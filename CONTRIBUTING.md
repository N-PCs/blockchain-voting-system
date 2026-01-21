# Contributing to Blockchain Voting System

Thank you for your interest in contributing to the Blockchain Voting System! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## 🤝 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

#### Windows (Recommended)
- **XAMPP** (includes Apache, MySQL, PHP)
- **Node.js** 14+ with npm
- **Python** 3.8+ with pip
- **Git** 2.0+

#### Linux/Mac
- **PHP** 8.1+ with Composer
- **Node.js** 14+ with npm
- **Python** 3.8+ with pip
- **MySQL** 5.7+ or MariaDB 10.3+
- **Git** 2.0+

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/blockchain-voting-system.git
   cd blockchain-voting-system
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/original-owner/blockchain-voting-system.git
   ```

## 🛠️ Development Setup

### Windows XAMPP Setup (Easiest)

```batch
# Install XAMPP from https://www.apachefriends.org/
# Start XAMPP Control Panel and start Apache + MySQL

# Run Windows setup script
setup-windows.bat

# Open phpMyAdmin (http://localhost/phpmyadmin)
# Create database 'voting_system' and import database/schema.sql

# Run database setup
setup-database.bat

# Install dependencies
cd python-blockchain && pip install -r requirements.txt
cd ../node-ws && npm install
cd ../frontend && npm install

# Start services in separate terminals:
# Terminal 1: cd python-blockchain && python run.py
# Terminal 2: cd node-ws && npm start
# Terminal 3: cd frontend && npm run dev

# Access the application
start http://localhost:5173
```

### Windows Standalone MySQL Setup (Advanced)

```batch
# Install MySQL Server from https://dev.mysql.com/downloads/mysql/
# Start MySQL service (run Command Prompt as Administrator)
# net start MySQL96  (or whatever your service name is)

# Run Windows setup script
setup-windows.bat

# Set up MySQL database and user
mysql-setup.bat

# Run database setup
setup-database.bat

# Install dependencies
cd python-blockchain && pip install -r requirements.txt
cd ../node-ws && npm install
cd ../frontend && npm install

# Start services in separate terminals:
# Terminal 1: cd python-blockchain && python run.py
# Terminal 2: cd node-ws && npm start
# Terminal 3: cd frontend && npm run dev
# Terminal 4: cd php-backend && php -S localhost:8000 -t public/

# Access the application
start http://localhost:5173
```

### Manual Setup

1. **Database Setup**:
   ```bash
   ./setup-database.sh
   ```

2. **Backend Setup**:
   ```bash
   cd php-backend
   composer install
   cp .env.example .env
   php -S localhost:8000 -t public/
   ```

3. **Blockchain Setup**:
   ```bash
   cd python-blockchain
   pip install -r requirements.txt
   python run.py
   ```

4. **WebSocket Server**:
   ```bash
   cd node-ws
   npm install
   npm start
   ```

5. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🏗️ Project Structure

```
blockchain-voting-system/
├── frontend/              # React TypeScript application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript type definitions
├── php-backend/           # PHP REST API
│   ├── src/
│   │   ├── Controllers/   # API controllers
│   │   ├── Middleware/    # PSR-15 middleware
│   │   ├── Models/        # Data models
│   │   └── Services/      # Business logic services
├── python-blockchain/     # Blockchain implementation
│   ├── src/
│   │   ├── core/          # Core blockchain logic
│   │   └── api/           # Flask API endpoints
├── node-ws/              # WebSocket server
│   ├── src/
│   │   ├── server/        # WebSocket server logic
│   │   └── utils/         # Utility functions
└── database/             # Database schemas and migrations
    └── schema.sql
```

## 🔄 Development Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Critical fixes for production

### Creating a Feature Branch

```bash
# Sync with upstream
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### Commit Guidelines

Follow conventional commit format:

```bash
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

Examples:
```bash
feat(auth): add JWT token refresh
fix(voting): prevent double voting in race conditions
docs(api): update WebSocket event documentation
```

## 📝 Coding Standards

### PHP (Backend)

- Follow PSR-12 coding standards
- Use type declarations for all methods and properties
- Implement proper error handling with exceptions
- Use dependency injection
- Write comprehensive PHPDoc comments

```php
<?php

namespace VotingSystem\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Authentication controller
 */
class AuthController
{
    public function __construct(
        private AuthService $authService,
        private LoggerInterface $logger
    ) {}

    public function login(Request $request, Response $response): Response
    {
        // Implementation
    }
}
```

### Python (Blockchain)

- Follow PEP 8 style guide
- Use type hints for all functions
- Write comprehensive docstrings
- Use meaningful variable names

```python
from typing import Optional, Dict, Any
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/blockchain/stats', methods=['GET'])
def get_blockchain_stats() -> Dict[str, Any]:
    """
    Get blockchain statistics.

    Returns:
        Dict containing blockchain stats
    """
    try:
        stats = blockchain.get_stats()
        return jsonify({
            'status': 'success',
            'data': stats
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
```

### JavaScript/TypeScript (Frontend)

- Use TypeScript for all new code
- Follow ESLint and Prettier configuration
- Use functional components with hooks
- Implement proper error boundaries
- Write unit tests for components

```typescript
import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

interface Election {
  id: string;
  title: string;
  status: 'active' | 'draft' | 'completed';
}

export const ElectionList: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const { loading, error, get } = useApi();

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const data = await get('/elections');
        setElections(data);
      } catch (err) {
        console.error('Failed to fetch elections:', err);
      }
    };

    fetchElections();
  }, [get]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {elections.map(election => (
        <div key={election.id}>{election.title}</div>
      ))}
    </div>
  );
};
```

### Node.js (WebSocket)

- Use async/await for asynchronous operations
- Implement proper error handling
- Use Winston for logging
- Follow ESLint configuration

## 🧪 Testing

### Running Tests

```bash
# PHP tests
cd php-backend && composer test

# Node.js tests
cd node-ws && npm test

# Python tests
cd python-blockchain && python -m pytest
```

### Testing Guidelines

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Test both positive and negative scenarios
- Mock external dependencies

## 📤 Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date**:
   ```bash
   git checkout your-feature-branch
   git rebase develop
   ```

2. **Run all checks**:
   ```bash
   # Lint and format code
   ./run-lint.sh

   # Run tests
   ./run-tests.sh

   # Check health
   ./health-check.sh
   ```

3. **Create a pull request**:
   - Use a descriptive title
   - Provide detailed description
   - Reference related issues
   - Add screenshots for UI changes

4. **Pull Request Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Documentation updated
   - [ ] Tests added/updated
   - [ ] Security review passed
   ```

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to reproduce**: Step-by-step instructions
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, browser, versions
- **Logs**: Relevant log output
- **Screenshots**: If applicable

### Feature Requests

For feature requests, please include:

- **Description**: Clear description of the feature
- **Use case**: Why this feature is needed
- **Alternatives**: Considered alternatives
- **Additional context**: Any other relevant information

## 📞 Getting Help

- **Documentation**: Check the README and docs folder
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Slack**: Join our community Slack (if available)

## 🎉 Recognition

Contributors will be recognized in:
- Repository contributors list
- Changelog for significant contributions
- Release notes

Thank you for contributing to the Blockchain Voting System! 🚀