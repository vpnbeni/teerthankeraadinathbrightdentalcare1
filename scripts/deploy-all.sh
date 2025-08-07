#!/bin/bash

# Master deployment script for Teerthanker Dental Care
# Usage: ./scripts/deploy-all.sh [environment]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Starting full deployment for Teerthanker Dental Care ($ENVIRONMENT)"

# Deploy in order: server first, then frontends
echo "1️⃣ Deploying API Server..."
./scripts/deploy-server.sh $ENVIRONMENT

echo "2️⃣ Deploying Client Portal..."
./scripts/deploy-client.sh $ENVIRONMENT

echo "3️⃣ Deploying Admin Dashboard..."
./scripts/deploy-admin.sh $ENVIRONMENT

echo "🎉 Full deployment completed successfully!"
echo "🌐 Applications are now available at:"
echo "   • Client Portal: https://client.teerthankerdentalcare.com"
echo "   • Admin Dashboard: https://admin.teerthankerdentalcare.com"
echo "   • API Server: https://api.teerthankerdentalcare.com"