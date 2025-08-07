import rateLimit from "express-rate-limit";

/**
 * Rate Limiting Middleware
 * Provides different rate limiting configurations for various endpoints
 */

// Standard rate limiter for general API endpoints
export const rateLimitStandard = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for sensitive operations (admin debug endpoints)
export const rateLimitStrict = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message:
      "Too many requests for this sensitive operation, please try again later.",
    code: "STRICT_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: (req) => {
    return (
      process.env.NODE_ENV === "development" &&
      (req.ip === "127.0.0.1" || req.ip === "::1")
    );
  },
});

// Payment-specific rate limiter
export const rateLimitPayment = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 payment requests per 5 minutes
  message: {
    success: false,
    message: "Too many payment requests, please wait before trying again.",
    code: "PAYMENT_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  rateLimitStandard,
  rateLimitStrict,
  rateLimitPayment,
};
