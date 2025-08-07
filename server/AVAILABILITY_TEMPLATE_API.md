# Availability Template Management API

This document describes the new API endpoints for managing availability templates in the simplified availability system.

## Overview

The availability template system allows admins to manage default time slots that apply to all working days, with exceptions for holidays and custom dates. This replaces the complex per-date availability management with a more efficient template-based approach.

## Endpoints

### GET /api/admin/availability/template

Retrieves the current availability template.

**Response:**

```json
{
  "success": true,
  "message": "Availability template retrieved successfully",
  "data": {
    "template": {
      "_id": "availability_template",
      "defaultSlots": [
        {
          "_id": "slot_id",
          "startTime": "08:00",
          "endTime": "09:00",
          "isActive": true,
          "maxBookings": 1
        }
      ],
      "workingDays": [1, 2, 3, 4, 5, 6],
      "slotDuration": 60,
      "version": 1,
      "updatedBy": "admin_user_id",
      "updatedAt": "2025-08-06T22:00:00.000Z",
      "createdAt": "2025-08-06T22:00:00.000Z"
    }
  },
  "timestamp": "2025-08-06T22:00:00.000Z"
}
```

### PUT /api/admin/availability/template

Updates the availability template.

**Request Body:**

```json
{
  "defaultSlots": [
    {
      "startTime": "09:00",
      "endTime": "10:00",
      "isActive": true,
      "maxBookings": 1
    }
  ],
  "workingDays": [1, 2, 3, 4, 5],
  "slotDuration": 30
}
```

**Response:**

```json
{
  "success": true,
  "message": "Availability template updated successfully",
  "data": {
    "template": {
      "_id": "availability_template",
      "defaultSlots": [...],
      "workingDays": [1, 2, 3, 4, 5],
      "slotDuration": 30,
      "version": 2,
      "updatedBy": "admin_user_id",
      "updatedAt": "2025-08-06T22:00:00.000Z"
    }
  },
  "timestamp": "2025-08-06T22:00:00.000Z"
}
```

### POST /api/admin/availability/template/slots

Adds a custom slot to the template.

**Request Body:**

```json
{
  "startTime": "19:00",
  "endTime": "20:00",
  "isActive": true,
  "maxBookings": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Custom slot added to template successfully",
  "data": {
    "slot": {
      "_id": "new_slot_id",
      "startTime": "19:00",
      "endTime": "20:00",
      "isActive": true,
      "maxBookings": 1
    },
    "template": {
      "_id": "availability_template",
      "version": 3,
      "updatedAt": "2025-08-06T22:00:00.000Z"
    }
  },
  "timestamp": "2025-08-06T22:00:00.000Z"
}
```

### DELETE /api/admin/availability/template/slots/:slotId

Removes a slot from the template.

**Response:**

```json
{
  "success": true,
  "message": "Slot removed from template successfully",
  "data": {
    "template": {
      "_id": "availability_template",
      "defaultSlots": [...],
      "version": 4,
      "updatedAt": "2025-08-06T22:00:00.000Z"
    }
  },
  "timestamp": "2025-08-06T22:00:00.000Z"
}
```

### PATCH /api/admin/availability/template/slots/:slotId/toggle

Toggles a slot's active status.

**Response:**

```json
{
  "success": true,
  "message": "Slot activated successfully",
  "data": {
    "slot": {
      "_id": "slot_id",
      "startTime": "08:00",
      "endTime": "09:00",
      "isActive": true,
      "maxBookings": 1
    },
    "template": {
      "_id": "availability_template",
      "version": 5,
      "updatedAt": "2025-08-06T22:00:00.000Z"
    }
  },
  "timestamp": "2025-08-06T22:00:00.000Z"
}
```

### POST /api/admin/availability/template/reset

Resets the template to default 8 AM to 6 PM hourly slots.

**Response:**

```json
{
  "success": true,
  "message": "Template reset to default 8 AM to 6 PM hourly slots successfully",
  "data": {
    "template": {
      "_id": "availability_template",
      "defaultSlots": [
        // 10 hourly slots from 8 AM to 6 PM
      ],
      "workingDays": [1, 2, 3, 4, 5, 6],
      "slotDuration": 60,
      "version": 6,
      "updatedBy": "admin_user_id",
      "updatedAt": "2025-08-06T22:00:00.000Z"
    }
  },
  "timestamp": "2025-08-06T22:00:00.000Z"
}
```

### GET /api/admin/availability/template/active-slots

Retrieves only the active slots from the template.

**Response:**

```json
{
  "success": true,
  "message": "Active template slots retrieved successfully",
  "data": {
    "activeSlots": [
      {
        "_id": "slot_id",
        "startTime": "08:00",
        "endTime": "09:00",
        "maxBookings": 1
      }
    ],
    "count": 9
  },
  "timestamp": "2025-08-06T22:00:00.000Z"
}
```

## Authentication & Authorization

All endpoints require:

- Valid admin authentication token
- Admin role permissions

## Validation

### Time Format

- All time fields must be in HH:MM format (24-hour)
- End time must be after start time
- Minimum slot duration: 15 minutes
- Maximum slot duration: 4 hours

### Working Days

- Array of integers from 0 (Sunday) to 6 (Saturday)
- Must contain at least 1 day
- Cannot contain duplicates

### Slot Duration

- Integer between 15 and 240 minutes

### Max Bookings

- Integer between 1 and 10

## Error Handling

All endpoints return appropriate HTTP status codes:

- 200: Success
- 201: Created (for POST requests)
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 500: Internal server error

Error responses include detailed error messages and validation details.

## Audit Logging

All template modifications are automatically logged with:

- Admin user ID
- Action performed
- Old and new values
- Timestamp
- IP address and user agent

## Features

### Default Template Creation

- Automatically creates default 8 AM to 6 PM hourly slots
- Monday to Saturday working days
- 60-minute slot duration

### Slot Management

- Add custom time slots
- Remove existing slots
- Toggle slot active/inactive status
- Prevent overlapping slots

### Template Versioning

- Version number increments with each change
- Optimistic locking support

### Business Rules

- At least one active slot must exist
- Slots cannot overlap
- Working days validation
- Time format validation
