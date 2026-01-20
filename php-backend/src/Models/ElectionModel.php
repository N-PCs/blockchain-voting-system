<?php
/**
 * Election Model
 * 
 * @package VotingSystem\Models
 */

declare(strict_types=1);

namespace VotingSystem\Models;

use VotingSystem\Database\DatabaseConfig;
use PDO;
use PDOException;
use RuntimeException;

class ElectionModel
{
    /**
     * @var PDO Database connection
     */
    private PDO $db;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->db = DatabaseConfig::getConnection();
    }

    /**
     * Get election by ID
     * 
     * @param int $electionId Election ID
     * @return array|null Election data
     */
    public function getElectionById(int $electionId): ?array
    {
        $sql = "SELECT 
            id,
            uuid,
            title,
            description,
            election_type,
            start_date,
            end_date,
            status,
            created_by
        FROM elections 
        WHERE id = :id";

        $stmt = DatabaseConfig::executeQuery($sql, [':id' => $electionId]);
        $election = $stmt->fetch();

        return $election ?: null;
    }

    /**
     * Get election by UUID
     * 
     * @param string $electionUuid Election UUID
     * @return array|null Election data
     */
    public function getElectionByUuid(string $electionUuid): ?array
    {
        $sql = "SELECT 
            id,
            uuid,
            title,
            description,
            election_type,
            start_date,
            end_date,
            status,
            created_by
        FROM elections 
        WHERE uuid = :uuid";

        $stmt = DatabaseConfig::executeQuery($sql, [':uuid' => $electionUuid]);
        $election = $stmt->fetch();

        return $election ?: null;
    }

    /**
     * Get active elections
     * 
     * @param int $limit Maximum number of elections
     * @return array Active elections
     */
    public function getActiveElections(int $limit = 10): array
    {
        $sql = "SELECT 
            id,
            uuid,
            title,
            description,
            election_type,
            start_date,
            end_date
        FROM elections 
        WHERE status = 'active' 
            AND start_date <= NOW() 
            AND end_date >= NOW()
        ORDER BY start_date ASC
        LIMIT :limit";

        $stmt = DatabaseConfig::executeQuery($sql, [':limit' => $limit]);
        return $stmt->fetchAll();
    }

    /**
     * Get candidate by ID
     * 
     * @param int $candidateId Candidate ID
     * @return array|null Candidate data
     */
    public function getCandidateById(int $candidateId): ?array
    {
        $sql = "SELECT 
            c.id,
            c.uuid,
            c.election_id,
            c.user_id,
            c.party_affiliation,
            c.biography,
            c.position,
            c.photo_url,
            c.is_active,
            CONCAT(u.first_name, ' ', u.last_name) as name
        FROM candidates c
        INNER JOIN users u ON c.user_id = u.id
        WHERE c.id = :id";

        $stmt = DatabaseConfig::executeQuery($sql, [':id' => $candidateId]);
        $candidate = $stmt->fetch();

        return $candidate ?: null;
    }

    /**
     * Get candidate by UUID
     * 
     * @param string $candidateUuid Candidate UUID
     * @return array|null Candidate data
     */
    public function getCandidateByUuid(string $candidateUuid): ?array
    {
        $sql = "SELECT 
            c.id,
            c.uuid,
            c.election_id,
            c.user_id,
            c.party_affiliation,
            c.biography,
            c.position,
            c.photo_url,
            c.is_active,
            CONCAT(u.first_name, ' ', u.last_name) as name
        FROM candidates c
        INNER JOIN users u ON c.user_id = u.id
        WHERE c.uuid = :uuid";

        $stmt = DatabaseConfig::executeQuery($sql, [':uuid' => $candidateUuid]);
        $candidate = $stmt->fetch();

        return $candidate ?: null;
    }

    /**
     * Get candidates for election
     * 
     * @param int $electionId Election ID
     * @return array Candidates
     */
    public function getCandidatesForElection(int $electionId): array
    {
        $sql = "SELECT 
            c.id,
            c.uuid,
            c.user_id,
            c.party_affiliation,
            c.biography,
            c.position,
            c.photo_url,
            CONCAT(u.first_name, ' ', u.last_name) as name
        FROM candidates c
        INNER JOIN users u ON c.user_id = u.id
        WHERE c.election_id = :election_id
            AND c.is_active = TRUE
        ORDER BY c.party_affiliation, c.position";

        $stmt = DatabaseConfig::executeQuery($sql, [':election_id' => $electionId]);
        return $stmt->fetchAll();
    }

    /**
     * Check voter eligibility for election
     * 
     * @param int $voterId Voter ID
     * @param int $electionId Election ID
     * @return array Eligibility result
     */
    public function checkVoterEligibility(int $voterId, int $electionId): array
    {
        $sql = "CALL CheckVoterEligibility(:voter_id, :election_id)";
        
        $stmt = DatabaseConfig::executeQuery($sql, [
            ':voter_id' => $voterId,
            ':election_id' => $electionId
        ]);
        
        $result = $stmt->fetch();
        
        if (!$result) {
            return [
                'eligible' => false,
                'reasons' => ['Unable to determine eligibility']
            ];
        }

        $eligibility = true;
        $reasons = [];

        if (!$result['is_adult']) {
            $eligibility = false;
            $reasons[] = 'Voter must be at least 18 years old';
        }

        if (!$result['is_verified']) {
            $eligibility = false;
            $reasons[] = 'Voter registration is not verified';
        }

        if (!$result['is_election_active']) {
            $eligibility = false;
            $reasons[] = 'Election is not active';
        }

        if (!$result['is_within_voting_period']) {
            $eligibility = false;
            $reasons[] = 'Current time is outside voting period';
        }

        if (!$result['has_not_voted']) {
            $eligibility = false;
            $reasons[] = 'Voter has already voted in this election';
        }

        return [
            'eligible' => $eligibility,
            'reasons' => $reasons,
            'details' => $result
        ];
    }

    /**
     * Get all elections
     *
     * @return array All elections
     */
    public function getAllElections(): array
    {
        $sql = "SELECT
            id,
            uuid,
            title,
            description,
            election_type,
            start_date,
            end_date,
            status,
            created_at
        FROM elections
        ORDER BY created_at DESC";

        $stmt = DatabaseConfig::executeQuery($sql);
        return $stmt->fetchAll();
    }

    /**
     * Get election candidates by election UUID
     *
     * @param string $electionUuid Election UUID
     * @return array Candidates
     */
    public function getElectionCandidates(string $electionUuid): array
    {
        $sql = "SELECT
            c.id,
            c.uuid,
            c.user_id,
            c.party_affiliation,
            c.biography,
            c.position,
            c.photo_url,
            CONCAT(u.first_name, ' ', u.last_name) as name,
            u.first_name,
            u.last_name
        FROM candidates c
        INNER JOIN users u ON c.user_id = u.id
        INNER JOIN elections e ON c.election_id = e.id
        WHERE e.uuid = :election_uuid
            AND c.is_active = TRUE
        ORDER BY c.party_affiliation, c.position";

        $stmt = DatabaseConfig::executeQuery($sql, [':election_uuid' => $electionUuid]);
        return $stmt->fetchAll();
    }

    /**
     * Create a new election
     *
     * @param array $electionData Election data
     * @param int $createdBy User ID who created the election
     * @return array Created election data
     */
    public function createElection(array $electionData, int $createdBy): array
    {
        // Validate required fields
        $requiredFields = ['title', 'election_type', 'start_date', 'end_date'];
        foreach ($requiredFields as $field) {
            if (empty($electionData[$field])) {
                throw new RuntimeException("Field '{$field}' is required");
            }
        }

        $sql = "INSERT INTO elections (
            title,
            description,
            election_type,
            start_date,
            end_date,
            status,
            created_by
        ) VALUES (
            :title,
            :description,
            :election_type,
            :start_date,
            :end_date,
            :status,
            :created_by
        )";

        $params = [
            ':title' => trim($electionData['title']),
            ':description' => trim($electionData['description'] ?? ''),
            ':election_type' => $electionData['election_type'],
            ':start_date' => $electionData['start_date'],
            ':end_date' => $electionData['end_date'],
            ':status' => $electionData['status'] ?? 'draft',
            ':created_by' => $createdBy
        ];

        DatabaseConfig::beginTransaction();

        try {
            $stmt = DatabaseConfig::executeQuery($sql, $params);
            $electionId = DatabaseConfig::lastInsertId();

            // Get the created election
            $createdElection = $this->getElectionById((int)$electionId);

            DatabaseConfig::commit();

            return $createdElection;

        } catch (PDOException $e) {
            DatabaseConfig::rollback();
            error_log('Election creation failed: ' . $e->getMessage());
            throw new RuntimeException('Failed to create election. Please try again.');
        }
    }

    /**
     * Get election results
     *
     * @param string $electionUuid Election UUID
     * @return array Election results
     */
    public function getElectionResults(string $electionUuid): array
    {
        $sql = "CALL GetElectionResults(:election_uuid)";

        $stmt = DatabaseConfig::executeQuery($sql, [':election_uuid' => $electionUuid]);
        return $stmt->fetchAll();
    }
}