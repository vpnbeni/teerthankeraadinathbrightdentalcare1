import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./server/.env" });

async function fixPhoneIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Get existing indexes
    const indexes = await usersCollection.indexes();
    console.log("Existing indexes:", indexes);

    // Check if there's a non-sparse phone index
    const phoneIndex = indexes.find(
      (index) => index.key && index.key.phone === 1 && !index.sparse
    );

    if (phoneIndex) {
      console.log("Found non-sparse phone index:", phoneIndex);

      // Drop the non-sparse index
      await usersCollection.dropIndex({ phone: 1 });
      console.log("Dropped non-sparse phone index");

      // Create a new sparse index
      await usersCollection.createIndex(
        { phone: 1 },
        { unique: true, sparse: true }
      );
      console.log("Created sparse phone index");
    } else {
      console.log("No non-sparse phone index found");

      // Ensure sparse index exists
      try {
        await usersCollection.createIndex(
          { phone: 1 },
          { unique: true, sparse: true }
        );
        console.log("Created sparse phone index");
      } catch (error) {
        if (error.code === 85) {
          console.log("Sparse phone index already exists");
        } else {
          throw error;
        }
      }
    }

    // Also check email index
    const emailIndex = indexes.find(
      (index) => index.key && index.key.email === 1 && !index.sparse
    );

    if (emailIndex) {
      console.log("Found non-sparse email index:", emailIndex);

      // Drop the non-sparse index
      await usersCollection.dropIndex({ email: 1 });
      console.log("Dropped non-sparse email index");

      // Create a new sparse index
      await usersCollection.createIndex(
        { email: 1 },
        { unique: true, sparse: true }
      );
      console.log("Created sparse email index");
    } else {
      console.log("No non-sparse email index found");

      // Ensure sparse index exists
      try {
        await usersCollection.createIndex(
          { email: 1 },
          { unique: true, sparse: true }
        );
        console.log("Created sparse email index");
      } catch (error) {
        if (error.code === 85) {
          console.log("Sparse email index already exists");
        } else {
          throw error;
        }
      }
    }

    console.log("Index fix completed successfully");
  } catch (error) {
    console.error("Error fixing indexes:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

fixPhoneIndex();
