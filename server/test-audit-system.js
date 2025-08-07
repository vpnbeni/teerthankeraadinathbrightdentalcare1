import mongoose from "mongoose";
import AuditLog from "./src/models/AuditLog.js";
import { User } from "./src/models/index.js";
import { auditAdminAction } from "./src/middleware/adminAuditMiddleware.js";

// Simple test to verify audit system works
async function testAuditSystem() {
  try {
    console.log("🔍 Testing Audit System...");

    // Connect to MongoDB (use your actual connection string)
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/dental-test"
    );
    console.log("✅ Connected to MongoDB");

    // Create a test admin user
    const adminUser = await User.create({
      name: "Test Admin",
      email: "admin@test.com",
      phone: "1234567890",
      role: "admin",
      password: "hashedpassword",
    });
    console.log("✅ Created test admin user");

    // Create a test audit log entry
    const auditEntry = await AuditLog.create({
      adminId: adminUser._id,
      action: "create",
      resource: "user",
      resourceId: new mongoose.Types.ObjectId(),
      changes: {
        before: null,
        after: { name: "Test User", email: "test@example.com" },
      },
      metadata: {
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
        endpoint: "/api/admin/users",
        method: "POST",
      },
      description: "Admin created new user",
      success: true,
    });
    console.log("✅ Created audit log entry:", auditEntry._id);

    // Test querying audit logs
    const auditLogs = await AuditLog.find({ adminId: adminUser._id })
      .populate("adminId", "name email role")
      .sort({ createdAt: -1 });

    console.log("✅ Retrieved audit logs:", auditLogs.length);
    console.log("📋 Audit Log Details:");
    auditLogs.forEach((log) => {
      console.log(
        `  - ${log.action} ${log.resource} by ${log.adminId.name} at ${log.createdAt}`
      );
    });

    // Test audit log model validation
    try {
      await AuditLog.create({
        adminId: adminUser._id,
        action: "invalid_action", // This should fail validation
        resource: "user",
        resourceId: new mongoose.Types.ObjectId(),
        metadata: { ipAddress: "127.0.0.1" },
      });
      console.log("❌ Validation should have failed");
    } catch (error) {
      console.log("✅ Validation correctly rejected invalid action");
    }

    // Test preventing audit log modification
    try {
      await AuditLog.updateOne({ _id: auditEntry._id }, { action: "modified" });
      console.log("❌ Audit log modification should have been prevented");
    } catch (error) {
      console.log("✅ Audit log modification correctly prevented");
    }

    console.log("🎉 All audit system tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Cleanup
    await AuditLog.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
    console.log("🧹 Cleanup completed");
  }
}

// Run the test
testAuditSystem();
