#!/bin/bash

# Production Build Script for Teerthanker Dental Care
# This script builds both admin and client with production environment variables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info "Starting production build process..."
log_info "Project root: $PROJECT_ROOT"

# Build Admin Dashboard
log_info "Building admin dashboard..."
cd "$PROJECT_ROOT/admin"
if npm run build:prod; then
    log_success "Admin dashboard built successfully"
else
    log_error "Admin dashboard build failed"
    exit 1
fi

# Build Client Portal
log_info "Building client portal..."
cd "$PROJECT_ROOT/client"
if npm run build:prod; then
    log_success "Client portal built successfully"
else
    log_error "Client portal build failed"
    exit 1
fi

log_success "All applications built successfully for production!"
log_info "Build outputs:"
log_info "  • Admin: $PROJECT_ROOT/admin/dist"
log_info "  • Client: $PROJECT_ROOT/client/dist"

# Verify API URLs in built files
log_info "Verifying API URLs in built files..."

# Check admin build
if grep -q "teerthanker-server.vercel.app" "$PROJECT_ROOT/admin/dist/assets/"*.js 2>/dev/null; then
    log_success "Admin build contains correct API URL"
else
    log_warning "Admin build may not contain correct API URL"
fi

# Check client build
if grep -q "teerthanker-server.vercel.app" "$PROJECT_ROOT/client/dist/assets/"*.js 2>/dev/null; then
    log_success "Client build contains correct API URL"
else
    log_warning "Client build may not contain correct API URL"
fi

log_info "Production build process completed!"
log_info "You can now deploy the dist folders to your hosting provider"
