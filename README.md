# Blockchain Voting System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![PHP Version](https://img.shields.io/badge/php-%3E%3D8.1-8892BF)](https://php.net/)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.8-blue)](https://python.org/)

A secure, transparent, and tamper-proof voting system built with blockchain technology. This system provides end-to-end verifiable elections with real-time monitoring and comprehensive audit trails.

> **Note**: This project has been updated to work without Docker. Windows users should use XAMPP for easy setup, while Linux/Mac users can use the traditional manual setup.

## ✨ Features

- **🔐 End-to-End Security**: Complete encryption from vote casting to blockchain storage
- **⛓️ Blockchain Verification**: Immutable vote storage with cryptographic proof
- **📊 Real-Time Monitoring**: Live election statistics and system health monitoring
- **👥 Multi-User Roles**: Separate interfaces for voters, candidates, and administrators
- **🔍 Audit Trails**: Comprehensive logging of all system activities
- **🌐 WebSocket Integration**: Real-time updates and notifications
- **📱 Responsive UI**: Modern React-based interface with Bootstrap styling
- **🔧 Multi-Service Architecture**: Scalable microservices design

## 🏗️ Architecture

The system consists of four main components:

### 📁 Project Structure

```
blockchain-voting-system/
├── frontend/          # React + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── php-backend/       # PHP REST API
│   ├── src/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   └── Models/
│   ├── .env.example
│   ├── composer.json
│   └── public/index.php
├── python-blockchain/ # Blockchain implementation
│   ├── src/
│   │   ├── core/
│   │   └── api/
│   ├── .env.example
│   ├── requirements.txt
│   └── run.py
├── node-ws/          # WebSocket server
│   ├── src/
│   │   ├── server/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── database/         # Database schema & scripts
│   └── schema.sql
├── setup-windows.bat # Windows setup script
├── setup-database.bat # Windows database setup
└── setup-xampp.bat   # XAMPP setup script
```

### 🔧 Components Overview

- **Frontend**: React + TypeScript application with modern UI using Bootstrap
- **Backend**: PHP API with PSR-7 compliance and JWT authentication using Slim Framework
- **Blockchain**: Python-based blockchain for vote storage and verification with Flask API
- **WebSocket**: Node.js real-time communication server using WebSocket protocol

## 🚀 Quick Start

### Prerequisites

#### Windows Setup (Recommended)
- **XAMPP** (includes Apache, MySQL, PHP)
- **Node.js** 14.0+ with npm 6.0+
- **Python** 3.8+ with pip 20.0+
- **Git** 2.0+

#### Linux/Mac Setup
- **PHP** 8.1+ with Composer 2.0+
- **Node.js** 14.0+ with npm 6.0+
- **Python** 3.8+ with pip 20.0+
- **MySQL** 5.7+ or **MariaDB** 10.3+

### Option 1: Windows XAMPP Setup (Easiest)

```batch
# Clone the repository
git clone <repository-url>
cd blockchain-voting-system

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

# Start services
# Terminal 1: cd python-blockchain && python run.py
# Terminal 2: cd node-ws && npm start
# Terminal 3: cd frontend && npm run dev

# Access the application
start http://localhost:5173
```

### Option 2: Windows Standalone MySQL Setup (Advanced)

```batch
# Clone the repository
git clone <repository-url>
cd blockchain-voting-system

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

# Start services
# Terminal 1: cd python-blockchain && python run.py
# Terminal 2: cd node-ws && npm start
# Terminal 3: cd frontend && npm run dev
# Terminal 4: cd php-backend && php -S localhost:8000 -t public/

# Access the application
start http://localhost:5173
```

**Default admin credentials:**
- Email: `admin@votingsystem.com`
- Password: `Admin123!`

### Option 2: Linux/Mac Manual Setup

#### 1. Database Setup

```bash
# Install MySQL/MariaDB and create database
sudo apt-get install mysql-server  # Ubuntu/Debian
# OR
brew install mysql                  # macOS

# Start MySQL service
sudo systemctl start mysql          # Linux
# OR
brew services start mysql           # macOS

# Run database setup script
./setup-database.sh
```

#### 2. Backend Setup

```bash
# PHP Backend
cd php-backend
composer install
cp .env.example .env  # Configure your environment variables
php -S localhost:8000 -t public/
```

#### 3. Blockchain Setup

```bash
# Python Blockchain
cd python-blockchain
pip install -r requirements.txt
python run.py
```

