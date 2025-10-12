# SMS Notifications Implementation

## Overview

This document describes the SMS notification system implemented for appointment bookings and follow-ups at Teerthanker Dental Care.

## Features Implemented

### 1. Appointment Booking Notifications

When a patient books an appointment, two SMS notifications are sent:

#### To Patient:

```
Dear [Patient Name], your appointment at Teerthanker Dental Care is confirmed for [Date] at [Time Slot]. We look forward to seeing you!
```

#### To Admin:

```
New Appointment Booked!
Patient: [Patient Name]
Phone: [Patient Phone]
Date: [Date]
Time: [Time Slot]
Notes: [Patient Notes]
```

### 2. Follow-up Appointment Notifications

When an admin schedules a follow-up appointment, the patient receives:

```
Dear [Patient Name], a follow-up appointment has been scheduled at Teerthanker Dental Care for [Date] at [Time Slot]. Note: [Follow-up Notes]
```

## Architecture

### SMS Service (`server/src/services/smsService.js`)

A dedicated service that handles all SMS operations with support for:

- **MSG91** (default provider)
- **Twilio** (alternative provider)
- Development mode with console logging
- Error handling and graceful degradation

### Key Methods:

1. **`sendSMS(phone, message, templateId)`** - Unified SMS sending method
2. **`sendAppointmentBookingToUser(userName, userPhone, date, timeSlot)`** - User booking confirmation
3. **`sendAppointmentBookingToAdmin(adminPhone, userName, userPhone, date, timeSlot, notes)`** - Admin booking notification
4. **`sendFollowUpNotificationToUser(userName, userPhone, date, timeSlot, notes)`** - Follow-up notification
5. **`sendCancellationNotification(userName, userPhone, date, timeSlot, reason)`** - Cancellation alerts
6. **`sendAppointmentReminder(userName, userPhone, date, timeSlot, hoursBeforeAppointment)`** - Reminder feature (ready for future cron job)

## Configuration

### Environment Variables

Add these to your `server/.env` file:

```env
# Admin Configuration (both admins will receive notifications)
ADMIN_PHONE=+917351114255
ADMIN_PHONE_TWO=+919899826025

# SMS Provider (msg91 or twilio)
SMS_PROVIDER=msg91

# MSG91 Configuration
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_SENDER_ID=TABDCL
MSG91_APPOINTMENT_BOOKING_TEMPLATE_ID=optional-template-id
MSG91_FOLLOWUP_TEMPLATE_ID=optional-template-id

# Twilio Configuration (if using Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone
```

### Configuration File Updates

Updated `server/src/config/environment.js` to include:

- `ADMIN_PHONE` - Phone number to receive admin notifications
- `MSG91.APPOINTMENT_BOOKING_TEMPLATE_ID` - Optional MSG91 template for bookings
- `MSG91.FOLLOWUP_TEMPLATE_ID` - Optional MSG91 template for follow-ups

## Integration Points

### Appointment Controller

**File:** `server/src/controllers/appointmentController.js`

#### Booking Flow:

```javascript
// After appointment creation:
1. Create appointment in database
2. Send email to user (existing)
3. Send email to admin (existing)
4. Send SMS to user ✨ NEW
5. Send SMS to admin ✨ NEW
6. Return success response
```

#### Follow-up Flow:

```javascript
// After follow-up creation:
1. Create follow-up in database
2. Send email to user (existing)
3. Send email to admin (existing)
4. Send SMS to user ✨ NEW
5. Return success response
```

## Error Handling

All SMS notifications are **non-blocking** and gracefully handle failures:

```javascript
smsService
  .sendAppointmentBookingToUser(...)
  .catch((error) => {
    console.error("SMS to user failed (non-blocking):", error.message);
  });
```

### Development Mode

In development mode (`NODE_ENV=development`):

- SMS content is logged to console
- No actual SMS is sent unless credentials are valid
- Allows testing without SMS credits
- Operations continue even if SMS fails

### Production Mode

In production mode:

- Actual SMS are sent via configured provider
- Failures are logged but don't block the appointment flow
- Users still receive email notifications as backup

## Testing

### Test Script

Run the test script to verify SMS functionality:

```bash
node test-sms-notifications.js
```

### Test Requirements

Set these environment variables for testing:

```env
TEST_USER_PHONE=9999999999
TEST_USER_EMAIL=test@example.com
TEST_ADMIN_TOKEN=get-from-admin-login
TEST_USER_TOKEN=get-from-user-login
```

### Manual Testing

1. **Book an Appointment:**

   - Login as a user
   - Book an appointment
   - Check server console for SMS logs
   - Verify user receives SMS confirmation
   - Verify admin receives SMS notification

2. **Create Follow-up:**
   - Login as admin
   - Mark an appointment as completed
   - Schedule a follow-up
   - Check server console for SMS logs
   - Verify user receives SMS notification

## Phone Number Format

The SMS service automatically handles phone number formatting:

