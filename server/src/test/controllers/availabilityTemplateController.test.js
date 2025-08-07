import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import {
  getAvailabilityTemplate,
  updateAvailabilityTemplate,
  addTemplateSlot,
  removeTemplateSlot,
  toggleTemplateSlot,
  resetTemplateToDefault,
  getActiveTemplateSlots,
} from "../../controllers/availabilityTemplateController.js";
import AvailabilityTemplate from "../../models/AvailabilityTemplate.js";
import User from "../../models/User.js";

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

jest.mock("../../middleware/adminValidation.js", () => ({
  validateAdminRequest: () => (req, res, next) => next(),
}));

jest.mock("../../middleware/adminAuditMiddleware.js", () => ({
  auditAdminAction: () => (req, res, next) => next(),
}));

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock logger
jest.mock("../../utils/logger.js", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock middleware functions
const auth = (req, res, next) => {
  req.user = { id: new mongoose.Types.ObjectId().toString(), role: "admin" };
  next();
};

const adminOnly = (req, res, next) => next();
const validateAdminRequest = () => (req, res, next) => next();

// Setup routes
app.get(
  "/api/admin/availability/template",
  auth,
  adminOnly,
  getAvailabilityTemplate
);
app.put(
  "/api/admin/availability/template",
  auth,
  adminOnly,
  validateAdminRequest("adminUpdateAvailabilityTemplate"),
  updateAvailabilityTemplate
);
app.post(
  "/api/admin/availability/template/slots",
  auth,
  adminOnly,
  validateAdminRequest("adminAddTemplateSlot"),
  addTemplateSlot
);
app.delete(
  "/api/admin/availability/template/slots/:slotId",
  auth,
  adminOnly,
  validateAdminRequest("adminRemoveTemplateSlot"),
  removeTemplateSlot
);
app.patch(
  "/api/admin/availability/template/slots/:slotId/toggle",
  auth,
  adminOnly,
  validateAdminRequest("adminRemoveTemplateSlot"),
  toggleTemplateSlot
);
app.post(
  "/api/admin/availability/template/reset",
  auth,
  adminOnly,
  resetTemplateToDefault
);
app.get(
  "/api/admin/availability/template/active-slots",
  auth,
  adminOnly,
  getActiveTemplateSlots
);

describe("Availability Template Controller", () => {
  let adminUser;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      phone: "9876543210",
      role: "admin",
      password: "hashedpassword",
    });
  });

  describe("GET /api/admin/availability/template", () => {
    it("should get the availability template", async () => {
      const response = await request(app)
        .get("/api/admin/availability/template")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toBeDefined();
      expect(response.body.data.template.defaultSlots).toBeInstanceOf(Array);
      expect(response.body.data.template.workingDays).toBeInstanceOf(Array);
      expect(response.body.data.template.slotDuration).toBe(60);
    });

    it("should create default template if none exists", async () => {
      const response = await request(app)
        .get("/api/admin/availability/template")
        .expect(200);

      const template = response.body.data.template;
      expect(template.defaultSlots).toHaveLength(10); // 8 AM to 6 PM = 10 slots
      expect(template.workingDays).toEqual([1, 2, 3, 4, 5, 6]); // Monday to Saturday
    });
  });

  describe("PUT /api/admin/availability/template", () => {
    it("should update the availability template", async () => {
      const updateData = {
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        slotDuration: 30,
      };

      const response = await request(app)
        .put("/api/admin/availability/template")
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.workingDays).toEqual([1, 2, 3, 4, 5]);
      expect(response.body.data.template.slotDuration).toBe(30);
    });

    it("should update default slots", async () => {
      const updateData = {
        defaultSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isActive: true,
            maxBookings: 1,
          },
          {
            startTime: "10:00",
            endTime: "11:00",
            isActive: true,
            maxBookings: 2,
          },
        ],
      };

      const response = await request(app)
        .put("/api/admin/availability/template")
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.defaultSlots).toHaveLength(2);
      expect(response.body.data.template.defaultSlots[1].maxBookings).toBe(2);
    });
  });

  describe("POST /api/admin/availability/template/slots", () => {
    it("should add a custom slot to the template", async () => {
      const slotData = {
        startTime: "19:00",
        endTime: "20:00",
        isActive: true,
        maxBookings: 1,
      };

      const response = await request(app)
        .post("/api/admin/availability/template/slots")
        .send(slotData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slot.startTime).toBe("19:00");
      expect(response.body.data.slot.endTime).toBe("20:00");
    });

    it("should handle validation errors for invalid slot data", async () => {
      const invalidSlotData = {
        startTime: "20:00",
        endTime: "19:00", // End time before start time
        isActive: true,
        maxBookings: 1,
      };

      const response = await request(app)
        .post("/api/admin/availability/template/slots")
        .send(invalidSlotData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/admin/availability/template/slots/:slotId", () => {
    it("should remove a slot from the template", async () => {
      // First get the template to get a slot ID
      const getResponse = await request(app)
        .get("/api/admin/availability/template")
        .expect(200);

      const slotId = getResponse.body.data.template.defaultSlots[0]._id;

      const response = await request(app)
        .delete(`/api/admin/availability/template/slots/${slotId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.defaultSlots).toHaveLength(9); // One less than default 10
    });

    it("should handle non-existent slot ID", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/admin/availability/template/slots/${nonExistentId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/admin/availability/template/slots/:slotId/toggle", () => {
    it("should toggle a slot's active status", async () => {
      // First get the template to get a slot ID
      const getResponse = await request(app)
        .get("/api/admin/availability/template")
        .expect(200);

      const slot = getResponse.body.data.template.defaultSlots[0];
      const originalStatus = slot.isActive;

      const response = await request(app)
        .patch(`/api/admin/availability/template/slots/${slot._id}/toggle`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slot.isActive).toBe(!originalStatus);
    });
  });

  describe("POST /api/admin/availability/template/reset", () => {
    it("should reset template to default 8 AM to 6 PM slots", async () => {
      // First modify the template
      await request(app)
        .put("/api/admin/availability/template")
        .send({ workingDays: [1, 2, 3], slotDuration: 30 })
        .expect(200);

      // Then reset it
      const response = await request(app)
        .post("/api/admin/availability/template/reset")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.defaultSlots).toHaveLength(10);
      expect(response.body.data.template.workingDays).toEqual([
        1, 2, 3, 4, 5, 6,
      ]);
      expect(response.body.data.template.slotDuration).toBe(60);
    });
  });

  describe("GET /api/admin/availability/template/active-slots", () => {
    it("should get only active slots from the template", async () => {
      // First get the template and toggle one slot to inactive
      const getResponse = await request(app)
        .get("/api/admin/availability/template")
        .expect(200);

      const slotId = getResponse.body.data.template.defaultSlots[0]._id;

      // Toggle the first slot to inactive
      await request(app)
        .patch(`/api/admin/availability/template/slots/${slotId}/toggle`)
        .expect(200);

      // Get active slots
      const response = await request(app)
        .get("/api/admin/availability/template/active-slots")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activeSlots).toHaveLength(9); // One less than default 10
      expect(response.body.data.count).toBe(9);
    });
  });
});
