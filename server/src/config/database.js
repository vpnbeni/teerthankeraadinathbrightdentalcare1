import mongoose from "mongoose";
import { config } from "./environment.js";

export const connectDB = async () => {
  try {
    // Connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };

    // Try to connect to MongoDB Atlas first
    console.log("🔌 Attempting to connect to MongoDB Atlas...");
    await mongoose.connect(config.MONGODB_URI, options);
    console.log("✅ MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("❌ MongoDB Atlas connection failed:", error.message);
    
    // Try to connect to local MongoDB as fallback
    try {
      console.log("🔄 Attempting to connect to local MongoDB...");
      const localUri = "mongodb://localhost:27017/teerthanker-dental-care-dev";
      await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        family: 4,
        maxPoolSize: 5
      });
      console.log("✅ Local MongoDB connected successfully");
    } catch (localError) {
      console.error("❌ Local MongoDB connection also failed:", localError.message);
      console.error("💡 Please ensure either:");
      console.error("   1. MongoDB Atlas is accessible and credentials are correct");
      console.error("   2. Local MongoDB is running on port 27017");
      console.error("   3. Check your network connection and firewall settings");
      
      // Don't exit immediately in development - allow the app to continue
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      } else {
        console.warn("⚠️ Running in development mode without database connection");
        console.warn("⚠️ Some features may not work properly");
      }
    }
  }
};
