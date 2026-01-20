#!/bin/bash

# Blockchain Voting System - Health Check Script
# This script checks the health status of all system components

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}🔍${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Check service health
check_service() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    if curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$url" | grep -q "^$expected_code$"; then
        log_success "$name is healthy"
        return 0
    else
        log_error "$name is not responding or unhealthy"
        return 1
    fi
}

# Check WebSocket connection (basic TCP check)
check_websocket() {
    local name=$1
    local host=$2
    local port=$3

    if timeout 5 bash -c "echo > /dev/tcp/$host/$port" 2>/dev/null; then
        log_success "$name WebSocket port ($port) is open"
        return 0
    else
        log_error "$name WebSocket port ($port) is not accessible"
        return 1
    fi
}

# Main health check
main() {
    echo "========================================"
    echo "Blockchain Voting System Health Check"
    echo "========================================"
    echo ""

    local all_healthy=true

    # Check each service
    log_info "Checking service health..."

    # Blockchain API
    if check_service "Blockchain API" "http://localhost:5000/health"; then
        # Additional blockchain checks
        if check_service "Blockchain Stats" "http://localhost:5000/api/blockchain/stats"; then
            log_success "Blockchain statistics accessible"
        fi
    else
        all_healthy=false
    fi

    echo ""

    # WebSocket Server (HTTP API)
    if check_service "WebSocket Server API" "http://localhost:3001/health"; then
        # Check WebSocket port
        if check_websocket "WebSocket Server" "localhost" "3001"; then
            log_success "WebSocket connections should be possible"
        fi
    else
        all_healthy=false
    fi

    echo ""

    # PHP Backend
    if check_service "PHP Backend" "http://localhost:8000/api/v1/health"; then
        # Additional PHP checks
        if check_service "PHP Auth Endpoint" "http://localhost:8000/api/v1/health" "200,404"; then
            log_success "PHP API endpoints responding"
        fi
    else
        all_healthy=false
    fi

    echo ""

    # React Frontend (basic connectivity check)
    if curl -s --max-time 5 "http://localhost:5173" >/dev/null 2>&1; then
        log_success "React Frontend is accessible"
    else
        log_warning "React Frontend may still be starting or not accessible"
        all_healthy=false
    fi

    echo ""

    # Database connectivity check (if MySQL client available)
    if command -v mysql >/dev/null 2>&1; then
        log_info "Checking database connectivity..."
        if mysql --host="${DB_HOST:-localhost}" --port="${DB_PORT:-3306}" \
                --user="${DB_USER:-root}" --password="${DB_PASS:-}" \
                -e "SELECT 1;" >/dev/null 2>&1; then
            log_success "Database connection successful"
        else
            log_error "Database connection failed"
            all_healthy=false
        fi
    else
        log_warning "MySQL client not found - skipping database check"
    fi

    echo ""
    echo "========================================"
    echo "System Status Summary"
    echo "========================================"

    if $all_healthy; then
        log_success "All services are healthy and running!"
    else
        log_error "Some services are not healthy. Check the output above."
    fi

    echo ""
    echo "Access URLs:"
    echo "• Frontend:    http://localhost:5173"
    echo "• API:         http://localhost:8000/api/v1"
    echo "• WebSocket:   ws://localhost:3001"
    echo "• Blockchain:  http://localhost:5000"
    echo ""
    echo "Default admin credentials:"
    echo "• Email: admin@votingsystem.com"
    echo "• Password: Admin123!"
    echo ""
    log_warning "Remember to change the default admin password in production!"

    echo ""
    echo "========================================"

    # Exit with appropriate code
    if $all_healthy; then
        exit 0
    else
        exit 1
    fi
}

# Show usage
show_usage() {
    echo "Blockchain Voting System - Health Check"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -v, --verbose    Show detailed output"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DB_HOST, DB_PORT, DB_USER, DB_PASS"
    echo ""
    echo "This script checks the health of all system components:"
    echo "• Blockchain API (port 5000)"
    echo "• WebSocket Server (port 3001)"
    echo "• PHP Backend (port 8000)"
    echo "• React Frontend (port 5173)"
    echo "• Database connectivity"
}

# Parse arguments
case "${1:-}" in
    "-h"|"--help")
        show_usage
        exit 0
        ;;
    "-v"|"--verbose")
        set -x  # Enable debug output
        ;;
    "")
        # No arguments, run main
        ;;
    *)
        echo "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac

# Run main function
main "$@"