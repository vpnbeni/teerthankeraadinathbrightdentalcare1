import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import mongoose from "mongoose";
import AvailabilityTemplate from "../../models/AvailabilityTemplate.js";
import { templateManager } from "../../services/templateManager.js";
import { auditService } from "../../services/auditService.js";
import { ValidationError } from "../../utils/errors.js";

// Mock the audit service
jest.mock("../../services/auditService.js", () => ({
  auditService: {
    logAction: jest.fn().mockResolvedValue({}),
  },
}));

describe("TemplateManager Service", () => {
  let mockTemplate;
  let mockUserId;
  let mockAuditInfo;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    mockUserId = new mongoose.Types.ObjectId().toString();
    mockAuditInfo = {
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
      endpoint: "/api/test",
    };

    // Mock template with default slots
    mockTemplate = {
      _id: "availability_template",
      defaultSlots: [
        {
          _id: new mongoose.Types.ObjectId(),
          startTime: "08:00",
          endTime: "09:00",
          isActive: true,
          maxBookings: 1,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          startTime: "09:00",
          endTime: "10:00",
          isActive: true,
          maxBookings: 1,
        },
      ],
      workingDays: [1, 2, 3, 4, 5, 6],
      slotDuration: 60,
      updatedBy: mockUserId,
      version: 1,
      save: jest.fn().mockResolvedValue(this),
      getActiveSlots: jest.fn().mockReturnValue([
        {
          startTime: "08:00",
          endTime: "09:00",
          isActive: true,
          maxBookings: 1,
        },
        {
          startTime: "09:00",
          endTime: "10:00",
          isActive: true,
          maxBookings: 1,
        },
      ]),
      isWorkingDay: jest.fn().mockReturnValue(true),
      addSlot: jest.fn().mockResolvedValue(this),
      removeSlot: jest.fn().mockResolvedValue(this),
      updateSlot: jest.fn().mockResolvedValue(this),
      toggleSlot: jest.fn().mockResolvedValue(this),
    };

    // Add id method to mock slots
    mockTemplate.defaultSlots.id = jest.fn((id) => {
      return mockTemplate.defaultSlots.find(
        (slot) => slot._id.toString() === id
      );
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getTemplate", () => {
    it("should retrieve the availability template successfully", async () => {
      jest
        .spyOn(AvailabilityTemplate, "getTemplate")
        .mockResolvedValue(mockTemplate);

      const result = await templateManager.getTemplate();

      expect(result).toEqual(mockTemplate);
      expect(AvailabilityTemplate.getTemplate).toHaveBeenCalledTimes(1);
    });

    it("should throw AppError when template retrieval fails", async () => {
      const error = new Error("Database error");
      jest.spyOn(AvailabilityTemplate, "getTemplate").mockRejectedValue(error);

      await expect(templateManager.getTemplate()).rejects.toThrow(
        "Failed to retrieve template: Database error"
      );
    });
  });

  describe("updateTemplate", () => {
    beforeEach(() => {
      jest
        .spyOn(AvailabilityTemplate, "getTemplate")
        .mockResolvedValue(mockTemplate);
    });

    it("should update template successfully with valid data", async () => {
      const templateData = {
        workingDays: [1, 2, 3, 4, 5],
        slotDuration: 30,
      };

      const result = await templateManager.updateTemplate(
        templateData,
        mockUserId,
        mockAuditInfo
      );

      expect(mockTemplate.workingDays).toEqual([1, 2, 3, 4, 5]);
      expect(mockTemplate.slotDuration).toEqual(30);
      expect(mockTemplate.updatedBy).toEqual(mockUserId);
      expect(mockTemplate.save).toHaveBeenCalledTimes(1);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          resourceType: "AvailabilityTemplate",
          success: true,
        })
      );
    });

    it("should update default slots when provided", async () => {
      const newSlots = [
        {
          startTime: "10:00",
          endTime: "11:00",
          isActive: true,
          maxBookings: 1,
        },
      ];

      jest
        .spyOn(templateManager, "_validateSlots")
        .mockImplementation(() => {});

      await templateManager.updateTemplate(
        { defaultSlots: newSlots },
        mockUserId,
        mockAuditInfo
      );

      expect(mockTemplate.defaultSlots).toEqual(newSlots);
      expect(templateManager._validateSlots).toHaveBeenCalledWith(newSlots);
    });

    it("should log failed update attempts", async () => {
      const error = new Error("Validation error");
      mockTemplate.save.mockRejectedValue(error);

      await expect(
        templateManager.updateTemplate({}, mockUserId, mockAuditInfo)
      ).rejects.toThrow("Failed to update template: Validation error");

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          success: false,
          errorMessage: "Validation error",
        })
      );
    });
  });

  describe("addCustomSlot", () => {
    beforeEach(() => {
      jest
        .spyOn(AvailabilityTemplate, "getTemplate")
        .mockResolvedValue(mockTemplate);
      jest
        .spyOn(templateManager, "_validateSlotData")
        .mockImplementation(() => {});
    });

    it("should add custom slot successfully", async () => {
      const slotData = {
        startTime: "18:00",
        endTime: "19:00",
        isActive: true,
        maxBookings: 1,
      };

      const result = await templateManager.addCustomSlot(
        slotData,
        mockUserId,
        mockAuditInfo
      );

      expect(templateManager._validateSlotData).toHaveBeenCalledWith(slotData);
      expect(mockTemplate.addSlot).toHaveBeenCalledWith(slotData, mockUserId);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          resourceType: "AvailabilityTemplate",
          success: true,
          description: "Added custom slot: 18:00-19:00",
        })
      );
    });

    it("should handle validation errors", async () => {
      const slotData = { startTime: "invalid", endTime: "19:00" };
      const validationError = new Error("Invalid time format");

      jest
        .spyOn(templateManager, "_validateSlotData")
        .mockImplementation(() => {
          throw validationError;
        });

      await expect(
        templateManager.addCustomSlot(slotData, mockUserId, mockAuditInfo)
      ).rejects.toThrow("Failed to add custom slot: Invalid time format");
    });

    it("should log failed slot addition attempts", async () => {
      const slotData = { startTime: "18:00", endTime: "19:00" };
      const error = new Error("Overlap detected");
      mockTemplate.addSlot.mockRejectedValue(error);

      await expect(
        templateManager.addCustomSlot(slotData, mockUserId, mockAuditInfo)
      ).rejects.toThrow("Failed to add custom slot: Overlap detected");

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          success: false,
          errorMessage: "Overlap detected",
        })
      );
    });
  });

  describe("removeSlot", () => {
    beforeEach(() => {
      jest
        .spyOn(AvailabilityTemplate, "getTemplate")
        .mockResolvedValue(mockTemplate);
    });

    it("should remove slot successfully", async () => {
      const slotId = mockTemplate.defaultSlots[0]._id.toString();

      const result = await templateManager.removeSlot(
        slotId,
        mockUserId,
        mockAuditInfo
      );

      expect(mockTemplate.removeSlot).toHaveBeenCalledWith(slotId, mockUserId);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          resourceType: "AvailabilityTemplate",
          success: true,
          description: "Removed slot: 08:00-09:00",
        })
      );
    });

    it("should throw error when slot not found", async () => {
      const nonExistentSlotId = new mongoose.Types.ObjectId().toString();
      mockTemplate.defaultSlots.id.mockReturnValue(null);

      await expect(
        templateManager.removeSlot(nonExistentSlotId, mockUserId, mockAuditInfo)
      ).rejects.toThrow("Slot not found");
    });

    it("should log failed slot removal attempts", async () => {
      const slotId = mockTemplate.defaultSlots[0]._id.toString();
      const error = new Error("Cannot remove slot");
      mockTemplate.removeSlot.mockRejectedValue(error);

      await expect(
        templateManager.removeSlot(slotId, mockUserId, mockAuditInfo)
      ).rejects.toThrow("Failed to remove slot: Cannot remove slot");

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          success: false,
          errorMessage: "Cannot remove slot",
        })
      );
    });
  });

  describe("generateDefaultSlots", () => {
    it("should generate default 8 AM to 6 PM hourly slots", () => {
      jest.spyOn(AvailabilityTemplate, "generateDefaultSlots").mockReturnValue([
        {
          startTime: "08:00",
          endTime: "09:00",
          isActive: true,
          maxBookings: 1,
        },
        {
          startTime: "09:00",
          endTime: "10:00",
          isActive: true,
          maxBookings: 1,
        },
      ]);

      const result = templateManager.generateDefaultSlots();

      expect(AvailabilityTemplate.generateDefaultSlots).toHaveBeenCalledTimes(
        1
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        startTime: "08:00",
        endTime: "09:00",
        isActive: true,
        maxBookings: 1,
      });
    });
  });

  describe("_validateSlotData", () => {
    it("should validate valid slot data", () => {
      const validSlot = {
        startTime: "09:00",
        endTime: "10:00",
        maxBookings: 1,
      };

      expect(() => templateManager._validateSlotData(validSlot)).not.toThrow();
    });

    it("should throw error for missing start time", () => {
      const invalidSlot = { endTime: "10:00" };

      expect(() => templateManager._validateSlotData(invalidSlot)).toThrow(
        "Start time and end time are required"
      );
    });

    it("should throw error for invalid time format", () => {
      const invalidSlot = { startTime: "25:00", endTime: "10:00" };

      expect(() => templateManager._validateSlotData(invalidSlot)).toThrow(
        "Time must be in HH:MM format"
      );
    });

    it("should throw error for end time before start time", () => {
      const invalidSlot = { startTime: "10:00", endTime: "09:00" };

      expect(() => templateManager._validateSlotData(invalidSlot)).toThrow(
        "End time must be after start time"
      );
    });

    it("should throw error for slot too short", () => {
      const invalidSlot = { startTime: "09:00", endTime: "09:10" };

      expect(() => templateManager._validateSlotData(invalidSlot)).toThrow(
        "Time slot must be at least 15 minutes long"
      );
    });

    it("should throw error for slot too long", () => {
      const invalidSlot = { startTime: "09:00", endTime: "14:00" };

      expect(() => templateManager._validateSlotData(invalidSlot)).toThrow(
        "Time slot cannot exceed 4 hours"
      );
    });

    it("should throw error for invalid maxBookings", () => {
      const invalidSlot = {
        startTime: "09:00",
        endTime: "10:00",
        maxBookings: 15,
      };

      expect(() => templateManager._validateSlotData(invalidSlot)).toThrow(
        "Max bookings must be an integer between 1 and 10"
      );
    });
  });

  describe("_validateSlots", () => {
    it("should validate array of non-overlapping slots", () => {
      const validSlots = [
        { startTime: "08:00", endTime: "09:00" },
        { startTime: "09:00", endTime: "10:00" },
      ];

      expect(() => templateManager._validateSlots(validSlots)).not.toThrow();
    });

    it("should throw error for non-array input", () => {
      expect(() => templateManager._validateSlots("not-array")).toThrow(
        "Slots must be an array"
      );
    });

    it("should throw error for overlapping slots", () => {
      const overlappingSlots = [
        { startTime: "08:00", endTime: "09:30" },
        { startTime: "09:00", endTime: "10:00" },
      ];

      expect(() => templateManager._validateSlots(overlappingSlots)).toThrow(
        "Slots overlap: 08:00-09:30 and 09:00-10:00"
      );
    });
  });

  describe("_timeSlotsOverlap", () => {
    it("should detect overlapping slots", () => {
      const slot1 = { startTime: "08:00", endTime: "09:30" };
      const slot2 = { startTime: "09:00", endTime: "10:00" };

      const result = templateManager._timeSlotsOverlap(slot1, slot2);

      expect(result).toBe(true);
    });

    it("should detect non-overlapping slots", () => {
      const slot1 = { startTime: "08:00", endTime: "09:00" };
      const slot2 = { startTime: "09:00", endTime: "10:00" };

      const result = templateManager._timeSlotsOverlap(slot1, slot2);

      expect(result).toBe(false);
    });
  });

  describe("_timeToMinutes", () => {
    it("should convert time string to minutes correctly", () => {
      expect(templateManager._timeToMinutes("08:00")).toBe(480);
      expect(templateManager._timeToMinutes("09:30")).toBe(570);
      expect(templateManager._timeToMinutes("00:00")).toBe(0);
      expect(templateManager._timeToMinutes("23:59")).toBe(1439);
    });
  });
});
