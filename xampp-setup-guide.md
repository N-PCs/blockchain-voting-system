# Running Blockchain Voting System with XAMPP

This guide explains how to run the blockchain voting system using XAMPP for the PHP backend and MySQL database, while running other services separately.

## 📋 Prerequisites

- **XAMPP** (latest version with PHP 8.1+)
- **Node.js** 14.0+ with npm
- **Python** 3.8+ with pip
- **Git**

## 🚀 Step-by-Step Setup

### Step 1: Install and Configure XAMPP

1. **Download and Install XAMPP**:
   - Download XAMPP from https://www.apachefriends.org/
   - Install XAMPP in the default location (usually `C:\xampp\` on Windows)

2. **Start XAMPP Services**:
   - Open XAMPP Control Panel
   - Start **Apache** and **MySQL** services
   - Verify by visiting `http://localhost` (should show XAMPP welcome page)

3. **Check PHP Version**:
   - Visit `http://localhost/dashboard/phpinfo.php`
   - Ensure PHP version is 8.1 or higher
   - If not, you'll need to upgrade PHP in XAMPP

### Step 2: Clone and Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd blockchain-voting-system

# Create project directory in XAMPP htdocs
# Copy php-backend to XAMPP htdocs
cp -r php-backend C:/xampp/htdocs/voting-api
```

### Step 3: Configure MySQL Database

1. **Open phpMyAdmin**:
   - Visit `http://localhost/phpmyadmin`

2. **Create Database**:
   ```sql
   CREATE DATABASE voting_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Import Schema**:
   - In phpMyAdmin, select `voting_system` database
   - Go to **Import** tab
   - Upload `database/schema.sql`
   - Click **Go** to import

### Step 4: Configure PHP Backend for XAMPP

1. **Update Apache Configuration**:
   - Open `C:\xampp\apache\conf\httpd.conf`
   - Ensure these modules are enabled (uncommented):
     ```
     LoadModule rewrite_module modules/mod_rewrite.so
     ```

2. **Create Virtual Host** (Optional but recommended):
   - Open `C:\xampp\apache\conf\extra\httpd-vhosts.conf`
   - Add this configuration:
     ```
     <VirtualHost *:80>
         ServerName voting-api.local
         DocumentRoot "C:/xampp/htdocs/voting-api/public"

         <Directory "C:/xampp/htdocs/voting-api/public">
             Options Indexes FollowSymLinks
             AllowOverride All
             Require all granted
         </Directory>

         ErrorLog logs/voting-api-error.log
         CustomLog logs/voting-api-access.log common
     </VirtualHost>
     ```

   - Open `C:\Windows\System32\drivers\etc\hosts` (as Administrator)
   - Add: `127.0.0.1 voting-api.local`

3. **Configure Environment**:
   - Copy `.env.example` to `.env` in the php-backend directory
   - Update the `.env` file:
     ```env
     APP_ENV=development
     DB_HOST=localhost
     DB_PORT=3306
     DB_NAME=voting_system
     DB_USER=root
     DB_PASS=
     JWT_SECRET=your-production-jwt-secret-change-this-immediately
     BLOCKCHAIN_SERVICE_URL=http://localhost:5000
     WEBSOCKET_SERVICE_URL=ws://localhost:3001
     ```

### Step 5: Install PHP Dependencies

```bash
# Navigate to the XAMPP PHP backend directory
cd C:/xampp/htdocs/voting-api

# Install Composer dependencies
composer install
```

### Step 6: Setup Python Blockchain Service

```bash
# Navigate to python-blockchain directory
cd python-blockchain

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment file
cp .env.example .env
# Update .env with your settings
```

### Step 7: Setup Node.js WebSocket Server

```bash
# Navigate to node-ws directory
cd node-ws

# Install dependencies
npm install

# Copy and configure environment file
copy .env.example .env
# Update .env with your settings
```

### Step 8: Setup React Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env
# Update .env with correct URLs (use localhost instead of container names)
```

## 🏃‍♂️ Running the System

### Method 1: Manual Startup (Recommended for Development)

1. **Start XAMPP Services**:
   - Open XAMPP Control Panel
   - Start Apache and MySQL

2. **Start Python Blockchain**:
   ```bash
   cd python-blockchain
   python run.py
   ```
   - Service will run on `http://localhost:5000`

3. **Start WebSocket Server**:
   ```bash
   cd node-ws
   npm start
   ```
   - Service will run on `http://localhost:3001`

4. **Start React Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   - Frontend will run on `http://localhost:5173`

### Method 2: Using the Startup Script

```bash
# Make scripts executable (Linux/Mac)
chmod +x *.sh

# Or manually start each service
# The start-system.sh script can be adapted for XAMPP
```

## 🔧 Configuration Files

### PHP Backend (.env)
```env
APP_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=voting_system
DB_USER=root
DB_PASS=
JWT_SECRET=your-production-jwt-secret-change-this-immediately
BLOCKCHAIN_SERVICE_URL=http://localhost:5000
WEBSOCKET_SERVICE_URL=ws://localhost:3001
```

### Python Blockchain (.env)
```env
SECRET_KEY=dev-blockchain-secret-key
BLOCKCHAIN_DIFFICULTY=4
DATABASE_URL=sqlite:///blockchain.db
API_KEYS=test-key-123
HOST=0.0.0.0
PORT=5000
```

### Node.js WebSocket (.env)
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-production-jwt-secret-change-this-immediately
REDIS_URL=redis://localhost:6379  # Remove if Redis not available
BLOCKCHAIN_API_URL=http://localhost:5000
PHP_API_URL=http://localhost/voting-api/api/v1
```

### React Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost/voting-api/api/v1
VITE_BLOCKCHAIN_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:3001
```

## 🌐 Accessing the Application

- **Frontend**: `http://localhost:5173`
- **PHP API**: `http://localhost/voting-api` or `http://voting-api.local`
- **WebSocket**: `ws://localhost:3001`
- **Blockchain API**: `http://localhost:5000`
- **phpMyAdmin**: `http://localhost/phpmyadmin`

## 🔍 Troubleshooting

### Common XAMPP Issues

1. **Port Conflicts**:
   - Ensure no other services are using ports 80, 443, 3306
   - Check Windows Services for conflicting applications

2. **PHP Version Issues**:
   - XAMPP comes with multiple PHP versions
   - Switch PHP version in XAMPP control panel if needed

3. **Permission Issues**:
   - Run XAMPP as Administrator
   - Check folder permissions for `C:\xampp\htdocs\voting-api`

4. **Database Connection**:
   - Ensure MySQL is running in XAMPP
   - Check credentials in `.env` file

### Service-Specific Issues

1. **PHP Backend Not Working**:
   ```bash
   # Test PHP installation
   php --version

   # Check Apache error logs
   # C:\xampp\apache\logs\error.log
   ```

2. **Python Blockchain Issues**:
   ```bash
   # Check Python version
   python --version

   # Test Flask app
   cd python-blockchain
   python -c "from src.api.app import app; print('Flask app imported successfully')"
   ```

3. **Node.js WebSocket Issues**:
   ```bash
   # Check Node version
   node --version

   # Test WebSocket server
   cd node-ws
   npm test
   ```

4. **React Frontend Issues**:
   ```bash
   # Check Node and npm
   node --version
   npm --version

   # Clear cache and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

## 🔄 Alternative: Docker Setup (Easier)

If XAMPP setup is too complex, use Docker instead:

```bash
# Copy environment file
cp docker-compose.env.example .env

# Start all services
docker-compose up -d

# Setup database
docker-compose exec php-backend ./setup-database.sh
```

## 📞 Default Credentials

- **Admin Email**: `admin@votingsystem.com`
- **Admin Password**: `Admin123!`

⚠️ **Important**: Change the default admin password immediately after first login!

## 📋 System Requirements Summary

- **XAMPP**: Apache, MySQL, PHP 8.1+
- **Node.js**: 14.0+ for WebSocket and Frontend
- **Python**: 3.8+ for Blockchain service
- **Browser**: Modern browser with WebSocket support

## 🎯 Next Steps

1. Access the frontend at `http://localhost:5173`
2. Login with admin credentials
3. Create your first election
4. Test the voting functionality
5. Monitor the blockchain and WebSocket activity

For additional help, check the main README.md or create an issue in the repository.