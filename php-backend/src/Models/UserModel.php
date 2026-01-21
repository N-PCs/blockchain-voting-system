<?php
/**
 * User Model for Voter and Admin Management
 * 
 * @package VotingSystem\Models
 */

declare(strict_types=1);

namespace VotingSystem\Models;

use VotingSystem\Database\DatabaseConfig;
use PDO;
use PDOException;
use RuntimeException;

class UserModel
{
    /**
     * @var PDO Database connection
     */
    private PDO $db;

    /**
     * @var array User types
     */
    public const USER_TYPES = ['voter', 'admin'];

    /**
     * @var array Registration statuses
     */
    public const REGISTRATION_STATUSES = ['pending', 'verified', 'rejected'];

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->db = DatabaseConfig::getConnection();
    }

    /**
     * Create a new user (voter registration)
     * 
     * @param array $userData User data
     * @return array Created user data
     * @throws PDOException|RuntimeException
     */
    public function createUser(array $userData): array
    {
        $this->validateUserData($userData);
        
        $requiredFields = ['email', 'password', 'first_name', 'last_name', 'date_of_birth', 'government_id'];
        foreach ($requiredFields as $field) {
            if (!isset($userData[$field]) || empty(trim($userData[$field]))) {
                throw new RuntimeException("Field '{$field}' is required");
            }
        }

        // Check if email or government ID already exists
        if ($this->emailExists($userData['email'])) {
            throw new RuntimeException('Email already registered');
        }

        if ($this->governmentIdExists($userData['government_id'])) {
            throw new RuntimeException('Government ID already registered');
        }

        // Hash password
        $hashedPassword = password_hash($userData['password'], PASSWORD_BCRYPT, [
            'cost' => $_ENV['BCRYPT_ROUNDS'] ?? 12
        ]);

        $sql = "INSERT INTO users (
            email, 
            password_hash, 
            first_name, 
            last_name, 
            date_of_birth, 
            government_id, 
            user_type, 
            registration_status,
            is_active
        ) VALUES (
            :email, 
            :password_hash, 
            :first_name, 
            :last_name, 
            :date_of_birth, 
            :government_id, 
            :user_type, 
            :registration_status,
            :is_active
        )";

        $params = [
            ':email' => trim($userData['email']),
            ':password_hash' => $hashedPassword,
            ':first_name' => ucfirst(trim($userData['first_name'])),
            ':last_name' => ucfirst(trim($userData['last_name'])),
            ':date_of_birth' => $userData['date_of_birth'],
            ':government_id' => strtoupper(trim($userData['government_id'])),
            ':user_type' => $userData['user_type'] ?? 'voter',
            ':registration_status' => $userData['registration_status'] ?? 'pending',
            ':is_active' => $userData['is_active'] ?? true
        ];

        DatabaseConfig::beginTransaction();
        
        try {
            $stmt = DatabaseConfig::executeQuery($sql, $params);
            $userId = DatabaseConfig::lastInsertId();
            
            // Get the created user
            $createdUser = $this->getUserById((int)$userId);
            
            DatabaseConfig::commit();
            
            // Log registration (without password)
            unset($userData['password']);
            $this->logAudit(
                null,
                'user_registration',
                'users',
                (int)$userId,
                null,
                $userData
            );
            
            return $createdUser;
            
        } catch (PDOException $e) {
            DatabaseConfig::rollback();
            error_log('User creation failed: ' . $e->getMessage());
            throw new RuntimeException('Failed to create user. Please try again.');
        }
    }

    /**
     * Get user by ID
     * 
     * @param int $userId User ID
     * @return array|null User data or null if not found
     */
    public function getUserById(int $userId): ?array
    {
        $sql = "SELECT 
            id, 
            uuid, 
            email, 
            first_name, 
            last_name, 
            date_of_birth, 
            government_id, 
            user_type, 
            registration_status,
            is_active,
            created_at,
            updated_at
        FROM users 
        WHERE id = :id AND is_active = TRUE";
        
        $stmt = DatabaseConfig::executeQuery($sql, [':id' => $userId]);
        $user = $stmt->fetch();
        
        return $user ?: null;
    }

    /**
     * Get user by email
     * 
     * @param string $email User email
     * @return array|null User data or null if not found
     */
    public function getUserByEmail(string $email): ?array
    {
        $sql = "SELECT 
            id, 
            uuid, 
            email, 
            password_hash,
            first_name, 
            last_name, 
            date_of_birth, 
            government_id, 
            user_type, 
            registration_status,
            is_active,
            created_at,
            updated_at
        FROM users 
        WHERE email = :email AND is_active = TRUE";
        
        $stmt = DatabaseConfig::executeQuery($sql, [':email' => trim($email)]);
        $user = $stmt->fetch();
        
        return $user ?: null;
    }

    /**
     * Get user by UUID
     *
     * @param string $uuid User UUID
     * @return array|null User data or null if not found
     */
    public function getUserByUuid(string $uuid): ?array
    {
        $sql = "SELECT 
            id, 
            uuid, 
            email, 
            first_name, 
            last_name, 
            date_of_birth, 
            government_id, 
            user_type, 
            registration_status,
            is_active,
            created_at,
            updated_at
        FROM users 
        WHERE uuid = :uuid AND is_active = TRUE";

        $stmt = DatabaseConfig::executeQuery($sql, [':uuid' => $uuid]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    /**
     * Get user by government ID
     * 
     * @param string $governmentId Government ID
     * @return array|null User data or null if not found
     */
    public function getUserByGovernmentId(string $governmentId): ?array
    {
        $sql = "SELECT 
            id, 
            uuid, 
            email, 
            first_name, 
            last_name, 
            date_of_birth, 
            government_id, 
            user_type, 
            registration_status,
            is_active,
            created_at,
            updated_at
        FROM users 
        WHERE government_id = :government_id AND is_active = TRUE";
        
        $stmt = DatabaseConfig::executeQuery($sql, [':government_id' => strtoupper(trim($governmentId))]);
        $user = $stmt->fetch();
        
        return $user ?: null;
    }

    /**
     * Update user registration status
     * 
     * @param int $userId User ID
     * @param string $status New status
     * @param int $adminId Admin performing the action
     * @return bool True on success
     */
    public function updateRegistrationStatus(int $userId, string $status, int $adminId): bool
    {
        if (!in_array($status, self::REGISTRATION_STATUSES)) {
            throw new RuntimeException('Invalid registration status');
        }

        $user = $this->getUserById($userId);
        if (!$user) {
            throw new RuntimeException('User not found');
        }

        $oldStatus = $user['registration_status'];
        
        $sql = "UPDATE users 
                SET registration_status = :status, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = :id";
        
        DatabaseConfig::beginTransaction();
        
        try {
            $params = [':status' => $status, ':id' => $userId];
            $stmt = DatabaseConfig::executeQuery($sql, $params);
            
            // Log admin action
            $this->logAdminAction(
                $adminId,
                $status === 'verified' ? 'verify_voter' : 'reject_voter',
                $userId,
                null,
                ['old_status' => $oldStatus, 'new_status' => $status]
            );
            
            // Log audit
            $this->logAudit(
                $adminId,
                'update_registration_status',
                'users',
                $userId,
                ['registration_status' => $oldStatus],
                ['registration_status' => $status]
            );
            
            DatabaseConfig::commit();
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            DatabaseConfig::rollback();
            error_log('Status update failed: ' . $e->getMessage());
            throw new RuntimeException('Failed to update registration status');
        }
    }

    /**
     * Get pending voter registrations
     * 
     * @param int $limit Results limit
     * @param int $offset Results offset
     * @return array List of pending registrations
     */
    public function getPendingRegistrations(int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT 
            id, 
            uuid, 
            email, 
            first_name, 
            last_name, 
            date_of_birth, 
            government_id, 
            user_type,
            registration_status,
            is_active,
            created_at,
            updated_at
        FROM users 
        WHERE user_type = 'voter' 
            AND registration_status = 'pending'
            AND is_active = TRUE
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset";
        
        $stmt = DatabaseConfig::executeQuery($sql, [
            ':limit' => $limit,
            ':offset' => $offset
        ]);
        
        return $stmt->fetchAll();
    }

    /**
     * Count pending registrations
     * 
     * @return int Number of pending registrations
     */
    public function countPendingRegistrations(): int
    {
        $sql = "SELECT COUNT(*) as count 
                FROM users 
                WHERE user_type = 'voter' 
                    AND registration_status = 'pending'
                    AND is_active = TRUE";
        
        $stmt = DatabaseConfig::executeQuery($sql);
        $result = $stmt->fetch();
        
        return (int)($result['count'] ?? 0);
    }

    /**
     * Verify user credentials
     * 
     * @param string $email User email
     * @param string $password User password
     * @return array|null User data if credentials are valid
     */
    public function verifyCredentials(string $email, string $password): ?array
    {
        $user = $this->getUserByEmail($email);
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return null;
        }
        
        // Remove password hash from returned data
        unset($user['password_hash']);
        
        return $user;
    }

    /**
     * Check if email exists
     * 
     * @param string $email Email to check
     * @return bool True if email exists
     */
    private function emailExists(string $email): bool
    {
        $sql = "SELECT 1 FROM users WHERE email = :email AND is_active = TRUE";
        $stmt = DatabaseConfig::executeQuery($sql, [':email' => trim($email)]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Check if government ID exists
     * 
     * @param string $governmentId Government ID to check
     * @return bool True if government ID exists
     */
    private function governmentIdExists(string $governmentId): bool
    {
        $sql = "SELECT 1 FROM users WHERE government_id = :government_id AND is_active = TRUE";
        $stmt = DatabaseConfig::executeQuery($sql, [':government_id' => strtoupper(trim($governmentId))]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Validate user data
     * 
     * @param array $userData User data to validate
     * @throws RuntimeException If validation fails
     */
    private function validateUserData(array $userData): void
    {
        // Email validation
        if (isset($userData['email']) && !filter_var($userData['email'], FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Invalid email format');
        }

        // Date of birth validation
        if (isset($userData['date_of_birth'])) {
            $dob = DateTime::createFromFormat('Y-m-d', $userData['date_of_birth']);
            if (!$dob || $dob->format('Y-m-d') !== $userData['date_of_birth']) {
                throw new RuntimeException('Invalid date of birth format. Use YYYY-MM-DD');
            }
            
            // Check if at least 18 years old
            $age = $dob->diff(new DateTime())->y;
            if ($age < 18) {
                throw new RuntimeException('Must be at least 18 years old to register');
            }
        }

        // Password strength validation
        if (isset($userData['password'])) {
            if (strlen($userData['password']) < 8) {
                throw new RuntimeException('Password must be at least 8 characters long');
            }
            
            if (!preg_match('/[A-Z]/', $userData['password'])) {
                throw new RuntimeException('Password must contain at least one uppercase letter');
            }
            
            if (!preg_match('/[a-z]/', $userData['password'])) {
                throw new RuntimeException('Password must contain at least one lowercase letter');
            }
            
            if (!preg_match('/[0-9]/', $userData['password'])) {
                throw new RuntimeException('Password must contain at least one number');
            }
            
            if (!preg_match('/[\W_]/', $userData['password'])) {
                throw new RuntimeException('Password must contain at least one special character');
            }
        }
    }

    /**
     * Log audit trail
     * 
     * @param int|null $userId User ID performing action
     * @param string $actionType Type of action
     * @param string $tableName Affected table
     * @param int|null $recordId Affected record ID
     * @param array|null $oldValues Old values
     * @param array|null $newValues New values
     */
    private function logAudit(
        ?int $userId,
        string $actionType,
        string $tableName,
        ?int $recordId,
        ?array $oldValues,
        ?array $newValues
    ): void {
        $sql = "INSERT INTO audit_log (
            user_id, 
            action_type, 
            table_name, 
            record_id, 
            old_values, 
            new_values, 
            ip_address, 
            user_agent
        ) VALUES (
            :user_id, 
            :action_type, 
            :table_name, 
            :record_id, 
            :old_values, 
            :new_values, 
            :ip_address, 
            :user_agent
        )";
        
        $params = [
            ':user_id' => $userId,
            ':action_type' => $actionType,
            ':table_name' => $tableName,
            ':record_id' => $recordId,
            ':old_values' => $oldValues ? json_encode($oldValues) : null,
            ':new_values' => $newValues ? json_encode($newValues) : null,
            ':ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ];
        
        DatabaseConfig::executeQuery($sql, $params);
    }

    /**
     * Update user information
     *
     * @param int $userId User ID
     * @param array $updateData Data to update
     * @return bool True on success
     */
    public function updateUser(int $userId, array $updateData): bool
    {
        if (empty($updateData)) {
            return false;
        }

        $user = $this->getUserById($userId);
        if (!$user) {
            throw new RuntimeException('User not found');
        }

        $allowedFields = ['first_name', 'last_name', 'email', 'is_active'];
        $updateData = array_intersect_key($updateData, array_flip($allowedFields));

        if (empty($updateData)) {
            return false;
        }

        $setParts = [];
        $params = [':id' => $userId];

        foreach ($updateData as $field => $value) {
            $setParts[] = "{$field} = :{$field}";
            $params[":{$field}"] = $value;
        }

        $setParts[] = 'updated_at = CURRENT_TIMESTAMP';

        $sql = "UPDATE users SET " . implode(', ', $setParts) . " WHERE id = :id";

        DatabaseConfig::beginTransaction();

        try {
            $stmt = DatabaseConfig::executeQuery($sql, $params);

            // Log audit
            $this->logAudit(
                null, // No specific user performing this action
                'update_user',
                'users',
                $userId,
                $user,
                array_merge($user, $updateData)
            );

            DatabaseConfig::commit();
            return $stmt->rowCount() > 0;

        } catch (PDOException $e) {
            DatabaseConfig::rollback();
            error_log('User update failed: ' . $e->getMessage());
            throw new RuntimeException('Failed to update user');
        }
    }

    /**
     * Log admin action
     *
     * @param int $adminId Admin ID
     * @param string $action Action type
     * @param int|null $targetUserId Target user ID
     * @param int|null $targetElectionId Target election ID
     * @param array $details Action details
     */
    private function logAdminAction(
        int $adminId,
        string $action,
        ?int $targetUserId,
        ?int $targetElectionId,
        array $details
    ): void {
        $sql = "INSERT INTO admin_actions (
            admin_id,
            action,
            target_user_id,
            target_election_id,
            details
        ) VALUES (
            :admin_id,
            :action,
            :target_user_id,
            :target_election_id,
            :details
        )";

        $params = [
            ':admin_id' => $adminId,
            ':action' => $action,
            ':target_user_id' => $targetUserId,
            ':target_election_id' => $targetElectionId,
            ':details' => json_encode($details)
        ];

        DatabaseConfig::executeQuery($sql, $params);
    }
}