#!/bin/bash

# Blockchain Voting System - XAMPP Setup Script for Linux/Mac
# This script helps set up the project to work with XAMPP

set -e  # Exit on any error

echo "========================================"
echo "Blockchain Voting System - XAMPP Setup"
echo "========================================"
echo

# Configuration - Change these if needed
XAMPP_DIR="/opt/lampp"  # Linux default
# XAMPP_DIR="/Applications/XAMPP"  # Uncomment for macOS
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$XAMPP_DIR/htdocs/voting-api"

echo "Checking XAMPP installation..."
if [ ! -d "$XAMPP_DIR" ]; then
    echo "ERROR: XAMPP not found in $XAMPP_DIR"
    echo "Please install XAMPP or update the XAMPP_DIR variable in this script"
    echo
    echo "Common XAMPP locations:"
    echo "  Linux: /opt/lampp"
    echo "  macOS: /Applications/XAMPP"
    echo "  Windows: C:\\xampp"
    exit 1
fi

echo "XAMPP found at $XAMPP_DIR"
echo

echo "Checking PHP version in XAMPP..."
PHP_VERSION=$("$XAMPP_DIR/bin/php" --version | head -n 1 | cut -d' ' -f2 | cut -d'.' -f1,2)
if [ "$(echo "$PHP_VERSION < 8.1" | bc -l)" = "1" ]; then
    echo "WARNING: PHP 8.1+ recommended. Current version: $PHP_VERSION"
else
    echo "PHP version OK: $PHP_VERSION"
fi
echo

echo "Creating API directory in XAMPP htdocs..."
if [ ! -d "$API_DIR" ]; then
    mkdir -p "$API_DIR"
    echo "Created $API_DIR"
else
    echo "Directory already exists: $API_DIR"
fi

echo
echo "Copying PHP backend files..."
cp -r php-backend/* "$API_DIR/"
echo "PHP backend copied to $API_DIR"

echo
echo "Setting up environment files..."

# Setup PHP backend .env
if [ ! -f "$API_DIR/.env" ]; then
    cp "$API_DIR/.env.example" "$API_DIR/.env" 2>/dev/null || echo "No .env.example found in API directory"
    echo "Created $API_DIR/.env"
    echo "Please edit $API_DIR/.env with your database credentials"
else
    echo "$API_DIR/.env already exists"
fi

# Setup Python blockchain .env
if [ ! -f "python-blockchain/.env" ]; then
    cp "python-blockchain/.env.example" "python-blockchain/.env" 2>/dev/null || echo "No .env.example found in python-blockchain"
    echo "Created python-blockchain/.env"
fi

# Setup Node.js WebSocket .env
if [ ! -f "node-ws/.env" ]; then
    cp "node-ws/.env.example" "node-ws/.env" 2>/dev/null || echo "No .env.example found in node-ws"
    echo "Created node-ws/.env"
fi

# Setup React frontend .env
if [ ! -f "frontend/.env" ]; then
    cp "frontend/.env.example" "frontend/.env" 2>/dev/null || echo "No .env.example found in frontend"
    echo "Created frontend/.env"
fi

echo
echo "========================================"
echo "Setup Summary"
echo "========================================"
echo
echo "1. XAMPP Directory: $XAMPP_DIR"
echo "2. API Directory: $API_DIR"
echo "3. Project Directory: $PROJECT_DIR"
echo
echo "Next Steps:"
echo "-----------"
echo "1. Start XAMPP: sudo $XAMPP_DIR/lampp start"
echo "2. Open phpMyAdmin: http://localhost/phpmyadmin"
echo "3. Create database 'voting_system'"
echo "4. Import database/schema.sql"
echo "5. Edit $API_DIR/.env with correct database credentials"
echo "6. Run: cd $API_DIR && composer install"
echo "7. Run: cd python-blockchain && pip install -r requirements.txt"
echo "8. Run: cd node-ws && npm install"
echo "9. Run: cd frontend && npm install"
echo
echo "Startup Commands:"
echo "-----------------"
echo "1. Start XAMPP: sudo $XAMPP_DIR/lampp start"
echo "2. cd python-blockchain && python run.py"
echo "3. cd node-ws && npm start"
echo "4. cd frontend && npm run dev"
echo
echo "Access URLs:"
echo "-----------"
echo "Frontend:    http://localhost:5173"
echo "API:         http://localhost/voting-api"
echo "phpMyAdmin:  http://localhost/phpmyadmin"
echo "Blockchain:  http://localhost:5000"
echo "WebSocket:   ws://localhost:3001"
echo
echo "Default Admin Login:"
echo "Email: admin@votingsystem.com"
echo "Password: Admin123!"
echo
echo "IMPORTANT: Change the default admin password immediately!"
echo