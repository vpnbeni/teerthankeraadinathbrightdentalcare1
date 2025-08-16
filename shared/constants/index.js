// Main constants export file
export * from "./api.js";
export * from "./plans.js";
export * from "./colors.js";
export * from "./validation.js";

// Application Constants
export const APP_CONFIG = {
  NAME: "Teerthanker Dental Care",
  VERSION: "1.0.0",
  DESCRIPTION: "Comprehensive dental care management system",
  SUPPORT_EMAIL: "support@teerthankerdentalcare.com",
  SUPPORT_PHONE: "+91-9876543210",
  ADDRESS: "Teerthanker Dental Care Clinic, Delhi, India",
};

// User Roles
export const USER_ROLES = {
  PATIENT: "patient",
  ADMIN: "admin",
  DOCTOR: "doctor",
};


// Appointment Status
export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
  RESCHEDULED: "rescheduled",
  EXPIRED: "expired",
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
};

// Session Status
export const SESSION_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

// Time Slots
export const TIME_SLOTS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
];

// Days of Week
export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

// Working Days (Monday to Saturday)
export const WORKING_DAYS = [1, 2, 3, 4, 5, 6];

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "DD/MM/YYYY",
  API: "YYYY-MM-DD",
  DATETIME: "DD/MM/YYYY HH:mm",
  TIME: "HH:mm",
};