#### 4. WebSocket Server Setup

```bash
# Node.js WebSocket Server
cd node-ws
npm install
npm start
```

#### 5. Frontend Setup

```bash
# React Frontend
cd frontend
npm install
npm run dev
```

#### 6. Start All Services

```bash
# From project root
./start-system.sh start
```

## 🔧 Configuration

### Windows Setup

For Windows users, choose one of the database options:

#### Option 1: XAMPP (Easiest)
```batch
# Run the setup script to create all environment files
setup-windows.bat

# Start XAMPP Control Panel
# Start Apache and MySQL services

# Open phpMyAdmin and create/import database
# Run database setup
setup-database.bat
```

#### Option 2: Standalone MySQL (Advanced)
```batch
# Run the setup script to create all environment files
setup-windows.bat

# Ensure MySQL service is running
# Run MySQL setup script
mysql-setup.bat

# Run database setup
setup-database.bat
```

### Manual Environment Configuration

Create `.env` files in each component directory:

#### PHP Backend (.env)
```env
APP_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=voting_system
DB_USER=root
DB_PASS=
JWT_SECRET=your-secret-key
BLOCKCHAIN_SERVICE_URL=http://localhost:5000
```

#### Python Blockchain (.env)
```env
SECRET_KEY=dev-secret-key
BLOCKCHAIN_DIFFICULTY=4
DATABASE_URL=sqlite:///blockchain.db
API_KEYS=test-key-123
HOST=0.0.0.0
PORT=5000
```

#### Node.js WebSocket (.env)
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=dev-jwt-secret
REDIS_URL=redis://localhost:6379
BLOCKCHAIN_API_URL=http://localhost:5000
PHP_API_URL=http://localhost:8000/api/v1
```

#### React Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_BLOCKCHAIN_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:3001
```

## 📊 Default Credentials

**Admin User:**
- Email: `admin@votingsystem.com`
- Password: `Admin123!`

⚠️ **Important**: Change the default admin password immediately after first login!

## 🔍 Health Checks

Check system status:

### Windows
```batch
# Check if services are running on their ports
# Blockchain: http://localhost:5000/health
# WebSocket: http://localhost:3001/health
# Frontend: http://localhost:5173
# PHP API: http://localhost/voting-api (when using XAMPP)
```

### Linux/Mac
```bash
# Quick health check
./health-check.sh

# Detailed status
./start-system.sh status

# View logs
./start-system.sh logs
```

## 🛠️ Development

### Running Tests

```bash
# PHP tests
cd php-backend && composer test

# Node.js tests
cd node-ws && npm test

# Python tests
cd python-blockchain && python -m pytest
```

### Code Quality

```bash
# PHP linting
cd php-backend && composer lint

# Node.js linting
cd node-ws && npm run lint

# Python linting
cd python-blockchain && black . && flake8 .
```

## 🔒 Security Features

- **End-to-End Encryption**: All communications are encrypted
- **Blockchain Verification**: Votes are immutably stored on blockchain
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive data validation
- **Audit Trails**: Complete logging of all actions

## 📈 Monitoring

The system provides real-time monitoring:

- **WebSocket Connections**: Live user activity
- **Blockchain Status**: Network health and statistics
- **Vote Verification**: Real-time vote confirmation
- **System Metrics**: Performance and usage statistics

## 🚦 API Documentation

### REST API Endpoints

#### Authentication (`/api/v1/auth`)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/verify` - Verify JWT token
- `POST /auth/logout` - User logout

#### Elections (`/api/v1/elections`)
- `GET /elections` - List all elections
- `GET /elections/{id}` - Get election details
- `POST /elections` - Create new election (Admin only)
- `PUT /elections/{id}` - Update election (Admin only)
- `DELETE /elections/{id}` - Delete election (Admin only)

#### Candidates (`/api/v1/candidates`)
- `GET /candidates?election_id={id}` - List candidates for election
- `POST /candidates` - Register as candidate (Admin approval required)
- `GET /candidates/{id}` - Get candidate details

#### Votes (`/api/v1/votes`)
- `POST /votes` - Cast a vote
- `GET /votes/{id}` - Get vote details
- `GET /votes?election_id={id}` - Get votes for election (Admin only)

#### Users (`/api/v1/users`)
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile
- `GET /users/pending` - List pending registrations (Admin only)
- `POST /users/{id}/verify` - Verify user registration (Admin only)

