# Availability Frontend Processing - CursorRules

## Overview
This document defines the rules for implementing availability-related functionality in the dental care booking system. The core principle is to move computation-heavy template application logic from backend to frontend for better performance and reduced server load.

## Core Principles

### 1. Backend Responsibility
- **Data Provision**: Backend provides raw template data, holiday information, and booked slots
- **No Slot Generation**: Backend should NOT generate time slots or apply templates to dates
- **Minimal Processing**: Backend focuses on data retrieval and validation only

### 2. Frontend Responsibility
- **Template Application**: Frontend applies templates to dates and generates time slots
- **Slot Generation**: All time slot generation logic runs on the client
- **Availability Calculation**: Frontend calculates availability status for dates and slots

## Backend Rules

### API Endpoints Structure
```javascript
// ✅ CORRECT: Return template data for frontend processing
GET /availability/availability/template/date/:date
Response: {
  available: boolean,
  template: { workingHours, slotDuration, breakTimes, ... },
  bookedSlots: string[],
  holiday: object | null
}

// ✅ CORRECT: Return all data for date range
GET /availability/availability/data/range
Response: {
  templates: Template[],
  holidays: Holiday[],
  bookedSlots: { [date]: string[] }
}

// ❌ WRONG: Don't generate slots on backend
GET /availability/availability/date/:date
Response: {
  slots: TimeSlot[], // This should be generated on frontend
  ...
}
```

### Service Methods
```javascript
// ✅ CORRECT: Return template data only
async getAvailabilityTemplateForDate(date) {
  // 1. Check if past date
  // 2. Check if holiday
  // 3. Get applicable template
  // 4. Get booked slots
  // 5. Return template + booked slots (NO slot generation)
}

// ✅ CORRECT: Return all data for range
async getAvailabilityDataForRange(startDate, endDate) {
  // 1. Get all templates
  // 2. Get all holidays in range
  // 3. Get all booked appointments in range
  // 4. Return raw data for frontend processing
}

// ❌ WRONG: Don't generate slots in service
async getAvailabilityForDate(date) {
  // Don't call template.generateTimeSlots()
  // Don't process slots on backend
}
```

### Database Queries
```javascript
// ✅ CORRECT: Efficient data retrieval
const templates = await AvailabilityTemplate.find({ isActive: true })
  .select('_id templateName workingHours slotDuration breakTimes applicableDates')
  .lean();

const holidays = await Holiday.find({
  date: { $gte: start, $lte: end }
}).lean();

const bookedAppointments = await Appointment.find({
  date: { $gte: start, $lt: end },
  status: { $nin: ["cancelled"] }
}).select("date timeSlot").lean();

// ❌ WRONG: Don't process data on backend
const allSlots = template.generateTimeSlots(); // Move to frontend
```

## Frontend Rules

### Utility Functions
```javascript
// ✅ CORRECT: Frontend slot generation
export const generateTimeSlots = (template) => {
  // Move all slot generation logic here
  // Handle working hours, breaks, slot duration
  // Return array of time slot objects
};

// ✅ CORRECT: Frontend template application
export const getTemplateForDate = (date, templates) => {
  // Find applicable template for date
  // Handle custom vs default templates
  // Return template object
};

// ✅ CORRECT: Frontend availability calculation
export const generateAvailabilityForDate = (date, templates, holidays, bookedSlots) => {
  // 1. Check if past date
  // 2. Check if holiday
  // 3. Get template for date
  // 4. Generate slots using template
  // 5. Mark slots as available/booked
  // 6. Return complete availability data
};
```

### Service Integration
```javascript
// ✅ CORRECT: Use frontend processing
const availabilityService = {
  // Get raw data from backend
  getAvailabilityDataForRange: async (startDate, endDate) => {
    const response = await api.get("/availability/availability/data/range", { params });
    return response;
  },

  // Process data on frontend
  generateAvailabilityForDateRange: async (startDate, endDate, options) => {
    // 1. Get raw data from backend
    const response = await availabilityService.getAvailabilityDataForRange(startDate, endDate);
    const { templates, holidays, bookedSlots } = response.data.data;

    // 2. Process on frontend
    const availability = generateAvailabilityForDateRange(
      startDate, endDate, templates, holidays, bookedSlots, options
    );

    return { data: { success: true, data: availability } };
  }
};
```

### Component Usage
```javascript
// ✅ CORRECT: Use frontend processing in components
const DateSelectionStep = () => {
  const fetchMonthAvailability = async () => {
    // Use frontend processing for better performance
    const response = await availabilityService.generateAvailabilityForDateRange(
      startDate, endDate
    );
    setAvailabilityData(response.data.data);
  };
};

// ❌ WRONG: Don't use legacy backend processing
const fetchMonthAvailability = async () => {
  // Don't use this for new implementations
  const response = await availabilityService.getAvailabilityForDateRange(startDate, endDate);
};
```

