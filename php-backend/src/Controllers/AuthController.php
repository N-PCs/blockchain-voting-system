<?php

declare(strict_types=1);

namespace VotingSystem\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use VotingSystem\Models\UserModel;
use VotingSystem\Services\Logger;
use Firebase\JWT\JWT;
use RuntimeException;

/**
 * Authentication Controller
 */
class AuthController
{
    /**
     * @var UserModel User model
     */
    private UserModel $userModel;

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
        $this->logger = new Logger('auth-controller');
    }

    /**
     * User login
     */
    public function login(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        if (!$data || !isset($data['email']) || !isset($data['password'])) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Email and password are required'
            ], 400);
        }

        try {
            $user = $this->userModel->verifyCredentials($data['email'], $data['password']);

            if (!$user) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'Invalid email or password'
                ], 401);
            }

            // Generate JWT token
            $token = $this->generateToken($user);

            $this->logger->info('User logged in successfully', [
                'user_id' => $user['id'],
                'email' => $user['email']
            ]);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user['uuid'],
                        'email' => $user['email'],
                        'firstName' => $user['first_name'],
                        'lastName' => $user['last_name'],
                        'userType' => $user['user_type'],
                        'registrationStatus' => $user['registration_status'],
                        'isActive' => (bool)$user['is_active']
                    ],
                    'token' => $token
                ]
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Login failed', [
                'email' => $data['email'],
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Login failed. Please try again.'
            ], 500);
        }
    }

    /**
     * User registration
     */
    public function register(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        try {
            $user = $this->userModel->createUser($data);

            $this->logger->info('User registered successfully', [
                'user_id' => $user['id'],
                'email' => $user['email']
            ]);

            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Registration submitted successfully. Please wait for admin approval.',
                'data' => [
                    'user_id' => $user['uuid'],
                    'email' => $user['email'],
                    'status' => $user['registration_status']
                ]
            ], 201);

        } catch (RuntimeException $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            $this->logger->error('Registration failed', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Registration failed. Please try again.'
            ], 500);
        }
    }

    /**
     * User logout
     */
    public function logout(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $userId = $request->getAttribute('user_id');

        $this->logger->info('User logged out', ['user_id' => $userId]);

        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Verify JWT token
     */
    public function verifyToken(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('user');

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user['uuid'],
                    'email' => $user['email'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name'],
                    'userType' => $user['user_type'],
                    'registrationStatus' => $user['registration_status'],
                    'isActive' => (bool)$user['is_active']
                ]
            ]
        ]);
    }

    /**
     * Get user profile
     */
    public function getProfile(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('user');

        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user['uuid'],
                    'email' => $user['email'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name'],
                    'dateOfBirth' => $user['date_of_birth'],
                    'governmentId' => $user['government_id'],
                    'userType' => $user['user_type'],
                    'registrationStatus' => $user['registration_status'],
                    'isActive' => (bool)$user['is_active'],
                    'createdAt' => $user['created_at'],
                    'updatedAt' => $user['updated_at']
                ]
            ]
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody();

        try {
            // Basic validation - only allow certain fields to be updated
            $allowedFields = ['first_name', 'last_name'];
            $updateData = array_intersect_key($data, array_flip($allowedFields));

            if (empty($updateData)) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'No valid fields to update'
                ], 400);
            }

            // Update user in database
            $this->userModel->updateUser($user['id'], $updateData);

            // Get updated user data
            $updatedUser = $this->userModel->getUserById($user['id']);

            $this->logger->info('Profile updated', ['user_id' => $user['id']]);

            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'user' => [
                        'id' => $updatedUser['uuid'],
                        'email' => $updatedUser['email'],
                        'firstName' => $updatedUser['first_name'],
                        'lastName' => $updatedUser['last_name']
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Profile update failed', [
                'user_id' => $user['id'],
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'success' => false,
                'error' => 'Failed to update profile'
            ], 500);
        }
    }

    /**
     * Generate JWT token
     */
    private function generateToken(array $user): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'your-secret-key';
        $issuedAt = time();
        $expirationTime = $issuedAt + (60 * 60 * 24 * 7); // 7 days

        $payload = [
            'iss' => 'voting-system',
            'aud' => 'voting-system-users',
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'user_id' => $user['id'],
            'email' => $user['email'],
            'user_type' => $user['user_type']
        ];

        return JWT::encode($payload, $secret, 'HS256');
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