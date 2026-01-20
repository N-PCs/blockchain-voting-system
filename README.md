# Blockchain Voting System

A secure, transparent, and tamper-proof voting system built with blockchain technology. This system provides end-to-end verifiable elections with real-time monitoring and comprehensive audit trails.

## 🏗️ Architecture

The system consists of four main components:

- **Frontend**: React + TypeScript application with modern UI
- **Backend**: PHP API with PSR-7 compliance and JWT authentication
- **Blockchain**: Python-based blockchain for vote storage and verification
- **WebSocket**: Node.js real-time communication server

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended) OR
- **PHP 8.1+** with Composer
- **Node.js 14+** with npm
- **Python 3.8+** with pip
- **MySQL 5.7+** or **MariaDB 10.3+**

### Option 1: Docker Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd blockchain-voting-system

# Start all services with Docker Compose
docker-compose up -d

# Run database setup
docker-compose exec php-backend ./setup-database.sh

# Access the application
open http://localhost:5173
```

### Option 2: Manual Setup

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

### Environment Variables

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

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/verify` - Verify JWT token

#### Elections
- `GET /api/v1/elections` - List elections
- `GET /api/v1/elections/{id}` - Get election details
- `POST /api/v1/votes` - Cast a vote
- `GET /api/v1/votes/{id}` - Get vote details

#### Blockchain
- `GET /api/blockchain/stats` - Blockchain statistics
- `GET /api/blockchain/blocks` - List blocks
- `POST /api/blockchain/validate` - Verify vote

### WebSocket Events

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001?token=YOUR_JWT_TOKEN');

// Listen for events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch(data.type) {
    case 'vote_cast':
      // Vote successfully cast
      break;
    case 'election_started':
      // Election started
      break;
    case 'block_mined':
      // New block added to blockchain
      break;
  }
};
```

## 🔧 Troubleshooting

### Common Issues

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