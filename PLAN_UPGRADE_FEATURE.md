# Plan Upgrade Feature

## Overview
The plan upgrade feature allows users to upgrade their subscription plan from the client panel's Payments page (/#/payments). When upgrading, users can select a higher-tier plan, complete payment via Razorpay, and have additional sessions added to their existing subscription.

## Key Features

### 1. Upgrade Detection
- The system automatically detects if a user is on the best available plan
- If not on the best plan, an "Upgrade Plan" option is prominently displayed
- Users can view all available upgrade options with clear pricing

### 2. Plan Comparison
- Current plan details are displayed for easy comparison
- Available upgrade plans show:
  - Plan name and duration
  - Number of sessions included
  - Additional sessions gained from upgrade
  - Upgrade price
  - Key features

### 3. Payment Integration
- Razorpay payment gateway integration for secure payments
- Real-time payment processing
- Automatic subscription update upon successful payment

### 4. Session Management
- **Additive Approach**: When upgrading, new sessions are ADDED to existing sessions
- Example: If user has 3 sessions remaining and upgrades to a plan with 8 sessions, they will have 11 sessions total
- Sessions are preserved even if the subscription period is extended

## User Flow

1. **Navigate to Payments Page**
   - User goes to /#/payments in the client panel
   - Current subscription status is displayed

2. **View Upgrade Options**
   - Click "Upgrade Plan" button
   - View available plans with higher session counts
   - Compare features and pricing

3. **Select Plan**
   - Click "Upgrade Now" on desired plan
   - Razorpay payment modal opens automatically

4. **Complete Payment**
   - Enter payment details in Razorpay modal
   - Complete payment securely

5. **Subscription Updated**
   - Sessions are added to account immediately
   - Subscription status is updated
   - User receives confirmation email

## Technical Implementation

### Client-Side Changes

**Files Modified:**
- `client/src/services/payments.js` - Added `isUpgrade` parameter to payment methods
- `client/src/components/subscription/PlanUpgrade.jsx` - Integrated direct payment flow
- `client/src/components/subscription/SubscriptionStatus.jsx` - Added upgrade prompt

**Key Functions:**
```javascript
// Initialize payment with upgrade flag
paymentService.initializePayment(planId, userData, isUpgrade)

// Create order with upgrade flag
paymentService.createOrder(planId, isUpgrade)
```

### Server-Side Changes

**Files Modified:**
- `server/src/controllers/paymentController.js` - Added `isUpgrade` parameter handling
- `server/src/services/paymentService.js` - Implemented additive session logic

**Key Logic:**
```javascript
// In processSuccessfulPayment
if (isUpgrade && user.subscription?.planId) {
  // Add new sessions to existing sessions
  totalSessions = (user.subscription.totalSessions || 0) + plan.sessions;
  sessionsRemaining = (user.subscription.sessionsRemaining || 0) + plan.sessions;
} else {
  // New subscription
  totalSessions = plan.sessions;
  sessionsRemaining = plan.sessions;
}
```

## Pricing Strategy

Currently, upgrades charge the **full price** of the new plan. The sessions are added to the existing subscription.

**Alternative Pricing Options** (can be implemented):
1. **Difference Pricing**: Charge only the difference between plans
2. **Prorated Pricing**: Calculate based on remaining subscription time
3. **Bundle Pricing**: Offer discounts for upgrades

To implement difference pricing, modify `server/src/services/paymentService.js`:
```javascript
if (isUpgrade && currentPlan) {
  amount = Math.max(0, plan.price - currentPlan.price);
}
```

## Subscription Period Handling

- If subscription is still active: Existing dates are preserved, sessions are added
- If subscription has expired: New start date is set, new end date is calculated
- Status is always set to "active" after successful upgrade

## Email Notifications

Users receive confirmation emails for:
- New subscriptions
- Plan upgrades (with special subject line)

Email includes:
- Plan name
- Payment amount
- Transaction ID
- Session details

## Testing

### Test Scenarios

1. **Upgrade from Basic to Premium**
   - User with 2 sessions remaining
   - Upgrades to 8-session plan
   - Should have 10 sessions after upgrade

2. **Upgrade with Expired Subscription**
   - User with expired subscription
   - Upgrades to new plan
   - Should get fresh start date and full sessions

3. **Payment Cancellation**
   - User initiates upgrade
   - Cancels Razorpay modal
   - Should show appropriate message

4. **Already on Best Plan**
   - User on highest tier plan
   - Should see "You're on the Best Plan!" message
   - No upgrade options shown

## Environment Variables

Ensure these are set in your environment:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key

# Client-side
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

## Future Enhancements

1. **Downgrade Support**: Allow users to downgrade plans
2. **Plan Comparison Tool**: Side-by-side plan comparison
3. **Upgrade Recommendations**: AI-based plan suggestions
4. **Discount Codes**: Apply promo codes during upgrade
5. **Subscription Pause**: Temporarily pause subscription
6. **Auto-renewal**: Automatic subscription renewal
7. **Payment History**: Detailed transaction history with filters

## Troubleshooting

### Issue: Payment modal doesn't open
- Check if Razorpay script is loaded
- Verify RAZORPAY_KEY_ID is set correctly
- Check browser console for errors

### Issue: Sessions not added after payment
- Verify payment verification is successful
- Check server logs for errors in `processSuccessfulPayment`
- Ensure user subscription is being saved correctly

### Issue: "Already on best plan" shown incorrectly
- Check plan sessions in database
- Verify plan comparison logic in `PlanUpgrade.jsx`
- Ensure plans are sorted by sessions correctly

## Support

For issues or questions:
1. Check server logs for payment processing errors
2. Verify Razorpay webhook configuration
3. Test with Razorpay test mode first
4. Review payment records in database
