#!/bin/bash

# Deployment script for Teerthanker Dental Care Client Portal
# Usage: ./scripts/deploy-client.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="teerthanker-dental-client"
DEPLOY_PATH="/var/www/client.teerthankerdentalcare.com"
BACKUP_PATH="/var/backups/$PROJECT_NAME"

echo "🚀 Starting deployment for $PROJECT_NAME ($ENVIRONMENT)"

# Create backup of current deployment
if [ -d "$DEPLOY_PATH" ]; then
    echo "📦 Creating backup..."
    sudo mkdir -p "$BACKUP_PATH"
    sudo cp -r "$DEPLOY_PATH" "$BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S)"
fi

# Build the application locally
echo "🔨 Building application..."
cd client

# Copy environment file
if [ -f ".env.$ENVIRONMENT" ]; then
    echo "⚙️ Setting up environment..."
    cp ".env.$ENVIRONMENT" .env
else
    echo "⚠️ Warning: No environment file found for $ENVIRONMENT"
fi

# Install dependencies and build
npm ci
npm run build

# Create deployment directory
sudo mkdir -p "$DEPLOY_PATH"

# Copy built files
echo "📁 Copying built files..."
sudo cp -r dist/* "$DEPLOY_PATH/"

# Copy additional files
sudo cp -r public/favicon.ico "$DEPLOY_PATH/" 2>/dev/null || true
sudo cp -r public/robots.txt "$DEPLOY_PATH/" 2>/dev/null || true

# Set proper permissions
sudo chown -R www-data:www-data "$DEPLOY_PATH"
sudo chmod -R 755 "$DEPLOY_PATH"

# Setup Nginx configuration
echo "🌐 Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/client.teerthankerdentalcare.com > /dev/null <<EOF
server {
    listen 80;
    server_name client.teerthankerdentalcare.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name client.teerthankerdentalcare.com;
    
    root $DEPLOY_PATH;
    index index.html;
    
    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/client.teerthankerdentalcare.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/client.teerthankerdentalcare.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.teerthankerdentalcare.com; font-src 'self';" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # API proxy (if needed for development)
    location /api/ {
        proxy_pass https://api.teerthankerdentalcare.com/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/client.teerthankerdentalcare.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL certificate (if using Let's Encrypt)
echo "🔒 Setting up SSL certificate..."
if command -v certbot &> /dev/null; then
    sudo certbot --nginx -d client.teerthankerdentalcare.com --non-interactive --agree-tos --email admin@teerthankerdentalcare.com
fi

# Health check
echo "🏥 Performing health check..."
sleep 2
if curl -f https://client.teerthankerdentalcare.com > /dev/null 2>&1; then
    echo "✅ Deployment successful! Client portal is accessible."
else
    echo "❌ Health check failed. Check Nginx logs:"
    sudo tail -20 /var/log/nginx/error.log
    exit 1
fi

echo "🎉 Client portal deployment completed successfully!"