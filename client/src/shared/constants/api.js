// API Base URLs
export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://teerthankeraadinathbrightdentalcare.vercel.app"
    : "http://localhost:5000";

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    VERIFY_OTP: "/api/auth/verify-otp",
    RESEND_OTP: "/api/auth/resend-otp",
    REFRESH_TOKEN: "/api/auth/refresh",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
  },

  // Users
  USERS: {
    PROFILE: "/api/users/profile",
    UPDATE_PROFILE: "/api/users/profile",
    UPLOAD_DOCUMENT: "/api/users/documents",
    GET_DOCUMENTS: "/api/users/documents",
    DELETE_DOCUMENT: "/api/users/documents",
    LIST: "/api/users", // Admin only
    GET_BY_ID: "/api/users", // Admin only
    UPDATE_USER: "/api/users", // Admin only
  },

  // Appointments
  APPOINTMENTS: {
    CREATE: "/api/appointments",
    LIST: "/api/appointments",
    GET_BY_ID: "/api/appointments",
    UPDATE: "/api/appointments",
    DELETE: "/api/appointments",
    RESCHEDULE: "/api/appointments/reschedule",
    AVAILABLE_SLOTS: "/api/appointments/available-slots",
    ADMIN_LIST: "/api/appointments/admin", // Admin only
  },

  // Payments
  PAYMENTS: {
    CREATE_ORDER: "/api/payments/create-order",
    VERIFY_PAYMENT: "/api/payments/verify",
    HISTORY: "/api/payments/history",
    REFUND: "/api/payments/refund", // Admin only
    ANALYTICS: "/api/payments/analytics", // Admin only
  },

  // Sessions
  SESSIONS: {
    CREATE: "/api/sessions",
    LIST: "/api/sessions",
    GET_BY_ID: "/api/sessions",
    UPDATE: "/api/sessions",
    COMPLETE: "/api/sessions/complete",
    ANALYTICS: "/api/sessions/analytics", // Admin only
  },

  // Plans
  PLANS: {
    LIST: "/api/plans",
    GET_BY_ID: "/api/plans",
    CREATE: "/api/plans", // Admin only
    UPDATE: "/api/plans", // Admin only
    DELETE: "/api/plans", // Admin only
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: "/api/analytics/dashboard",
    PAYMENTS: "/api/analytics/payments",
    SESSIONS: "/api/analytics/sessions",
    BOOKINGS: "/api/analytics/bookings",
    REVENUE: "/api/analytics/revenue",
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// Request Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
};
