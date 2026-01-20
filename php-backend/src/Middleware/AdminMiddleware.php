<?php

declare(strict_types=1);

namespace VotingSystem\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Admin Authorization Middleware
 */
class AdminMiddleware implements MiddlewareInterface
{
    /**
     * Process an incoming server request
     */
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $user = $request->getAttribute('user');

        if (!$user) {
            return $this->createForbiddenResponse('Authentication required');
        }

        if ($user['user_type'] !== 'admin') {
            return $this->createForbiddenResponse('Admin access required');
        }

        return $handler->handle($request);
    }

    /**
     * Create forbidden response
     */
    private function createForbiddenResponse(string $message): ResponseInterface
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => $message
        ]));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(403);
    }
}