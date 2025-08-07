# Deployment Guide - Teerthanker Dental Care Management System

This guide covers the deployment of the Teerthanker Dental Care management system to production environments.

## Architecture Overview

The system consists of three separate applications deployed on different subdomains:

- **Client Portal**: `https://client.teerthankerdentalcare.com`
- **Admin Dashboard**: `https://admin.teerthankerdentalcare.com`
- **API Server**: `https://api.teerthankerdentalcare.com`

## Prerequisites

### Server Requirements

- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+ and npm
- Nginx
- PM2 (for process management)
- SSL certificates (Let's Encrypt recommended)
- MongoDB Atlas account (recommended) or local MongoDB

### Domain Setup

1. Configure DNS records for all three subdomains to point to your server IP
2. Ensure all subdomains are properly configured in your hosting provider

## Environment Configuration

### 1. Server Environment Variables

Create production environment files with real values:

```bash
# Copy and edit production environment files
cp server/.env.example server/.env.production
cp client/.env.example client/.env.production
cp admin/.env.example admin/.env.production
```

### 2. Required Services Setup

#### MongoDB Atlas

1. Create a MongoDB Atlas cluster
2. Create a database user with read/write permissions
3. Whitelist your server IP address
4. Update `MONGODB_URI` in `server/.env.production`

#### Razorpay

1. Create a Razorpay account
2. Generate API keys for production
3. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

#### Cloudinary

1. Create a Cloudinary account
2. Get your cloud name, API key, and API secret
3. Update Cloudinary configuration

#### MSG91

1. Create an MSG91 account for SMS services
2. Get your auth key and template ID
3. Update MSG91 configuration

#### Gmail (for email notifications)

1. Enable 2-factor authentication on Gmail
2. Generate an app-specific password
3. Update email configuration

## Deployment Methods

### Method 1: Traditional Deployment (Recommended)

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

#### 2. Deploy Applications

```bash
# Clone repository
git clone <your-repository-url>
cd teerthanker-dental-care

# Install all dependencies
npm run install:all

# Build production applications
npm run build:production

# Deploy all applications
npm run deploy
```

#### 3. SSL Certificate Setup

```bash
# Generate SSL certificates for all domains
sudo certbot --nginx -d api.teerthankerdentalcare.com
sudo certbot --nginx -d client.teerthankerdentalcare.com
sudo certbot --nginx -d admin.teerthankerdentalcare.com
```

#### 4. Setup Auto-renewal

```bash
# Add cron job for certificate renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Method 2: Docker Deployment

#### 1. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Deploy with Docker

```bash
# Build and start all services
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs
```

## Post-Deployment Configuration

### 1. Database Setup

```bash
# Seed initial data (subscription plans)
cd server
npm run seed-plans
```

### 2. Monitoring Setup

```bash
# Setup PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Save PM2 configuration
pm2 save
pm2 startup
```

### 3. Backup Configuration

```bash
# Create backup script
sudo tee /etc/cron.daily/dental-backup > /dev/null <<EOF
#!/bin/bash
# Daily backup script
BACKUP_DIR="/var/backups/teerthanker-dental"
DATE=$(date +%Y%m%d)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app-$DATE.tar.gz /var/www/

# Backup database (if using local MongoDB)
# mongodump --out $BACKUP_DIR/db-$DATE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

sudo chmod +x /etc/cron.daily/dental-backup
```

## Security Considerations

### 1. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Fail2Ban Setup

```bash
# Install and configure Fail2Ban
sudo apt install fail2ban -y

# Create custom jail for Nginx
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600
EOF

sudo systemctl restart fail2ban
```

### 3. Regular Security Updates

```bash
# Setup automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Monitoring and Maintenance

### 1. Health Checks

The system includes built-in health check endpoints:

- API: `https://api.teerthankerdentalcare.com/api/health`
- Client: `https://client.teerthankerdentalcare.com`
- Admin: `https://admin.teerthankerdentalcare.com`

### 2. Log Monitoring

```bash
# View application logs
pm2 logs teerthanker-dental-api

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Performance Monitoring

Consider setting up monitoring tools:

- **Uptime monitoring**: UptimeRobot, Pingdom
- **Application monitoring**: New Relic, DataDog
- **Server monitoring**: Netdata, Grafana

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**

   ```bash
   # Check certificate status
   sudo certbot certificates

   # Renew certificates manually
   sudo certbot renew --dry-run
   ```

2. **PM2 Process Issues**

   ```bash
   # Restart all processes
   pm2 restart all

   # Check process status
   pm2 status

   # View detailed logs
   pm2 logs --lines 100
   ```

3. **Database Connection Issues**

   ```bash
   # Check MongoDB Atlas connection
   # Verify IP whitelist and credentials
   # Check network connectivity
   ```

4. **CORS Issues**
   ```bash
   # Verify environment variables
   # Check CORS configuration in server/src/middleware/security.js
   # Ensure all domains are properly configured
   ```

## Rollback Procedure

If deployment fails:

```bash
# Restore from backup
sudo tar -xzf /var/backups/teerthanker-dental/app-YYYYMMDD.tar.gz -C /

# Restart services
pm2 restart all
sudo systemctl reload nginx
```

## Support

For deployment issues:

1. Check application logs
2. Verify environment configuration
3. Test individual components
4. Contact system administrator

## Security Compliance

This deployment follows HIPAA guidelines:

- All data transmission is encrypted (HTTPS)
- Sensitive data is encrypted at rest
- Access logs are maintained
- Regular security updates are applied
- Backup and recovery procedures are in place
