#!/bin/bash

# Deployment script for Teerthanker Dental Care API Server
# Usage: ./scripts/deploy-server.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="teerthanker-dental-api"
DEPLOY_PATH="/var/www/$PROJECT_NAME"
BACKUP_PATH="/var/backups/$PROJECT_NAME"

echo "🚀 Starting deployment for $PROJECT_NAME ($ENVIRONMENT)"

# Create backup of current deployment
if [ -d "$DEPLOY_PATH" ]; then
    echo "📦 Creating backup..."
    sudo mkdir -p "$BACKUP_PATH"
    sudo cp -r "$DEPLOY_PATH" "$BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S)"
fi

# Create deployment directory
sudo mkdir -p "$DEPLOY_PATH"
sudo mkdir -p "$DEPLOY_PATH/logs"

# Copy server files
echo "📁 Copying server files..."
sudo cp -r server/* "$DEPLOY_PATH/"
sudo cp -r shared "$DEPLOY_PATH/"

# Set proper permissions
sudo chown -R www-data:www-data "$DEPLOY_PATH"
sudo chmod -R 755 "$DEPLOY_PATH"

# Install dependencies
echo "📦 Installing dependencies..."
cd "$DEPLOY_PATH"
sudo -u www-data npm ci --only=production

# Copy environment file
if [ -f "server/.env.$ENVIRONMENT" ]; then
    echo "⚙️ Setting up environment..."
    sudo cp "server/.env.$ENVIRONMENT" "$DEPLOY_PATH/.env"
else
    echo "⚠️ Warning: No environment file found for $ENVIRONMENT"
fi

# Run database migrations/seeds if needed
echo "🗄️ Setting up database..."
sudo -u www-data npm run seed-plans

# Start/restart PM2 process
echo "🔄 Starting application..."
sudo -u www-data pm2 delete "$PROJECT_NAME" 2>/dev/null || true
sudo -u www-data pm2 start ecosystem.config.js --env $ENVIRONMENT

# Save PM2 configuration
sudo -u www-data pm2 save

# Setup log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/$PROJECT_NAME > /dev/null <<EOF
$DEPLOY_PATH/logs/*.log {
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

# Setup SSL certificate renewal (if using Let's Encrypt)
echo "🔒 Setting up SSL certificate..."
if command -v certbot &> /dev/null; then
    sudo certbot --nginx -d api.teerthankerdentalcare.com --non-interactive --agree-tos --email admin@teerthankerdentalcare.com
fi

# Health check
echo "🏥 Performing health check..."
sleep 5
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Deployment successful! API is responding."
else
    echo "❌ Health check failed. Check logs:"
    sudo -u www-data pm2 logs "$PROJECT_NAME" --lines 20
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Application status:"
sudo -u www-data pm2 status "$PROJECT_NAME"