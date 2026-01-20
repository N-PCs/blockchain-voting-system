<?php

declare(strict_types=1);

namespace VotingSystem\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * JSON Body Parser Middleware
 */
class JsonBodyParserMiddleware implements MiddlewareInterface
{
    /**
     * Process an incoming server request
     */
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $contentType = $request->getHeaderLine('Content-Type');

        // Parse JSON body if content type is application/json
        if (str_contains($contentType, 'application/json')) {
            $body = $request->getBody()->getContents();
            $request->getBody()->rewind();

            if (!empty($body)) {
                try {
                    $parsedBody = json_decode($body, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $request = $request->withParsedBody($parsedBody);
                    }
                } catch (\Exception $e) {
                    // Invalid JSON, continue without parsed body
                }
            }
        }

        return $handler->handle($request);
    }
}