import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Availability from "../../models/Availability.js";
import AvailabilitySettings from "../../models/AvailabilitySettings.js";
import User from "../../models/User.js";
import { auth } from "../../middleware/auth.js";
import { adminOnly } from "../../middleware/adminAuth.js";
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailabilitySettings,
  updateAvailabilitySettings,
  generateAvailability,
} from "../../controllers/availabilityController.js";

// Mock middleware
jest.mock("../../middleware/auth.js", () => ({
  auth: (req, res, next) => {
    req.user = { id: "admin123", role: "admin" };
    next();
  },
}));

jest.mock("../../middleware/adminAuth.js", () => ({
  adminOnly: (req, res, next) => next(),
}));

describe("Availability Controller", () => {
  let mongoServer;
  let app;
  let adminUser;

  beforeEach(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test admin user
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      phone: "1234567890",
      role: "admin",
      password: "hashedpassword",
    });

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(auth);
    app.use(adminOnly);

    // Setup routes
    app.get("/availability", getAvailability);
    app.post("/availability", createAvailability);
    app.put("/availability/:id", updateAvailability);
    app.delete("/availability/:id", deleteAvailability);
    app.get("/availability/settings", getAvailabilitySettings);
    app.put("/availability/settings", updateAvailabilitySettings);
    app.post("/availability/generate", generateAvailability);
  });

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("GET /availability", () => {
    it("should get availability for date range", async () => {
      // Create test availability
      const testDate = new Date("2024-01-15");
      await Availability.create({
        date: testDate,
        timeSlots: [{ startTime: "09:00", endTime: "10:00", maxBookings: 1 }],
        createdBy: adminUser._id,
      });

      const response = await request(app).get("/availability").query({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].timeSlots).toHaveLength(1);
    });

    it("should return 400 for missing date parameters", async () => {
      const response = await request(app).get("/availability");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        "Start date and end date are required"
      );
    });

    it("should return 400 for invalid date format", async () => {
      const response = await request(app).get("/availability").query({
        startDate: "invalid-date",
        endDate: "2024-01-31",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid date format");
    });
  });

  describe("POST /availability", () => {
    it("should create new availability", async () => {
      const availabilityData = {
        date: "2024-01-15",
        timeSlots: [
          { startTime: "09:00", endTime: "10:00", maxBookings: 1 },
          { startTime: "10:00", endTime: "11:00", maxBookings: 1 },
        ],
        notes: "Test availability",
      };

      const response = await request(app)
        .post("/availability")
        .send(availabilityData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.timeSlots).toHaveLength(2);
      expect(response.body.data.notes).toBe("Test availability");
    });

    it("should return 400 for missing date", async () => {
      const response = await request(app)
        .post("/availability")
        .send({
          timeSlots: [{ startTime: "09:00", endTime: "10:00" }],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Date is required");
    });

    it("should return 400 for duplicate date", async () => {
      const testDate = "2024-01-15";

      // Create first availability
      await Availability.create({
        date: new Date(testDate),
        timeSlots: [],
        createdBy: adminUser._id,
      });

      // Try to create duplicate
      const response = await request(app).post("/availability").send({
        date: testDate,
        timeSlots: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });
  });

  describe("PUT /availability/:id", () => {
    it("should update existing availability", async () => {
      const availability = await Availability.create({
        date: new Date("2024-01-15"),
        timeSlots: [{ startTime: "09:00", endTime: "10:00" }],
        createdBy: adminUser._id,
      });

      const updateData = {
        timeSlots: [
          { startTime: "09:00", endTime: "10:00", maxBookings: 2 },
          { startTime: "11:00", endTime: "12:00", maxBookings: 1 },
        ],
        notes: "Updated availability",
      };

      const response = await request(app)
        .put(`/availability/${availability._id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.timeSlots).toHaveLength(2);
      expect(response.body.data.notes).toBe("Updated availability");
    });

    it("should return 404 for non-existent availability", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app).put(`/availability/${fakeId}`).send({
        timeSlots: [],
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("DELETE /availability/:id", () => {
    it("should delete availability without appointments", async () => {
      const availability = await Availability.create({
        date: new Date("2024-01-15"),
        timeSlots: [],
        createdBy: adminUser._id,
      });

      const response = await request(app).delete(
        `/availability/${availability._id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted successfully");

      // Verify deletion
      const deletedAvailability = await Availability.findById(availability._id);
      expect(deletedAvailability).toBeNull();
    });

    it("should return 404 for non-existent availability", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app).delete(`/availability/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("GET /availability/settings", () => {
    it("should get availability settings", async () => {
      const response = await request(app).get("/availability/settings");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("workingDays");
      expect(response.body.data).toHaveProperty("defaultTimeSlots");
      expect(response.body.data).toHaveProperty("breakTimes");
    });
  });

  describe("PUT /availability/settings", () => {
    it("should update availability settings", async () => {
      const settingsData = {
        workingDays: [1, 2, 3, 4, 5],
        advanceBookingDays: 45,
        minimumNoticeHours: 4,
      };

      const response = await request(app)
        .put("/availability/settings")
        .send(settingsData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workingDays).toEqual([1, 2, 3, 4, 5]);
      expect(response.body.data.advanceBookingDays).toBe(45);
      expect(response.body.data.minimumNoticeHours).toBe(4);
    });
  });

  describe("POST /availability/generate", () => {
    it("should generate availability for date range", async () => {
      const generateData = {
        startDate: "2024-01-15",
        endDate: "2024-01-19", // 5 days, should include weekdays
      };

      const response = await request(app)
        .post("/availability/generate")
        .send(generateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("generatedDates");
      expect(response.body.data).toHaveProperty("totalGenerated");
      expect(response.body.data.totalGenerated).toBeGreaterThan(0);
    });

    it("should return 400 for missing dates", async () => {
      const response = await request(app)
        .post("/availability/generate")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        "Start date and end date are required"
      );
    });
  });
});
