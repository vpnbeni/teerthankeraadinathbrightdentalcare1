# Final Deployment Checklist - Teerthanker Dental Care

## Pre-Deployment Verification

### Environment Setup

- [ ] Production environment variables configured in all `.env.production` files
- [ ] MongoDB Atlas cluster created and connection string updated
- [ ] Razorpay production keys obtained and configured
- [ ] Cloudinary production account configured
- [ ] MSG91 production account configured
- [ ] Gmail app password generated for notifications
- [ ] Strong JWT secrets generated (64+ characters)
- [ ] Encryption keys generated for HIPAA compliance

### Domain and SSL

- [ ] DNS records configured for all subdomains:
  - [ ] api.teerthankerdentalcare.com
  - [ ] client.teerthankerdentalcare.com
  - [ ] admin.teerthankerdentalcare.com
- [ ] Domain ownership verified
- [ ] Server firewall configured (ports 80, 443, 22)

### Server Prerequisites

- [ ] Ubuntu/CentOS server provisioned
- [ ] Node.js 18+ installed
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Nginx installed and configured
- [ ] Certbot installed for SSL management
- [ ] Git installed for code deployment

## Deployment Process

### 1. Code Preparation

```bash
# Clone repository
git clone <repository-url>
cd teerthanker-dental-care

# Make scripts executable (Linux/Mac)
chmod +x scripts/*.sh

# Install dependencies
npm install
```

### 2. Run Pre-Deployment Tests

```bash
# Run comprehensive deployment with tests
./scripts/deploy-with-tests.sh production
```

### 3. Manual Verification Steps

#### API Server Verification

- [ ] Health check: `https://api.teerthankerdentalcare.com/api/health`
- [ ] Plans endpoint: `https://api.teerthankerdentalcare.com/api/plans`
- [ ] Monitoring: `https://api.teerthankerdentalcare.com/api/monitoring/health`

#### Client Portal Verification

- [ ] Landing page loads: `https://client.teerthankerdentalcare.com`
- [ ] Registration form accessible
- [ ] Plan selection working
- [ ] Responsive design on mobile

#### Admin Dashboard Verification

- [ ] Admin login page: `https://admin.teerthankerdentalcare.com`
- [ ] Dashboard loads after login
- [ ] User management accessible
- [ ] Analytics dashboard working

### 4. Integration Testing

#### User Registration Flow

- [ ] User can select a subscription plan
- [ ] Registration form accepts user details
- [ ] OTP verification process works (test with real phone number)
- [ ] Payment integration with Razorpay works
- [ ] User account created successfully
- [ ] Confirmation email/SMS sent

#### Appointment Booking Flow

- [ ] User can access appointment booking
- [ ] Calendar shows available dates
- [ ] Time slots display correctly
- [ ] Appointment confirmation works
- [ ] Admin can see booked appointments

#### Payment Processing

- [ ] Razorpay payment gateway loads
- [ ] Test payment with Razorpay test cards
- [ ] Payment success/failure handling works
- [ ] Payment history displays correctly
- [ ] Webhooks process correctly

#### File Upload Testing

- [ ] Document upload works in client portal
- [ ] Files stored in Cloudinary
- [ ] File size limits enforced
- [ ] File type validation works

#### Admin Functionality

- [ ] Admin can log in
- [ ] User management works (view, edit, search)
- [ ] Appointment management functional
- [ ] Session completion form works
- [ ] Analytics dashboard displays data
- [ ] Reports generation works

### 5. Security Verification

#### SSL and HTTPS

- [ ] All domains redirect HTTP to HTTPS
- [ ] SSL certificates valid and trusted
- [ ] Security headers present:
  - [ ] X-Content-Type-Options
  - [ ] X-Frame-Options
  - [ ] X-XSS-Protection
  - [ ] Strict-Transport-Security

#### Authentication and Authorization

- [ ] JWT tokens working correctly
- [ ] Session management secure
- [ ] Role-based access control enforced
- [ ] Password hashing working
- [ ] Rate limiting active

