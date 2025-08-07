# Production Deployment Checklist

## Pre-Deployment Checklist

### Environment Configuration

- [ ] All production environment variables are set in `.env.production` files
- [ ] MongoDB Atlas cluster is created and configured
- [ ] Razorpay production keys are obtained and configured
- [ ] Cloudinary production account is set up
- [ ] MSG91 production account is configured
- [ ] Gmail app password is generated for email notifications
- [ ] Strong JWT secrets are generated (minimum 64 characters)
- [ ] Encryption keys are generated for HIPAA compliance

### Domain and SSL

- [ ] DNS records are configured for all three subdomains
- [ ] Domain ownership is verified
- [ ] SSL certificates are ready to be generated
- [ ] Firewall rules are configured (ports 80, 443, 22)

### Server Setup

- [ ] Ubuntu/CentOS server is provisioned
- [ ] Node.js 18+ is installed
- [ ] PM2 is installed globally
- [ ] Nginx is installed and configured
- [ ] Certbot is installed for SSL management
- [ ] Git is installed for code deployment

### Security

- [ ] Server is hardened (SSH keys, disable root login)
- [ ] Fail2Ban is configured
- [ ] UFW firewall is enabled
- [ ] Regular security updates are configured
- [ ] Backup strategy is planned

## Deployment Steps

### 1. Code Deployment

- [ ] Repository is cloned to server
- [ ] All dependencies are installed (`npm run install:all`)
- [ ] Production builds are created (`npm run build:production`)
- [ ] Environment files are copied to production locations

### 2. Database Setup

- [ ] MongoDB connection is tested
- [ ] Initial data is seeded (`npm run seed-plans`)
- [ ] Database indexes are created
- [ ] Backup procedures are tested

### 3. Application Deployment

- [ ] API server is deployed and started with PM2
- [ ] Client portal is built and deployed to Nginx
- [ ] Admin dashboard is built and deployed to Nginx
- [ ] All applications are accessible via their domains

### 4. SSL Configuration

- [ ] SSL certificates are generated for all domains
- [ ] HTTPS redirects are working
- [ ] SSL certificate auto-renewal is configured
- [ ] Security headers are properly set

### 5. Monitoring Setup

- [ ] PM2 monitoring is configured
- [ ] Log rotation is set up
- [ ] Health check endpoints are responding
- [ ] Uptime monitoring is configured (optional)

## Post-Deployment Verification

### Functional Testing

- [ ] User registration flow works end-to-end
- [ ] OTP verification is working
- [ ] Payment integration is functional
- [ ] Appointment booking works
- [ ] Admin dashboard is accessible
- [ ] File uploads are working
- [ ] Email notifications are sent

### Security Testing

- [ ] HTTPS is enforced on all domains
- [ ] CORS is properly configured
- [ ] Rate limiting is working
- [ ] Input validation is functioning
- [ ] Authentication is secure
- [ ] Admin access is restricted

### Performance Testing

- [ ] Page load times are acceptable
- [ ] API response times are under 2 seconds
- [ ] Database queries are optimized
- [ ] Static assets are cached properly
- [ ] Gzip compression is working

### Compliance Verification

- [ ] HIPAA compliance features are active
- [ ] Data encryption is working
- [ ] Audit logging is functional
- [ ] Backup procedures are tested
- [ ] Data retention policies are implemented

## Monitoring and Maintenance

### Daily Checks

- [ ] Application health status
- [ ] Server resource usage
- [ ] Error logs review
- [ ] Backup verification

### Weekly Checks

- [ ] Security updates
- [ ] Performance metrics review
- [ ] SSL certificate status
- [ ] Database optimization

### Monthly Checks

- [ ] Full backup testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Compliance review

## Emergency Procedures

### Rollback Plan

- [ ] Previous version backup is available
- [ ] Rollback procedure is documented
- [ ] Database rollback plan is ready
- [ ] Emergency contacts are defined

### Incident Response

- [ ] Monitoring alerts are configured
- [ ] Incident response team is identified
- [ ] Communication plan is established
- [ ] Recovery procedures are documented

## Production URLs

After successful deployment, verify these URLs:

- **Client Portal**: https://client.teerthankerdentalcare.com
- **Admin Dashboard**: https://admin.teerthankerdentalcare.com
- **API Server**: https://api.teerthankerdentalcare.com
- **Health Check**: https://api.teerthankerdentalcare.com/api/health

## Support Information

### Log Locations

- Application logs: `/var/www/teerthanker-dental-api/logs/`
- Nginx logs: `/var/log/nginx/`
- PM2 logs: `~/.pm2/logs/`

### Important Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs teerthanker-dental-api

# Restart application
pm2 restart teerthanker-dental-api

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx configuration
sudo nginx -t && sudo systemctl reload nginx

# Check SSL certificates
sudo certbot certificates

# Renew SSL certificates
sudo certbot renew
```

### Emergency Contacts

- System Administrator: [Contact Information]
- Database Administrator: [Contact Information]
- Security Team: [Contact Information]
- Hosting Provider Support: [Contact Information]

## Sign-off

- [ ] Development Team Lead: ********\_******** Date: **\_\_\_**
- [ ] System Administrator: ********\_******** Date: **\_\_\_**
- [ ] Security Officer: **********\_********** Date: **\_\_\_**
- [ ] Project Manager: **********\_********** Date: **\_\_\_**
