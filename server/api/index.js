// Vercel serverless function entry point
import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

const app = express();

// Database connection with caching for serverless
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      retryWrites: true,
      w: "majority",
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    cachedDb = conn;
    console.log("✅ Database connected");
    return cachedDb;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
};

// Simplified CORS configuration for serverless
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://client.teerthankerdentalcare.com",
      "https://admin.teerthankerdentalcare.com",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:5173",
    ];

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now to test
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
};

// Middleware
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health check routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Teerthanker Dental Care API is running on Vercel!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    version: "1.0.0",
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Teerthanker Dental Care API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    version: "1.0.0",
  });
});

// Test endpoint with environment check
app.get("/api/test", async (req, res) => {
  try {
    // Test database connection
    let dbStatus = "❌ Not connected";
    try {
      await connectDB();
      dbStatus = "✅ Connected";
    } catch (error) {
      dbStatus = `❌ Error: ${error.message}`;
    }

    res.json({
      success: true,
      message: "Test endpoint working!",
      timestamp: new Date().toISOString(),
      env_check: {
        mongodb_uri: process.env.MONGODB_URI ? "✅ Set" : "❌ Missing",
        jwt_secret: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
        razorpay_key: process.env.RAZORPAY_KEY_ID ? "✅ Set" : "❌ Missing",
        node_env: process.env.NODE_ENV || "development",
        database_status: dbStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Test endpoint error",
      error: error.message,
    });
  }
});

// Basic API routes for testing
app.get("/api/health", async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      message: "API is healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

// Lazy load routes to avoid import issues
app.use("/api/auth", async (req, res, next) => {
  try {
    await connectDB();
    const { default: authRoutes } = await import("../src/routes/auth.js");
    authRoutes(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Auth route loading failed",
      error: error.message,
    });
  }
});

app.use("/api/payments", async (req, res, next) => {
  try {
    await connectDB();
    const { default: paymentRoutes } = await import(
      "../src/routes/payments.js"
    );
    paymentRoutes(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment route loading failed",
      error: error.message,
    });
  }
});

app.use("/api/plans", async (req, res, next) => {
  try {
    await connectDB();
    const { default: planRoutes } = await import("../src/routes/plans.js");
    planRoutes(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Plans route loading failed",
      error: error.message,
    });
  }
});

app.use("/api/users", async (req, res, next) => {
  try {
    await connectDB();
    const { default: userRoutes } = await import("../src/routes/users.js");
    userRoutes(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "User route loading failed",
      error: error.message,
    });
  }
});

app.use("/api/appointments", async (req, res, next) => {
  try {
    await connectDB();
    const { default: appointmentRoutes } = await import(
      "../src/routes/appointments.js"
    );
    appointmentRoutes(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Appointments route loading failed",
      error: error.message,
    });
  }
});

app.use("/api/admin", async (req, res, next) => {
  try {
    await connectDB();
    const { default: adminRoutes } = await import("../src/routes/admin.js");
    adminRoutes(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin route loading failed",
      error: error.message,
    });
  }
});

app.use("/api/analytics", async (req, res, next) => {
  try {
    await connectDB();
    const { default: analyticsRoutes } = await import(
      "../src/routes/analytics.js"
    );
    analyticsRoutes(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Analytics route loading failed",
      error: error.message,
    });
  }
});

app.use("/api/availability", async (req, res, next) => {
  try {
    await connectDB();
    const { default: availabilityRoutes } = await import(
      "../src/routes/availability.js"
    );
    availabilityRoutes(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Availability route loading failed",
      error: error.message,
    });
  }
});

app.use("/api/session-limits", async (req, res, next) => {
  try {
    await connectDB();
    const { default: sessionLimitsRoutes } = await import(
      "../src/routes/sessionLimits.js"
    );
    sessionLimitsRoutes(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Session limits route loading failed",
      error: error.message,
    });
  }
});

// Handle 404 - Route not found
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    available_routes: [
      "GET / - Health check",
      "GET /api - API health check",
      "GET /api/test - Environment test",
      "GET /api/health - Database health check",
      "POST /api/auth/* - Authentication endpoints",
      "GET /api/payments/* - Payment endpoints",
      "GET /api/plans - Plans endpoint",
      "GET /api/users/* - User management endpoints",
      "GET /api/appointments - Appointments endpoints",
      "GET /api/admin/* - Admin management endpoints",
      "GET /api/analytics/* - Analytics endpoints",
      "GET /api/availability/* - Availability endpoints",
      "GET /api/session-limits/* - Session limits endpoints",
    ],
    timestamp: new Date().toISOString(),
  });
});

// Global error handling
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.stack
        : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

export default app;
