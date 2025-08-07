import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import AuditLog from "../../models/AuditLog.js";
import { User } from "../../models/index.js";
import { auth } from "../../middleware/auth.js";
import { adminOnly } from "../../middleware/adminAuth.js";
import {
  getAuditLogs,
  getAuditLogStats,
  getResourceAuditLogs,
  getAdminAuditLogs,
} from "../../controllers/auditController.js";

// Mock middleware
const mockAuth = (req, res, next) => {
  req.user = {
    _id: new mongoose.Types.ObjectId(),
    role: "admin",
    name: "Test Admin",
    email: "admin@test.com",
  };
  next();
};

const mockAdminOnly = (req, res, next) => {
  next();
};

describe("Audit Controller", () => {
  let mongoServer;
  let app;
  let adminUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test admin user
    adminUser = await User.create({
      name: "Test Admin",
      email: "admin@test.com",
      phone: "1234567890",
      role: "admin",
      password: "hashedpassword",
    });

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(mockAuth);
    app.use(mockAdminOnly);

    // Setup routes
    app.get("/audit-logs", getAuditLogs);
    app.get("/audit-logs/stats", getAuditLogStats);
    app.get("/audit-logs/resource/:resource/:resourceId", getResourceAuditLogs);
    app.get("/audit-logs/admin/:adminId", getAdminAuditLogs);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear audit logs before each test
    await AuditLog.deleteMany({});
  });

  describe("GET /audit-logs", () => {
    it("should get audit logs with default pagination", async () => {
      // Create test audit logs
      await AuditLog.create([
        {
          adminId: adminUser._id,
          action: "create",
          resource: "user",
          resourceId: new mongoose.Types.ObjectId(),
          changes: { after: { name: "Test User" } },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
        {
          adminId: adminUser._id,
          action: "update",
          resource: "appointment",
          resourceId: new mongoose.Types.ObjectId(),
          changes: {
            before: { status: "pending" },
            after: { status: "confirmed" },
          },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
      ]);

      const response = await request(app).get("/audit-logs").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(50);
    });

    it("should filter audit logs by date range", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create audit log from yesterday
      await AuditLog.create({
        adminId: adminUser._id,
        action: "create",
        resource: "user",
        resourceId: new mongoose.Types.ObjectId(),
        changes: { after: { name: "Old User" } },
        metadata: {
          ipAddress: "127.0.0.1",
          userAgent: "test-agent",
        },
        createdAt: yesterday,
      });

      // Create audit log from today
      await AuditLog.create({
        adminId: adminUser._id,
        action: "create",
        resource: "user",
        resourceId: new mongoose.Types.ObjectId(),
        changes: { after: { name: "New User" } },
        metadata: {
          ipAddress: "127.0.0.1",
          userAgent: "test-agent",
        },
      });

      const response = await request(app)
        .get("/audit-logs")
        .query({
          startDate: new Date().toISOString().split("T")[0], // Today
          endDate: tomorrow.toISOString().split("T")[0], // Tomorrow
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(1);
      expect(response.body.data.logs[0].changes.after.name).toBe("New User");
    });

    it("should filter audit logs by action", async () => {
      await AuditLog.create([
        {
          adminId: adminUser._id,
          action: "create",
          resource: "user",
          resourceId: new mongoose.Types.ObjectId(),
          changes: { after: { name: "Created User" } },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
        {
          adminId: adminUser._id,
          action: "update",
          resource: "user",
          resourceId: new mongoose.Types.ObjectId(),
          changes: {
            before: { name: "Old Name" },
            after: { name: "Updated User" },
          },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
      ]);

      const response = await request(app)
        .get("/audit-logs")
        .query({ action: "create" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(1);
      expect(response.body.data.logs[0].action).toBe("create");
    });
  });

  describe("GET /audit-logs/stats", () => {
    it("should get audit log statistics", async () => {
      await AuditLog.create([
        {
          adminId: adminUser._id,
          action: "create",
          resource: "user",
          resourceId: new mongoose.Types.ObjectId(),
          changes: { after: { name: "User 1" } },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
        {
          adminId: adminUser._id,
          action: "create",
          resource: "appointment",
          resourceId: new mongoose.Types.ObjectId(),
          changes: { after: { date: "2024-01-01" } },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
        {
          adminId: adminUser._id,
          action: "update",
          resource: "user",
          resourceId: new mongoose.Types.ObjectId(),
          changes: {
            before: { name: "Old" },
            after: { name: "New" },
          },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
      ]);

      const response = await request(app).get("/audit-logs/stats").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalLogs).toBe(3);
      expect(response.body.data.actionStats).toHaveLength(2);
      expect(response.body.data.resourceStats).toHaveLength(2);
      expect(response.body.data.adminStats).toHaveLength(1);
    });
  });

  describe("GET /audit-logs/resource/:resource/:resourceId", () => {
    it("should get audit logs for specific resource", async () => {
      const resourceId = new mongoose.Types.ObjectId();
      const otherResourceId = new mongoose.Types.ObjectId();

      await AuditLog.create([
        {
          adminId: adminUser._id,
          action: "create",
          resource: "user",
          resourceId: resourceId,
          changes: { after: { name: "Target User" } },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
        {
          adminId: adminUser._id,
          action: "update",
          resource: "user",
          resourceId: resourceId,
          changes: {
            before: { name: "Target User" },
            after: { name: "Updated Target User" },
          },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
        {
          adminId: adminUser._id,
          action: "create",
          resource: "user",
          resourceId: otherResourceId,
          changes: { after: { name: "Other User" } },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
      ]);

      const response = await request(app)
        .get(`/audit-logs/resource/user/${resourceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(2);
      expect(response.body.data.logs[0].resourceId.toString()).toBe(
        resourceId.toString()
      );
      expect(response.body.data.logs[1].resourceId.toString()).toBe(
        resourceId.toString()
      );
    });
  });

  describe("GET /audit-logs/admin/:adminId", () => {
    it("should get audit logs for specific admin", async () => {
      const otherAdmin = await User.create({
        name: "Other Admin",
        email: "other@test.com",
        phone: "0987654321",
        role: "admin",
        password: "hashedpassword",
      });

      await AuditLog.create([
        {
          adminId: adminUser._id,
          action: "create",
          resource: "user",
          resourceId: new mongoose.Types.ObjectId(),
          changes: { after: { name: "User by Admin 1" } },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
        {
          adminId: otherAdmin._id,
          action: "create",
          resource: "user",
          resourceId: new mongoose.Types.ObjectId(),
          changes: { after: { name: "User by Admin 2" } },
          metadata: {
            ipAddress: "127.0.0.1",
            userAgent: "test-agent",
          },
        },
      ]);

      const response = await request(app)
        .get(`/audit-logs/admin/${adminUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(1);
      expect(response.body.data.logs[0].adminId.toString()).toBe(
        adminUser._id.toString()
      );
      expect(response.body.data.adminInfo.name).toBe("Test Admin");
    });
  });
});
