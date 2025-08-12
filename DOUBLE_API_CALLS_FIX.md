# Fix for Double API Calls in Production

## Issue Description

In production (Vercel deployment), API calls were being made twice, causing issues like:

- Appointment booking API called twice
- First request succeeds, second fails with "slot already booked"
- Other POST operations potentially duplicated
- Unnecessary server load and potential data inconsistencies

## Root Cause Analysis

The double API calls were caused by multiple factors:

### 1. React.StrictMode

- React.StrictMode intentionally double-invokes functions in development
- This behavior can persist in production builds under certain conditions
- Causes components to render twice, triggering duplicate API calls

### 2. API Retry Logic

- Axios retry mechanism was configured to retry failed requests
- In some edge cases, successful requests might be retried
- No exclusion for POST requests which should never be retried

### 3. Component Re-renders

- React components re-rendering due to state changes
- Multiple useEffect hooks triggering the same API calls
- Redux actions being dispatched multiple times

### 4. Network Issues

- Slow network responses causing users to click multiple times
- Race conditions in async operations

## Applied Fixes

### 1. Conditional StrictMode (Client-side)

**File:** `client/src/main.jsx`

```javascript
// Before: Always wrapped in StrictMode
<React.StrictMode>
  <App />
</React.StrictMode>;

// After: Only use StrictMode in development
{
  process.env.NODE_ENV === "development" ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  );
}
```

### 2. Request Deduplication (Client-side)

**File:** `client/src/services/api.js`

Added request deduplication mechanism:

```javascript
// Track pending requests to prevent duplicates
const pendingRequests = new Map();

const generateRequestKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(
    config.data || {}
  )}:${JSON.stringify(config.params || {})}`;
};

// In request interceptor
if (config.method === "post") {
  const requestKey = generateRequestKey(config);

  if (pendingRequests.has(requestKey)) {
    console.log(`Deduplicating request: ${requestKey}`);
    return pendingRequests.get(requestKey);
  }

  config.requestKey = requestKey;
}
```

### 3. Improved Retry Logic (Client-side)

**File:** `client/src/services/api.js`

```javascript
// Before: Retry all failed requests
const shouldRetry = retryCount < MAX_RETRIES && ...

// After: Don't retry POST requests
const shouldRetry =
  config.method !== 'post' &&
  retryCount < MAX_RETRIES && ...
```

### 4. Booking Request Tracking (Client-side)

**File:** `client/src/services/appointments.js`

```javascript
// Track ongoing booking requests
const ongoingBookings = new Set();

createAppointment: async (appointmentData) => {
  const bookingKey = `${appointmentData.date}-${appointmentData.timeSlot}`;

  if (ongoingBookings.has(bookingKey)) {
    throw new Error("Booking request already in progress for this slot");
  }

  try {
    ongoingBookings.add(bookingKey);
    // ... make API call
  } finally {
    ongoingBookings.delete(bookingKey);
  }
};
```

### 5. Server-side Duplicate Prevention

**File:** `server/src/controllers/appointmentController.js`

```javascript
// Track recent booking requests
const recentBookings = new Map();
const DUPLICATE_WINDOW = 5000; // 5 seconds

export const createAppointment = async (req, res) => {
  const bookingKey = `${req.user._id}-${date}-${timeSlot}`;
  const now = Date.now();

  // Check for recent duplicate requests
  if (recentBookings.has(bookingKey)) {
    const lastRequest = recentBookings.get(bookingKey);
    if (now - lastRequest < DUPLICATE_WINDOW) {
      return res.status(429).json({
        success: false,
        message: "Duplicate booking request. Please wait before trying again.",
      });
    }
  }

  recentBookings.set(bookingKey, now);
  // ... continue with booking logic
};
```

## Additional Recommendations

### 1. UI/UX Improvements

Add loading states and disable buttons during API calls:

```javascript
const [isBooking, setIsBooking] = useState(false);

const handleBooking = async () => {
  if (isBooking) return; // Prevent multiple clicks

  setIsBooking(true);
  try {
    await bookAppointment(data);
  } finally {
    setIsBooking(false);
  }
};

// In JSX
<button disabled={isBooking} onClick={handleBooking}>
  {isBooking ? "Booking..." : "Book Appointment"}
</button>;
```

### 2. Redux Action Deduplication

For Redux actions, consider using middleware to prevent duplicate dispatches:

```javascript
// Custom middleware to prevent duplicate actions
const deduplicationMiddleware = (store) => (next) => (action) => {
  const key = `${action.type}-${JSON.stringify(action.payload)}`;

  if (pendingActions.has(key)) {
    return pendingActions.get(key);
  }

  const promise = next(action);
  pendingActions.set(key, promise);

  // Clean up after action completes
  promise.finally(() => {
    pendingActions.delete(key);
  });

  return promise;
};
```

### 3. Network Request Monitoring

Add monitoring to track duplicate requests:

```javascript
// In development, log potential duplicates
if (process.env.NODE_ENV === "development") {
  console.warn(`Potential duplicate request: ${requestKey}`);
}
```

## Testing

### 1. Manual Testing

- Test appointment booking in production
- Verify only one API call is made per action
- Check network tab in browser DevTools
- Test with slow network conditions

### 2. Automated Testing

- Add tests for request deduplication
- Test component behavior without StrictMode
- Verify server-side duplicate prevention

### 3. Monitoring

- Monitor server logs for duplicate request patterns
- Track 429 responses from duplicate prevention
- Monitor appointment booking success rates

## Expected Results

After applying these fixes:

✅ **Single API Calls**: Each user action results in exactly one API call  
✅ **No Duplicate Bookings**: Appointment slots can't be double-booked  
✅ **Better Performance**: Reduced server load and faster response times  
✅ **Improved UX**: No confusing error messages about slots being taken  
✅ **Consistent Data**: No race conditions or data inconsistencies

## Deployment Checklist

- [ ] Deploy client-side changes (StrictMode fix, request deduplication)
- [ ] Deploy server-side changes (duplicate prevention)
- [ ] Test appointment booking flow in production
- [ ] Monitor server logs for any remaining duplicate requests
- [ ] Verify no regression in other API endpoints
- [ ] Update monitoring dashboards if applicable

## Prevention for Future

1. **Code Reviews**: Always check for potential duplicate API calls
2. **Testing**: Test all user interactions that trigger API calls
3. **Monitoring**: Set up alerts for unusual API call patterns
4. **Documentation**: Document all async operations and their safeguards
5. **Best Practices**: Use loading states and disable buttons during operations
