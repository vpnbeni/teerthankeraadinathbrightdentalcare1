import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Environment configuration with validation
 * Ensures all required environment variables are present
 */

const requiredEnvVars = [
  // Note: MONGODB_URI is validated dynamically based on environment
  // Staging uses STAGE_MONGODB_URI, production uses MONGODB_URI
  // This is handled by getMongoDbUri() function
  "JWT_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const securityEnvVars = [
  "ENCRYPTION_KEY", // Required for HIPAA compliance
];

const optionalEnvVars = [
  "PORT",
  "NODE_ENV",
  "JWT_EXPIRE",
  "JWT_COOKIE_EXPIRE",
  "CLIENT_URL",
  "ADMIN_URL",
  "EMAIL_FROM",
  "GMAIL_USER",
  "GMAIL_PASS",
  "EMAIL_USER",
  "EMAIL_PASS",
];

/**
 * Validate required environment variables
 */
const validateEnvironment = () => {
  let allRequired = [...requiredEnvVars];
  if (process.env.SMS_PROVIDER === "twilio") {
    allRequired.push(
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_PHONE_NUMBER"
    );
  } else {
    allRequired.push("MSG91_AUTH_KEY");
  }

  const missing = allRequired.filter((envVar) => !process.env[envVar]);
  const missingSecurity = securityEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  // Validate MongoDB URI based on environment
  // For staging: STAGE_MONGODB_URI is required
  // For production: MONGODB_URI is required
  const isStage = process.env.DEPLOY_ENV === "stage" || process.env.VERCEL_URL?.includes("stage");
  const hasMongoUri = isStage
    ? !!process.env.STAGE_MONGODB_URI
    : !!process.env.MONGODB_URI;

  if (!hasMongoUri) {
    const requiredVar = isStage ? "STAGE_MONGODB_URI" : "MONGODB_URI";
    missing.push(requiredVar);
  }

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((envVar) => console.error(`   - ${envVar}`));

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn("⚠️ Running in development mode with missing variables");
    }
  }

  if (missingSecurity.length > 0) {
    console.warn("⚠️ Missing security environment variables:");
    missingSecurity.forEach((envVar) => console.warn(`   - ${envVar}`));

    if (process.env.NODE_ENV === "production") {
      console.error("❌ Security variables are required in production");
      process.exit(1);
    } else {
      console.warn("⚠️ Security features may not work properly");
    }
  }

  console.log("✅ Environment variables validated");
};

/**
 * Determine if running in staging environment
 * Checks DEPLOY_ENV or falls back to domain pattern detection
 */
const isStageEnvironment = () => {
  // Debug logging
  console.log("🔍 Environment Detection Debug:");
  console.log(`   DEPLOY_ENV = "${process.env.DEPLOY_ENV}"`);
  console.log(`   VERCEL_URL = "${process.env.VERCEL_URL}"`);
  console.log(`   STAGE_MONGODB_URI exists = ${!!process.env.STAGE_MONGODB_URI}`);

  // Explicit deployment environment flag
  if (process.env.DEPLOY_ENV === "stage") {
    console.log("   ✅ Detected as STAGING (via DEPLOY_ENV)");
    return true;
  }

  // Check if running on stage subdomain (Vercel)
  if (process.env.VERCEL_URL?.includes("stage")) {
    console.log("   ✅ Detected as STAGING (via VERCEL_URL)");
    return true;
  }

  console.log("   ⚠️ Detected as PRODUCTION");
  return false;
};

/**
 * Get the appropriate MongoDB URI based on environment
 * Uses STAGE_MONGODB_URI for staging, MONGODB_URI for production
 */
const getMongoDbUri = () => {
  const isStage = isStageEnvironment();
  const hasStageUri = !!process.env.STAGE_MONGODB_URI;

  console.log(`\n� Database Selection:`);
  console.log(`   Is Stage Environment: ${isStage}`);
  console.log(`   Has STAGE_MONGODB_URI: ${hasStageUri}`);

  if (isStage && hasStageUri) {
    const stageUri = process.env.STAGE_MONGODB_URI;
    console.log(`   📍 Using STAGING MongoDB database`);
    console.log(`   DB: ${stageUri?.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`);
    return stageUri;
  }

  const prodUri = process.env.MONGODB_URI;
  console.log(`   📍 Using PRODUCTION MongoDB database`);
  console.log(`   DB: ${prodUri?.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`);
  return prodUri;
};

/**
 * Environment configuration object
 */
