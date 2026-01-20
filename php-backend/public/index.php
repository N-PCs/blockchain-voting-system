<?php
/**
 * Voting System PHP Backend - Entry Point
 */

// Display all errors for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set CORS headers
header('Access-Control-Allow-Origin: ' . ($_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3000'));
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple routing
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api/v1';

// Remove base path
if (strpos($request_uri, $base_path) === 0) {
    $request_uri = substr($request_uri, strlen($base_path));
}

// Simple router
switch ($request_uri) {
    case '/health':
        echo json_encode(['status' => 'healthy', 'timestamp' => date('c')]);
        break;
        
    case '/auth/login':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => '1',
                        'email' => $data['email'] ?? '',
                        'userType' => 'admin'
                    ],
                    'token' => 'test-jwt-token'
                ]
            ]);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
        break;
}