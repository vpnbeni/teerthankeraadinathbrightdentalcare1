# Appointment Auto-Cancellation Implementation

## Overview

This document describes the implementation of the automatic appointment cancellation feature. The system automatically cancels appointments that have passed their scheduled time without any admin action (confirmation or completion).

## Features

### Core Functionality
- **Automatic Detection**: Finds appointments with status "scheduled" that have passed their appointment time
- **Smart Cancellation**: Uses existing appointment cancellation logic to maintain data integrity
- **Session Restoration**: Automatically restores user sessions if the user has an active subscription
- **Email Notifications**: Sends cancellation emails to patients (configurable)
- **Admin Monitoring**: Provides admin interface for monitoring and manual triggering

### Configuration Options
- **Enable/Disable**: Can be completely disabled via environment variable
- **Check Interval**: Configurable cron pattern for how often to check (default: every 15 minutes)
- **Grace Period**: Configurable grace period after appointment time (default: 0 minutes)
- **Email Notifications**: Can be disabled for patients
- **Session Restoration**: Can be disabled

## Architecture

### Files Created/Modified

1. **Service Implementation**
   - `server/src/services/appointmentAutoCancelService.js` - Main service logic
   - Uses `node-cron` for scheduling background tasks

2. **Configuration**
   - `server/src/config/environment.js` - Added AUTO_CANCEL configuration section

3. **API Routes**
   - `server/src/routes/autoCancelRoutes.js` - Admin monitoring and management endpoints

4. **Server Integration**
   - `server/server.js` - Auto-imports service and adds routes

5. **Testing**
   - `server/src/test/autoCancelTest.js` - Comprehensive test script
   - Added npm script: `npm run test:auto-cancel`

## Configuration

### Environment Variables

```bash
# Auto-cancellation settings
AUTO_CANCEL_ENABLED=true                    # Enable/disable the service
AUTO_CANCEL_CHECK_INTERVAL="*/15 * * * *"   # Cron pattern (every 15 minutes)
AUTO_CANCEL_GRACE_PERIOD_MINUTES=0          # Minutes to wait after appointment time
AUTO_CANCEL_NOTIFY_PATIENTS=true            # Send email notifications to patients
AUTO_CANCEL_RESTORE_SESSIONS=true           # Restore sessions for cancelled appointments
```

### Default Configuration

```javascript
AUTO_CANCEL: {
  ENABLED: true,                           // Default enabled
  CHECK_INTERVAL: "*/15 * * * *",          // Every 15 minutes
  GRACE_PERIOD_MINUTES: 0,                 // No grace period
  NOTIFY_PATIENTS: true,                   // Email notifications enabled
  RESTORE_SESSIONS: true,                  // Session restoration enabled
}
```

## API Endpoints

### Admin Monitoring Endpoints

All endpoints require admin authentication.

#### Get Service Statistics
```
GET /api/admin/auto-cancel/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalProcessed": 25,
    "totalCancelled": 18,
    "totalErrors": 0,
    "lastRunTime": "2024-01-15T10:30:00.000Z",
    "sessionRestored": 15,
    "isProcessing": false,
    "serviceUptime": 3600000
  }
}
```

#### Manual Trigger
```
POST /api/admin/auto-cancel/trigger
```

Response:
```json
{
  "success": true,
  "data": {
    "processed": 3,
    "cancelled": 2,
    "statsBefore": {...},
    "statsAfter": {...}
  },
  "message": "Manual trigger completed. Processed: 3, Cancelled: 2"
}
```

#### Preview Expired Appointments
```
GET /api/admin/auto-cancel/preview
```

Response:
```json
{
  "success": true,
  "data": {
    "count": 2,
    "appointments": [
      {
        "_id": "...",
        "patientName": "John Doe",
        "patientPhone": "+1234567890",
        "patientEmail": "john@example.com",
        "date": "2024-01-15T00:00:00.000Z",
        "timeSlot": "09:00-10:00",
        "appointmentDateTime": "2024-01-15T09:00:00.000Z",
        "status": "scheduled",
        "minutesPastDue": 45,
        "hasSubscription": true
      }
    ]
  }
}
```

#### Get Configuration
```
GET /api/admin/auto-cancel/config
```

## Business Logic

### Cancellation Criteria