#### Admin (`/api/v1/admin`)
- `GET /admin/dashboard` - Get dashboard statistics
- `GET /admin/audit-log` - Get audit logs
- `POST /admin/system/health` - System health check

### Blockchain API Endpoints

#### Core Blockchain (`/api/blockchain`)
- `GET /stats` - Blockchain statistics and health
- `GET /blocks` - List all blocks
- `GET /blocks/{index}` - Get specific block
- `POST /validate` - Verify vote integrity
- `GET /transactions/{hash}` - Get transaction details

#### Mining (`/api/mining`)
- `GET /status` - Mining status
- `POST /start` - Start mining process
- `POST /stop` - Stop mining process

### WebSocket Events

The system uses WebSocket connections for real-time updates. All events require JWT authentication.

```javascript
// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:3001?token=YOUR_JWT_TOKEN');

// Connection established
ws.onopen = (event) => {
  console.log('Connected to voting system');
};

// Handle incoming messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'vote_cast':
      // Vote successfully cast and confirmed
      console.log('Vote cast:', data.vote);
      break;

    case 'election_started':
      // New election has begun
      console.log('Election started:', data.election);
      updateElectionStatus(data.election);
      break;

    case 'election_ended':
      // Election has concluded
      console.log('Election ended:', data.election);
      showResults(data.election);
      break;

    case 'block_mined':
      // New block added to blockchain
      console.log('Block mined:', data.block);
      updateBlockchainStatus(data.block);
      break;

    case 'user_registered':
      // New user registration (admin notification)
      console.log('New user:', data.user);
      updatePendingRegistrations(data.user);
      break;

    case 'system_health':
      // System health update
      console.log('Health status:', data.health);
      updateSystemHealth(data.health);
      break;

    case 'error':
      // Error notification
      console.error('WebSocket error:', data.message);
      showError(data.message);
      break;
  }
};

// Handle connection errors
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Handle connection close
ws.onclose = (event) => {
  console.log('WebSocket connection closed');
  // Implement reconnection logic
};
```

#### Event Types

- **`vote_cast`**: Vote successfully recorded
- **`election_started`**: Election begins
- **`election_ended`**: Election concludes
- **`block_mined`**: New blockchain block
- **`user_registered`**: New user registration
- **`system_health`**: System status update
- **`error`**: Error notification

## 🔧 Troubleshooting

### Common Issues

#### Windows Issues

1. **XAMPP Not Found**
   ```batch
   # Ensure XAMPP is installed in C:\xampp
   # Or update XAMPP_DIR in setup-windows.bat
   ```

2. **Port Conflicts**
   ```batch
   # Check what's using a port
   netstat -ano | findstr :5000

   # Kill process using port (replace PID)
   taskkill /PID <PID> /F
   ```

3. **MySQL Connection Issues**
   ```batch
   # Test MySQL connection (from XAMPP directory)
   C:\xampp\mysql\bin\mysql -h localhost -u root -p -e "SELECT 1;"

   # Reset database
   setup-database.bat
   ```

4. **Python/Node.js Path Issues**
   ```batch
   # Check versions
   python --version
   node --version

   # Ensure they're in PATH
   where python
   where node
   ```

#### Linux/Mac Issues

1. **Port Conflicts**
   ```bash
   # Check what's using a port
   lsof -i :5000

   # Kill process using port
   kill -9 $(lsof -ti :5000)
   ```

2. **Database Connection Issues**
   ```bash
   # Test MySQL connection
   mysql -h localhost -u root -p -e "SELECT 1;"

   # Reset database
   ./setup-database.sh
   ```

3. **Permission Issues**
   ```bash
   # Make scripts executable
   chmod +x *.sh
   chmod +x php-backend/*.sh
   ```

4. **Node.js/Python Path Issues**
   ```bash
   # Check versions
   node --version
   python --version

   # Update PATH if needed
   export PATH="/usr/local/bin:$PATH"
   ```

### Logs

Check logs for debugging:

#### Windows
```batch
# XAMPP Logs
# Apache: C:\xampp\apache\logs\
# MySQL: C:\xampp\mysql\data\

# Application Logs (check individual service directories)
type python-blockchain\blockchain.log
type node-ws\websocket.log
```

#### Linux/Mac
```bash
# All service logs
./start-system.sh logs

# Individual service logs
tail -f blockchain.log
tail -f websocket.log
tail -f php.log
tail -f frontend.log
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This is a demonstration system. For production use, additional security measures, penetration testing, and compliance with local election regulations are required.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the logs for error messages