import mongoose from "mongoose";
import { config } from "../src/config/environment.js";

async function checkAndFixIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("users");

    // Check existing indexes
    const indexes = await collection.indexes();
    console.log("Existing indexes:");
    indexes.forEach((idx) => {
      console.log(
        `- ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${
          idx.unique
        }, sparse: ${idx.sparse})`
      );
    });

    // Check if there's a name index (there shouldn't be one)
    const nameIndex = indexes.find((idx) => idx.key.name);
    if (nameIndex) {
      console.log(
        "\n⚠️  Found name index - this should be removed as names can be duplicate"
      );
      try {
        await collection.dropIndex(nameIndex.name);
        console.log(`✅ Dropped ${nameIndex.name} index`);
      } catch (error) {
        console.error(
          `❌ Error dropping ${nameIndex.name} index:`,
          error.message
        );
      }
    } else {
      console.log("\n✅ No name index found - this is correct");
    }

    // Fix email index to be sparse if it isn't already
    const emailIndex = indexes.find((idx) => idx.key.email);
    if (emailIndex && !emailIndex.sparse) {
      console.log("\n🔧 Fixing email index to be sparse...");
      try {
        await collection.dropIndex("email_1");
        await collection.createIndex(
          { email: 1 },
          { unique: true, sparse: true }
        );
        console.log("✅ Email index fixed to be sparse");
      } catch (error) {
        console.error("❌ Error fixing email index:", error.message);
      }
    } else if (emailIndex && emailIndex.sparse) {
      console.log("\n✅ Email index is already sparse");
    }

    // Verify final indexes
    const finalIndexes = await collection.indexes();
    console.log("\nFinal indexes:");
    finalIndexes.forEach((idx) => {
      console.log(
        `- ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${
          idx.unique
        }, sparse: ${idx.sparse})`
      );
    });

    console.log("\n✅ Index check and fix completed successfully");
  } catch (error) {
    console.error("❌ Operation failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the check and fix
checkAndFixIndexes().catch(console.error);
