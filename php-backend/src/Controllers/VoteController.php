<?php
/**
 * Vote Controller
 * Handles vote casting with blockchain integration
 * 
 * @package VotingSystem\Controllers
 */

declare(strict_types=1);

namespace VotingSystem\Controllers;

use VotingSystem\Models\UserModel;
use VotingSystem\Models\VoteModel;
use VotingSystem\Models\ElectionModel;
use VotingSystem\Services\BlockchainService;
use VotingSystem\Services\Logger;
use VotingSystem\Database\DatabaseConfig;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use RuntimeException;

class VoteController
{
    /**
     * @var UserModel User model
     */
    private UserModel $userModel;

    /**
     * @var VoteModel Vote model
     */
    private VoteModel $voteModel;

    /**
     * @var ElectionModel Election model
     */
    private ElectionModel $electionModel;

    /**
     * @var BlockchainService Blockchain service
     */
    private BlockchainService $blockchainService;

    /**
     * @var Logger Logger instance
     */
    private Logger $logger;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->userModel = new UserModel();
        $this->voteModel = new VoteModel();
        $this->electionModel = new ElectionModel();
        $this->blockchainService = new BlockchainService();
        $this->logger = new Logger('vote-controller');
    }

    /**
     * Cast a vote
     * 
     * @param ServerRequestInterface $request HTTP request
     * @param ResponseInterface $response HTTP response
     * @return ResponseInterface JSON response
     */
    public function castVote(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody() ?? [];
        $userId = (int) $request->getAttribute('user_id'); // From JWT middleware
        $electionUuid = $data['election_id'] ?? $data['electionId'] ?? null;
        $candidateUuid = $data['candidate_id'] ?? $data['candidateId'] ?? null;
        
        $this->logger->info('Vote casting initiated', [
            'user_id' => $userId,
            'election_id' => $electionUuid
        ]);

        try {
            // Validate required fields
            if (empty($electionUuid) || empty($candidateUuid)) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Missing required field: election_id or candidate_id'
                ], 400);
            }

            // Get user information
            $user = $this->userModel->getUserById($userId);
            if (!$user) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'User not found'
                ], 404);
            }

            // Check if user is verified voter
            if ($user['registration_status'] !== 'verified') {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'User is not a verified voter'
                ], 403);
            }

            // Check election eligibility
            $election = $this->electionModel->getElectionByUuid($electionUuid);
            if (!$election) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Election not found'
                ], 404);
            }

            // Check if election is active
            $currentTime = time();
            $startTime = strtotime($election['start_date']);
            $endTime = strtotime($election['end_date']);

            if ($currentTime < $startTime) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Election has not started yet'
                ], 400);
            }

            if ($currentTime > $endTime) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Election has ended'
                ], 400);
            }

            // Check if user has already voted in this election
            if ($this->voteModel->hasUserVoted($userId, $election['id'])) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'You have already voted in this election'
                ], 400);
            }

            // Verify candidate exists in this election
            $candidate = $this->electionModel->getCandidateByUuid($candidateUuid);
            if (!$candidate || $candidate['election_id'] !== $election['id']) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Invalid candidate for this election'
                ], 400);
            }

            // Start database transaction
            DatabaseConfig::beginTransaction();

            try {
                // Create vote record in database (initially pending)
                $voteData = [
                    'election_id' => $election['id'],
                    'voter_id' => $userId,
                    'candidate_id' => $candidate['id'],
                    'ip_address' => $request->getServerParams()['REMOTE_ADDR'] ?? null,
                    'user_agent' => $request->getHeaderLine('User-Agent'),
                    'status' => 'pending'
                ];

                $voteId = $this->voteModel->createVote($voteData);
                $vote = $this->voteModel->getVoteById($voteId);

                $this->logger->info('Vote record created in database', [
                    'vote_id' => $voteId,
                    'election_id' => $election['id'],
                    'user_id' => $userId
                ]);

                // Prepare vote data for blockchain
                $blockchainVoteData = [
                    'election_uuid' => $election['uuid'],
                    'voter_uuid' => $user['uuid'],
                    'candidate_uuid' => $candidate['uuid'],
                    'vote_id' => $vote['uuid'],
                    'timestamp' => time(),
                    'session_id' => session_id(),
                    'ip_address' => $voteData['ip_address'],
                    'user_agent' => $voteData['user_agent']
                ];

                // Submit to blockchain
                $blockchainResult = $this->blockchainService->submitVoteTransaction($blockchainVoteData);

                if (!$blockchainResult['success']) {
                    throw new RuntimeException(
                        'Failed to submit vote to blockchain: ' . 
                        ($blockchainResult['error'] ?? 'Unknown error')
                    );
                }

                // Update vote with blockchain data
                $updateData = [
                    'vote_hash' => $blockchainResult['data']['vote_hash'] ?? null,
                    'transaction_id' => $blockchainResult['data']['transaction_id'] ?? null,
                    'status' => 'confirmed'
                ];

                $this->voteModel->updateVote($voteId, $updateData);

                // Commit transaction
                DatabaseConfig::commit();

                $this->logger->info('Vote cast successfully', [
                    'vote_id' => $voteId,
                    'transaction_id' => $updateData['transaction_id'],
                    'election_id' => $election['id']
                ]);

                // Prepare response
                $responseData = [
                    'success' => true,
                    'data' => [
                        'vote_id' => $vote['uuid'],
                        'transaction_id' => $updateData['transaction_id'],
                        'vote_hash' => $updateData['vote_hash'],
                        'timestamp' => time(),
                        'election' => [
                            'id' => $election['uuid'],
                            'title' => $election['title']
                        ],
                        'candidate' => [
                            'id' => $candidate['uuid'],
                            'name' => $candidate['name'] ?? null
                        ],
                        'message' => 'Vote cast successfully'
                    ]
                ];

                return $this->jsonResponse($response, $responseData, 201);

            } catch (\Exception $e) {
                // Rollback transaction on error
                DatabaseConfig::rollback();
                
                $this->logger->error('Vote casting failed', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'user_id' => $userId,
                    'election_id' => $electionUuid
                ]);
                
                throw $e; // Re-throw for outer catch block
            }

        } catch (RuntimeException $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error casting vote', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'An unexpected error occurred. Please try again.'
            ], 500);
        }
    }

    /**
     * Verify a vote
     * 
     * @param ServerRequestInterface $request HTTP request
     * @param ResponseInterface $response HTTP response
     * @return ResponseInterface JSON response
     */
    public function verifyVote(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $voteId = $request->getAttribute('vote_id') ?? $request->getAttribute('id');
        
        try {
            // Get vote from database
            $vote = $this->voteModel->getVoteByUuid($voteId);
            if (!$vote) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Vote not found'
                ], 404);
            }

            // Get user and election data
            $user = $this->userModel->getUserById($vote['voter_id']);
            $election = $this->electionModel->getElectionById($vote['election_id']);

            if (!$user || !$election) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Unable to verify vote data'
                ], 404);
            }

            // Verify in blockchain
            $verificationResult = $this->blockchainService->verifyVoteInBlockchain(
                $election['uuid'],
                $user['uuid'],
                $vote['vote_hash']
            );

            if (!$verificationResult['success']) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Failed to verify vote in blockchain'
                ], 500);
            }

            $responseData = [
                'success' => true,
                'data' => [
                    'vote_id' => $voteId,
                    'exists_in_blockchain' => $verificationResult['data']['exists'] ?? false,
                    'confirmed' => $verificationResult['data']['confirmed'] ?? false,
                    'blockchain_data' => $verificationResult['data'],
                    'database_data' => [
                        'vote' => $vote,
                        'voter' => [
                            'id' => $user['uuid'],
                            'name' => $user['first_name'] . ' ' . $user['last_name']
                        ],
                        'election' => [
                            'id' => $election['uuid'],
                            'title' => $election['title']
                        ]
                    ]
                ]
            ];

            return $this->jsonResponse($response, $responseData);

        } catch (\Exception $e) {
            $this->logger->error('Error verifying vote', [
                'vote_id' => $voteId,
                'error' => $e->getMessage()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to verify vote: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get vote details
     * 
     * @param ServerRequestInterface $request HTTP request
     * @param ResponseInterface $response HTTP response
     * @return ResponseInterface JSON response
     */
    public function getVoteDetails(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $voteId = $request->getAttribute('vote_id') ?? $request->getAttribute('id');
        $userId = (int) $request->getAttribute('user_id');
        
        try {
            $vote = $this->voteModel->getVoteByUuid($voteId);
            
            if (!$vote) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Vote not found'
                ], 404);
            }

            // Check permission (voter can see own votes, admin can see all)
            $user = $this->userModel->getUserById($userId);
            $isAdmin = $user['user_type'] === 'admin';
            
            if (!$isAdmin && $vote['voter_id'] !== $userId) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Unauthorized to view this vote'
                ], 403);
            }

            // Get additional data
            $voter = $this->userModel->getUserById($vote['voter_id']);
            $election = $this->electionModel->getElectionById($vote['election_id']);
            $candidate = $this->electionModel->getCandidateById($vote['candidate_id']);

            $responseData = [
                'success' => true,
                'data' => [
                    'vote' => [
                        'id' => $vote['uuid'],
                        'status' => $vote['status'],
                        'vote_hash' => $vote['vote_hash'],
                        'transaction_id' => $vote['transaction_id'],
                        'casted_at' => $vote['casted_at'],
                        'ip_address' => $isAdmin ? $vote['ip_address'] : null,
                        'user_agent' => $isAdmin ? $vote['user_agent'] : null
                    ],
                    'voter' => [
                        'id' => $voter['uuid'],
                        'name' => $voter['first_name'] . ' ' . $voter['last_name'],
                        'email' => $isAdmin ? $voter['email'] : null
                    ],
                    'election' => [
                        'id' => $election['uuid'],
                        'title' => $election['title'],
                        'type' => $election['election_type']
                    ],
                    'candidate' => [
                        'id' => $candidate['uuid'],
                        'name' => $candidate['name'] ?? null,
                        'party_affiliation' => $candidate['party_affiliation']
                    ]
                ]
            ];

            // Add blockchain verification if available
            if ($vote['vote_hash']) {
                $verification = $this->blockchainService->verifyVoteInBlockchain(
                    $election['uuid'],
                    $voter['uuid'],
                    $vote['vote_hash']
                );
                
                if ($verification['success']) {
                    $responseData['data']['blockchain_verification'] = $verification['data'];
                }
            }

            return $this->jsonResponse($response, $responseData);

        } catch (\Exception $e) {
            $this->logger->error('Error getting vote details', [
                'vote_id' => $voteId,
                'error' => $e->getMessage()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to get vote details'
            ], 500);
        }
    }

    /**
     * Get user's voting history
     * 
     * @param ServerRequestInterface $request HTTP request
     * @param ResponseInterface $response HTTP response
     * @return ResponseInterface JSON response
     */
    public function getVotingHistory(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $userId = $request->getAttribute('user_id');
        $page = (int) ($request->getQueryParams()['page'] ?? 1);
        $limit = (int) ($request->getQueryParams()['limit'] ?? 10);
        
        try {
            $votes = $this->voteModel->getVotesByVoter($userId, $page, $limit);
            $totalVotes = $this->voteModel->countVotesByVoter($userId);
            
            $votesData = [];
            foreach ($votes as $vote) {
                $election = $this->electionModel->getElectionById($vote['election_id']);
                $candidate = $this->electionModel->getCandidateById($vote['candidate_id']);
                
                $votesData[] = [
                    'vote_id' => $vote['uuid'],
                    'election' => [
                        'id' => $election['uuid'],
                        'title' => $election['title'],
                        'type' => $election['election_type']
                    ],
                    'candidate' => [
                        'name' => $candidate['name'] ?? null,
                        'party_affiliation' => $candidate['party_affiliation']
                    ],
                    'casted_at' => $vote['casted_at'],
                    'status' => $vote['status'],
                    'verified_in_blockchain' => !empty($vote['vote_hash'])
                ];
            }
            
            $responseData = [
                'success' => true,
                'data' => [
                    'votes' => $votesData,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $totalVotes,
                        'total_pages' => ceil($totalVotes / $limit)
                    ]
                ]
            ];
            
            return $this->jsonResponse($response, $responseData);
            
        } catch (\Exception $e) {
            $this->logger->error('Error getting voting history', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to get voting history'
            ], 500);
        }
    }

    /**
     * Create JSON response
     * 
     * @param ResponseInterface $response Response object
     * @param array $data Response data
     * @param int $status HTTP status code
     * @return ResponseInterface JSON response
     */
    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data, JSON_PRETTY_PRINT));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}