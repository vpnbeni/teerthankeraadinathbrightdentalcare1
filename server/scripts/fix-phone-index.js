import mongoose from "mongoose";
import { config } from "../src/config/environment.js";

async function fixPhoneIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("users");

    // Check existing indexes
    const indexes = await collection.indexes();
    console.log(
      "Existing indexes:",
      indexes.map((idx) => ({ name: idx.name, key: idx.key }))
    );

    // Drop the old phone index if it exists
    try {
      await collection.dropIndex("phone_1");
      console.log("Dropped old phone_1 index");
    } catch (error) {
      if (error.code === 27) {
        console.log("phone_1 index does not exist, skipping drop");
      } else {
        console.error("Error dropping phone_1 index:", error.message);
      }
    }

    // Create new sparse index for phone
    await collection.createIndex({ phone: 1 }, { unique: true, sparse: true });
    console.log("Created new sparse unique index for phone");

    // Create sparse index for email if it doesn't exist
    try {
      await collection.createIndex(
        { email: 1 },
        { unique: true, sparse: true }
      );
      console.log("Created new sparse unique index for email");
    } catch (error) {
      if (error.code === 85) {
        console.log(
          "Email index already exists with different options, dropping and recreating..."
        );
        try {
          await collection.dropIndex("email_1");
          await collection.createIndex(
            { email: 1 },
            { unique: true, sparse: true }
          );
          console.log("Recreated email index as sparse");
        } catch (recreateError) {
          console.error("Error recreating email index:", recreateError.message);
        }
      } else {
        console.error("Error creating email index:", error.message);
      }
    }

    // Verify new indexes
    const newIndexes = await collection.indexes();
    console.log(
      "New indexes:",
      newIndexes.map((idx) => ({
        name: idx.name,
        key: idx.key,
        unique: idx.unique,
        sparse: idx.sparse,
      }))
    );

    console.log("Index migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
fixPhoneIndex().catch(console.error);
