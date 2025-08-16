# Session Quota Expiry Implementation

## Overview

This implementation addresses the issue where scheduled appointments that were never confirmed by admin still counted towards user session quotas, causing incorrect "session limit reached" messages. The solution introduces an automatic expiry system that marks unconfirmed scheduled appointments as "expired" when their appointment time has passed.

## Key Features

### 1. Appointment Expiry Logic
- **Automatic Detection**: Identifies appointments with status "scheduled" that have passed their appointment time
- **Grace Period**: Configurable grace period (default: 15 minutes) before marking as expired
- **Status Change**: Changes status from "scheduled" to "expired" instead of deleting
- **Audit Trail**: Maintains appointment records for analytics and audit purposes

### 2. Updated Quota Counting
- **Excludes Expired**: Expired appointments do not count towards session limits
- **Only Counts Active**: Only ["confirmed", "completed"] appointments consume session quota
- **Real-time Updates**: Session limits update automatically when appointments expire

### 3. Background Processing
- **Cron Service**: Runs every 10 minutes to check for expired appointments
- **Non-blocking**: Operates independently without affecting user experience
- **Configurable**: Can be enabled/disabled via environment variables

## Implementation Details

### Files Modified

#### 1. Core Models and Constants
- **`shared/constants/index.js`**: Added "expired" to APPOINTMENT_STATUS enum
- **`server/src/models/Appointment.js`**: 
  - Added "expired" status to schema validation
  - Added `expire()` instance method
  - Updated availability checking to exclude expired appointments

#### 2. Session Quota Logic
- **`server/src/middleware/sessionLimits.js`**: Updated to exclude expired appointments from counts
- **`client/src/utils/sessionLimits.js`**: Updated client-side logic to exclude expired appointments

#### 3. Expiry Service
- **`server/src/services/appointmentExpiryService.js`**: New service for automatic appointment expiry
- **`server/src/config/environment.js`**: Added configuration for expiry service
- **`server/server.js`**: Initialize expiry service on startup

#### 4. Analytics Updates
- **`server/src/controllers/analyticsController.js`**: Updated to track expired appointments in statistics

#### 5. Documentation
- **`.cursor-rules`**: Added sessionQuotaRules for future development guidance

### Configuration

The system can be configured via environment variables:

```bash
# Appointment Expiry Configuration
APPOINTMENT_EXPIRY_ENABLED=true                    # Enable/disable expiry service
APPOINTMENT_EXPIRY_CHECK_INTERVAL="*/10 * * * *"   # Cron pattern (every 10 minutes)
APPOINTMENT_EXPIRY_GRACE_PERIOD_MINUTES=15         # Grace period before expiry
APPOINTMENT_EXPIRY_NOTIFY_PATIENTS=true            # Send notification emails
```

### Default Configuration

```javascript
APPOINTMENT_EXPIRY: {
  ENABLED: true,                    // Default enabled
  CHECK_INTERVAL: "*/10 * * * *",   // Every 10 minutes
  GRACE_PERIOD_MINUTES: 15,         // 15 minute grace period
  NOTIFY_PATIENTS: true,            // Email notifications enabled
}
```

## How It Works

### 1. Appointment Lifecycle
```
scheduled -> (time passes + grace period) -> expired
scheduled -> (admin confirms) -> confirmed
confirmed -> (admin completes) -> completed
```

### 2. Session Counting Logic
```javascript
// Before: Counted scheduled + confirmed
const appointments = await Appointment.find({
  userId,
  status: { $in: ["scheduled", "confirmed"] }
});

// After: Only counts confirmed (expired excluded automatically)
const appointments = await Appointment.find({
  userId,
  status: { $in: ["scheduled", "confirmed"] }  // "expired" appointments filtered out
});
```

### 3. Expiry Process
1. **Detection**: Find appointments where `status === "scheduled"` AND `appointmentDateTime + gracePeriod < now`
2. **Expiry**: Change status to "expired" using `appointment.expire()` method
3. **Notification**: Send email to patient explaining the expiry
4. **Audit**: Log the expiry for admin monitoring

## Benefits

### 1. Accurate Quota Management
- Users can book new appointments when old unconfirmed ones expire
- No more false "session limit reached" errors
- Fair usage of subscription sessions

### 2. Data Integrity
- Expired appointments remain in database for analytics
- Complete audit trail of all appointment states
- Historical data preserved for reporting

### 3. User Experience
- Clear communication about appointment expiry
- Automatic resolution without manual intervention
- Transparent session quota calculation

### 4. Administrative Efficiency
- Automatic cleanup of stale appointments
- Reduced support requests about quota limits
- Clear visibility into appointment lifecycle

## Testing

A comprehensive test script is provided (`test-session-quota-expiry.js`) that:
- Creates test appointments in various states
- Verifies expiry logic works correctly
- Confirms quota counting excludes expired appointments
- Validates the complete flow end-to-end

### Running Tests
```bash
node test-session-quota-expiry.js
```

## API Impact

### Session Limits Endpoints
- **GET `/api/session-limits`**: Now excludes expired appointments from counts
- **GET `/api/session-limits/can-book`**: More accurate availability checking

### Analytics Endpoints
- **GET `/api/analytics/appointments`**: Includes expired appointment statistics
- **GET `/api/analytics/dashboard`**: Updated counts exclude expired from active metrics

## Monitoring

### Service Statistics
The expiry service provides statistics accessible via:
```javascript
appointmentExpiryService.getStats()
```

Returns:
- `totalProcessed`: Total appointments checked
- `totalExpired`: Total appointments expired
- `totalErrors`: Any processing errors
- `lastRunTime`: When service last ran
- `isProcessing`: Current processing state

### Logging
All expiry actions are logged with details:
- Appointment ID and patient information
- Expiry reason and timestamp
- Email notification status
- Any errors encountered

## Future Enhancements

1. **Admin Dashboard**: Visual interface for monitoring expired appointments
2. **Bulk Actions**: Admin ability to bulk-expire or restore appointments
3. **Custom Grace Periods**: Per-appointment or per-user grace period settings
4. **Notification Templates**: Customizable expiry notification emails
5. **Reporting**: Detailed reports on appointment expiry patterns

## New Cursor Rule

The implementation includes a new cursor rule to ensure consistent handling:

```json
{
  "sessionQuotaRules": {
    "description": "Session quota management ensures users only count valid appointments towards their plan limits",
    "implementation": [
      "Do not count expired scheduled appointments towards user quota.",
      "Auto-expire appointments when appointment time + grace period passes without admin confirmation.",
      "Only count appointments with status in ['confirmed', 'completed'] as consuming sessions.",
      "Expired appointments (status: 'expired') should NOT count towards session limits.",
      "Use AppointmentExpiryService for automatic expiry with configurable grace period (default: 15 minutes).",
      "Expired appointments remain in database for audit/analytics but don't block new bookings."
    ]
  }
}
```

This ensures future development maintains the correct quota logic and expiry handling.
