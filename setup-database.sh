#!/bin/bash

# Blockchain Voting System - Database Setup Script
# This script sets up the MySQL database for the voting system

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

# Check if MySQL client is available
check_mysql_client() {
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL client not found. Please install MySQL client tools."
        exit 1
    fi
}

# Check if MySQL server is running
check_mysql_server() {
    log_info "Checking MySQL server connection..."

    # Try to connect to MySQL server
    if ! mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASS" -e "SELECT 1;" &> /dev/null; then
        log_error "Cannot connect to MySQL server at ${DB_HOST}:${DB_PORT}"
        log_error "Please ensure MySQL server is running and credentials are correct."
        log_error "You can set environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASS"
        exit 1
    fi

    log_success "MySQL server connection successful"
}

# Create database if it doesn't exist
create_database() {
    log_info "Creating database '${DB_NAME}' if it doesn't exist..."

    mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASS" -e "
        CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;
    "

    log_success "Database '${DB_NAME}' is ready"
}

# Import schema
import_schema() {
    local schema_file="database/schema.sql"

    if [ ! -f "$schema_file" ]; then
        log_error "Schema file not found: $schema_file"
        exit 1
    fi

    log_info "Importing database schema from ${schema_file}..."

    # Import the schema
    mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASS" "$DB_NAME" < "$schema_file"

    log_success "Database schema imported successfully"
}

# Verify installation
verify_setup() {
    log_info "Verifying database setup..."

    # Check if tables exist
    local tables_count
    tables_count=$(mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASS" "$DB_NAME" -e "
        SELECT COUNT(*) as count FROM information_schema.tables
        WHERE table_schema = '${DB_NAME}'
        AND table_type = 'BASE TABLE';
    " 2>/dev/null | tail -n1)

    if [ "$tables_count" -gt 0 ]; then
        log_success "Found ${tables_count} tables in database"

        # Show created tables
        log_info "Created tables:"
        mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASS" "$DB_NAME" -e "
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = '${DB_NAME}'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        " | while read -r table; do
            [ "$table" != "table_name" ] && echo "  - $table"
        done
    else
        log_error "No tables found in database. Setup may have failed."
        exit 1
    fi

    # Check if default admin user exists
    local admin_count
    admin_count=$(mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASS" "$DB_NAME" -e "
        SELECT COUNT(*) FROM users WHERE email = 'admin@votingsystem.com';
    " 2>/dev/null | tail -n1)

    if [ "$admin_count" -gt 0 ]; then
        log_success "Default admin user created (admin@votingsystem.com)"
        log_warning "IMPORTANT: Change the default password 'Admin123!' immediately after first login!"
    fi
}

# Show usage information
show_usage() {
    echo "Blockchain Voting System - Database Setup"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  --host HOST         MySQL host (default: localhost)"
    echo "  --port PORT         MySQL port (default: 3306)"
    echo "  --database NAME     Database name (default: voting_system)"
    echo "  --user USERNAME     MySQL username (default: root)"
    echo "  --password PASS     MySQL password (default: empty)"
    echo ""
    echo "Environment variables:"
    echo "  DB_HOST             MySQL host"
    echo "  DB_PORT             MySQL port"
    echo "  DB_NAME             Database name"
    echo "  DB_USER             MySQL username"
    echo "  DB_PASS             MySQL password"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Use defaults"
    echo "  $0 --host mysql.example.com --user myuser --password mypass"
    echo "  DB_HOST=mysql.example.com DB_USER=myuser DB_PASS=mypass $0"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            --host)
                DB_HOST="$2"
                shift 2
                ;;
            --port)
                DB_PORT="$2"
                shift 2
                ;;
            --database)
                DB_NAME="$2"
                shift 2
                ;;
            --user)
                DB_USER="$2"
                shift 2
                ;;
            --password)
                DB_PASS="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Main execution
main() {
    echo "========================================"
    echo "Blockchain Voting System - Database Setup"
    echo "========================================"

    # Parse command line arguments
    parse_args "$@"

    log_info "Configuration:"
    log_info "  Host: ${DB_HOST}"
    log_info "  Port: ${DB_PORT}"
    log_info "  Database: ${DB_NAME}"
    log_info "  User: ${DB_USER}"
    echo ""

    # Run setup steps
    check_mysql_client
    check_mysql_server
    create_database
    import_schema
    verify_setup

    echo ""
    log_success "Database setup completed successfully!"
    echo ""
    log_info "Next steps:"
    echo "  1. Start the PHP backend: cd php-backend && php -S localhost:8000"
    echo "  2. Start the Node.js WebSocket server: cd node-ws && npm start"
    echo "  3. Start the Python blockchain: cd python-blockchain && python run.py"
    echo "  4. Start the frontend: cd frontend && npm run dev"
    echo "  5. Access the application at http://localhost:5173"
    echo ""
    log_warning "Remember to change the default admin password!"
}

# Run main function with all arguments
main "$@"