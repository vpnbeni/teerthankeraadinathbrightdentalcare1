#!/bin/bash

# Comprehensive Deployment Script with Testing
# Usage: ./scripts/deploy-with-tests.sh [environment]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    # Check if running as appropriate user
    if [[ $EUID -eq 0 ]]; then
        log_error "Do not run this script as root"
        exit 1
    fi
    
    # Check required commands
    local required_commands=("node" "npm" "pm2" "nginx" "certbot" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 18 ]]; then
        log_error "Node.js version 18 or higher required. Current: $(node --version)"
        exit 1
    fi
    
    # Check environment files
    local env_files=("server/.env.$ENVIRONMENT" "client/.env.$ENVIRONMENT" "admin/.env.$ENVIRONMENT")
    for env_file in "${env_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$env_file" ]]; then
            log_error "Environment file not found: $env_file"
            exit 1
        fi
    done
    
    log_success "Prerequisites check passed"
}

# Pre-deployment tests
run_pre_deployment_tests() {
    log_info "Running pre-deployment tests..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing root dependencies..."
        npm install
    fi
    
    # Run unit tests
    log_info "Running unit tests..."
    
    # Server tests
    cd server
    if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
        npm test || {
            log_error "Server unit tests failed"
            exit 1
        }
    fi
    
    # Client tests
    cd ../client
    if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
        npm test -- --run || {
            log_error "Client unit tests failed"
            exit 1
        }
    fi
    
    # Admin tests
    cd ../admin
    if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
        npm test -- --run || {
            log_error "Admin unit tests failed"
            exit 1
        }
    fi
    
    cd "$PROJECT_ROOT"
    log_success "Pre-deployment tests passed"
}

# Build applications
build_applications() {
    log_info "Building applications for $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT"
    
    # Build client
    log_info "Building client portal..."
    cd client
    cp ".env.$ENVIRONMENT" .env
    npm ci
    npm run build
    
    # Build admin
    log_info "Building admin dashboard..."
    cd ../admin
    cp ".env.$ENVIRONMENT" .env
    npm ci
    npm run build
    
    # Prepare server
    log_info "Preparing server..."
    cd ../server
    npm ci --only=production
    
    cd "$PROJECT_ROOT"
    log_success "Applications built successfully"
}

# Deploy applications
deploy_applications() {
    log_info "Deploying applications..."
    
    # Deploy server
    log_info "Deploying API server..."
    ./scripts/deploy-server.sh "$ENVIRONMENT" || {
        log_error "Server deployment failed"
        exit 1
    }
    
    # Wait for server to start
    log_info "Waiting for server to start..."
    sleep 10
    
    # Deploy client
    log_info "Deploying client portal..."
    ./scripts/deploy-client.sh "$ENVIRONMENT" || {
        log_error "Client deployment failed"
        exit 1
    }
    
    # Deploy admin
    log_info "Deploying admin dashboard..."
    ./scripts/deploy-admin.sh "$ENVIRONMENT" || {
        log_error "Admin deployment failed"
        exit 1
    }
    
    log_success "Applications deployed successfully"
}

# Run integration tests
run_integration_tests() {
    log_info "Running integration tests..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables for testing
    if [[ "$ENVIRONMENT" == "production" ]]; then
        export API_URL="https://api.teerthankerdentalcare.com"
        export CLIENT_URL="https://client.teerthankerdentalcare.com"
        export ADMIN_URL="https://admin.teerthankerdentalcare.com"
    else
        export API_URL="http://localhost:5000"
        export CLIENT_URL="http://localhost:3000"
        export ADMIN_URL="http://localhost:3001"
    fi
    
    # Wait for services to be fully ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Run integration tests
    node scripts/integration-tests.js || {
        log_error "Integration tests failed"
        return 1
    }
    
    log_success "Integration tests passed"
}

# Run production verification
run_production_verification() {
    if [[ "$ENVIRONMENT" != "production" ]]; then
        log_info "Skipping production verification for non-production environment"
        return 0
    fi
    
    log_info "Running production verification..."
    
    cd "$PROJECT_ROOT"
    
    # Wait a bit more for production services
    log_info "Waiting for production services to stabilize..."
    sleep 60
    
    # Run production verification
    node scripts/production-verification.js || {
        log_error "Production verification failed"
        return 1
    }
    
    log_success "Production verification passed"
}

# Setup monitoring and alerts
setup_monitoring() {
    log_info "Setting up monitoring and alerts..."
    
    # Setup log rotation
    sudo tee /etc/logrotate.d/teerthanker-dental > /dev/null <<EOF
/var/www/teerthanker-dental-api/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    # Setup PM2 monitoring
    pm2 install pm2-logrotate 2>/dev/null || true
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 30
    pm2 save
    
    # Setup system monitoring cron job
    (crontab -l 2>/dev/null; echo "*/5 * * * * curl -f http://localhost:5000/api/health > /dev/null || echo 'API health check failed' | logger") | crontab -
    
    log_success "Monitoring setup completed"
}

# Cleanup function
cleanup() {
    log_info "Performing cleanup..."
    
    # Remove temporary files
    rm -f "$PROJECT_ROOT"/client/.env
    rm -f "$PROJECT_ROOT"/admin/.env
    
    # Clear npm cache
    npm cache clean --force 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Rollback function
rollback() {
    log_error "Deployment failed. Initiating rollback..."
    
    # Stop current processes
    pm2 stop teerthanker-dental-api 2>/dev/null || true
    
    # Restore from backup if available
    local backup_dir="/var/backups/teerthanker-dental-api"
    if [[ -d "$backup_dir" ]]; then
        local latest_backup=$(ls -t "$backup_dir" | head -n1)
        if [[ -n "$latest_backup" ]]; then
            log_info "Restoring from backup: $latest_backup"
            sudo cp -r "$backup_dir/$latest_backup"/* /var/www/teerthanker-dental-api/
            pm2 start teerthanker-dental-api
        fi
    fi
    
    log_error "Rollback completed. Please check the system manually."
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    log_info "🚀 Starting deployment for Teerthanker Dental Care ($ENVIRONMENT)"
    log_info "Timestamp: $(date)"
    
    # Set trap for cleanup on exit
    trap cleanup EXIT
    trap rollback ERR
    
    # Run deployment steps
    check_prerequisites
    run_pre_deployment_tests
    build_applications
    deploy_applications
    
    # Run tests
    if ! run_integration_tests; then
        log_error "Integration tests failed. Deployment aborted."
        exit 1
    fi
    
    if ! run_production_verification; then
        log_warning "Production verification had issues. Please review the report."
    fi
    
    setup_monitoring
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "🎉 Deployment completed successfully!"
    log_info "Total deployment time: ${duration} seconds"
    log_info "Applications are now available at:"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "  • Client Portal: https://client.teerthankerdentalcare.com"
        log_info "  • Admin Dashboard: https://admin.teerthankerdentalcare.com"
        log_info "  • API Server: https://api.teerthankerdentalcare.com"
    else
        log_info "  • Client Portal: http://localhost:3000"
        log_info "  • Admin Dashboard: http://localhost:3001"
        log_info "  • API Server: http://localhost:5000"
    fi
    
    log_info "📊 Check the test reports for detailed results:"
    log_info "  • Integration tests: integration-test-results.json"
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "  • Production verification: production-verification-report.html"
    fi
}

# Run main function
main "$@"