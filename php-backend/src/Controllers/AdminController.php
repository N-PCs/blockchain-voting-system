<?php

declare(strict_types=1);

namespace VotingSystem\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use VotingSystem\Models\UserModel;
use VotingSystem\Models\ElectionModel;
use VotingSystem\Services\Logger;

/**
 * Admin Controller
 */
class AdminController
{
    /**
     * @var UserModel User model
     */
    private UserModel $userModel;

    /**
     * @var ElectionModel Election model
     */
    private ElectionModel $electionModel;

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
        $this->electionModel = new ElectionModel();
        $this->logger = new Logger('admin-controller');
    }

    /**
     * Get pending user registrations
     */
    public function getPendingRegistrations(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $users = $this->userModel->getPendingRegistrations();

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $users
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get pending registrations', ['error' => $e->getMessage()]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to load pending registrations'
            ], 500);
        }
    }

    /**
     * Verify user registration
     */
    public function verifyUser(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $userId = (int) $request->getAttribute('id');
        $adminId = $request->getAttribute('user_id');

        try {
            $this->userModel->updateRegistrationStatus($userId, 'verified', $adminId);

            $this->logger->info('User verified', [
                'user_id' => $userId,
                'admin_id' => $adminId
            ]);

            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'User verified successfully'
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Failed to verify user', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to verify user'
            ], 500);
        }
    }

    /**
     * Reject user registration
     */
    public function rejectUser(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $userId = (int) $request->getAttribute('id');
        $adminId = $request->getAttribute('user_id');

        try {
            $this->userModel->updateRegistrationStatus($userId, 'rejected', $adminId);

            $this->logger->info('User rejected', [
                'user_id' => $userId,
                'admin_id' => $adminId
            ]);

            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'User registration rejected'
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Failed to reject user', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to reject user'
            ], 500);
        }
    }

    /**
     * Create election
     */
    public function createElection(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();
        $adminId = $request->getAttribute('user_id');

        try {
            $election = $this->electionModel->createElection($data, $adminId);

            $this->logger->info('Election created', [
                'election_id' => $election['id'],
                'admin_id' => $adminId
            ]);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $election
            ], 201);

        } catch (\Exception $e) {
            $this->logger->error('Failed to create election', [
                'error' => $e->getMessage(),
                'admin_id' => $adminId
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to create election'
            ], 500);
        }
    }

    /**
     * Get election results
     */
    public function getElectionResults(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $electionId = $request->getAttribute('id');

        try {
            $results = $this->electionModel->getElectionResults($electionId);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get election results', [
                'election_id' => $electionId,
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to load election results'
            ], 500);
        }
    }

    /**
     * Placeholder methods for other admin functions
     */
    public function updateElection(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->jsonResponse($response, ['success' => false, 'error' => 'Not implemented'], 501);
    }

    public function deleteElection(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->jsonResponse($response, ['success' => false, 'error' => 'Not implemented'], 501);
    }

    public function startElection(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->jsonResponse($response, ['success' => false, 'error' => 'Not implemented'], 501);
    }

    public function endElection(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->jsonResponse($response, ['success' => false, 'error' => 'Not implemented'], 501);
    }

    public function addCandidate(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->jsonResponse($response, ['success' => false, 'error' => 'Not implemented'], 501);
    }

    public function removeCandidate(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->jsonResponse($response, ['success' => false, 'error' => 'Not implemented'], 501);
    }

    public function getAuditTrail(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->jsonResponse($response, ['success' => false, 'error' => 'Not implemented'], 501);
    }

    public function getAuditEntry(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->jsonResponse($response, ['success' => false, 'error' => 'Not implemented'], 501);
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