- Input: `9999999999`, `+919999999999`, or `919999999999`
- Normalized: `9999999999` (10 digits for Indian numbers)
- Sent as: `91` + normalized number for MSG91

## Message Templates

### MSG91 DLT Compliance

For production use with MSG91 in India:

1. **Register Templates** in MSG91 dashboard
2. **Get Approved Template IDs**
3. **Add to Environment Variables:**
   - `MSG91_APPOINTMENT_BOOKING_TEMPLATE_ID`
   - `MSG91_FOLLOWUP_TEMPLATE_ID`

### Without Templates

The system works without templates but:

- May not comply with DLT regulations in India
- Messages might be blocked by telecom operators
- Recommended for testing only

## Future Enhancements

### 1. Appointment Reminders

Already implemented in SMS service, can be activated with cron job:

```javascript
// Add to a cron job
smsService.sendAppointmentReminder(
  userName,
  userPhone,
  appointmentDate,
  timeSlot,
  24 // hours before appointment
);
```

### 2. Cancellation Notifications

Method ready, integrate when implementing cancellation flow:

```javascript
smsService.sendCancellationNotification(
  userName,
  userPhone,
  date,
  timeSlot,
  reason
);
```

### 3. WhatsApp Integration

Future consideration for better delivery rates and rich media support.

## Monitoring

### Console Logs

All SMS operations are logged:

```
📱 [MSG91 SMS] To: 9999999999
📝 Message: Dear John, your appointment at...
🔍 MSG91 SMS PAYLOAD:
═══════════════════════════════
📤 URL: https://api.msg91.com/api/sendhttp.php
📦 Data: { authkey: '...', mobiles: '9999999999', ... }
═══════════════════════════════
MSG91 Response: Message Sent Successfully
```

### Success Indicators

- ✅ `SMS sent successfully` - SMS delivered to provider
- ⚠️ `SMS sent successfully (development mode)` - Logged but not sent
- ⚠️ `SMS sent successfully (mock mode)` - Credentials not configured

### Error Indicators

- ❌ `SMS to user failed (non-blocking): [error]` - Failed but won't break flow
- ❌ `Invalid phone number format` - Phone number validation failed
- ❌ `MSG91 Error: [message]` - Provider-specific error

## Troubleshooting

### SMS Not Sending

1. **Check Configuration:**

   ```bash
   # Verify environment variables
   echo $ADMIN_PHONE
   echo $MSG91_AUTH_KEY
   ```

2. **Check Logs:**

   - Look for SMS-related console logs
   - Check for error messages
   - Verify phone number format

3. **Test Connection:**
   ```javascript
   const result = await smsService.testConnection("9999999999");
   console.log(result);
   ```

### Invalid Phone Numbers

- Ensure phone numbers are 10 digits
- Don't include country code in user database
- System handles +91 prefix automatically

### MSG91 Errors

Common MSG91 error codes:

- **418:** Invalid authentication key
- **420:** Invalid mobile number
- **421:** Invalid sender ID
- **424:** SMS sending failed
- **425:** Insufficient balance

## Security Considerations

1. **Phone Number Privacy:** Admin phone is in env, not exposed to client
2. **Rate Limiting:** Consider implementing SMS rate limits
3. **Cost Control:** Monitor SMS usage to prevent abuse
4. **Data Validation:** All phone numbers are validated before sending

## API Documentation

No new API endpoints were added. SMS notifications are triggered automatically by existing endpoints:

- `POST /api/appointments` - Creates appointment, sends SMS
- `POST /api/appointments/:id/followup` - Creates follow-up, sends SMS

## Migration Guide

No database migrations required. This is a service-layer enhancement.

### Deployment Steps:

1. **Update Environment Variables:**

   ```bash
   # Add to production .env
   ADMIN_PHONE=+917351114255
   ```

2. **Deploy Code:**

   ```bash
   git pull
   npm install
   pm2 restart all
   ```

3. **Verify:**
   - Check server starts without errors
   - Book a test appointment
   - Verify SMS delivery

## Cost Estimation

### MSG91 Pricing (Approximate)

- Transactional SMS: ₹0.15 - ₹0.25 per SMS
- Monthly cost depends on volume

### Example Calculation:

- 100 appointments/month = 200 SMS (user + admin)
- 50 follow-ups/month = 50 SMS
- Total: 250 SMS × ₹0.20 = ₹50/month

## Support

For issues or questions:

1. Check server logs
2. Verify environment configuration
3. Test with the provided test script
4. Review MSG91/Twilio dashboard for delivery status

## Changelog

### Version 1.0.0 (Current)

- ✅ SMS service implementation
- ✅ Appointment booking notifications (user + admin)
- ✅ Follow-up notifications (user)
- ✅ Development mode support
- ✅ Error handling and logging
- ✅ MSG91 and Twilio support
- ✅ Phone number formatting
- ✅ Test script
- ✅ Documentation

### Future Versions

- Appointment reminders (cron job)
- Cancellation notifications integration
- WhatsApp support
- SMS delivery tracking
- Analytics dashboard
