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

    await mongoose.connect(config.MONGODB_URI, options);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
