<?php

declare(strict_types=1);

/**
 * Voting System PHP Backend - Entry Point
 * Using Slim Framework for PSR-7 compliance
 */

require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use VotingSystem\Controllers\VoteController;
use VotingSystem\Controllers\AuthController;
use VotingSystem\Controllers\ElectionController;
use VotingSystem\Controllers\AdminController;
use VotingSystem\Middleware\AuthMiddleware;
use VotingSystem\Middleware\AdminMiddleware;
use VotingSystem\Middleware\CorsMiddleware;
use VotingSystem\Middleware\JsonBodyParserMiddleware;
use VotingSystem\Services\Logger;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Create Slim App
$app = AppFactory::create();

// Add error middleware
$app->addErrorMiddleware(
    $_ENV['APP_ENV'] === 'development',
    true,
    true,
    Logger::getInstance('slim-errors')
);

// Add middleware
$app->add(new CorsMiddleware());
$app->add(new JsonBodyParserMiddleware());

// Routes
$app->group('/api/v1', function (RouteCollectorProxy $group) {
    // Health check
    $group->get('/health', function (Request $request, Response $response) {
        $data = [
            'status' => 'healthy',
            'timestamp' => date('c'),
            'version' => '1.0.0'
        ];
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // Authentication routes
    $group->post('/auth/login', [AuthController::class, 'login']);
    $group->post('/auth/register', [AuthController::class, 'register']);
    $group->post('/auth/logout', [AuthController::class, 'logout'])->add(new AuthMiddleware());
    $group->get('/auth/verify', [AuthController::class, 'verifyToken'])->add(new AuthMiddleware());

    // User profile routes
    $group->get('/profile', [AuthController::class, 'getProfile'])->add(new AuthMiddleware());
    $group->put('/profile', [AuthController::class, 'updateProfile'])->add(new AuthMiddleware());

    // Election routes
    $group->get('/elections', [ElectionController::class, 'getElections'])->add(new AuthMiddleware());
    $group->get('/elections/{id}', [ElectionController::class, 'getElection'])->add(new AuthMiddleware());
    $group->get('/elections/{id}/candidates', [ElectionController::class, 'getElectionCandidates'])->add(new AuthMiddleware());

    // Voting routes
    $group->post('/votes', [VoteController::class, 'castVote'])->add(new AuthMiddleware());
    $group->get('/votes/{id}', [VoteController::class, 'getVoteDetails'])->add(new AuthMiddleware());
    $group->get('/votes/history', [VoteController::class, 'getVotingHistory'])->add(new AuthMiddleware());
    $group->post('/votes/{id}/verify', [VoteController::class, 'verifyVote'])->add(new AuthMiddleware());

    // Blockchain routes
    $group->get('/blockchain/stats', [ElectionController::class, 'getBlockchainStats'])->add(new AuthMiddleware());
    $group->get('/blockchain/blocks', [ElectionController::class, 'getBlocks'])->add(new AuthMiddleware());
    $group->get('/blockchain/blocks/{index}', [ElectionController::class, 'getBlock'])->add(new AuthMiddleware());
    $group->get('/blockchain/transactions/{id}', [ElectionController::class, 'getTransaction'])->add(new AuthMiddleware());

    // Admin routes
    $group->group('/admin', function (RouteCollectorProxy $adminGroup) {
        // User management
        $adminGroup->get('/users/pending', [AdminController::class, 'getPendingRegistrations']);
        $adminGroup->post('/users/{id}/verify', [AdminController::class, 'verifyUser']);
        $adminGroup->post('/users/{id}/reject', [AdminController::class, 'rejectUser']);

        // Election management
        $adminGroup->post('/elections', [AdminController::class, 'createElection']);
        $adminGroup->put('/elections/{id}', [AdminController::class, 'updateElection']);
        $adminGroup->delete('/elections/{id}', [AdminController::class, 'deleteElection']);
        $adminGroup->post('/elections/{id}/start', [AdminController::class, 'startElection']);
        $adminGroup->post('/elections/{id}/end', [AdminController::class, 'endElection']);

        // Candidate management
        $adminGroup->post('/elections/{electionId}/candidates', [AdminController::class, 'addCandidate']);
        $adminGroup->delete('/elections/{electionId}/candidates/{candidateId}', [AdminController::class, 'removeCandidate']);

        // Election results
        $adminGroup->get('/elections/{id}/results', [AdminController::class, 'getElectionResults']);

        // Audit trail
        $adminGroup->get('/audit', [AdminController::class, 'getAuditTrail']);
        $adminGroup->get('/audit/{id}', [AdminController::class, 'getAuditEntry']);
    })->add(new AdminMiddleware());

});

// Handle 404
$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function (Request $request, Response $response) {
    $response->getBody()->write(json_encode([
        'success' => false,
        'error' => 'Endpoint not found'
    ]));
    return $response
        ->withHeader('Content-Type', 'application/json')
        ->withStatus(404);
});

// Run the app
$app->run();