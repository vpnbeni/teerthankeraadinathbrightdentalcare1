// Validation Rules and Patterns
export const VALIDATION_RULES = {
  // User Registration
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s]+$/,
    MESSAGE: "Name must be 2-50 characters and contain only letters and spaces",
  },

  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: "Please enter a valid email address",
  },

  PHONE: {
    PATTERN: /^[6-9]\d{9}$/,
    MESSAGE: "Please enter a valid 10-digit Indian mobile number",
  },

  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    MESSAGE:
      "Password must be 8+ characters with uppercase, lowercase, number, and special character",
  },

  OTP: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/,
    MESSAGE: "OTP must be exactly 6 digits",
  },

  // Appointment Booking
  APPOINTMENT_DATE: {
    MIN_ADVANCE_HOURS: 24,
    MAX_ADVANCE_DAYS: 90,
    MESSAGE:
      "Appointments must be booked 24 hours in advance and within 90 days",
  },

  APPOINTMENT_TIME: {
    START_HOUR: 9,
    END_HOUR: 18,
    SLOT_DURATION: 60, // minutes
    MESSAGE: "Appointments available between 9 AM to 6 PM",
  },

  // Payment
  AMOUNT: {
    MIN: 100,
    MAX: 100000,
    MESSAGE: "Amount must be between ₹100 and ₹1,00,000",
  },

  // File Upload
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
    MESSAGE: "File must be JPEG, PNG, or PDF and under 5MB",
  },

  // Session Notes
  SESSION_NOTES: {
    MAX_LENGTH: 1000,
    MESSAGE: "Session notes cannot exceed 1000 characters",
  },
};

// Form Field Requirements
export const REQUIRED_FIELDS = {
  REGISTRATION: ["name", "email", "phone", "password"],
  LOGIN: ["email", "password"],
  APPOINTMENT: ["date", "time", "planId"],
  PAYMENT: ["amount", "planId"],
  PROFILE_UPDATE: ["name", "phone"],
  SESSION_COMPLETION: ["notes", "treatmentProvided"],
};
