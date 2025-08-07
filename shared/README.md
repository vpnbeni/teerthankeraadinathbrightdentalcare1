# Teerthanker Dental Care - Shared Utilities

This package contains shared utilities, constants, and components used across the Teerthanker Dental Care system (client, admin, and server applications).

## Installation

```bash
npm install
```

## Usage

### Constants

```javascript
import {
  API_ENDPOINTS,
  SUBSCRIPTION_PLANS,
  COLORS,
  VALIDATION_RULES,
} from "teerthanker-dental-shared";

// Use API endpoints
const loginUrl = API_ENDPOINTS.AUTH.LOGIN;

// Use subscription plans
const plans = SUBSCRIPTION_PLANS;

// Use brand colors
const primaryColor = COLORS.PRIMARY;
```

### Utilities

```javascript
import {
  formatCurrency,
  formatDate,
  isValidEmail,
  apiClient,
} from "teerthanker-dental-shared";

// Format currency
const price = formatCurrency(15000); // ₹15,000

// Format date
const date = formatDate(new Date()); // DD/MM/YYYY

// Validate email
const isValid = isValidEmail("user@example.com");

// Make API calls
apiClient.setAuthToken("your-jwt-token");
const response = await apiClient.get("/api/users/profile");
```

## Structure

```
shared/
├── constants/
│   ├── api.js          # API endpoints and HTTP constants
│   ├── plans.js        # Subscription plans configuration
│   ├── colors.js       # Brand colors and themes
│   ├── validation.js   # Validation rules and messages
│   └── index.js        # Constants exports
├── utils/
│   ├── validation.js   # Validation utility functions
│   ├── date.js         # Date formatting and manipulation
│   ├── format.js       # Text and number formatting
│   ├── api.js          # API client utilities
│   └── index.js        # Utilities exports
├── index.js            # Main entry point
├── package.json        # Package configuration
└── README.md           # This file
```

## Constants

### API Endpoints

- Authentication endpoints (login, register, OTP verification)
- User management endpoints
- Appointment booking endpoints
- Payment processing endpoints
- Session management endpoints
- Analytics endpoints

### Subscription Plans

- 6 Sessions Plan (₹15,000)
- 8 Sessions Plan (₹20,000) - Most Popular
- 12 Sessions Plan (₹28,000)

### Brand Colors

- Primary: #346870
- Secondary: #BDCFD1
- Status colors (success, warning, error, info)
- Neutral colors (grays, black, white)

### Validation Rules

- Email format validation
- Phone number validation (Indian format)
- Password strength requirements
- File upload restrictions
- Date and time validation

## Utilities

### Validation Functions

- `isValidEmail(email)` - Validate email format
- `isValidPhone(phone)` - Validate Indian phone numbers
- `validatePassword(password)` - Check password strength
- `validateFile(file)` - Validate file uploads
- `validateAppointmentDate(date)` - Validate appointment dates

### Date Functions

- `formatDate(date)` - Format date for display (DD/MM/YYYY)
- `formatDateTime(date)` - Format date and time
- `formatTime(time)` - Format time with AM/PM
- `getAvailableDates()` - Get available appointment dates
- `isWorkingDay(date)` - Check if date is a working day

### Formatting Functions

- `formatCurrency(amount)` - Format Indian currency
- `formatPhoneNumber(phone)` - Format phone numbers
- `capitalizeWords(text)` - Capitalize text
- `truncateText(text, length)` - Truncate long text
- `getInitials(name)` - Generate initials from name

### API Client

- `apiClient` - Singleton API client instance
- `ApiError` - Custom error class for API errors
- Support for GET, POST, PUT, PATCH, DELETE requests
- File upload support
- Automatic token management

## Development

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## License

MIT License - Teerthanker Dental Care
