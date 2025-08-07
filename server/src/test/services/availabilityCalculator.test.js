import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import AvailabilityCalculator from "../../services/availabilityCalculator.js";
import AvailabilityTemplate from "../../models/AvailabilityTemplate.js";
import Holiday from "../../models/Holiday.js";
import CustomDateAvailability from "../../models/CustomDateAvailability.js";
import Appointment from "../../models/Appointment.js";

// Mock the models
jest.mock("../../models/AvailabilityTemplate.js");
jest.mock("../../models/Holiday.js");
jest.mock("../../models/CustomDateAvailability.js");
jest.mock("../../models/Appointment.js", () => ({
  default: {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    }),
  },
}));

describe("AvailabilityCalculator", () => {
  let calculator;
  let mockTemplate;
  let mockDate;

  beforeEach(() => {
    calculator = new AvailabilityCalculator();
    mockDate = new Date("2024-03-15T10:00:00Z"); // Friday

    // Setup Appointment mock
    Appointment.find = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    // Mock template with default 8 AM to 6 PM slots
    mockTemplate = {
      defaultSlots: [
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
        {
          startTime: "10:00",
          endTime: "11:00",
          isActive: true,
          maxBookings: 1,
        },
        {
          startTime: "11:00",
          endTime: "12:00",
          isActive: true,
          maxBookings: 1,
        },
        {
          startTime: "13:00",
          endTime: "14:00",
          isActive: true,
          maxBookings: 1,
        },
        {
          startTime: "14:00",
          endTime: "15:00",
          isActive: true,
          maxBookings: 1,
        },
        {
          startTime: "15:00",
          endTime: "16:00",
          isActive: true,
          maxBookings: 1,
        },
        {
          startTime: "16:00",
          endTime: "17:00",
          isActive: true,
          maxBookings: 1,
        },
        {
          startTime: "17:00",
          endTime: "18:00",
          isActive: true,
          maxBookings: 1,
        },
      ],
      workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
      isWorkingDay: jest.fn((date) => {
        const dayOfWeek = date.getDay();
        return [1, 2, 3, 4, 5, 6].includes(dayOfWeek);
      }),
      getActiveSlots: jest.fn(() =>
        mockTemplate.defaultSlots.filter((slot) => slot.isActive)
      ),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    calculator.clearCache();
  });

  describe("getAvailableSlotsForDate", () => {
    it("should return empty slots for holidays", async () => {
      // Mock holiday check
      const mockHoliday = {
        name: "Test Holiday",
        description: "Test holiday description",
      };
      Holiday.getHolidayForDate.mockResolvedValue(mockHoliday);

      const result = await calculator.getAvailableSlotsForDate(mockDate);

      expect(result).toEqual({
        date: "2024-03-15",
        slots: [],
        isHoliday: true,
        holidayName: "Test Holiday",
        holidayDescription: "Test holiday description",
        source: "holiday",
        totalSlots: 0,
        availableSlots: 0,
      });

      expect(Holiday.getHolidayForDate).toHaveBeenCalledWith(expect.any(Date));
    });

    it("should return custom slots for dates with custom availability", async () => {
      // Mock no holiday
      Holiday.getHolidayForDate.mockResolvedValue(null);

      // Mock custom date availability
      const mockCustomDate = {
        reason: "Extended hours",
        notes: "Special event coverage",
        getActiveSlots: jest.fn(() => [
          {
            startTime: "07:00",
            endTime: "08:00",
            isActive: true,
            maxBookings: 1,
          },
          {
            startTime: "08:00",
            endTime: "09:00",
            isActive: true,
            maxBookings: 1,
          },
        ]),
      };
      CustomDateAvailability.findByDate.mockResolvedValue(mockCustomDate);

      // Mock no existing appointments
      Appointment.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      const result = await calculator.getAvailableSlotsForDate(mockDate);

      expect(result.isCustom).toBe(true);
      expect(result.customReason).toBe("Extended hours");
      expect(result.customNotes).toBe("Special event coverage");
      expect(result.source).toBe("custom");
      expect(result.slots).toHaveLength(2);
      expect(result.totalSlots).toBe(2);
      expect(result.availableSlots).toBe(2);
    });

    it("should return template slots for regular working days", async () => {
      // Mock no holiday
      Holiday.getHolidayForDate.mockResolvedValue(null);

      // Mock no custom date
      CustomDateAvailability.findByDate.mockResolvedValue(null);

      // Mock template
      AvailabilityTemplate.getTemplate.mockResolvedValue(mockTemplate);

      // Mock no existing appointments
      Appointment.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      const result = await calculator.getAvailableSlotsForDate(mockDate);

      expect(result.isDefault).toBe(true);
      expect(result.source).toBe("template");
      expect(result.slots).toHaveLength(9);
      expect(result.totalSlots).toBe(9);
      expect(result.availableSlots).toBe(9);
      expect(result.slots[0]).toEqual({
        startTime: "08:00",
        endTime: "09:00",
        maxBookings: 1,
        currentBookings: 0,
        isAvailable: true,
        remainingCapacity: 1,
        timeSlot: "08:00-09:00",
      });
    });

    it("should return empty slots for non-working days", async () => {
      // Mock no holiday
      Holiday.getHolidayForDate.mockResolvedValue(null);

      // Mock no custom date
      CustomDateAvailability.findByDate.mockResolvedValue(null);

      // Mock template for Sunday (non-working day)
      const sundayDate = new Date("2024-03-17T10:00:00Z"); // Sunday
      mockTemplate.isWorkingDay.mockReturnValue(false);
      AvailabilityTemplate.getTemplate.mockResolvedValue(mockTemplate);

      const result = await calculator.getAvailableSlotsForDate(sundayDate);

      expect(result.isWorkingDay).toBe(false);
      expect(result.source).toBe("template");
      expect(result.slots).toEqual([]);
      expect(result.totalSlots).toBe(0);
      expect(result.availableSlots).toBe(0);
    });

    it("should filter out booked slots", async () => {
      // Mock no holiday
      Holiday.getHolidayForDate.mockResolvedValue(null);

      // Mock no custom date
      CustomDateAvailability.findByDate.mockResolvedValue(null);

      // Mock template
      AvailabilityTemplate.getTemplate.mockResolvedValue(mockTemplate);

      // Mock existing appointments
      Appointment.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { timeSlot: "09:00-10:00", status: "confirmed" },
          { timeSlot: "10:00-11:00", status: "scheduled" },
        ]),
      });

      const result = await calculator.getAvailableSlotsForDate(mockDate);

      expect(result.slots).toHaveLength(9);
      expect(result.availableSlots).toBe(7); // 9 total - 2 booked

      // Check that booked slots are marked as unavailable
      const slot9to10 = result.slots.find((s) => s.timeSlot === "09:00-10:00");
      const slot10to11 = result.slots.find((s) => s.timeSlot === "10:00-11:00");

      expect(slot9to10.isAvailable).toBe(false);
      expect(slot9to10.currentBookings).toBe(1);
      expect(slot10to11.isAvailable).toBe(false);
      expect(slot10to11.currentBookings).toBe(1);
    });
  });

  describe("getAvailableDatesInRange", () => {
    it("should return available dates in range", async () => {
      const startDate = new Date("2024-03-15T00:00:00Z");
      const endDate = new Date("2024-03-17T00:00:00Z");

      // Mock the getAvailableSlotsForDate method
      calculator.getAvailableSlotsForDate = jest
        .fn()
        .mockResolvedValueOnce({
          date: "2024-03-15",
          slots: [{ startTime: "09:00", endTime: "10:00", isAvailable: true }],
          availableSlots: 1,
          totalSlots: 1,
        })
        .mockResolvedValueOnce({
          date: "2024-03-16",
          slots: [],
          availableSlots: 0,
          totalSlots: 0,
          isHoliday: true,
        })
        .mockResolvedValueOnce({
          date: "2024-03-17",
          slots: [{ startTime: "09:00", endTime: "10:00", isAvailable: true }],
          availableSlots: 1,
          totalSlots: 1,
        });

      const result = await calculator.getAvailableDatesInRange(
        startDate,
        endDate
      );

      expect(result).toHaveLength(2); // Only dates with available slots
      expect(result[0].date).toBe("2024-03-15");
      expect(result[1].date).toBe("2024-03-17");
    });

    it("should include unavailable dates when includeUnavailable option is set", async () => {
      const startDate = new Date("2024-03-15T00:00:00Z");
      const endDate = new Date("2024-03-16T00:00:00Z");

      calculator.getAvailableSlotsForDate = jest
        .fn()
        .mockResolvedValueOnce({
          date: "2024-03-15",
          slots: [{ startTime: "09:00", endTime: "10:00", isAvailable: true }],
          availableSlots: 1,
        })
        .mockResolvedValueOnce({
          date: "2024-03-16",
          slots: [],
          availableSlots: 0,
          isHoliday: true,
        });

      const result = await calculator.getAvailableDatesInRange(
        startDate,
        endDate,
        { includeUnavailable: true }
      );

      expect(result).toHaveLength(2);
      expect(result[1].isHoliday).toBe(true);
    });

    it("should throw error for invalid date range", async () => {
      const startDate = new Date("2024-03-17T00:00:00Z");
      const endDate = new Date("2024-03-15T00:00:00Z");

      await expect(
        calculator.getAvailableDatesInRange(startDate, endDate)
      ).rejects.toThrow("Start date must be before or equal to end date");
    });
  });
  describe("validateSlotBooking", () => {
    beforeEach(() => {
      // Mock no holiday
      Holiday.getHolidayForDate.mockResolvedValue(null);
      // Mock no custom date
      CustomDateAvailability.findByDate.mockResolvedValue(null);
      // Mock template
      AvailabilityTemplate.getTemplate.mockResolvedValue(mockTemplate);
      // Mock no existing appointments
      Appointment.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });
    });

    it("should validate available slot booking", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const result = await calculator.validateSlotBooking(
        futureDate,
        "09:00-10:00"
      );

      expect(result.isValid).toBe(true);
      expect(result.slot).toEqual({
        startTime: "09:00",
        endTime: "10:00",
        maxBookings: 1,
        currentBookings: 0,
        remainingCapacity: 1,
      });
    });

    it("should reject booking on holiday", async () => {
      Holiday.getHolidayForDate.mockResolvedValue({
        name: "Test Holiday",
        description: "Test description",
      });

      const result = await calculator.validateSlotBooking(
        mockDate,
        "09:00-10:00"
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Date is a holiday: Test Holiday");
    });

    it("should reject booking for non-existent slot", async () => {
      const result = await calculator.validateSlotBooking(
        mockDate,
        "19:00-20:00"
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Requested time slot does not exist");
      expect(result.availableSlots).toBeDefined();
    });

    it("should reject booking for fully booked slot", async () => {
      // Mock existing appointment for the slot
      Appointment.find.mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue([
            { timeSlot: "09:00-10:00", status: "confirmed" },
          ]),
      });

      const result = await calculator.validateSlotBooking(
        mockDate,
        "09:00-10:00"
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Time slot is fully booked");
    });

    it("should reject booking in the past", async () => {
      const pastDate = new Date("2020-01-01T10:00:00Z");

      const result = await calculator.validateSlotBooking(
        pastDate,
        "09:00-10:00"
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Cannot book appointments in the past");
    });

    it("should reject booking without minimum notice", async () => {
      // Use fake timers
      jest.useFakeTimers();

      // Set current time to 8 AM local time
      const currentTime = new Date();
      currentTime.setHours(8, 0, 0, 0);
      jest.setSystemTime(currentTime);

      // Create appointment for same day at 9 AM (1 hour later, should fail with 2 hour minimum notice)
      const appointmentDate = new Date(currentTime);
      appointmentDate.setHours(9, 0, 0, 0);

      const result = await calculator.validateSlotBooking(
        appointmentDate,
        "09:00-10:00",
        {
          minimumNoticeHours: 2,
        }
      );

      // Restore real timers
      jest.useRealTimers();

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(
        "Appointments must be booked at least 2 hours in advance"
      );
    });

    it("should reject booking too far in advance", async () => {
      const farFutureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000); // 100 days from now

      const result = await calculator.validateSlotBooking(
        farFutureDate,
        "09:00-10:00",
        {
          maxAdvanceDays: 90,
        }
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(
        "Appointments cannot be booked more than 90 days in advance"
      );
    });
  });

  describe("getAvailabilityStats", () => {
    it("should calculate availability statistics", async () => {
      const startDate = new Date("2024-03-15T00:00:00Z");
      const endDate = new Date("2024-03-17T00:00:00Z");

      calculator.getAvailableDatesInRange = jest.fn().mockResolvedValue([
        {
          date: "2024-03-15",
          isDefault: true,
          totalSlots: 9,
          availableSlots: 7,
        },
        {
          date: "2024-03-16",
          isHoliday: true,
          totalSlots: 0,
          availableSlots: 0,
        },
        {
          date: "2024-03-17",
          isCustom: true,
          totalSlots: 5,
          availableSlots: 3,
        },
      ]);

      const stats = await calculator.getAvailabilityStats(startDate, endDate);

      expect(stats).toEqual({
        totalDates: 3,
        availableDates: 2,
        holidayDates: 1,
        customDates: 1,
        templateDates: 1,
        nonWorkingDays: 0,
        totalSlots: 14,
        availableSlots: 10,
        bookedSlots: 4,
        utilizationRate: 29, // 4/14 * 100 rounded
      });
    });
  });

  describe("caching", () => {
    it("should cache template data", async () => {
      // Mock no holiday and no custom date
      Holiday.getHolidayForDate.mockResolvedValue(null);
      CustomDateAvailability.findByDate.mockResolvedValue(null);
      AvailabilityTemplate.getTemplate.mockResolvedValue(mockTemplate);
      Appointment.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      // First call
      await calculator.getAvailableSlotsForDate(mockDate);
      expect(AvailabilityTemplate.getTemplate).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await calculator.getAvailableSlotsForDate(mockDate);
      expect(AvailabilityTemplate.getTemplate).toHaveBeenCalledTimes(1);
    });

    it("should cache holiday data", async () => {
      Holiday.getHolidayForDate.mockResolvedValue(null);

      // First call
      await calculator.getAvailableSlotsForDate(mockDate);
      expect(Holiday.getHolidayForDate).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await calculator.getAvailableSlotsForDate(mockDate);
      expect(Holiday.getHolidayForDate).toHaveBeenCalledTimes(1);
    });

    it("should clear all caches", async () => {
      // Set up some cached data
      Holiday.getHolidayForDate.mockResolvedValue(null);
      CustomDateAvailability.findByDate.mockResolvedValue(null);
      AvailabilityTemplate.getTemplate.mockResolvedValue(mockTemplate);
      Appointment.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await calculator.getAvailableSlotsForDate(mockDate);

      // Clear cache
      calculator.clearCache();

      // Next call should fetch fresh data
      await calculator.getAvailableSlotsForDate(mockDate);
      expect(AvailabilityTemplate.getTemplate).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      Holiday.getHolidayForDate.mockRejectedValue(new Error("Database error"));

      await expect(
        calculator.getAvailableSlotsForDate(mockDate)
      ).rejects.toThrow(
        "Failed to calculate availability for 2024-03-15: Database error"
      );
    });

    it("should handle invalid date inputs", async () => {
      await expect(
        calculator.getAvailableSlotsForDate("invalid-date")
      ).rejects.toThrow();
    });
  });
});