## Performance Guidelines

### Backend Optimization
1. **Batch Queries**: Use single queries to get all data for a date range
2. **Lean Queries**: Use `.lean()` for read-only operations
3. **Selective Fields**: Only select required fields from database
4. **Caching**: Implement appropriate cache headers for template data

### Frontend Optimization
1. **Memoization**: Cache processed availability data
2. **Lazy Loading**: Generate slots only when needed
3. **Debouncing**: Debounce availability requests
4. **Local Storage**: Cache template data locally

## Migration Rules

### Legacy Code Handling
```javascript
// ✅ CORRECT: Maintain backward compatibility
const availabilityService = {
  // Legacy methods for backward compatibility
  getAvailabilityForDate: async (date) => {
    // Keep for existing code
  },

  // New frontend processing methods
  generateAvailabilityForDate: async (date, options) => {
    // Use for new implementations
  }
};
```

### Gradual Migration
1. **New Features**: Always use frontend processing
2. **Existing Features**: Migrate gradually, maintain compatibility
3. **Performance Critical**: Prioritize migration of frequently used components

## Testing Rules

### Backend Testing
```javascript
// ✅ CORRECT: Test data provision
describe('Availability Service', () => {
  it('should return template data without slot generation', async () => {
    const result = await availabilityService.getAvailabilityTemplateForDate(date);
    expect(result.template).toBeDefined();
    expect(result.slots).toBeUndefined(); // No slots on backend
  });
});
```

### Frontend Testing
```javascript
// ✅ CORRECT: Test slot generation
describe('Availability Utils', () => {
  it('should generate time slots from template', () => {
    const slots = generateTimeSlots(template);
    expect(slots).toHaveLength(expectedSlotCount);
    expect(slots[0]).toHaveProperty('timeSlot');
  });
});
```

## Error Handling

### Backend Errors
```javascript
// ✅ CORRECT: Handle data retrieval errors
try {
  const templates = await AvailabilityTemplate.find({ isActive: true });
  return { success: true, data: { templates, holidays, bookedSlots } };
} catch (error) {
  console.error('Error fetching availability data:', error);
  throw new Error('Failed to fetch availability data');
}
```

### Frontend Errors
```javascript
// ✅ CORRECT: Handle processing errors gracefully
try {
  const availability = generateAvailabilityForDate(date, templates, holidays, bookedSlots);
  return availability;
} catch (error) {
  console.error('Error generating availability:', error);
  return {
    available: false,
    reason: 'Error processing availability',
    type: 'error',
    slots: []
  };
}
```

## Documentation Requirements

### Code Comments
```javascript
/**
 * Generate time slots from a template (FRONTEND PROCESSING)
 * This function handles the computation-heavy slot generation logic
 * that was previously done on the backend.
 * 
 * @param {Object} template - Template object with workingHours, slotDuration, breakTimes
 * @returns {Array} Array of time slot objects
 */
export const generateTimeSlots = (template) => {
  // Implementation
};
```

### API Documentation
```javascript
/**
 * Get availability template data for a specific date (BACKEND DATA PROVISION)
 * Returns template data and booked slots for frontend processing.
 * Does NOT generate time slots - that's handled on the frontend.
 * 
 * @param {Date} date - The date to get template data for
 * @returns {Object} Template data and booked slots
 */
export const getAvailabilityTemplateForDate = async (date) => {
  // Implementation
};
```

## Enforcement Checklist

When implementing availability-related functionality, ensure:

- [ ] Backend only provides raw data (templates, holidays, booked slots)
- [ ] No slot generation happens on backend
- [ ] Frontend handles all template application logic
- [ ] Frontend generates time slots using utility functions
- [ ] Components use frontend processing methods
- [ ] Legacy compatibility is maintained where needed
- [ ] Performance optimizations are implemented
- [ ] Error handling is in place for both backend and frontend
- [ ] Code is properly documented
- [ ] Tests cover both data provision and processing logic

## Benefits of This Approach

1. **Reduced Backend Load**: Server processes less data per request
2. **Better Performance**: Frontend can cache and process data efficiently
3. **Improved Scalability**: Backend can handle more concurrent users
4. **Enhanced UX**: Faster response times for availability queries
5. **Flexible Processing**: Frontend can implement custom filtering and sorting
6. **Reduced Network Traffic**: Only essential data is transferred
7. **Better Caching**: Template data can be cached longer than generated slots
