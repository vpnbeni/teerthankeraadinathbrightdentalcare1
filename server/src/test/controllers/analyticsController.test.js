import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { auth } from "../../middleware/auth.js";
import { adminOnly } from "../../middleware/adminAuth.js";
import {
  getAdminAppointmentAnalytics,
  getAdminRevenueAnalytics,
  getAdminPatientAnalytics,
  generateAdminReport,
} from "../../controllers/analyticsController.js";
import { User, Appointment, Payment, Plan } from "../../models/index.js";

// Mock middleware
jest.mock("../../middleware/auth.js");
jest.mock("../../middleware/adminAuth.js");

describe("Analytics Controller - Admin Endpoints", () => {
  let app;
  let mongoServer;
  let testUser;
  let testPlan;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app
    app = express();
    app.use(express.json());

    // Mock middleware to always pass
    auth.mockImplementation((req, res, next) => {
      req.user = { id: "admin123", role: "admin" };
      next();
    });
    adminOnly.mockImplementation((req, res, next) => next());

    // Setup routes
    app.get("/api/admin/analytics/appointments", getAdminAppointmentAnalytics);
    app.get("/api/admin/analytics/revenue", getAdminRevenueAnalytics);
    app.get("/api/admin/analytics/patients", getAdminPatientAnalytics);
    app.post("/api/admin/reports/generate", generateAdminReport);

    // Create test data
    testPlan = await Plan.create({
      name: "Basic Plan",
      price: 1000,
      sessions: 5,
      description: "Basic dental plan",
    });

    testUser = await User.create({
      name: "Test User",
      phone: "1234567890",
      email: "test@example.com",
      subscription: {
        planId: testPlan._id,
        status: "active",
        sessionsRemaining: 3,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Appointment.deleteMany({});
    await Payment.deleteMany({});
  });

  describe("GET /api/admin/analytics/appointments", () => {
    it("should return appointment analytics", async () => {
      // Create test appointments
      await Appointment.create([
        {
          userId: testUser._id,
          date: new Date(),
          timeSlot: "09:00-10:00",
          status: "completed",
          sessionNumber: 1,
        },
        {
          userId: testUser._id,
          date: new Date(),
          timeSlot: "10:00-11:00",
          status: "cancelled",
          sessionNumber: 2,
        },
      ]);

      const response = await request(app)
        .get("/api/admin/analytics/appointments")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("overview");
      expect(response.body.data).toHaveProperty("statusDistribution");
      expect(response.body.data).toHaveProperty("dailyTrends");
      expect(response.body.data.overview.totalAppointments).toBe(2);
      expect(response.body.data.overview.completedAppointments).toBe(1);
      expect(response.body.data.overview.cancelledAppointments).toBe(1);
    });

    it("should handle date range filters", async () => {
      const startDate = new Date("2024-01-01").toISOString();
      const endDate = new Date("2024-12-31").toISOString();

      const response = await request(app)
        .get(
          `/api/admin/analytics/appointments?startDate=${startDate}&endDate=${endDate}`
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dateRange.startDate).toBeDefined();
      expect(response.body.data.dateRange.endDate).toBeDefined();
    });
  });

  describe("GET /api/admin/analytics/revenue", () => {
    it("should return revenue analytics", async () => {
      // Create test payments
      await Payment.create([
        {
          userId: testUser._id,
          planId: testPlan._id,
          amount: 1000,
          status: "completed",
          razorpayOrderId: "order_123",
          transactionDate: new Date(),
          paymentMethod: "card",
        },
        {
          userId: testUser._id,
          planId: testPlan._id,
          amount: 1500,
          status: "completed",
          razorpayOrderId: "order_124",
          transactionDate: new Date(),
          paymentMethod: "upi",
        },
      ]);

      const response = await request(app)
        .get("/api/admin/analytics/revenue")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("overview");
      expect(response.body.data).toHaveProperty("trends");
      expect(response.body.data).toHaveProperty("revenueByPlan");
      expect(response.body.data.overview.totalRevenue).toBe(2500);
      expect(response.body.data.overview.totalTransactions).toBe(2);
    });
  });

  describe("GET /api/admin/analytics/patients", () => {
    it("should return patient analytics", async () => {
      const response = await request(app)
        .get("/api/admin/analytics/patients")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("overview");
      expect(response.body.data).toHaveProperty("growth");
      expect(response.body.data).toHaveProperty("demographics");
      expect(response.body.data).toHaveProperty("subscriptionDistribution");
    });
  });

  describe("POST /api/admin/reports/generate", () => {
    it("should generate appointment report", async () => {
      const reportData = {
        reportType: "appointments",
        startDate: new Date("2024-01-01").toISOString(),
        endDate: new Date("2024-12-31").toISOString(),
        filters: {},
        groupBy: "day",
        metrics: [],
      };

      const response = await request(app)
        .post("/api/admin/reports/generate")
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("reportId");
      expect(response.body.data).toHaveProperty("reportType");
      expect(response.body.data.reportType).toBe("appointments");
    });

    it("should generate revenue report", async () => {
      const reportData = {
        reportType: "revenue",
        startDate: new Date("2024-01-01").toISOString(),
        endDate: new Date("2024-12-31").toISOString(),
        filters: {},
        groupBy: "month",
        metrics: [],
      };

      const response = await request(app)
        .post("/api/admin/reports/generate")
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reportType).toBe("revenue");
    });

    it("should generate comprehensive report", async () => {
      const reportData = {
        reportType: "comprehensive",
        startDate: new Date("2024-01-01").toISOString(),
        endDate: new Date("2024-12-31").toISOString(),
        filters: {},
        groupBy: "day",
        metrics: [],
      };

      const response = await request(app)
        .post("/api/admin/reports/generate")
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reportType).toBe("comprehensive");
      expect(response.body.data.data).toHaveProperty("appointments");
      expect(response.body.data.data).toHaveProperty("revenue");
      expect(response.body.data.data).toHaveProperty("patients");
      expect(response.body.data.data).toHaveProperty("insights");
    });

    it("should return 400 for invalid report type", async () => {
      const reportData = {
        reportType: "invalid",
        startDate: new Date("2024-01-01").toISOString(),
        endDate: new Date("2024-12-31").toISOString(),
      };

      const response = await request(app)
        .post("/api/admin/reports/generate")
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid report type");
    });

    it("should return 400 for missing required fields", async () => {
      const reportData = {
        reportType: "appointments",
        // Missing startDate and endDate
      };

      const response = await request(app)
        .post("/api/admin/reports/generate")
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("required");
    });
  });
});
