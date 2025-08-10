// Vercel serverless function entry point
import express from "express";
import cors from "cors";

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
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
    message: "API endpoint working!",
    timestamp: new Date().toISOString()
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

// Catch all other routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    available_routes: [
      "GET / - Health check",
      "GET /api - API health check", 
      "GET /api/test - Environment test"
    ]
  });
});

export default app;