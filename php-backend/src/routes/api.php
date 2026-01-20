<?php
/**
 * API Routes for Voting System
 * 
 * @package VotingSystem\Routes
 */

declare(strict_types=1);

use VotingSystem\Controllers\AuthController;
use VotingSystem\Controllers\UserController;
use VotingSystem\Controllers\VoteController;
use VotingSystem\Controllers\AdminController;
use VotingSystem\Controllers\BlockchainController;
use VotingSystem\Middleware\AuthMiddleware;
use VotingSystem\Middleware\AdminMiddleware;

// Helper function to get controller instance
$getController = function (string $controllerClass) {
    return new $controllerClass();
};

// Apply CORS headers
header('Access-Control-Allow-Origin: ' . ($_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3000'));
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Parse request
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = '/api/v1';

// Remove base path from request URI
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}

// Route definitions
$routes = [
    // Public routes (no auth required)
    'POST /auth/register' => [AuthController::class, 'register'],
    'POST /auth/login' => [AuthController::class, 'login'],
    'GET /health' => function() {
        echo json_encode(['status' => 'healthy', 'timestamp' => date('c')]);
    },
    
    // Protected routes (require authentication)
    'GET /auth/profile' => [AuthController::class, 'getProfile', [AuthMiddleware::class]],
    'PUT /auth/profile' => [AuthController::class, 'updateProfile', [AuthMiddleware::class]],
    
    // Vote routes
    'POST /votes/cast' => [VoteController::class, 'castVote', [AuthMiddleware::class]],
    'GET /votes/{vote_id}' => [VoteController::class, 'getVoteDetails', [AuthMiddleware::class]],
    'GET /votes/verify/{vote_id}' => [VoteController::class, 'verifyVote', [AuthMiddleware::class]],
    'GET /votes/history' => [VoteController::class, 'getVotingHistory', [AuthMiddleware::class]],
    
    // Election routes
    'GET /elections/active' => [ElectionController::class, 'getActiveElections', [AuthMiddleware::class]],
    'GET /elections/{election_id}/candidates' => [ElectionController::class, 'getCandidates', [AuthMiddleware::class]],
    'GET /elections/{election_id}/eligibility' => [ElectionController::class, 'checkEligibility', [AuthMiddleware::class]],
    
    // Blockchain routes (public for explorer, protected for operations)
    'GET /blockchain/stats' => [BlockchainController::class, 'getStats'],
    'GET /blockchain/blocks' => [BlockchainController::class, 'getBlocks'],
    'GET /blockchain/blocks/{block_index}' => [BlockchainController::class, 'getBlock'],
    'GET /blockchain/transactions/{transaction_id}' => [BlockchainController::class, 'getTransaction'],
    'POST /blockchain/test' => [BlockchainController::class, 'testConnection', [AuthMiddleware::class]],
    
    // Admin routes
    'GET /admin/pending-registrations' => [AdminController::class, 'getPendingRegistrations', [AuthMiddleware::class, AdminMiddleware::class]],
    'PUT /admin/users/{user_id}/status' => [AdminController::class, 'updateUserStatus', [AuthMiddleware::class, AdminMiddleware::class]],
    'GET /admin/elections' => [AdminController::class, 'getAllElections', [AuthMiddleware::class, AdminMiddleware::class]],
    'POST /admin/elections' => [AdminController::class, 'createElection', [AuthMiddleware::class, AdminMiddleware::class]],
    'GET /admin/elections/{election_id}/results' => [AdminController::class, 'getElectionResults', [AuthMiddleware::class, AdminMiddleware::class]],
    'GET /admin/elections/{election_id}/audit' => [AdminController::class, 'getAuditTrail', [AuthMiddleware::class, AdminMiddleware::class]],
];

// Simple router implementation
function routeRequest(array $routes, string $method, string $uri): void
{
    // Try exact match first
    $routeKey = $method . ' ' . $uri;
    
    if (isset($routes[$routeKey])) {
        executeRoute($routes[$routeKey]);
        return;
    }
    
    // Try pattern matching with parameters
    foreach ($routes as $pattern => $routeConfig) {
        list($routeMethod, $routePath) = explode(' ', $pattern, 2);
        
        if ($routeMethod !== $method) {
            continue;
        }
        
        // Convert route pattern to regex
        $regex = preg_replace('/\{([^}]+)\}/', '([^/]+)', $routePath);
        $regex = '#^' . $regex . '$#';
        
        if (preg_match($regex, $uri, $matches)) {
            array_shift($matches); // Remove full match
            
            // Extract parameter names
            preg_match_all('/\{([^}]+)\}/', $routePath, $paramNames);
            $paramNames = $paramNames[1];
            
            // Add parameters to request
            foreach ($paramNames as $index => $name) {
                if (isset($matches[$index])) {
                    $_REQUEST['route_params'][$name] = $matches[$index];
                }
            }
            
            executeRoute($routeConfig);
            return;
        }
    }
    
    // No route found
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
}

function executeRoute(array $routeConfig): void
{
    try {
        $controllerClass = $routeConfig[0];
        $method = $routeConfig[1];
        $middleware = $routeConfig[2] ?? [];
        
        // Execute middleware
        foreach ($middleware as $middlewareClass) {
            $middlewareInstance = new $middlewareClass();
            if (!$middlewareInstance->handle()) {
                return; // Middleware stopped execution
            }
        }
        
        // Create controller and call method
        $controller = new $controllerClass();
        
        // Create mock request/response objects (simplified)
        $request = [
            'method' => $_SERVER['REQUEST_METHOD'],
            'uri' => $_SERVER['REQUEST_URI'],
            'query' => $_GET,
            'body' => json_decode(file_get_contents('php://input'), true) ?? [],
            'headers' => getallheaders(),
            'route_params' => $_REQUEST['route_params'] ?? [],
            'user_id' => $_SESSION['user_id'] ?? null
        ];
        
        // Call controller method
        $response = $controller->$method($request);
        
        // Output response
        if (is_array($response)) {
            header('Content-Type: application/json');
            echo json_encode($response);
        }
        
    } catch (Exception $e) {
        error_log('Route execution error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Internal server error',
            'message' => $_ENV['APP_DEBUG'] === 'true' ? $e->getMessage() : 'An error occurred'
        ]);
    }
}

// Handle the request
routeRequest($routes, $requestMethod, $requestUri);