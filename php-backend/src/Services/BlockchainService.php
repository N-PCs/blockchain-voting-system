<?php
/**
 * Blockchain Service Client
 * Handles communication with Python blockchain service
 * 
 * @package VotingSystem\Services
 */

declare(strict_types=1);

namespace VotingSystem\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\ConnectException;
use Psr\Http\Message\ResponseInterface;
use VotingSystem\Services\Logger;
use RuntimeException;

class BlockchainService
{
    /**
     * @var Client HTTP client
     */
    private Client $httpClient;

    /**
     * @var string Blockchain service base URL
     */
    private string $baseUrl;

    /**
     * @var string API key for blockchain service
     */
    private string $apiKey;

    /**
     * @var int Request timeout in seconds
     */
    private int $timeout;

    /**
     * @var Logger Logger instance
     */
    private Logger $logger;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->baseUrl = rtrim($_ENV['BLOCKCHAIN_SERVICE_URL'] ?? 'http://localhost:5000', '/');
        $this->apiKey = $_ENV['BLOCKCHAIN_API_KEY'] ?? 'test-key-123';
        $this->timeout = (int) ($_ENV['BLOCKCHAIN_SERVICE_TIMEOUT'] ?? 30);
        $this->logger = new Logger('blockchain-service');

        $this->httpClient = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => $this->timeout,
            'connect_timeout' => 5,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'VotingSystem-PHP/1.0'
            ],
            'verify' => false, // For development only - set to true in production
            'http_errors' => true
        ]);

        $this->logger->info('BlockchainService initialized', [
            'base_url' => $this->baseUrl,
            'timeout' => $this->timeout
        ]);
    }

    /**
     * Submit a vote transaction to blockchain
     * 
     * @param array $voteData Vote data
     * @return array Blockchain response
     * @throws RuntimeException
     */
    public function submitVoteTransaction(array $voteData): array
    {
        $this->validateVoteData($voteData);

        // Generate vote hash (must match Python's calculation)
        $voteHash = $this->generateVoteHash($voteData);

        $payload = [
            'election_id' => $voteData['election_uuid'],
            'voter_id' => $voteData['voter_uuid'],
            'candidate_id' => $voteData['candidate_uuid'],
            'vote_hash' => $voteHash,
            'metadata' => [
                'session_id' => $voteData['session_id'] ?? null,
                'ip_address' => $voteData['ip_address'] ?? null,
                'user_agent' => $voteData['user_agent'] ?? null,
                'php_vote_id' => $voteData['vote_id'] ?? null
            ]
        ];

        $this->logger->info('Submitting vote to blockchain', [
            'election_id' => $payload['election_id'],
            'voter_id' => $payload['voter_id'],
            'vote_hash' => $voteHash
        ]);

        try {
            $response = $this->httpClient->post('/api/blockchain/transactions/submit', [
                'json' => $payload,
                'headers' => [
                    'X-API-Key' => $this->apiKey
                ]
            ]);

            $result = $this->parseResponse($response);

            if ($result['success']) {
                $this->logger->info('Vote submitted to blockchain successfully', [
                    'transaction_id' => $result['data']['transaction_id'] ?? null,
                    'vote_hash' => $voteHash
                ]);
            } else {
                $this->logger->warning('Blockchain submission failed', [
                    'error' => $result['error'] ?? 'Unknown error',
                    'vote_hash' => $voteHash
                ]);
            }

            return $result;

        } catch (ConnectException $e) {
            $this->logger->error('Blockchain service connection failed', [
                'error' => $e->getMessage(),
                'url' => $this->baseUrl
            ]);
            throw new RuntimeException('Blockchain service is unavailable. Please try again later.', 0, $e);
        } catch (RequestException $e) {
            $errorResponse = $this->handleRequestException($e);
            $this->logger->error('Blockchain request failed', [
                'error' => $errorResponse['error'] ?? $e->getMessage(),
                'status_code' => $e->getCode()
            ]);
            throw new RuntimeException($errorResponse['error'] ?? 'Blockchain service error', 0, $e);
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error submitting vote', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new RuntimeException('Failed to submit vote to blockchain', 0, $e);
        }
    }

    /**
     * Verify if a vote exists in blockchain
     * 
     * @param string $electionId Election UUID
     * @param string $voterId Voter UUID
     * @param string $voteHash Vote hash to verify
     * @return array Verification result
     * @throws RuntimeException
     */
    public function verifyVoteInBlockchain(string $electionId, string $voterId, string $voteHash): array
    {
        $payload = [
            'election_id' => $electionId,
            'voter_id' => $voterId,
            'vote_hash' => $voteHash
        ];

        $this->logger->debug('Verifying vote in blockchain', [
            'election_id' => $electionId,
            'voter_id' => $voterId,
            'vote_hash' => $voteHash
        ]);

        try {
            $response = $this->httpClient->post('/api/blockchain/validate', [
                'json' => $payload,
                'headers' => [
                    'X-API-Key' => $this->apiKey
                ]
            ]);

            $result = $this->parseResponse($response);

            if ($result['success'] && isset($result['data']['exists'])) {
                $this->logger->info('Vote verification completed', [
                    'exists' => $result['data']['exists'],
                    'confirmed' => $result['data']['confirmed'] ?? false,
                    'election_id' => $electionId
                ]);
            }

            return $result;

        } catch (ConnectException $e) {
            $this->logger->error('Blockchain service unavailable for verification', [
                'error' => $e->getMessage()
            ]);
            throw new RuntimeException('Cannot verify vote - blockchain service unavailable', 0, $e);
        } catch (\Exception $e) {
            $this->logger->error('Error verifying vote in blockchain', [
                'error' => $e->getMessage()
            ]);
            throw new RuntimeException('Failed to verify vote in blockchain', 0, $e);
        }
    }

    /**
     * Get blockchain statistics
     * 
     * @return array Blockchain stats
     * @throws RuntimeException
     */
    public function getBlockchainStats(): array
    {
        try {
            $response = $this->httpClient->get('/api/blockchain/stats');
            return $this->parseResponse($response);
        } catch (\Exception $e) {
            $this->logger->error('Error getting blockchain stats', [
                'error' => $e->getMessage()
            ]);
            throw new RuntimeException('Failed to get blockchain statistics', 0, $e);
        }
    }

    /**
     * Get block by index
     * 
     * @param int $blockIndex Block index
     * @return array Block data
     * @throws RuntimeException
     */
    public function getBlock(int $blockIndex): array
    {
        try {
            $response = $this->httpClient->get("/api/blockchain/blocks/{$blockIndex}");
            return $this->parseResponse($response);
        } catch (\Exception $e) {
            $this->logger->error('Error getting block from blockchain', [
                'block_index' => $blockIndex,
                'error' => $e->getMessage()
            ]);
            throw new RuntimeException("Failed to get block {$blockIndex}", 0, $e);
        }
    }

    /**
     * Get blocks with pagination
     * 
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array Blocks data
     * @throws RuntimeException
     */
    public function getBlocks(int $page = 1, int $perPage = 10): array
    {
        try {
            $response = $this->httpClient->get('/api/blockchain/blocks', [
                'query' => [
                    'page' => $page,
                    'per_page' => $perPage
                ]
            ]);
            return $this->parseResponse($response);
        } catch (\Exception $e) {
            $this->logger->error('Error getting blocks from blockchain', [
                'page' => $page,
                'per_page' => $perPage,
                'error' => $e->getMessage()
            ]);
            throw new RuntimeException('Failed to get blocks from blockchain', 0, $e);
        }
    }

    /**
     * Get transaction by ID
     * 
     * @param string $transactionId Transaction ID
     * @return array Transaction data
     * @throws RuntimeException
     */
    public function getTransaction(string $transactionId): array
    {
        try {
            $response = $this->httpClient->get("/api/blockchain/transactions/{$transactionId}");
            return $this->parseResponse($response);
        } catch (\Exception $e) {
            $this->logger->error('Error getting transaction from blockchain', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);
            throw new RuntimeException("Failed to get transaction {$transactionId}", 0, $e);
        }
    }

    /**
     * Trigger manual block mining
     * 
     * @param string $minerAddress Miner address
     * @return array Mining result
     * @throws RuntimeException
     */
    public function mineBlock(string $minerAddress = 'php_backend'): array
    {
        try {
            $response = $this->httpClient->post('/api/blockchain/mine', [
                'json' => ['miner_address' => $minerAddress],
                'headers' => ['X-API-Key' => $this->apiKey]
            ]);
            return $this->parseResponse($response);
        } catch (\Exception $e) {
            $this->logger->error('Error mining block', [
                'miner_address' => $minerAddress,
                'error' => $e->getMessage()
            ]);
            throw new RuntimeException('Failed to mine block', 0, $e);
        }
    }

    /**
     * Check blockchain service health
     * 
     * @return array Health status
     */
    public function checkHealth(): array
    {
        try {
            $response = $this->httpClient->get('/health', ['timeout' => 3]);
            $result = $this->parseResponse($response);
            
            $this->logger->debug('Blockchain health check', [
                'healthy' => $result['status'] === 'healthy',
                'timestamp' => $result['timestamp'] ?? null
            ]);
            
            return [
                'healthy' => $result['status'] === 'healthy',
                'response' => $result
            ];
        } catch (\Exception $e) {
            $this->logger->warning('Blockchain health check failed', [
                'error' => $e->getMessage()
            ]);
            return [
                'healthy' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate vote data before submission
     * 
     * @param array $voteData Vote data
     * @throws RuntimeException
     */
    private function validateVoteData(array $voteData): void
    {
        $requiredFields = [
            'election_uuid',
            'voter_uuid', 
            'candidate_uuid',
            'vote_id'
        ];

        foreach ($requiredFields as $field) {
            if (empty($voteData[$field])) {
                throw new RuntimeException("Missing required field: {$field}");
            }
        }

        // Validate UUID formats
        $uuidPattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
        
        if (!preg_match($uuidPattern, $voteData['election_uuid'])) {
            throw new RuntimeException('Invalid election UUID format');
        }
        
        if (!preg_match($uuidPattern, $voteData['voter_uuid'])) {
            throw new RuntimeException('Invalid voter UUID format');
        }
        
        if (!preg_match($uuidPattern, $voteData['candidate_uuid'])) {
            throw new RuntimeException('Invalid candidate UUID format');
        }
    }

    /**
     * Generate vote hash (must match Python's calculation)
     * 
     * @param array $voteData Vote data
     * @return string SHA-256 hash
     */
    private function generateVoteHash(array $voteData): string
    {
        $hashData = [
            'election_id' => $voteData['election_uuid'],
            'voter_id' => $voteData['voter_uuid'],
            'candidate_id' => $voteData['candidate_uuid'],
            'timestamp' => $voteData['timestamp'] ?? time()
        ];

        // JSON encode with sorted keys to match Python's json.dumps(sort_keys=True)
        $jsonString = json_encode($hashData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        
        // Sort keys (PHP doesn't have built-in sort_keys like Python)
        $dataArray = json_decode($jsonString, true);
        ksort($dataArray);
        $sortedJson = json_encode($dataArray, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        
        return hash('sha256', $sortedJson);
    }

    /**
     * Parse HTTP response
     * 
     * @param ResponseInterface $response HTTP response
     * @return array Parsed response data
     * @throws RuntimeException
     */
    private function parseResponse(ResponseInterface $response): array
    {
        $body = (string) $response->getBody();
        $statusCode = $response->getStatusCode();

        $data = json_decode($body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Invalid JSON response from blockchain service');
        }

        // Log response for debugging
        $this->logger->debug('Blockchain response', [
            'status_code' => $statusCode,
            'success' => $data['success'] ?? false
        ]);

        return $data;
    }

    /**
     * Handle request exception
     * 
     * @param RequestException $e Request exception
     * @return array Error response
     */
    private function handleRequestException(RequestException $e): array
    {
        $response = $e->getResponse();
        
        if ($response) {
            try {
                $body = (string) $response->getBody();
                $errorData = json_decode($body, true);
                
                if (json_last_error() === JSON_ERROR_NONE && isset($errorData['error'])) {
                    return ['error' => $errorData['error']];
                }
            } catch (\Exception $parseError) {
                // Ignore parse error and fall back to default
            }
        }

        return ['error' => $e->getMessage()];
    }

    /**
     * Test blockchain connection
     * 
     * @return array Test results
     */
    public function testConnection(): array
    {
        $results = [
            'service_url' => $this->baseUrl,
            'api_key_set' => !empty($this->apiKey),
            'tests' => []
        ];

        // Test 1: Health check
        try {
            $health = $this->checkHealth();
            $results['tests']['health_check'] = [
                'success' => $health['healthy'],
                'message' => $health['healthy'] ? 'Service is healthy' : 'Service is unhealthy',
                'data' => $health
            ];
        } catch (\Exception $e) {
            $results['tests']['health_check'] = [
                'success' => false,
                'message' => 'Health check failed: ' . $e->getMessage()
            ];
        }

        // Test 2: Get stats
        try {
            $stats = $this->getBlockchainStats();
            $results['tests']['get_stats'] = [
                'success' => $stats['success'] ?? false,
                'message' => $stats['success'] ? 'Successfully retrieved stats' : 'Failed to get stats',
                'data' => $stats['data'] ?? null
            ];
        } catch (\Exception $e) {
            $results['tests']['get_stats'] = [
                'success' => false,
                'message' => 'Get stats failed: ' . $e->getMessage()
            ];
        }

        // Determine overall status
        $allTestsPassed = true;
        foreach ($results['tests'] as $test) {
            if (!$test['success']) {
                $allTestsPassed = false;
                break;
            }
        }

        $results['connection_successful'] = $allTestsPassed;
        $results['timestamp'] = date('c');

        $this->logger->info('Blockchain connection test completed', $results);

        return $results;
    }
}