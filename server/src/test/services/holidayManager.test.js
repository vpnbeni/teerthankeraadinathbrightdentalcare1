import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import mongoose from "mongoose";
import Holiday from "../../models/Holiday.js";
import Appointment from "../../models/Appointment.js";
import { holidayManager } from "../../services/holidayManager.js";
import { auditService } from "../../services/auditService.js";
import { ValidationError } from "../../utils/errors.js";

// Mock the audit service
jest.mock("../../services/auditService.js", () => ({
  auditService: {
    logAction: jest.fn().mockResolvedValue({}),
  },
}));

describe("HolidayManager Service", () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const mockAuditInfo = {
    ipAddress: "127.0.0.1",
    userAgent: "test-agent",
    endpoint: "/api/test",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getHolidays", () => {
    it("should retrieve holidays with default options", async () => {
      const mockHolidays = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: "New Year",
          date: new Date("2024-01-01"),
          description: "New Year's Day",
          isRecurring: true,
          isActive: true,
        },
      ];

      const findSpy = vi.spyOn(Holiday, "find").mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockHolidays),
      });

      const countSpy = vi.spyOn(Holiday, "countDocuments").mockResolvedValue(1);

      const result = await holidayManager.getHolidays();

      expect(result.holidays).toEqual(mockHolidays);
      expect(result.pagination.total).toBe(1);
      expect(findSpy).toHaveBeenCalledWith({});
      expect(countSpy).toHaveBeenCalledWith({});
    });

    it("should apply filters correctly", async () => {
      const filters = {
        isActive: true,
        isRecurring: false,
        dateRange: {
          startDate: "2024-01-01",
          endDate: "2024-12-31",
        },
        search: "Christmas",
      };

      const findSpy = vi.spyOn(Holiday, "find").mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      });

      vi.spyOn(Holiday, "countDocuments").mockResolvedValue(0);

      await holidayManager.getHolidays(filters);

      expect(findSpy).toHaveBeenCalledWith({
        isActive: true,
        isRecurring: false,
        date: {
          $gte: new Date("2024-01-01"),
          $lte: new Date("2024-12-31"),
        },
        $or: [
          { name: { $regex: "Christmas", $options: "i" } },
          { description: { $regex: "Christmas", $options: "i" } },
        ],
      });
    });

    it("should handle errors gracefully", async () => {
      vi.spyOn(Holiday, "find").mockImplementation(() => {
        throw new Error("Database error");
      });

      await expect(holidayManager.getHolidays()).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("getHolidayById", () => {
    it("should retrieve a holiday by ID", async () => {
      const mockHoliday = {
        _id: new mongoose.Types.ObjectId(),
        name: "Christmas",
        date: new Date("2024-12-25"),
        isRecurring: true,
        isActive: true,
      };

      const findByIdSpy = vi.spyOn(Holiday, "findById").mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockHoliday),
      });

      const result = await holidayManager.getHolidayById(mockHoliday._id);

      expect(result).toEqual(mockHoliday);
      expect(findByIdSpy).toHaveBeenCalledWith(mockHoliday._id);
    });

    it("should throw error if holiday not found", async () => {
      vi.spyOn(Holiday, "findById").mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      });

      await expect(
        holidayManager.getHolidayById(new mongoose.Types.ObjectId())
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("createHoliday", () => {
    const validHolidayData = {
      name: "Test Holiday",
      date: new Date("2024-07-04"),
      description: "Test holiday description",
      isRecurring: false,
    };

    it("should create a holiday successfully", async () => {
      const mockCreatedHoliday = {
        _id: new mongoose.Types.ObjectId(),
        ...validHolidayData,
        createdBy: mockUserId,
        isActive: true,
        toObject: vi.fn().mockReturnValue({ ...validHolidayData }),
        formattedDate: "2024-07-04",
      };

      // Mock appointment conflict check
      vi.spyOn(Appointment, "find").mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      });

      vi.spyOn(Holiday, "createHoliday").mockResolvedValue(mockCreatedHoliday);

      const result = await holidayManager.createHoliday(
        validHolidayData,
        mockUserId,
        mockAuditInfo
      );

      expect(result).toEqual(validHolidayData);
      expect(Holiday.createHoliday).toHaveBeenCalledWith(
        validHolidayData,
        mockUserId
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          resourceType: "Holiday",
          success: true,
        })
      );
    });

    it("should validate holiday data", async () => {
      const invalidData = {
        name: "", // Empty name
        date: new Date("2024-07-04"),
      };

      await expect(
        holidayManager.createHoliday(invalidData, mockUserId, mockAuditInfo)
      ).rejects.toThrow(ValidationError);
    });

    it("should check for appointment conflicts", async () => {
      // Mock existing appointments
      vi.spyOn(Appointment, "find").mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(2),
      });

      await expect(
        holidayManager.createHoliday(
          validHolidayData,
          mockUserId,
          mockAuditInfo
        )
      ).rejects.toThrow(ValidationError);
    });

    it("should log failed creation attempts", async () => {
      vi.spyOn(Appointment, "find").mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      });

      vi.spyOn(Holiday, "createHoliday").mockRejectedValue(
        new Error("Creation failed")
      );

      await expect(
        holidayManager.createHoliday(
          validHolidayData,
          mockUserId,
          mockAuditInfo
        )
      ).rejects.toThrow(ValidationError);

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          success: false,
        })
      );
    });
  });

  describe("updateHoliday", () => {
    const holidayId = new mongoose.Types.ObjectId();
    const updateData = {
      name: "Updated Holiday",
      description: "Updated description",
    };

    it("should update a holiday successfully", async () => {
      const mockHoliday = {
        _id: holidayId,
        name: "Original Holiday",
        date: new Date("2024-07-04"),
        description: "Original description",
        isRecurring: false,
        isActive: true,
        toObject: vi.fn().mockReturnValue({
          name: "Original Holiday",
          date: new Date("2024-07-04"),
        }),
        updateHoliday: vi.fn().mockResolvedValue({
          ...updateData,
          toObject: vi.fn().mockReturnValue(updateData),
        }),
      };

      vi.spyOn(Holiday, "findById").mockResolvedValue(mockHoliday);

      const result = await holidayManager.updateHoliday(
        holidayId,
        updateData,
        mockUserId,
        mockAuditInfo
      );

      expect(result).toEqual(updateData);
      expect(mockHoliday.updateHoliday).toHaveBeenCalledWith(
        updateData,
        mockUserId
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          resourceType: "Holiday",
          success: true,
        })
      );
    });

    it("should throw error if holiday not found", async () => {
      vi.spyOn(Holiday, "findById").mockResolvedValue(null);

      await expect(
        holidayManager.updateHoliday(
          holidayId,
          updateData,
          mockUserId,
          mockAuditInfo
        )
      ).rejects.toThrow(ValidationError);
    });

    it("should check for appointment conflicts when date is changed", async () => {
      const mockHoliday = {
        _id: holidayId,
        name: "Original Holiday",
        date: new Date("2024-07-04"),
        toObject: vi.fn().mockReturnValue({}),
      };

      const updateWithNewDate = {
        ...updateData,
        date: new Date("2024-07-05"),
      };

      vi.spyOn(Holiday, "findById").mockResolvedValue(mockHoliday);
      vi.spyOn(Appointment, "find").mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(1),
      });

      await expect(
        holidayManager.updateHoliday(
          holidayId,
          updateWithNewDate,
          mockUserId,
          mockAuditInfo
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("deleteHoliday", () => {
    const holidayId = new mongoose.Types.ObjectId();

    it("should delete (deactivate) a holiday successfully", async () => {
      const mockHoliday = {
        _id: holidayId,
        name: "Test Holiday",
        date: new Date("2024-07-04"),
        isActive: true,
        formattedDate: "2024-07-04",
        deactivate: vi.fn().mockResolvedValue({
          toObject: vi.fn().mockReturnValue({ isActive: false }),
        }),
      };

      vi.spyOn(Holiday, "findById").mockResolvedValue(mockHoliday);

      const result = await holidayManager.deleteHoliday(
        holidayId,
        mockUserId,
        mockAuditInfo
      );

      expect(mockHoliday.deactivate).toHaveBeenCalledWith(mockUserId);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          resourceType: "Holiday",
          success: true,
        })
      );
    });

    it("should throw error if holiday not found", async () => {
      vi.spyOn(Holiday, "findById").mockResolvedValue(null);

      await expect(
        holidayManager.deleteHoliday(holidayId, mockUserId, mockAuditInfo)
      ).rejects.toThrow(ValidationError);
    });

    it("should throw error if holiday is already deleted", async () => {
      const mockHoliday = {
        _id: holidayId,
        isActive: false,
      };

      vi.spyOn(Holiday, "findById").mockResolvedValue(mockHoliday);

      await expect(
        holidayManager.deleteHoliday(holidayId, mockUserId, mockAuditInfo)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("bulkCreateHolidays", () => {
    const validHolidaysData = [
      {
        name: "Holiday 1",
        date: new Date("2024-07-04"),
        description: "First holiday",
        isRecurring: false,
      },
      {
        name: "Holiday 2",
        date: new Date("2024-12-25"),
        description: "Second holiday",
        isRecurring: true,
      },
    ];

    it("should bulk create holidays successfully", async () => {
      // Mock appointment conflict checks
      vi.spyOn(Appointment, "find").mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      });

      const mockResults = {
        results: [
          { success: true, holiday: validHolidaysData[0] },
          { success: true, holiday: validHolidaysData[1] },
        ],
        errors: [],
      };

      vi.spyOn(Holiday, "bulkCreateHolidays").mockResolvedValue(mockResults);

      const result = await holidayManager.bulkCreateHolidays(
        validHolidaysData,
        mockUserId,
        mockAuditInfo
      );

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
    });

    it("should validate bulk data", async () => {
      await expect(
        holidayManager.bulkCreateHolidays([], mockUserId, mockAuditInfo)
      ).rejects.toThrow(ValidationError);

      await expect(
        holidayManager.bulkCreateHolidays(
          "not an array",
          mockUserId,
          mockAuditInfo
        )
      ).rejects.toThrow(ValidationError);
    });

    it("should enforce bulk limits", async () => {
      const tooManyHolidays = Array(101).fill(validHolidaysData[0]);

      await expect(
        holidayManager.bulkCreateHolidays(
          tooManyHolidays,
          mockUserId,
          mockAuditInfo
        )
      ).rejects.toThrow(ValidationError);
    });

    it("should validate individual holiday data", async () => {
      const invalidHolidaysData = [
        validHolidaysData[0],
        { name: "", date: new Date() }, // Invalid data
      ];

      await expect(
        holidayManager.bulkCreateHolidays(
          invalidHolidaysData,
          mockUserId,
          mockAuditInfo
        )
      ).rejects.toThrow(ValidationError);
    });

    it("should check for appointment conflicts", async () => {
      // Mock conflict for second holiday
      vi.spyOn(Appointment, "find")
        .mockReturnValueOnce({
          countDocuments: vi.fn().mockResolvedValue(0),
        })
        .mockReturnValueOnce({
          countDocuments: vi.fn().mockResolvedValue(1),
        });

      await expect(
        holidayManager.bulkCreateHolidays(
          validHolidaysData,
          mockUserId,
          mockAuditInfo
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("bulkUpdateHolidays", () => {
    const updates = [
      {
        id: new mongoose.Types.ObjectId(),
        data: { name: "Updated Holiday 1" },
      },
      {
        id: new mongoose.Types.ObjectId(),
        data: { name: "Updated Holiday 2" },
      },
    ];

    it("should bulk update holidays successfully", async () => {
      // Mock successful individual updates
      vi.spyOn(holidayManager, "updateHoliday")
        .mockResolvedValueOnce({ name: "Updated Holiday 1" })
        .mockResolvedValueOnce({ name: "Updated Holiday 2" });

      const result = await holidayManager.bulkUpdateHolidays(
        updates,
        mockUserId,
        mockAuditInfo
      );

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.summary.successful).toBe(2);
    });

    it("should handle partial failures", async () => {
      // Mock one success and one failure
      vi.spyOn(holidayManager, "updateHoliday")
        .mockResolvedValueOnce({ name: "Updated Holiday 1" })
        .mockRejectedValueOnce(new Error("Update failed"));

      const result = await holidayManager.bulkUpdateHolidays(
        updates,
        mockUserId,
        mockAuditInfo
      );

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
    });

    it("should validate update data structure", async () => {
      const invalidUpdates = [{ id: "123" }]; // Missing data field

      await expect(
        holidayManager.bulkUpdateHolidays(
          invalidUpdates,
          mockUserId,
          mockAuditInfo
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("bulkDeleteHolidays", () => {
    const holidayIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];

    it("should bulk delete holidays successfully", async () => {
      // Mock successful individual deletions
      vi.spyOn(holidayManager, "deleteHoliday")
        .mockResolvedValueOnce({ isActive: false })
        .mockResolvedValueOnce({ isActive: false });

      const result = await holidayManager.bulkDeleteHolidays(
        holidayIds,
        mockUserId,
        mockAuditInfo
      );

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.summary.successful).toBe(2);
    });

    it("should handle partial failures", async () => {
      // Mock one success and one failure
      vi.spyOn(holidayManager, "deleteHoliday")
        .mockResolvedValueOnce({ isActive: false })
        .mockRejectedValueOnce(new Error("Delete failed"));

      const result = await holidayManager.bulkDeleteHolidays(
        holidayIds,
        mockUserId,
        mockAuditInfo
      );

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  describe("isHoliday", () => {
    it("should check if a date is a holiday", async () => {
      const testDate = new Date("2024-12-25");
      const mockHoliday = { name: "Christmas", date: testDate };

      vi.spyOn(Holiday, "getHolidayForDate").mockResolvedValue(mockHoliday);

      const result = await holidayManager.isHoliday(testDate);

      expect(result).toEqual(mockHoliday);
      expect(Holiday.getHolidayForDate).toHaveBeenCalledWith(testDate);
    });

    it("should return null if date is not a holiday", async () => {
      const testDate = new Date("2024-07-15");

      vi.spyOn(Holiday, "getHolidayForDate").mockResolvedValue(null);

      const result = await holidayManager.isHoliday(testDate);

      expect(result).toBeNull();
    });
  });

  describe("getHolidaysInRange", () => {
    it("should get holidays in a date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");
      const mockHolidays = [
        { name: "New Year", effectiveDate: new Date("2024-01-01") },
        { name: "Christmas", effectiveDate: new Date("2024-12-25") },
      ];

      vi.spyOn(Holiday, "getHolidaysInRange").mockResolvedValue(mockHolidays);

      const result = await holidayManager.getHolidaysInRange(
        startDate,
        endDate
      );

      expect(result).toEqual(mockHolidays);
      expect(Holiday.getHolidaysInRange).toHaveBeenCalledWith(
        startDate,
        endDate
      );
    });
  });

  describe("getUpcomingHolidays", () => {
    it("should get upcoming holidays", async () => {
      const mockUpcomingHolidays = [
        { name: "Next Holiday", nextOccurrence: new Date("2024-07-04") },
      ];

      vi.spyOn(Holiday, "getUpcomingHolidays").mockResolvedValue(
        mockUpcomingHolidays
      );

      const result = await holidayManager.getUpcomingHolidays(5);

      expect(result).toEqual(mockUpcomingHolidays);
      expect(Holiday.getUpcomingHolidays).toHaveBeenCalledWith(5);
    });
  });

  describe("getHolidayStats", () => {
    it("should get holiday statistics", async () => {
      const mockStats = {
        totalHolidays: 10,
        recurringHolidays: 6,
        oneTimeHolidays: 4,
      };

      vi.spyOn(Holiday, "getHolidayStats").mockResolvedValue(mockStats);

      const result = await holidayManager.getHolidayStats();

      expect(result).toEqual(mockStats);
      expect(Holiday.getHolidayStats).toHaveBeenCalled();
    });
  });

  describe("reactivateHoliday", () => {
    const holidayId = new mongoose.Types.ObjectId();

    it("should reactivate a deactivated holiday", async () => {
      const mockHoliday = {
        _id: holidayId,
        name: "Test Holiday",
        date: new Date("2024-07-04"),
        isActive: false,
        formattedDate: "2024-07-04",
        reactivate: vi.fn().mockResolvedValue({
          toObject: vi.fn().mockReturnValue({ isActive: true }),
        }),
      };

      vi.spyOn(Holiday, "findById").mockResolvedValue(mockHoliday);
      vi.spyOn(Appointment, "find").mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      });

      const result = await holidayManager.reactivateHoliday(
        holidayId,
        mockUserId,
        mockAuditInfo
      );

      expect(mockHoliday.reactivate).toHaveBeenCalledWith(mockUserId);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          success: true,
        })
      );
    });

    it("should throw error if holiday is already active", async () => {
      const mockHoliday = {
        _id: holidayId,
        isActive: true,
      };

      vi.spyOn(Holiday, "findById").mockResolvedValue(mockHoliday);

      await expect(
        holidayManager.reactivateHoliday(holidayId, mockUserId, mockAuditInfo)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("_validateHolidayData", () => {
    it("should validate valid holiday data", () => {
      const validData = {
        name: "Test Holiday",
        date: new Date("2024-07-04"),
        description: "Test description",
        isRecurring: false,
      };

      expect(() => {
        holidayManager._validateHolidayData(validData);
      }).not.toThrow();
    });

    it("should throw error for missing name", () => {
      const invalidData = {
        date: new Date("2024-07-04"),
      };

      expect(() => {
        holidayManager._validateHolidayData(invalidData);
      }).toThrow(ValidationError);
    });

    it("should throw error for invalid date", () => {
      const invalidData = {
        name: "Test Holiday",
        date: "invalid-date",
      };

      expect(() => {
        holidayManager._validateHolidayData(invalidData);
      }).toThrow(ValidationError);
    });

    it("should throw error for name too long", () => {
      const invalidData = {
        name: "a".repeat(101),
        date: new Date("2024-07-04"),
      };

      expect(() => {
        holidayManager._validateHolidayData(invalidData);
      }).toThrow(ValidationError);
    });

    it("should throw error for description too long", () => {
      const invalidData = {
        name: "Test Holiday",
        date: new Date("2024-07-04"),
        description: "a".repeat(501),
      };

      expect(() => {
        holidayManager._validateHolidayData(invalidData);
      }).toThrow(ValidationError);
    });
  });

  describe("_validateNoAppointmentConflicts", () => {
    it("should pass validation when no appointments exist", async () => {
      vi.spyOn(Appointment, "find").mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(0),
      });

      await expect(
        holidayManager._validateNoAppointmentConflicts(new Date("2024-07-04"))
      ).resolves.not.toThrow();
    });

    it("should throw error when appointments exist", async () => {
      vi.spyOn(Appointment, "find").mockReturnValue({
        countDocuments: vi.fn().mockResolvedValue(2),
      });

      await expect(
        holidayManager._validateNoAppointmentConflicts(new Date("2024-07-04"))
      ).rejects.toThrow(ValidationError);
    });
  });
});
