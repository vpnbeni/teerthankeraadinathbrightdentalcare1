# Admin User Management API Endpoints

This document describes the comprehensive user management API endpoints implemented for the admin panel.

## Overview

The following endpoints have been implemented to provide comprehensive user management capabilities for administrators:

1. `GET /api/admin/users/:id/details` - Get comprehensive user details
2. `PUT /api/admin/users/:id/personal` - Update user personal information
3. `PUT /api/admin/users/:id/medical` - Update user medical information
4. `GET /api/admin/users/:id/payments` - Get user payment history
5. `GET /api/admin/users/:id/bookings` - Get user appointment/booking history

## Authentication & Authorization

All endpoints require:

- Valid JWT token in Authorization header: `Bearer <token>`
- Admin role (`role: "admin"`)

## Audit Logging

All endpoints include comprehensive audit logging that tracks:

- Admin user performing the action
- Timestamp of the action
- IP address and user agent
- Changes made (for update operations)
- HIPAA compliance categorization

## Endpoints

### 1. Get User Details

**Endpoint:** `GET /api/admin/users/:id/details`

**Description:** Retrieves comprehensive user information including statistics and recent activity.

**Parameters:**

- `id` (path parameter): User ID

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com",
      "address": "123 Main St",
      "gender": "male",
      "alternativePhone": "9876543211",
      "medicalInfo": {
        "systemicDiseases": ["Diabetes"],
        "drugAllergies": ["Penicillin"],
        "isPregnant": false,
        "pastTreatments": ["Root Canal"],
        "previousExperiences": ["Good experience"]
      },
      "subscription": {
        "planId": {
          "_id": "plan_id",
          "name": "Premium Plan",
          "sessions": 6,
          "price": 1000,
          "duration": 12
        },
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-12-31T23:59:59.999Z",
        "sessionsRemaining": 4,
        "status": "active"
      }
    },
    "statistics": {
      "totalAppointments": 10,
      "totalSessions": 6,
      "totalPayments": 2,
      "totalSpent": 2000
    },
    "recentActivity": {
      "appointments": [
        {
          "_id": "appointment_id",
          "date": "2024-02-01T00:00:00.000Z",
          "timeSlot": "09:00-10:00",
          "status": "completed",
          "sessionNumber": 1
        }
      ],
      "payments": [
        {
          "_id": "payment_id",
          "amount": 1000,
          "transactionDate": "2024-01-15T00:00:00.000Z",
          "paymentMethod": "card",
          "planId": {
            "name": "Premium Plan",
            "sessions": 6,
            "price": 1000
          }
        }
      ]
    }
  }
}
```

### 2. Update Personal Information

**Endpoint:** `PUT /api/admin/users/:id/personal`

**Description:** Updates user's personal information with validation.

**Parameters:**

- `id` (path parameter): User ID

**Request Body:**

```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "email": "john.updated@example.com",
  "address": "456 Updated Street",
  "gender": "male",
  "alternativePhone": "9876543212"
}
```

**Validation Rules:**

- `name`: Required, 2-100 characters, letters and spaces only
- `phone`: Required, valid Indian phone number (10 digits starting with 6-9)
- `email`: Optional, valid email format
- `address`: Optional, max 500 characters
- `gender`: Optional, must be "male", "female", or "other"
- `alternativePhone`: Optional, valid Indian phone number

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      // Updated user object
    }
  },
  "message": "Personal information updated successfully"
}
```

### 3. Update Medical Information

**Endpoint:** `PUT /api/admin/users/:id/medical`

**Description:** Updates user's medical information.

**Parameters:**

- `id` (path parameter): User ID

**Request Body:**

```json
{
  "systemicDiseases": ["Hypertension", "Diabetes"],
  "drugAllergies": ["Aspirin", "Penicillin"],
  "isPregnant": false,
  "pastTreatments": ["Cleaning", "Root Canal"],
  "previousExperiences": ["Excellent service", "Professional staff"]
}
```

**Validation Rules:**

