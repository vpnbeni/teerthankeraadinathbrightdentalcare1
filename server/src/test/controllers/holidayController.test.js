import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { auth } from "../../middleware/auth.js";
import { adminOnly } from "../../middleware/adminAuth.js";
import { validateAdminRequest } from "../../middleware/adminValidation.js";
import {
  auditAdminAction,
  auditBulkAdminAction,
} from "../../middleware/adminAuditMiddleware.js";
import {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  bulkCreateHolidays,
  bulkUpdateHolidays,
  bulkDeleteHolidays,
  checkHoliday,
  getHolidaysInRange,
  getUpcomingHolidays,
  getHolidayStats,
  reactivateHoliday,
} from "../../controllers/holidayController.js";
import { User, Holiday } from "../../models/index.js";

describe("Holiday Controller", () => {
  let app;
  let mongoServer;
  let adminUser;
  let authToken;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app
    app = express();
    app.use(express.json());

    // Mock auth middleware for testing
    app.use((req, res, next) => {
      req.user = adminUser;
      next();
    });

    // Setup routes
    app.get("/api/admin/availability/holidays", getHolidays);
    app.get("/api/admin/availability/holidays/stats", getHolidayStats);
    app.get("/api/admin/availability/holidays/upcoming", getUpcomingHolidays);
    app.get("/api/admin/availability/holidays/range", getHolidaysInRange);
    app.get("/api/admin/availability/holidays/check/:date", checkHoliday);
    app.post(
      "/api/admin/availability/holidays",
      validateAdminRequest("adminCreateHoliday"),
      createHoliday
    );
    app.post(
      "/api/admin/availability/holidays/bulk",
      validateAdminRequest("adminBulkCreateHolidays"),
      bulkCreateHolidays
    );
    app.put(
      "/api/admin/availability/holidays/bulk",
      validateAdminRequest("adminBulkUpdateHolidays"),
      bulkUpdateHolidays
    );
    app.delete(
      "/api/admin/availability/holidays/bulk",
      validateAdminRequest("adminBulkDeleteHolidays"),
      bulkDeleteHolidays
    );
    app.get("/api/admin/availability/holidays/:id", getHolidayById);
    app.put(
      "/api/admin/availability/holidays/:id",
      validateAdminRequest("adminUpdateHoliday"),
      updateHoliday
    );
    app.delete("/api/admin/availability/holidays/:id", deleteHoliday);
    app.patch(
      "/api/admin/availability/holidays/:id/reactivate",
      reactivateHoliday
    );

    // Create test admin user
    adminUser = await User.create({
      name: "Test Admin",
      email: "admin@test.com",
      phone: "9876543210",
      role: "admin",
      isVerified: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear holidays collection before each test
    await Holiday.deleteMany({});
  });

  describe("GET /api/admin/availability/holidays", () => {
    it("should get all holidays", async () => {
      // Create test holidays
      await Holiday.create([
        {
          name: "New Year",
          date: new Date("2024-01-01"),
          description: "New Year's Day",
          isRecurring: true,
          createdBy: adminUser._id,
        },
        {
          name: "Independence Day",
          date: new Date("2024-08-15"),
          description: "Independence Day of India",
          isRecurring: true,
          createdBy: adminUser._id,
        },
      ]);

      const response = await request(app)
        .get("/api/admin/availability/holidays")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe("New Year");
      expect(response.body.pagination).toBeDefined();
    });

    it("should filter holidays by active status", async () => {
      await Holiday.create([
        {
          name: "Active Holiday",
          date: new Date("2024-01-01"),
          isActive: true,
          createdBy: adminUser._id,
        },
        {
          name: "Inactive Holiday",
          date: new Date("2024-01-02"),
          isActive: false,
          createdBy: adminUser._id,
        },
      ]);

      const response = await request(app)
        .get("/api/admin/availability/holidays?isActive=true")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("Active Holiday");
    });
  });

  describe("POST /api/admin/availability/holidays", () => {
    it("should create a new holiday", async () => {
      const holidayData = {
        name: "Test Holiday",
        date: "2024-12-25",
        description: "Christmas Day",
        isRecurring: true,
      };

      const response = await request(app)
        .post("/api/admin/availability/holidays")
        .send(holidayData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Test Holiday");
      expect(response.body.data.isRecurring).toBe(true);
      expect(response.body.message).toBe("Holiday created successfully");
    });

    it("should return 400 for invalid holiday data", async () => {
      const invalidData = {
        name: "", // Empty name
        date: "invalid-date",
      };

      const response = await request(app)
        .post("/api/admin/availability/holidays")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("PUT /api/admin/availability/holidays/:id", () => {
    it("should update an existing holiday", async () => {
      const holiday = await Holiday.create({
        name: "Original Holiday",
        date: new Date("2024-01-01"),
        createdBy: adminUser._id,
      });

      const updateData = {
        name: "Updated Holiday",
        description: "Updated description",
      };

      const response = await request(app)
        .put(`/api/admin/availability/holidays/${holiday._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Holiday");
      expect(response.body.data.description).toBe("Updated description");
    });

    it("should return 404 for non-existent holiday", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/admin/availability/holidays/${nonExistentId}`)
        .send({ name: "Updated Name" })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/admin/availability/holidays/:id", () => {
    it("should delete (deactivate) a holiday", async () => {
      const holiday = await Holiday.create({
        name: "Holiday to Delete",
        date: new Date("2024-01-01"),
        createdBy: adminUser._id,
      });

      const response = await request(app)
        .delete(`/api/admin/availability/holidays/${holiday._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.message).toBe("Holiday deleted successfully");
    });
  });

  describe("POST /api/admin/availability/holidays/bulk", () => {
    it("should bulk create holidays", async () => {
      const holidaysData = {
        holidays: [
          {
            name: "Holiday 1",
            date: "2024-01-01",
            description: "First holiday",
          },
          {
            name: "Holiday 2",
            date: "2024-01-02",
            description: "Second holiday",
          },
        ],
      };

      const response = await request(app)
        .post("/api/admin/availability/holidays/bulk")
        .send(holidaysData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.successful).toBe(2);
      expect(response.body.data.summary.failed).toBe(0);
    });

    it("should handle validation errors in bulk creation", async () => {
      const invalidData = {
        holidays: [
          {
            name: "", // Invalid name
            date: "2024-01-01",
          },
        ],
      };

      const response = await request(app)
        .post("/api/admin/availability/holidays/bulk")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("GET /api/admin/availability/holidays/check/:date", () => {
    it("should check if a date is a holiday", async () => {
      await Holiday.create({
        name: "Test Holiday",
        date: new Date("2024-01-01"),
        createdBy: adminUser._id,
      });

      const response = await request(app)
        .get("/api/admin/availability/holidays/check/2024-01-01")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isHoliday).toBe(true);
      expect(response.body.data.holiday.name).toBe("Test Holiday");
    });

    it("should return false for non-holiday dates", async () => {
      const response = await request(app)
        .get("/api/admin/availability/holidays/check/2024-01-01")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isHoliday).toBe(false);
      expect(response.body.data.holiday).toBeNull();
    });
  });

  describe("GET /api/admin/availability/holidays/range", () => {
    it("should get holidays in date range", async () => {
      await Holiday.create([
        {
          name: "Holiday 1",
          date: new Date("2024-01-01"),
          createdBy: adminUser._id,
        },
        {
          name: "Holiday 2",
          date: new Date("2024-01-15"),
          createdBy: adminUser._id,
        },
        {
          name: "Holiday 3",
          date: new Date("2024-02-01"),
          createdBy: adminUser._id,
        },
      ]);

      const response = await request(app)
        .get(
          "/api/admin/availability/holidays/range?startDate=2024-01-01&endDate=2024-01-31"
        )
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.dateRange.startDate).toBe("2024-01-01");
      expect(response.body.dateRange.endDate).toBe("2024-01-31");
    });

    it("should return 400 for missing date parameters", async () => {
      const response = await request(app)
        .get("/api/admin/availability/holidays/range")
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/admin/availability/holidays/stats", () => {
    it("should get holiday statistics", async () => {
      await Holiday.create([
        {
          name: "Recurring Holiday",
          date: new Date("2024-01-01"),
          isRecurring: true,
          createdBy: adminUser._id,
        },
        {
          name: "One-time Holiday",
          date: new Date("2024-01-02"),
          isRecurring: false,
          createdBy: adminUser._id,
        },
      ]);

      const response = await request(app)
        .get("/api/admin/availability/holidays/stats")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalHolidays).toBe(2);
      expect(response.body.data.recurringHolidays).toBe(1);
      expect(response.body.data.oneTimeHolidays).toBe(1);
    });
  });

  describe("PATCH /api/admin/availability/holidays/:id/reactivate", () => {
    it("should reactivate a deactivated holiday", async () => {
      const holiday = await Holiday.create({
        name: "Deactivated Holiday",
        date: new Date("2024-01-01"),
        isActive: false,
        createdBy: adminUser._id,
      });

      const response = await request(app)
        .patch(`/api/admin/availability/holidays/${holiday._id}/reactivate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.message).toBe("Holiday reactivated successfully");
    });
  });
});
