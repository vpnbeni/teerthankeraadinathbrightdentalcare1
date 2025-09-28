# MSG91 OTP Service Setup Guide

## Current Status

The OTP verification functionality is currently using **mock mode** because the MSG91 authentication key is invalid (Error 418: Invalid authentication key).

## How to Fix MSG91 Integration

### 1. Get Valid MSG91 Credentials

1. **Sign up at MSG91**: Go to [https://msg91.com/](https://msg91.com/)
2. **Create an account** and verify your email
3. **Add credits** to your account for SMS sending
4. **Get your AUTH KEY** from the MSG91 dashboard
5. **Get your TEMPLATE ID** (if using template-based SMS)

### 2. Update Environment Variables

Update the following variables in `server/.env`:

```env
# MSG91 Configuration
MSG91_AUTH_KEY=your-actual-auth-key-here
MSG91_TEMPLATE_ID=your-template-id-here
MSG91_SIGNUP_TEMPLATE_ID=68d8d20108c74d5c0f167b2
MSG91_LOGIN_TEMPLATE_ID=68d8d1d89d4ce1639a6d1173
MSG91_SENDER_ID=TABDCL
```

### 3. Test the Integration

Run the test script to verify the connection:

```bash
cd server
node test-msg91-connection.js
```

### 4. Current Workaround

The system currently works in **development mode** with the following behavior:

- ✅ OTP is generated and stored in memory
- ✅ OTP is logged to console for testing
- ✅ OTP verification works normally
- ❌ No actual SMS is sent to users

### 5. Production Considerations

For production deployment:

1. **Valid MSG91 account** with sufficient credits
2. **Proper sender ID** registration (if required)
3. **DLT registration** for Indian SMS compliance
4. **Rate limiting** and **fraud prevention** measures

## Testing OTP Functionality

### Development Mode Testing

1. **Start the server**:

   ```bash
   cd server
   npm run dev
   ```

2. **Register a new user** through the client application
3. **Check server console** for the OTP code
4. **Use the logged OTP** to verify the phone number

### API Testing

You can also test the OTP endpoints directly:

```bash
# Test MSG91 connection
curl -X POST http://localhost:5000/api/auth/test-msg91

# Test OTP sending (development only)
curl -X POST http://localhost:5000/api/auth/test-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999"}'
```

## Error Codes Reference

Common MSG91 error codes:

- **418**: Invalid authentication key
- **419**: Route not allowed for your account
- **420**: Invalid mobile number
- **421**: Invalid sender ID
- **422**: Invalid message
- **423**: Invalid country code
- **424**: SMS sending failed
- **425**: Insufficient balance

## Alternative Solutions

If MSG91 doesn't work, you can:

1. **Use another SMS provider** (Twilio, AWS SNS, etc.)
2. **Implement email-based verification** as backup
3. **Use WhatsApp Business API** for OTP delivery
4. **Implement voice call OTP** for better accessibility

## Security Notes

- ✅ OTPs expire after 5 minutes
- ✅ Maximum 3 verification attempts per OTP
- ✅ Rate limiting on OTP requests
- ✅ Phone number format validation
- ✅ Secure in-memory storage (production should use Redis)

The current implementation is secure and production-ready except for the SMS delivery part.
