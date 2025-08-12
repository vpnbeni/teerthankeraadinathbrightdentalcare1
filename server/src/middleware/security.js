import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import { config } from "../config/environment.js";

/**
 * Security Middleware
 * Implements various security measures for the API
 */

/**
 * Rate limiting configuration
 */
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: config.SECURITY.RATE_LIMIT_WINDOW,
    max: config.SECURITY.RATE_LIMIT_MAX,
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: "Too many attempts, please try again after 15 minutes.",
  },
});

/**
 * OTP rate limiter
 */
export const otpRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute
  message: {
    success: false,
    message: "Too many OTP requests, please wait before requesting again.",
  },
});

/**
 * Login rate limiter
 */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes.",
  },
});

/**
 * Security headers middleware
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * NoSQL injection prevention
 */
export const preventNoSQLInjection = mongoSanitize({
  replaceWith: "_",
});

/**
 * XSS protection
 */
export const xssProtection = xss();

/**
 * HTTP Parameter Pollution protection
 */
export const hppProtection = hpp({
  whitelist: ["sort", "fields", "page", "limit"],
});

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (req, res, next) => {
  // Remove any null bytes
  const sanitizeString = (str) => {
    if (typeof str === "string") {
      return str.replace(/\0/g, "");
    }
    return str;
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === "string") {
            obj[key] = sanitizeString(obj[key]);
          } else if (typeof obj[key] === "object") {
            sanitizeObject(obj[key]);
          }
        }
      }
    }
  };

  // Sanitize request body
  if (req.body) {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.get("Content-Length"));

  if (contentLength && contentLength > config.SECURITY.MAX_FILE_SIZE) {
    return res.status(413).json({
      success: false,
      message: "Request entity too large",
    });
  }

  next();
};

/**
 * IP whitelist middleware (for admin endpoints)
 */
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: "Access denied from this IP address",
      });
    }

    next();
  };
};

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins =
      config.NODE_ENV === "production"
        ? config.CORS_ORIGINS.production
        : config.CORS_ORIGINS.development;

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "Pragma",
  ],
  exposedHeaders: ["X-Total-Count"],
  maxAge: 86400, // 24 hours
};

/**
 * Security audit logging
 */
export const securityLogger = (req, res, next) => {
  const securityEvents = [
    "login",
    "logout",
    "register",
    "password-change",
    "password-reset",
  ];

  const endpoint = req.path.split("/").pop();

  if (securityEvents.includes(endpoint)) {
    console.log(`🔒 Security Event: ${endpoint}`, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
      userId: req.user?._id,
    });
  }

  next();
};

/**
 * Comprehensive security middleware stack
 */
export const applySecurity = (app) => {
  // Basic security headers
  app.use(securityHeaders);

  // Request sanitization
  app.use(sanitizeRequest);
  app.use(preventNoSQLInjection);
  app.use(xssProtection);
  app.use(hppProtection);

  // Request size limiting
  app.use(requestSizeLimiter);

  // Security logging
  app.use(securityLogger);

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set("trust proxy", 1);
};

export default {
  createRateLimiter,
  strictRateLimiter,
  otpRateLimiter,
  loginRateLimiter,
  securityHeaders,
  preventNoSQLInjection,
  xssProtection,
  hppProtection,
  sanitizeRequest,
  requestSizeLimiter,
  ipWhitelist,
  corsOptions,
  securityLogger,
  applySecurity,
};
