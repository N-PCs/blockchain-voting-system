<?php
/**
 * Vote Model
 * 
 * @package VotingSystem\Models
 */

declare(strict_types=1);

namespace VotingSystem\Models;

use VotingSystem\Database\DatabaseConfig;
use PDO;
use PDOException;
use RuntimeException;

class VoteModel
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
     * Create a new vote
     * 
     * @param array $voteData Vote data
     * @return int New vote ID
     * @throws RuntimeException
     */
    public function createVote(array $voteData): int
    {
        $requiredFields = ['election_id', 'voter_id', 'candidate_id'];
        foreach ($requiredFields as $field) {
            if (!isset($voteData[$field])) {
                throw new RuntimeException("Missing required field: {$field}");
            }
        }

        $sql = "INSERT INTO votes (
            election_id,
            voter_id,
            candidate_id,
            ip_address,
            user_agent,
            status
        ) VALUES (
            :election_id,
            :voter_id,
            :candidate_id,
            :ip_address,
            :user_agent,
            :status
        )";

        $params = [
            ':election_id' => $voteData['election_id'],
            ':voter_id' => $voteData['voter_id'],
            ':candidate_id' => $voteData['candidate_id'],
            ':ip_address' => $voteData['ip_address'] ?? null,
            ':user_agent' => $voteData['user_agent'] ?? null,
            ':status' => $voteData['status'] ?? 'pending'
        ];

        DatabaseConfig::executeQuery($sql, $params);
        return (int) DatabaseConfig::lastInsertId();
    }

    /**
     * Get vote by ID
     * 
     * @param int $voteId Vote ID
     * @return array|null Vote data
     */
    public function getVoteById(int $voteId): ?array
    {
        $sql = "SELECT 
            v.id,
            v.uuid,
            v.election_id,
            v.voter_id,
            v.candidate_id,
            v.vote_hash,
            v.transaction_id,
            v.block_index,
            v.casted_at,
            v.status,
            v.ip_address,
            v.user_agent,
            e.uuid as election_uuid,
            u.uuid as voter_uuid,
            c.uuid as candidate_uuid
        FROM votes v
        INNER JOIN elections e ON v.election_id = e.id
        INNER JOIN users u ON v.voter_id = u.id
        INNER JOIN candidates c ON v.candidate_id = c.id
        WHERE v.id = :id";

        $stmt = DatabaseConfig::executeQuery($sql, [':id' => $voteId]);
        $vote = $stmt->fetch();

        return $vote ?: null;
    }

    /**
     * Get vote by UUID
     * 
     * @param string $voteUuid Vote UUID
     * @return array|null Vote data
     */
    public function getVoteByUuid(string $voteUuid): ?array
    {
        $sql = "SELECT 
            v.id,
            v.uuid,
            v.election_id,
            v.voter_id,
            v.candidate_id,
            v.vote_hash,
            v.transaction_id,
            v.block_index,
            v.casted_at,
            v.status,
            v.ip_address,
            v.user_agent,
            e.uuid as election_uuid,
            u.uuid as voter_uuid,
            c.uuid as candidate_uuid
        FROM votes v
        INNER JOIN elections e ON v.election_id = e.id
        INNER JOIN users u ON v.voter_id = u.id
        INNER JOIN candidates c ON v.candidate_id = c.id
        WHERE v.uuid = :uuid";

        $stmt = DatabaseConfig::executeQuery($sql, [':uuid' => $voteUuid]);
        $vote = $stmt->fetch();

        return $vote ?: null;
    }

    /**
     * Update vote
     * 
     * @param int $voteId Vote ID
     * @param array $updateData Data to update
     * @return bool True if successful
     */
    public function updateVote(int $voteId, array $updateData): bool
    {
        if (empty($updateData)) {
            return false;
        }

        $setClauses = [];
        $params = [':id' => $voteId];

        foreach ($updateData as $key => $value) {
            $setClauses[] = "{$key} = :{$key}";
            $params[":{$key}"] = $value;
        }

        $sql = "UPDATE votes 
                SET " . implode(', ', $setClauses) . "
                WHERE id = :id";

        $stmt = DatabaseConfig::executeQuery($sql, $params);
        return $stmt->rowCount() > 0;
    }

    /**
     * Check if user has voted in election
     * 
     * @param int $userId User ID
     * @param int $electionId Election ID
     * @return bool True if user has voted
     */
    public function hasUserVoted(int $userId, int $electionId): bool
    {
        $sql = "SELECT 1 FROM votes 
                WHERE voter_id = :voter_id 
                AND election_id = :election_id
                AND status IN ('confirmed', 'pending')";

        $stmt = DatabaseConfig::executeQuery($sql, [
            ':voter_id' => $userId,
            ':election_id' => $electionId
        ]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Get votes by voter with pagination
     * 
     * @param int $voterId Voter ID
     * @param int $page Page number
     * @param int $limit Items per page
     * @return array Votes
     */
    public function getVotesByVoter(int $voterId, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;

        $sql = "SELECT 
            v.id,
            v.uuid,
            v.election_id,
            v.candidate_id,
            v.vote_hash,
            v.transaction_id,
            v.casted_at,
            v.status,
            e.title as election_title,
            e.election_type,
            c.party_affiliation
        FROM votes v
        INNER JOIN elections e ON v.election_id = e.id
        INNER JOIN candidates c ON v.candidate_id = c.id
        WHERE v.voter_id = :voter_id
        ORDER BY v.casted_at DESC
        LIMIT :limit OFFSET :offset";

        $stmt = DatabaseConfig::executeQuery($sql, [
            ':voter_id' => $voterId,
            ':limit' => $limit,
            ':offset' => $offset
        ]);

        return $stmt->fetchAll();
    }

    /**
     * Count votes by voter
     * 
     * @param int $voterId Voter ID
     * @return int Vote count
     */
    public function countVotesByVoter(int $voterId): int
    {
        $sql = "SELECT COUNT(*) as count 
                FROM votes 
                WHERE voter_id = :voter_id";

        $stmt = DatabaseConfig::executeQuery($sql, [':voter_id' => $voterId]);
        $result = $stmt->fetch();

        return (int) ($result['count'] ?? 0);
    }

    /**
     * Get election results
     * 
     * @param int $electionId Election ID
     * @return array Election results
     */
    public function getElectionResults(int $electionId): array
    {
        $sql = "CALL GetElectionResults(:election_id)";
        $stmt = DatabaseConfig::executeQuery($sql, [':election_id' => $electionId]);
        return $stmt->fetchAll();
    }

    /**
     * Get votes for audit trail
     * 
     * @param int $electionId Election ID
     * @param int $page Page number
     * @param int $limit Items per page
     * @return array Votes with voter details
     */
    public function getAuditTrail(int $electionId, int $page = 1, int $limit = 50): array
    {
        $offset = ($page - 1) * $limit;

        $sql = "SELECT 
            v.uuid as vote_uuid,
            v.vote_hash,
            v.transaction_id,
            v.block_index,
            v.casted_at,
            v.status,
            u.uuid as voter_uuid,
            CONCAT(u.first_name, ' ', u.last_name) as voter_name,
            u.government_id,
            c.uuid as candidate_uuid,
            c.party_affiliation
        FROM votes v
        INNER JOIN users u ON v.voter_id = u.id
        INNER JOIN candidates c ON v.candidate_id = c.id
        WHERE v.election_id = :election_id
        ORDER BY v.casted_at DESC
        LIMIT :limit OFFSET :offset";

        $stmt = DatabaseConfig::executeQuery($sql, [
            ':election_id' => $electionId,
            ':limit' => $limit,
            ':offset' => $offset
        ]);

        return $stmt->fetchAll();
    }
}