- `systemicDiseases`: Optional array, each item max 200 characters
- `drugAllergies`: Optional array, each item max 200 characters
- `isPregnant`: Optional boolean
- `pastTreatments`: Optional array, each item max 200 characters
- `previousExperiences`: Optional array, each item max 200 characters

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      // Updated user object with medical info
    }
  },
  "message": "Medical information updated successfully"
}
```

### 4. Get Payment History

**Endpoint:** `GET /api/admin/users/:id/payments`

**Description:** Retrieves user's payment history with filtering and pagination.

**Parameters:**

- `id` (path parameter): User ID

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by payment status ("pending", "completed", "failed", "refunded")
- `startDate` (optional): Filter payments from this date (ISO format)
- `endDate` (optional): Filter payments until this date (ISO format)

**Response:**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "_id": "payment_id",
        "amount": 1000,
        "currency": "INR",
        "status": "completed",
        "razorpayOrderId": "order_123",
        "razorpayPaymentId": "pay_123",
        "paymentMethod": "card",
        "transactionDate": "2024-01-15T00:00:00.000Z",
        "planId": {
          "name": "Premium Plan",
          "sessions": 6,
          "price": 1000,
          "duration": 12
        }
      }
    ],
    "statistics": {
      "total": 5,
      "completed": 3,
      "pending": 1,
      "failed": 1,
      "totalAmount": 5000,
      "completedAmount": 3000
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalPayments": 5,
      "hasNext": false,
      "hasPrev": false
    },
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com"
    }
  }
}
```

### 5. Get Booking History

**Endpoint:** `GET /api/admin/users/:id/bookings`

**Description:** Retrieves user's appointment/booking history with filtering and pagination.

**Parameters:**

- `id` (path parameter): User ID

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by appointment status ("scheduled", "confirmed", "completed", "cancelled", "rescheduled")
- `startDate` (optional): Filter appointments from this date (ISO format)
- `endDate` (optional): Filter appointments until this date (ISO format)
- `sortBy` (optional): Sort field (default: "date")
- `sortOrder` (optional): Sort order "asc" or "desc" (default: "desc")

**Response:**

```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "_id": "appointment_id",
        "date": "2024-02-01T00:00:00.000Z",
        "timeSlot": "09:00-10:00",
        "status": "completed",
        "sessionNumber": 1,
        "notes": "Regular checkup",
        "userId": {
          "name": "John Doe",
          "phone": "9876543210",
          "email": "john@example.com"
        },
        "rescheduleHistory": [],
        "cancellationDetails": null
      }
    ],
    "statistics": {
      "total": 10,
      "scheduled": 2,
      "confirmed": 1,
      "completed": 6,
      "cancelled": 1,
      "rescheduled": 0
    },
    "upcomingAppointments": [
      {
        "_id": "upcoming_appointment_id",
        "date": "2024-03-01T00:00:00.000Z",
        "timeSlot": "10:00-11:00",
        "status": "scheduled",
        "sessionNumber": 7
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalAppointments": 10,
      "hasNext": false,
      "hasPrev": false
    },
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com",
      "subscription": {
        "planId": "plan_id",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-12-31T23:59:59.999Z",
        "sessionsRemaining": 4,
        "status": "active"
      }
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes:

- `400`: Bad Request (validation errors, invalid data)
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (user not found)
- `500`: Internal Server Error

### Validation Error Response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone",
      "message": "Please provide a valid Indian phone number",
      "value": "invalid-phone"
    }
  ]
}
```

## Usage Examples

### Get User Details

```bash
curl -X GET \
  http://localhost:5000/api/admin/users/60f7b3b3b3b3b3b3b3b3b3b3/details \
  -H 'Authorization: Bearer your-jwt-token'
```

### Update Personal Information

```bash
curl -X PUT \
  http://localhost:5000/api/admin/users/60f7b3b3b3b3b3b3b3b3b3b3/personal \
  -H 'Authorization: Bearer your-jwt-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "John Updated",
    "phone": "9876543210",
    "email": "john.updated@example.com"
  }'
```

### Get Payment History with Filtering

```bash
curl -X GET \
  'http://localhost:5000/api/admin/users/60f7b3b3b3b3b3b3b3b3b3b3/payments?status=completed&page=1&limit=10' \
  -H 'Authorization: Bearer your-jwt-token'
```

### Get Booking History with Date Range

```bash
curl -X GET \
  'http://localhost:5000/api/admin/users/60f7b3b3b3b3b3b3b3b3b3b3/bookings?startDate=2024-01-01&endDate=2024-12-31&status=completed' \
  -H 'Authorization: Bearer your-jwt-token'
```

## Security Features

1. **Authentication**: JWT token validation
2. **Authorization**: Admin role verification
3. **Audit Logging**: All actions logged for compliance
4. **Input Validation**: Comprehensive validation on all inputs
5. **Data Sanitization**: Protection against injection attacks
6. **HIPAA Compliance**: PHI access logging and protection

## Implementation Notes

- All endpoints include comprehensive error handling
- Audit logging is automatically applied via middleware
- Validation is applied using express-validator
- Database queries are optimized with proper indexing
- Pagination is implemented for large datasets
- All user data access is logged for HIPAA compliance
