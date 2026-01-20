#!/bin/bash

# Blockchain Voting System - Complete System Startup Script
# This script starts all components of the voting system in the correct order

set -e  # Exit on any error

# Configuration - Change these values as needed
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-voting_system}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if a port is in use
check_port() {
    local port=$1
    local service=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        log_warning "Port $port ($service) is already in use"
        return 1
    fi

    return 0
}

# Wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=${3:-30}
    local attempt=1

    log_info "Waiting for $service_name to be ready at $url..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
            log_success "$service_name is ready!"
            return 0
        fi

        log_info "Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        ((attempt++))
    done

    log_error "$service_name failed to start within ${max_attempts} attempts"
    return 1
}

# Start database
start_database() {
    log_info "Checking database connection..."

    # Try to connect to MySQL
    if ! mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1; then
        log_error "Cannot connect to MySQL database at ${DB_HOST}:${DB_PORT}"
        log_error "Please ensure MySQL is running and credentials are correct."
        log_error "You can set environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASS"
        exit 1
    fi

    # Check if database exists
    if ! mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASS" -e "USE ${DB_NAME};" >/dev/null 2>&1; then
        log_error "Database '${DB_NAME}' does not exist."
        log_error "Please run './setup-database.sh' first to create the database."
        exit 1
    fi

    log_success "Database connection successful"
}

# Start Python blockchain service
start_blockchain() {
    log_info "Starting Python blockchain service..."

    cd python-blockchain

    # Check if port 5000 is available
    if ! check_port 5000 "Blockchain API"; then
        log_error "Port 5000 is already in use. Please stop the service using that port."
        cd ..
        return 1
    fi

    # Start blockchain service in background
    python run.py > blockchain.log 2>&1 &
    BLOCKCHAIN_PID=$!

    echo $BLOCKCHAIN_PID > ../blockchain.pid
    cd ..

    log_info "Blockchain service starting (PID: $BLOCKCHAIN_PID)"

    # Wait for blockchain service to be ready
    if ! wait_for_service "http://localhost:5000/health" "Blockchain API"; then
        log_error "Failed to start blockchain service"
        return 1
    fi

    log_success "Blockchain service started successfully"
}

# Start Node.js WebSocket server
start_websocket() {
    log_info "Starting Node.js WebSocket server..."

    cd node-ws

    # Check if port 3001 is available
    if ! check_port 3001 "WebSocket Server"; then
        log_error "Port 3001 is already in use. Please stop the service using that port."
        cd ..
        return 1
    fi

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing Node.js dependencies..."
        npm install
    fi

    # Start WebSocket server in background
    npm start > websocket.log 2>&1 &
    WEBSOCKET_PID=$!

    echo $WEBSOCKET_PID > ../websocket.pid
    cd ..

    log_info "WebSocket server starting (PID: $WEBSOCKET_PID)"

    # Wait for WebSocket server to be ready (check HTTP API)
    if ! wait_for_service "http://localhost:3001/health" "WebSocket Server"; then
        log_error "Failed to start WebSocket server"
        return 1
    fi

    log_success "WebSocket server started successfully"
}

# Start PHP backend
start_php_backend() {
    log_info "Starting PHP backend..."

    cd php-backend

    # Check if port 8000 is available
    if ! check_port 8000 "PHP Backend"; then
        log_error "Port 8000 is already in use. Please stop the service using that port."
        cd ..
        return 1
    fi

    # Install dependencies if vendor doesn't exist
    if [ ! -d "vendor" ]; then
        log_info "Installing PHP dependencies..."
        composer install
    fi

    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Creating from template..."
        cp .env.example .env 2>/dev/null || log_warning "No .env.example found. Using defaults."
    fi

    # Start PHP server in background
    php -S localhost:8000 -t public/ > php.log 2>&1 &
    PHP_PID=$!

    echo $PHP_PID > ../php.pid
    cd ..

    log_info "PHP backend starting (PID: $PHP_PID)"

    # Wait for PHP backend to be ready
    if ! wait_for_service "http://localhost:8000/api/v1/health" "PHP Backend"; then
        log_error "Failed to start PHP backend"
        return 1
    fi

    log_success "PHP backend started successfully"
}

