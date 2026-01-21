-- ============================================
-- BLOCKCHAIN VOTING SYSTEM DATABASE SCHEMA
-- ============================================

-- Enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 0;

-- ========== CORE TABLES ==========

-- Users table for authentication (admins and voters)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    government_id VARCHAR(50) NOT NULL UNIQUE,
    user_type ENUM('voter', 'admin') DEFAULT 'voter',
    registration_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_registration_status (registration_status),
    INDEX idx_government_id (government_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    election_type ENUM('national', 'state', 'local', 'referendum') NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    election_id INT NOT NULL,
    user_id INT NOT NULL,
    party_affiliation VARCHAR(100),
    biography TEXT,
    position VARCHAR(255),
    photo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_election (election_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== VOTING TABLES ==========

-- Votes table (stores vote metadata, actual vote stored in blockchain)
CREATE TABLE IF NOT EXISTS votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    election_id INT NOT NULL,
    voter_id INT NOT NULL,
    candidate_id INT NOT NULL,
    vote_hash VARCHAR(255) NOT NULL UNIQUE, -- Hash stored in blockchain
    block_index INT, -- Reference to blockchain block
    casted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed', 'invalid') DEFAULT 'pending',
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    INDEX idx_election_voter (election_id, voter_id),
    INDEX idx_vote_hash (vote_hash),
    INDEX idx_status (status),
    UNIQUE KEY unique_vote_per_election (election_id, voter_id) -- Prevents double voting at DB level
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== BLOCKCHAIN SYNC TABLES ==========

-- Blockchain sync status
CREATE TABLE IF NOT EXISTS blockchain_sync (
    id INT PRIMARY KEY AUTO_INCREMENT,
    last_block_index INT DEFAULT 0,
    last_block_hash VARCHAR(255),
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('syncing', 'synced', 'error') DEFAULT 'synced',
    error_message TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== AUDIT TABLES ==========

-- Audit log for all critical actions
CREATE TABLE IF NOT EXISTS audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_action (user_id, action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin actions log
CREATE TABLE IF NOT EXISTS admin_actions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action ENUM('verify_voter', 'reject_voter', 'create_election', 'modify_election', 'add_candidate', 'remove_candidate') NOT NULL,
    target_user_id INT,
    target_election_id INT,
    details JSON,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_action (admin_id, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== INITIAL DATA ==========

-- Insert default admin user (password will need to be changed on first login)
-- Default password: Admin123! (should be changed immediately)
INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth, government_id, user_type, registration_status)
VALUES (
    'admin@votingsystem.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'Admin123!'
    'System',
    'Administrator',
    '1990-01-01',
    'ADMIN001',
    'admin',
    'verified'
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert initial blockchain sync record
INSERT INTO blockchain_sync (last_block_index, last_block_hash, status)
VALUES (
    0,
    REPEAT('0', 64), -- Genesis block hash (64 zeros)
    'synced'
) ON DUPLICATE KEY UPDATE sync_timestamp = CURRENT_TIMESTAMP;

-- Enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- ========== STORED PROCEDURES ==========

DELIMITER //

-- Procedure to get election results
CREATE PROCEDURE GetElectionResults(IN election_id_param INT)
BEGIN
    SELECT 
        c.id as candidate_id,
        c.uuid as candidate_uuid,
        CONCAT(u.first_name, ' ', u.last_name) as candidate_name,
        c.party_affiliation,
        COUNT(v.id) as vote_count
    FROM candidates c
    INNER JOIN users u ON c.user_id = u.id
    LEFT JOIN votes v ON c.id = v.candidate_id AND v.status = 'confirmed'
    WHERE c.election_id = election_id_param
    GROUP BY c.id, c.uuid, candidate_name, c.party_affiliation
    ORDER BY vote_count DESC;
END //

-- Procedure to check if voter can vote in election
CREATE PROCEDURE CheckVoterEligibility(IN voter_id_param INT, IN election_id_param INT)
BEGIN
    DECLARE voter_age INT;
    DECLARE voter_status VARCHAR(20);
    DECLARE election_status VARCHAR(20);
    DECLARE already_voted BOOLEAN;
    DECLARE election_start DATETIME;
    DECLARE election_end DATETIME;
    
    -- Get voter details
    SELECT 
        TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()),
        registration_status
    INTO voter_age, voter_status
    FROM users 
    WHERE id = voter_id_param;
    
    -- Get election details
    SELECT 
        status,
        start_date,
        end_date
    INTO election_status, election_start, election_end
    FROM elections 
    WHERE id = election_id_param;
    
    -- Check if already voted
    SELECT EXISTS(
        SELECT 1 FROM votes 
        WHERE voter_id = voter_id_param 
        AND election_id = election_id_param
        AND status = 'confirmed'
    ) INTO already_voted;
    
    -- Return eligibility result
    SELECT 
        voter_age >= 18 as is_adult,
        voter_status = 'verified' as is_verified,
        election_status = 'active' as is_election_active,
        NOW() BETWEEN election_start AND election_end as is_within_voting_period,
        NOT already_voted as has_not_voted,
        voter_age,
        voter_status,
        election_status,
        election_start,
        election_end,
        already_voted
    FROM dual;
END //

DELIMITER ;