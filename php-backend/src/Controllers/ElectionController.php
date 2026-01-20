<?php

declare(strict_types=1);

namespace VotingSystem\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use VotingSystem\Models\ElectionModel;
use VotingSystem\Services\BlockchainService;
use VotingSystem\Services\Logger;

/**
 * Election Controller
 */
class ElectionController
{
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
        $this->electionModel = new ElectionModel();
        $this->blockchainService = new BlockchainService();
        $this->logger = new Logger('election-controller');
    }

    /**
     * Get all elections
     */
    public function getElections(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $elections = $this->electionModel->getAllElections();

            $electionsData = array_map(function ($election) {
                return [
                    'id' => $election['uuid'],
                    'title' => $election['title'],
                    'description' => $election['description'],
                    'election_type' => $election['election_type'],
                    'start_date' => $election['start_date'],
                    'end_date' => $election['end_date'],
                    'status' => $election['status'],
                    'created_at' => $election['created_at']
                ];
            }, $elections);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $electionsData
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get elections', ['error' => $e->getMessage()]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to load elections'
            ], 500);
        }
    }

    /**
     * Get single election
     */
    public function getElection(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $id = $request->getAttribute('id');

        try {
            $election = $this->electionModel->getElectionByUuid($id);

            if (!$election) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Election not found'
                ], 404);
            }

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => [
                    'id' => $election['uuid'],
                    'title' => $election['title'],
                    'description' => $election['description'],
                    'election_type' => $election['election_type'],
                    'start_date' => $election['start_date'],
                    'end_date' => $election['end_date'],
                    'status' => $election['status'],
                    'created_at' => $election['created_at']
                ]
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get election', [
                'election_id' => $id,
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to load election'
            ], 500);
        }
    }

    /**
     * Get election candidates
     */
    public function getElectionCandidates(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $id = $request->getAttribute('id');

        try {
            $candidates = $this->electionModel->getElectionCandidates($id);

            $candidatesData = array_map(function ($candidate) {
                return [
                    'id' => $candidate['uuid'],
                    'name' => $candidate['first_name'] . ' ' . $candidate['last_name'],
                    'party_affiliation' => $candidate['party_affiliation'],
                    'biography' => $candidate['biography'],
                    'position' => $candidate['position']
                ];
            }, $candidates);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $candidatesData
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get election candidates', [
                'election_id' => $id,
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to load candidates'
            ], 500);
        }
    }

    /**
     * Get blockchain statistics
     */
    public function getBlockchainStats(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $stats = $this->blockchainService->getBlockchainStats();

            return $this->jsonResponse($response, $stats);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get blockchain stats', ['error' => $e->getMessage()]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to load blockchain statistics'
            ], 500);
        }
    }

    /**
     * Get blocks
     */
    public function getBlocks(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $page = (int) ($request->getQueryParams()['page'] ?? 1);
            $perPage = (int) ($request->getQueryParams()['per_page'] ?? 10);

            $blocks = $this->blockchainService->getBlocks($page, $perPage);

            return $this->jsonResponse($response, $blocks);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get blocks', ['error' => $e->getMessage()]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to load blocks'
            ], 500);
        }
    }

    /**
     * Get single block
     */
    public function getBlock(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $index = (int) $request->getAttribute('index');

        try {
            $block = $this->blockchainService->getBlock($index);

            return $this->jsonResponse($response, $block);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get block', [
                'block_index' => $index,
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to load block'
            ], 500);
        }
    }

    /**
     * Get transaction
     */
    public function getTransaction(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $id = $request->getAttribute('id');

        try {
            $transaction = $this->blockchainService->getTransaction($id);

            return $this->jsonResponse($response, $transaction);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get transaction', [
                'transaction_id' => $id,
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to load transaction'
            ], 500);
        }
    }

    /**
     * Create JSON response
     */
    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data, JSON_PRETTY_PRINT));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}