#### CORS Configuration

- [ ] Client portal can access API
- [ ] Admin dashboard can access API
- [ ] Unauthorized origins blocked

### 6. Performance Verification

#### Response Times

- [ ] API responses < 2 seconds
- [ ] Frontend load times < 5 seconds
- [ ] Database queries optimized
- [ ] Static assets cached properly

#### Monitoring

- [ ] PM2 processes running
- [ ] Log files being created
- [ ] Health check endpoints responding
- [ ] Monitoring metrics collecting

## Post-Deployment Configuration

### 1. Database Setup

```bash
# Seed initial data
cd /var/www/teerthanker-dental-api
npm run seed-plans
```

### 2. Backup Configuration

- [ ] Automated backups scheduled
- [ ] Backup restoration tested
- [ ] Backup retention policy configured

### 3. Monitoring Setup

- [ ] PM2 monitoring configured
- [ ] Log rotation setup
- [ ] Health check monitoring
- [ ] Error alerting configured

### 4. Security Hardening

- [ ] Firewall rules configured
- [ ] Fail2Ban installed and configured
- [ ] Regular security updates scheduled
- [ ] SSH key authentication enabled

## Production URLs

After successful deployment, verify these URLs are working:

- **Client Portal**: https://client.teerthankerdentalcare.com
- **Admin Dashboard**: https://admin.teerthankerdentalcare.com
- **API Server**: https://api.teerthankerdentalcare.com
- **Health Check**: https://api.teerthankerdentalcare.com/api/health

## Rollback Plan

If deployment fails:

1. **Immediate Actions**:

   ```bash
   # Stop current processes
   pm2 stop teerthanker-dental-api

   # Restore from backup
   sudo cp -r /var/backups/teerthanker-dental-api/backup-YYYYMMDD-HHMMSS/* /var/www/teerthanker-dental-api/

   # Restart services
   pm2 start teerthanker-dental-api
   sudo systemctl reload nginx
   ```

2. **Verify rollback**:
   - [ ] Health check responds
   - [ ] Applications accessible
   - [ ] Database connection working

## Maintenance Tasks

### Daily

- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor resource usage

### Weekly

- [ ] Security updates
- [ ] Performance review
- [ ] SSL certificate status

### Monthly

- [ ] Full backup testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Compliance review

## Emergency Contacts

- **System Administrator**: [Contact Information]
- **Database Administrator**: [Contact Information]
- **Security Team**: [Contact Information]
- **Hosting Provider**: [Contact Information]

## Sign-off

- [ ] **Development Team Lead**: ********\_******** Date: **\_\_\_**
- [ ] **System Administrator**: ********\_******** Date: **\_\_\_**
- [ ] **Security Officer**: ********\_******** Date: **\_\_\_**
- [ ] **Project Manager**: ********\_******** Date: **\_\_\_**

---

## Deployment Commands Reference

### Full Deployment with Tests

```bash
./scripts/deploy-with-tests.sh production
```

### Individual Component Deployment

```bash
./scripts/deploy-server.sh production
./scripts/deploy-client.sh production
./scripts/deploy-admin.sh production
```

### Testing Commands

```bash
# Integration tests
node scripts/integration-tests.js

# Production verification
node scripts/production-verification.js
```

### Monitoring Commands

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs teerthanker-dental-api

# Check Nginx status
sudo systemctl status nginx

# SSL certificate status
sudo certbot certificates
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**

   ```bash
   sudo certbot renew --dry-run
   sudo nginx -t && sudo systemctl reload nginx
   ```

2. **PM2 Process Issues**

   ```bash
   pm2 restart teerthanker-dental-api
   pm2 logs teerthanker-dental-api --lines 50
   ```

3. **Database Connection Issues**

   - Check MongoDB Atlas IP whitelist
   - Verify connection string
   - Test network connectivity

4. **CORS Issues**
   - Verify environment variables
   - Check CORS configuration in security middleware
   - Ensure all domains properly configured

Remember: Always test in a staging environment before production deployment!
