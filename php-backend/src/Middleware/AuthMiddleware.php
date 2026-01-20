<?php

declare(strict_types=1);

namespace VotingSystem\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use VotingSystem\Database\DatabaseConfig;

/**
 * Authentication Middleware
 */
class AuthMiddleware implements MiddlewareInterface
{
    /**
     * Process an incoming server request
     */
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $authHeader = $request->getHeaderLine('Authorization');
        $token = null;

        // Extract token from Authorization header
        if (!empty($authHeader) && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        }

        // Extract token from query parameter (fallback)
        if (!$token) {
            $token = $request->getQueryParams()['token'] ?? null;
        }

        if (!$token) {
            return $this->createUnauthorizedResponse('No authentication token provided');
        }

        try {
            // Verify JWT token
            $secret = $_ENV['JWT_SECRET'] ?? 'your-secret-key';
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));

            // Get user from database to ensure they still exist and are active
            $userModel = new \VotingSystem\Models\UserModel();
            $user = $userModel->getUserById($decoded->user_id ?? 0);

            if (!$user || !$user['is_active']) {
                return $this->createUnauthorizedResponse('User account is inactive');
            }

            // Add user to request attributes
            $request = $request->withAttribute('user_id', $user['id']);
            $request = $request->withAttribute('user', $user);

        } catch (\Firebase\JWT\ExpiredException $e) {
            return $this->createUnauthorizedResponse('Token has expired');
        } catch (\Exception $e) {
            return $this->createUnauthorizedResponse('Invalid authentication token');
        }

        return $handler->handle($request);
    }

    /**
     * Create unauthorized response
     */
    private function createUnauthorizedResponse(string $message): ResponseInterface
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => $message
        ]));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}