# Start React frontend
start_frontend() {
    log_info "Starting React frontend..."

    cd frontend

    # Check if port 5173 is available
    if ! check_port 5173 "React Frontend"; then
        log_error "Port 5173 is already in use. Please stop the service using that port."
        cd ..
        return 1
    fi

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing React dependencies..."
        npm install
    fi

    # Start frontend in background
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!

    echo $FRONTEND_PID > ../frontend.pid
    cd ..

    log_info "React frontend starting (PID: $FRONTEND_PID)"

    # Wait for frontend to be ready
    if ! wait_for_service "http://localhost:5173" "React Frontend" 60; then
        log_warning "Frontend may still be starting... continuing..."
    fi

    log_success "React frontend started successfully"
}

# Stop all services
stop_services() {
    log_info "Stopping all services..."

    # Stop services in reverse order
    for pidfile in frontend.pid php.pid websocket.pid blockchain.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            if kill -0 "$pid" 2>/dev/null; then
                log_info "Stopping process $pid (${pidfile%.pid})"
                kill "$pid" 2>/dev/null || true
                rm -f "$pidfile"
            fi
        fi
    done

    log_success "All services stopped"
}

# Cleanup function
cleanup() {
    echo ""
    log_info "Cleaning up..."

    # Remove PID files
    rm -f *.pid

    # Remove log files older than 7 days
    find . -name "*.log" -mtime +7 -delete 2>/dev/null || true
}

# Show status
show_status() {
    echo ""
    echo "========================================"
    echo "Blockchain Voting System Status"
    echo "========================================"

    # Check each service
    services=(
        "Blockchain API:http://localhost:5000/health:blockchain.pid"
        "WebSocket Server:http://localhost:3001/health:websocket.pid"
        "PHP Backend:http://localhost:8000/api/v1/health:php.pid"
        "React Frontend:http://localhost:5173:frontend.pid"
    )

    for service_info in "${services[@]}"; do
        IFS=':' read -r name url pidfile <<< "$service_info"

        if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
            if curl -s --max-time 3 "$url" >/dev/null 2>&1; then
                echo -e "${GREEN}✓${NC} $name: Running"
            else
                echo -e "${YELLOW}⚠${NC} $name: Process running but not responding"
            fi
        else
            echo -e "${RED}✗${NC} $name: Not running"
        fi
    done

    echo ""
    echo "Access the application at: http://localhost:5173"
    echo "Default admin login: admin@votingsystem.com / Admin123!"
}

# Show usage information
show_usage() {
    echo "Blockchain Voting System - Startup Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services (default)"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  status    Show status of all services"
    echo "  logs      Show logs from all services"
    echo "  help      Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS"
    echo ""
    echo "Services started in order:"
    echo "  1. Database check"
    echo "  2. Python Blockchain API (port 5000)"
    echo "  3. Node.js WebSocket Server (port 3001)"
    echo "  4. PHP Backend API (port 8000)"
    echo "  5. React Frontend (port 5173)"
}

# Handle command line arguments
case "${1:-start}" in
    "start")
        echo "========================================"
        echo "Starting Blockchain Voting System"
        echo "========================================"

        trap cleanup EXIT
        trap 'stop_services; exit 1' INT TERM

        start_database
        start_blockchain
        start_websocket
        start_php_backend
        start_frontend

        echo ""
        log_success "All services started successfully!"
        echo ""
        echo "========================================"
        echo "System URLs:"
        echo "========================================"
        echo "Frontend:    http://localhost:5173"
        echo "API:         http://localhost:8000/api/v1"
        echo "WebSocket:   ws://localhost:3001"
        echo "Blockchain:  http://localhost:5000"
        echo ""
        echo "Default admin credentials:"
        echo "Email: admin@votingsystem.com"
        echo "Password: Admin123!"
        echo ""
        log_warning "Remember to change the default admin password!"
        echo ""
        log_info "Press Ctrl+C to stop all services"
        wait
        ;;

    "stop")
        stop_services
        ;;

    "restart")
        stop_services
        sleep 2
        exec "$0" start
        ;;

    "status")
        show_status
        ;;

    "logs")
        echo "Recent logs:"
        echo "============"
        for logfile in *.log; do
            if [ -f "$logfile" ]; then
                echo ""
                echo "$logfile:"
                echo "---"
                tail -20 "$logfile" 2>/dev/null || echo "No logs available"
            fi
        done
        ;;

    "help"|"-h"|"--help")
        show_usage
        ;;

    *)
        log_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac