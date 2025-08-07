import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import Settings from "../../models/Settings.js";
import {
  getSystemSettings,
  updateEmailTemplates,
  updateBusinessRules,
  updateTimeSlotDefaults,
  getSettingsByCategory,
  resetSettingsToDefault,
} from "../../controllers/settingsController.js";

// Mock middleware
const mockAuth = (req, res, next) => {
  req.user = { id: new mongoose.Types.ObjectId(), role: "admin" };
  next();
};

const mockValidation = (req, res, next) => next();

describe("Settings Controller", () => {
  let app;

  beforeEach(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(mockAuth);

    // Setup routes
    app.get("/api/admin/settings", getSystemSettings);
    app.get("/api/admin/settings/:category", getSettingsByCategory);
    app.put(
      "/api/admin/settings/email-templates",
      mockValidation,
      updateEmailTemplates
    );
    app.put(
      "/api/admin/settings/business-rules",
      mockValidation,
      updateBusinessRules
    );
    app.put(
      "/api/admin/settings/time-slots",
      mockValidation,
      updateTimeSlotDefaults
    );
    app.post(
      "/api/admin/settings/reset",
      mockValidation,
      resetSettingsToDefault
    );

    // Error handler
    app.use((error, req, res, next) => {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/settings", () => {
    it("should return empty settings when none exist", async () => {
      const response = await request(app)
        .get("/api/admin/settings")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toEqual({});
      expect(response.body.data.totalCount).toBe(0);
    });

    it("should return settings filtered by category", async () => {
      // Create test settings
      await Settings.create({
        category: "email-templates",
        key: "default",
        emailTemplates: new Map([
          [
            "test-template",
            {
              name: "test-template",
              subject: "Test Subject",
              htmlContent: "<p>Test HTML</p>",
              textContent: "Test Text",
              variables: [],
            },
          ],
        ]),
        lastModifiedBy: new mongoose.Types.ObjectId(),
      });

      const response = await request(app)
        .get("/api/admin/settings?category=email-templates")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings["email-templates"]).toBeDefined();
      expect(response.body.data.totalCount).toBe(1);
    });
  });

  describe("PUT /api/admin/settings/email-templates", () => {
    it("should update email templates successfully", async () => {
      const templates = {
        "welcome-email": {
          subject: "Welcome to our clinic",
          htmlContent: "<h1>Welcome {{patientName}}</h1>",
          textContent: "Welcome {{patientName}}",
          variables: [
            {
              name: "patientName",
              description: "Patient's name",
              required: true,
            },
          ],
        },
      };

      const response = await request(app)
        .put("/api/admin/settings/email-templates")
        .send({ templates })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Email templates updated successfully"
      );
      expect(response.body.data.templates["welcome-email"]).toBeDefined();
      expect(response.body.data.templates["welcome-email"].subject).toBe(
        "Welcome to our clinic"
      );
    });

    it("should return error for invalid template data", async () => {
      const templates = {
        "invalid-template": {
          subject: "Test Subject",
          // Missing required htmlContent and textContent
        },
      };

      const response = await request(app)
        .put("/api/admin/settings/email-templates")
        .send({ templates })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("missing required fields");
    });
  });

  describe("PUT /api/admin/settings/business-rules", () => {
    it("should update business rules successfully", async () => {
      const rules = {
        "max-appointments": {
          name: "Maximum Appointments Per Day",
          value: 20,
          description: "Maximum number of appointments allowed per day",
          category: "booking",
        },
      };

      const response = await request(app)
        .put("/api/admin/settings/business-rules")
        .send({ rules })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Business rules updated successfully");
      expect(response.body.data.rules["max-appointments"]).toBeDefined();
      expect(response.body.data.rules["max-appointments"].value).toBe(20);
    });

    it("should return error for invalid category", async () => {
      const rules = {
        "invalid-rule": {
          name: "Invalid Rule",
          value: 10,
          category: "invalid-category",
        },
      };

      const response = await request(app)
        .put("/api/admin/settings/business-rules")
        .send({ rules })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("invalid category");
    });
  });

  describe("PUT /api/admin/settings/time-slots", () => {
    it("should update time slot defaults successfully", async () => {
      const timeSlots = [
        {
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "17:00",
          breakTimes: [
            {
              startTime: "13:00",
              endTime: "14:00",
              description: "Lunch break",
            },
          ],
          slotDuration: 60,
          maxBookingsPerSlot: 1,
          isActive: true,
        },
      ];

      const response = await request(app)
        .put("/api/admin/settings/time-slots")
        .send({ timeSlots })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Time slot defaults updated successfully"
      );
      expect(response.body.data.timeSlots).toHaveLength(1);
      expect(response.body.data.timeSlots[0].dayOfWeek).toBe(1);
    });

    it("should return error for invalid time format", async () => {
      const timeSlots = [
        {
          dayOfWeek: 1,
          startTime: "25:00", // Invalid time
          endTime: "17:00",
        },
      ];

      const response = await request(app)
        .put("/api/admin/settings/time-slots")
        .send({ timeSlots })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("invalid time format");
    });

    it("should return error when start time is after end time", async () => {
      const timeSlots = [
        {
          dayOfWeek: 1,
          startTime: "17:00",
          endTime: "09:00", // End time before start time
        },
      ];

      const response = await request(app)
        .put("/api/admin/settings/time-slots")
        .send({ timeSlots })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        "Start time must be before end time"
      );
    });
  });

  describe("GET /api/admin/settings/:category", () => {
    it("should return settings for specific category", async () => {
      // Create test settings
      await Settings.create({
        category: "business-rules",
        key: "default",
        businessRules: new Map([
          [
            "test-rule",
            {
              name: "Test Rule",
              value: 10,
              description: "Test description",
              category: "booking",
            },
          ],
        ]),
        lastModifiedBy: new mongoose.Types.ObjectId(),
      });

      const response = await request(app)
        .get("/api/admin/settings/business-rules")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe("business-rules");
      expect(
        response.body.data.settings.default.businessRules["test-rule"]
      ).toBeDefined();
    });

    it("should return error for invalid category", async () => {
      const response = await request(app)
        .get("/api/admin/settings/invalid-category")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid category");
    });
  });

  describe("POST /api/admin/settings/reset", () => {
    it("should reset all settings to default when no category specified", async () => {
      const response = await request(app)
        .post("/api/admin/settings/reset")
        .send({ confirm: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "Settings reset to default values"
      );
      expect(response.body.data.resetResults).toHaveLength(4); // All categories
    });

    it("should reset specific category to default", async () => {
      const response = await request(app)
        .post("/api/admin/settings/reset")
        .send({ confirm: true, category: "email-templates" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("email-templates");
      expect(response.body.data.resetResults).toHaveLength(1);
    });

    it("should return error without confirmation", async () => {
      const response = await request(app)
        .post("/api/admin/settings/reset")
        .send({ confirm: false })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Confirmation required");
    });
  });
});
