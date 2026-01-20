<?php
/**
 * WebSocket Notification Service
 * Sends notifications to WebSocket server via HTTP API
 * 
 * @package VotingSystem\Services
 */

declare(strict_types=1);

namespace VotingSystem\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use RuntimeException;

class WebSocketService
{
    /**
     * @var Client HTTP client
     */
    private Client $httpClient;

    /**
     * @var string WebSocket server URL
     */
    private string $serverUrl;

    /**
     * @var Logger Logger instance
     */
    private Logger $logger;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->serverUrl = rtrim($_ENV['WS_SERVER_URL'] ?? 'http://localhost:3001', '/');
        $this->logger = new Logger('websocket-service');

        $this->httpClient = new Client([
            'base_uri' => $this->serverUrl,
            'timeout' => 5,
            'connect_timeout' => 2,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'verify' => false, // For development only
        ]);

        $this->logger->info('WebSocketService initialized', [
            'server_url' => $this->serverUrl
        ]);
    }

    /**
     * Send vote notification
     * 
     * @param array $voteData Vote data
     * @return bool Success status
     */
    public function sendVoteNotification(array $voteData): bool
    {
        $notification = [
            'channel' => 'votes',
            'message' => 'New vote cast',
            'data' => [
                'type' => 'vote_cast',
                'voteId' => $voteData['uuid'] ?? null,
                'electionId' => $voteData['election_uuid'] ?? null,
                'voterId' => $voteData['voter_uuid'] ?? null,
                'candidateId' => $voteData['candidate_uuid'] ?? null,
                'timestamp' => $voteData['casted_at'] ?? date('c'),
                'transactionId' => $voteData['transaction_id'] ?? null,
            ]
        ];

        return $this->sendNotification($notification);
    }

    /**
     * Send blockchain block notification
     * 
     * @param array $blockData Block data
     * @return bool Success status
     */
    public function sendBlockNotification(array $blockData): bool
    {
        $notification = [
            'channel' => 'blockchain',
            'message' => 'New block mined',
            'data' => [
                'type' => 'block_mined',
                'index' => $blockData['index'] ?? null,
                'hash' => $blockData['hash'] ?? null,
                'transactionCount' => $blockData['transaction_count'] ?? null,
                'miner' => $blockData['mined_by'] ?? null,
                'timestamp' => $blockData['timestamp'] ?? date('c'),
            ]
        ];

        return $this->sendNotification($notification);
    }

    /**
     * Send election results notification
     * 
     * @param array $resultsData Election results
     * @return bool Success status
     */
    public function sendElectionResultsNotification(array $resultsData): bool
    {
        $notification = [
            'channel' => 'elections',
            'message' => 'Election results updated',
            'data' => [
                'type' => 'election_results',
                'electionId' => $resultsData['election_uuid'] ?? null,
                'title' => $resultsData['title'] ?? null,
                'results' => $resultsData['results'] ?? [],
                'totalVotes' => $resultsData['total_votes'] ?? 0,
                'updatedAt' => $resultsData['updated_at'] ?? date('c'),
            ]
        ];

        return $this->sendNotification($notification);
    }

    /**
     * Send admin notification
     * 
     * @param string $message Notification message
     * @param array $data Additional data
     * @return bool Success status
     */
    public function sendAdminNotification(string $message, array $data = []): bool
    {
        $notification = [
            'channel' => 'admin',
            'message' => $message,
            'data' => array_merge($data, [
                'type' => 'admin_notification',
                'timestamp' => date('c'),
            ])
        ];

        return $this->sendNotification($notification);
    }

    /**
     * Send notification to WebSocket server
     * 
     * @param array $notification Notification data
     * @return bool Success status
     */
    private function sendNotification(array $notification): bool
    {
        try {
            $response = $this->httpClient->post('/api/notify', [
                'json' => $notification
            ]);

            $result = json_decode((string) $response->getBody(), true);
            
            $this->logger->debug('WebSocket notification sent', [
                'channel' => $notification['channel'],
                'success' => $result['success'] ?? false,
                'notification' => $notification
            ]);

            return $result['success'] ?? false;

        } catch (RequestException $e) {
            $this->logger->error('WebSocket notification failed', [
                'error' => $e->getMessage(),
                'notification' => $notification
            ]);
            
            // Don't throw exception - WebSocket notifications are non-critical
            return false;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error sending WebSocket notification', [
                'error' => $e->getMessage(),
                'notification' => $notification
            ]);
            
            return false;
        }
    }

    /**
     * Check WebSocket server health
     * 
     * @return array Health status
     */
    public function checkHealth(): array
    {
        try {
            $response = $this->httpClient->get('/health', ['timeout' => 3]);
            $result = json_decode((string) $response->getBody(), true);
            
            return [
                'healthy' => $result['status'] === 'healthy',
                'response' => $result
            ];
        } catch (\Exception $e) {
            $this->logger->warning('WebSocket health check failed', [
                'error' => $e->getMessage()
            ]);
            
            return [
                'healthy' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get WebSocket server statistics
     * 
     * @return array Server stats
     */
    public function getServerStats(): array
    {
        try {
            $response = $this->httpClient->get('/api/stats');
            return json_decode((string) $response->getBody(), true);
        } catch (\Exception $e) {
            $this->logger->error('Error getting WebSocket stats', [
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}