An appointment is eligible for auto-cancellation if:
1. **Status is "scheduled"** - No admin action has been taken
2. **Appointment time has passed** - Based on date + timeSlot
3. **Service is enabled** - AUTO_CANCEL_ENABLED = true
4. **Grace period has passed** - If configured (default: 0 minutes)

### Process Flow

1. **Scheduled Check**: Every 15 minutes (configurable)
2. **Find Expired**: Query for appointments meeting cancellation criteria
3. **Process Each**:
   - Cancel appointment using existing `appointment.cancel()` method
   - Restore user session if applicable
   - Send email notification if enabled
   - Log admin notification
   - Update statistics
4. **Error Handling**: Continue processing even if individual appointments fail

### Session Restoration

When an appointment is auto-cancelled:
- If user has an active subscription
- If session restoration is enabled
- Calls `user.restoreSession()` to add back the session
- Updates appointment record with restoration status

## Testing

### Automated Testing

Run the comprehensive test:
```bash
npm run test:auto-cancel
```

The test creates:
- Expired appointment (should be cancelled)
- Future appointment (should NOT be cancelled)
- Past confirmed appointment (should NOT be cancelled)

### Manual Testing

1. **Create test appointment** in the past with status "scheduled"
2. **Trigger manually**: `POST /api/admin/auto-cancel/trigger`
3. **Verify cancellation**: Check appointment status is "cancelled"
4. **Check email**: Verify cancellation email was sent
5. **Check session**: Verify user session was restored (if applicable)

## Monitoring

### Logs

The service logs important events:
- Service initialization
- Scheduled runs
- Appointments processed/cancelled
- Errors and warnings
- Manual triggers

### Statistics

Track key metrics:
- Total appointments processed
- Total appointments cancelled
- Total errors
- Last run time
- Sessions restored
- Service uptime

## Error Handling

### Graceful Degradation
- Email failures don't prevent cancellation
- Session restoration failures don't prevent cancellation
- Individual appointment failures don't stop batch processing
- Service continues running even after errors

### Error Logging
- All errors are logged with context
- Statistics track error counts
- Admin can monitor via API endpoints

## Security Considerations

### Admin Only Access
- All monitoring endpoints require admin authentication
- Manual triggers are logged with admin user info

### Data Integrity
- Uses existing appointment cancellation logic
- Maintains audit trails
- No direct database manipulation

### Privacy
- Email notifications respect user preferences
- Only processes appointments that should be cancelled
- Logs contain minimal PII

## Performance

### Efficiency
- Runs only when needed (cron schedule)
- Processes appointments in batches
- Uses database indexes for fast queries
- Prevents concurrent execution

### Scalability
- Query limits can be added if needed
- Processing can be paginated for large datasets
- Statistics provide performance monitoring

## Future Enhancements

### Potential Improvements
1. **Grace Period**: Configurable delay before cancellation
2. **Admin Notifications**: Email alerts for auto-cancellations
3. **Retry Logic**: Retry failed cancellations
4. **Reporting**: Dashboard for cancellation analytics
5. **Customizable Messages**: Different cancellation reasons/emails
6. **Batch Size**: Configurable processing limits

### Integration Options
1. **SMS Notifications**: In addition to email
2. **Webhook Support**: Notify external systems
3. **Calendar Integration**: Remove from external calendars
4. **Analytics**: Integration with reporting systems

## Deployment Notes

### Environment Setup
1. Set environment variables in production
2. Ensure email service is configured
3. Test with manual trigger first
4. Monitor logs during initial deployment

### Rollback Plan
- Set `AUTO_CANCEL_ENABLED=false` to disable
- No data migration needed
- Service stops automatically

### Health Checks
- Monitor via `/api/admin/auto-cancel/stats`
- Check logs for errors
- Verify email delivery if enabled

## Support

### Troubleshooting

**Service not running:**
- Check `AUTO_CANCEL_ENABLED` environment variable
- Verify service logs for initialization errors
- Check database connectivity

**Appointments not being cancelled:**
- Verify appointment query criteria
- Check if grace period is configured
- Use preview endpoint to see eligible appointments

**Emails not sending:**
- Check email service configuration
- Verify `AUTO_CANCEL_NOTIFY_PATIENTS` setting
- Check email service logs

**Sessions not restored:**
- Verify `AUTO_CANCEL_RESTORE_SESSIONS` setting
- Check if users have active subscriptions
- Review session restoration logs

### Contact Information
For technical support or questions about this implementation, contact the development team.