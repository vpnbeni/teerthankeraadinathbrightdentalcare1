// Vercel serverless function entry point
import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { config } from "../src/config/environment.js";
import { connectDB } from "../src/config/database.js";
import authRoutes from "../src/routes/auth.js";
import paymentRoutes from "../src/routes/payments.js";
import planRoutes from "../src/routes/plans.js";
import userRoutes from "../src/routes/users.js";
import appointmentRoutes from "../src/routes/appointments.js";
import adminRoutes from "../src/routes/admin.js";
import analyticsRoutes from "../src/routes/analytics.js";
import availabilityRoutes from "../src/routes/availability.js";
import autoCancelRoutes from "../src/routes/autoCancelRoutes.js";
import sessionLimitsRoutes from "../src/routes/sessionLimits.js";
import { corsOptions } from "../src/middleware/security.js";

const app = express();

// Initialize database connection
let dbConnected = false;
const initDB = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log("✅ Database connected");
    } catch (error) {
      console.error("❌ Database connection failed:", error);
    }
  }
};

// Middleware
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Teerthanker Dental Care API is running on Vercel!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production"
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Teerthanker Dental Care API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production"
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Test endpoint working!",
    env_check: {
      mongodb_uri: process.env.MONGODB_URI ? "✅ Set" : "❌ Missing",
      jwt_secret: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
      node_env: process.env.NODE_ENV || "development"
    }
  });
});

// Initialize database before handling requests
app.use(async (req, res, next) => {
  await initDB();
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/admin/auto-cancel", autoCancelRoutes);
app.use("/api/session-limits", sessionLimitsRoutes);

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: {
      payments: [
        "POST /api/payments/create-order - Create a new payment order",
        "POST /api/payments/verify-payment - Verify a completed payment",
      ],
      auth: [
        "POST /api/auth/register - Register a new user",
        "POST /api/auth/login - Login with credentials",
        "POST /api/auth/verify-phone - Verify phone number",
        "GET /api/auth/me - Get current user profile",
        "GET /api/auth/profile - Get current user profile",
      ],
      plans: ["GET /api/plans - Get all available plans"],
      appointments: [
        "GET /api/appointments - Get user appointments",
        "GET /api/appointments/available-slots/:date - Get available time slots",
        "GET /api/appointments/:appointmentId - Get appointment details",
        "POST /api/appointments - Create a new appointment",
        "PUT /api/appointments/:appointmentId - Update appointment",
        "DELETE /api/appointments/:appointmentId - Cancel appointment",
        "GET /api/appointments/admin/all - Get all appointments (Admin)",
        "GET /api/appointments/admin/statistics - Get appointment statistics (Admin)",
        "PUT /api/appointments/admin/:appointmentId/reschedule - Reschedule appointment (Admin)",
        "PUT /api/appointments/admin/:appointmentId/complete - Complete appointment (Admin)",
        "POST /api/appointments/admin/:appointmentId/cancel - Cancel appointment (Admin)",
        "POST /api/appointments/admin/bulk-cancel - Bulk cancel appointments (Admin)",
        "POST /api/appointments/admin/bulk-update - Bulk update appointments (Admin)",
      ],
      users: [
        "GET /api/users/profile - Get user profile",
        "PUT /api/users/profile/personal - Update personal information",
        "PUT /api/users/profile/medical - Update medical information",
        "GET /api/users/documents - Get user documents",
        "POST /api/users/documents - Upload a document",
        "DELETE /api/users/documents/:id - Delete a document",
        "GET /api/users/subscription - Get subscription details",
      ],
      "session-limits": [
        "GET /api/session-limits - Get user's session limit information",
        "GET /api/session-limits/can-book - Check if user can book appointments",
      ],
    },
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export default app;