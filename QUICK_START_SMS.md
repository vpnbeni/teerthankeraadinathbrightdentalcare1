# Quick Start: SMS Notifications Setup

This guide will help you quickly set up SMS notifications for appointment bookings and follow-ups.

## 🚀 Quick Setup (5 minutes)

### Step 1: Update Environment Variables

Add these to your `server/.env` file:

```env
# Required: Admin phone to receive booking notifications
ADMIN_PHONE=+917351114255

# Optional: MSG91 template IDs for DLT compliance (India)
MSG91_APPOINTMENT_BOOKING_TEMPLATE_ID=your-template-id
MSG91_FOLLOWUP_TEMPLATE_ID=your-template-id
```

### Step 2: Restart Server

```bash
cd server
npm start
```

### Step 3: Test It!

Book an appointment through your app and check the server console. You should see:

```
📱 [MSG91 SMS] To: 9999999999
📝 Message: Dear John, your appointment at Teerthanker Dental Care...
```

## ✅ What Works Now

1. **When a patient books an appointment:**

   - ✅ Patient receives SMS confirmation
   - ✅ Admin receives SMS notification with patient details

2. **When admin schedules a follow-up:**
   - ✅ Patient receives SMS with follow-up details

## 📱 Development Mode

In development mode:

- SMS messages are logged to console
- No actual SMS sent (unless valid MSG91/Twilio credentials)
- Everything else works normally
- Perfect for testing!

## 🔧 Production Setup

For production (actually sending SMS):

1. **Get MSG91 Account:**

   - Sign up at [msg91.com](https://msg91.com)
   - Add credits
   - Get your AUTH_KEY

2. **Update .env:**

   ```env
   MSG91_AUTH_KEY=your-real-auth-key
   ```

3. **For India (DLT Compliance):**
   - Register message templates in MSG91
   - Get approved template IDs
   - Add template IDs to .env

## 🧪 Testing

Run the test script:

```bash
node test-sms-notifications.js
```

## 📊 Cost

Approximate MSG91 costs:

- ₹0.15 - ₹0.25 per SMS
- 100 appointments = 200 SMS (user + admin) = ~₹40-50/month

## 🆘 Troubleshooting

### SMS not showing in console?

Check your appointment booking includes:

- ✅ User has a phone number
- ✅ ADMIN_PHONE is set in .env

### Want to use Twilio instead?

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number
```

## 📖 Full Documentation

See `SMS_NOTIFICATIONS_IMPLEMENTATION.md` for complete details.

## 🎯 What's Next?

The system is ready for:

- Appointment reminders (add cron job)
- Cancellation notifications (already coded)
- WhatsApp integration (future)

## ⚡ Summary

You're done! SMS notifications are now:

- ✅ Integrated into appointment flow
- ✅ Working in development mode
- ✅ Ready for production with valid credentials
- ✅ Non-blocking (won't break appointments if SMS fails)
- ✅ Fully logged for debugging

Just set `ADMIN_PHONE` in your .env and you're good to go! 🎉