const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || "development",
  DEPLOY_ENV: process.env.DEPLOY_ENV || "production",
  IS_STAGE: isStageEnvironment(),
  PORT: parseInt(process.env.PORT) || 5001,

  // Database Configuration
  MONGODB_URI: getMongoDbUri(),

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  JWT_COOKIE_EXPIRE: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,

  // External Services
  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID,
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  },

  MSG91: {
    AUTH_KEY: process.env.MSG91_AUTH_KEY,
    TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID, // Legacy fallback
    SIGNUP_TEMPLATE_ID: process.env.MSG91_SIGNUP_TEMPLATE_ID || "68d8d20108c74d5c0f4167b2",
    LOGIN_TEMPLATE_ID: process.env.MSG91_LOGIN_TEMPLATE_ID || "68d8d1d89d4ce1639a6d1173",
    // Booking templates - created notifications
    BOOKING_TO_CLIENT_TEMPLATE_ID: process.env.MSG91_BOOKING_CREATED_TO_CLIENT || "68e539860c47ee1cf7449778",
    BOOKING_TO_ADMIN_TEMPLATE_ID: process.env.MSG91_BOOKING_CREATED_TO_ADMIN || "1007910660285725173",
    // Booking confirmed template
    BOOKING_CONFIRMED_TO_CLIENT_TEMPLATE_ID: process.env.MSG91_BOOKING_CONFIRMED_TO_CLIENT || "1007385565585392496",
    FOLLOWUP_TEMPLATE_ID: process.env.MSG91_FOLLOWUP_TEMPLATE_ID,
    SENDER_ID: process.env.MSG91_SENDER_ID || "TABDCL",
  },

  TWILIO: {
    ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  },

  SMS_PROVIDER: process.env.SMS_PROVIDER || "msg91",

  // Admin Configuration
  ADMIN_PHONE: process.env.ADMIN_PHONE,
  ADMIN_PHONE_TWO: process.env.ADMIN_PHONE_TWO,

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },

  // Email Configuration
  EMAIL: {
    FROM: process.env.EMAIL_FROM || "noreply@teerthankerdentalcare.com",
    FROM_NAME: process.env.EMAIL_FROM_NAME || "Teerthanker Dental Care",
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_PASS: process.env.GMAIL_PASS,
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS,
  },

  // CORS Origins
  CORS_ORIGINS: {
    development: [
      process.env.CLIENT_URL || "http://localhost:3000",
      process.env.ADMIN_URL || "http://localhost:3001",
      "http://localhost:5173", // Vite default port
      "http://127.0.0.1:5173",
    ],
    production: [
      process.env.CLIENT_URL ||
      "https://teerthankeraadinathbrightdentalcare-ten.vercel.app",
      process.env.ADMIN_URL ||
      "https://teerthankeraadinathbrightdentalcare-ten.vercel.app",
      process.env.PROD_CLIENT_URL || "https://client.teerthankerdentalcare.com",
      process.env.PROD_ADMIN_URL || "https://admin.teerthankerdentalcare.com",
      "https://teerthankeraadinathbrightdentalcare.vercel.app",
    ],
  },

  // Security Configuration
  SECURITY: {
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX: process.env.NODE_ENV === "production" ? 100 : 1000,
    BCRYPT_ROUNDS: 12,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_SESSIONS_PER_USER: 3,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    AUDIT_RETENTION_DAYS: 2555, // 7 years for HIPAA compliance
    BACKUP_RETENTION_DAYS: 90,
  },

  // Appointment Auto-Cancellation Configuration
  AUTO_CANCEL: {
    ENABLED: process.env.AUTO_CANCEL_ENABLED !== "false", // Default enabled
    CHECK_INTERVAL: process.env.AUTO_CANCEL_CHECK_INTERVAL || "*/15 * * * *", // Every 15 minutes
    GRACE_PERIOD_MINUTES:
      parseInt(process.env.AUTO_CANCEL_GRACE_PERIOD_MINUTES) || 0, // No grace period by default
    NOTIFY_PATIENTS: process.env.AUTO_CANCEL_NOTIFY_PATIENTS !== "false", // Default enabled
    RESTORE_SESSIONS: process.env.AUTO_CANCEL_RESTORE_SESSIONS !== "false", // Default enabled
  },

  // Appointment Expiry Configuration  
  APPOINTMENT_EXPIRY: {
    ENABLED: process.env.APPOINTMENT_EXPIRY_ENABLED !== "false", // Default enabled
    CHECK_INTERVAL: process.env.APPOINTMENT_EXPIRY_CHECK_INTERVAL || "*/10 * * * *", // Every 10 minutes
    GRACE_PERIOD_MINUTES:
      parseInt(process.env.APPOINTMENT_EXPIRY_GRACE_PERIOD_MINUTES) || 15, // 15 minute grace period by default
    NOTIFY_PATIENTS: process.env.APPOINTMENT_EXPIRY_NOTIFY_PATIENTS !== "false", // Default enabled
  },
};

export const emailConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  from: process.env.EMAIL_FROM || "noreply@teerthankerdentalcare.com",
};

/**
 * Get environment-specific configuration
 */
const getConfig = () => {
  validateEnvironment();
  return config;
};

/**
 * Check if running in production
 */
const isProduction = () => config.NODE_ENV === "production";

/**
 * Check if running in development
 */
const isDevelopment = () => config.NODE_ENV === "development";

/**
 * Get CORS origins for current environment
 */
const getCorsOrigins = () => {
  return isProduction()
    ? config.CORS_ORIGINS.production
    : config.CORS_ORIGINS.development;
};

export {
  config,
  getConfig,
  isProduction,
  isDevelopment,
  isStageEnvironment,
  getCorsOrigins,
  validateEnvironment,
};
