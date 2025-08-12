import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Environment configuration with validation
 * Ensures all required environment variables are present
 */

const requiredEnvVars = [
  "MONGODB_URI",
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
 * Environment configuration object
 */
const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT) || 5001,

  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI,

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
    TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID,
  },

  TWILIO: {
    ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  },

  SMS_PROVIDER: process.env.SMS_PROVIDER || "msg91",

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
  getCorsOrigins,
  validateEnvironment,
};
