import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import Availability from "../../models/Availability.js";
import AvailabilitySettings from "../../models/AvailabilitySettings.js";
import User from "../../models/User.js";

describe("Availability Model", () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      name: "Test Admin",
      email: "admin@test.com",
      phone: "1234567890",
      password: "hashedpassword",
      role: "admin",
    });
  });

  describe("Schema Validation", () => {
    it("should create availability with valid data", async () => {
      const availabilityData = {
        date: new Date("2024-12-01"),
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isAvailable: true,
            maxBookings: 1,
            currentBookings: 0,
          },
        ],
        createdBy: testUser._id,
      };

      const availability = new Availability(availabilityData);
      await expect(availability.save()).resolves.toBeDefined();
    });

    it("should reject availability with past date", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const availabilityData = {
        date: yesterday,
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
          },
        ],
        createdBy: testUser._id,
      };

      const availability = new Availability(availabilityData);
      await expect(availability.save()).rejects.toThrow(
        "Availability date cannot be in the past"
      );
    });

    it("should reject overlapping time slots", async () => {
      const availabilityData = {
        date: new Date("2024-12-01"),
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:30",
          },
          {
            startTime: "10:00",
            endTime: "11:00",
          },
        ],
        createdBy: testUser._id,
      };

      const availability = new Availability(availabilityData);
      await expect(availability.save()).rejects.toThrow(
        "Time slots cannot overlap"
      );
    });

    it("should reject time slots with invalid duration", async () => {
      const availabilityData = {
        date: new Date("2024-12-01"),
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "09:10", // Less than 15 minutes
          },
        ],
        createdBy: testUser._id,
      };

      const availability = new Availability(availabilityData);
      await expect(availability.save()).rejects.toThrow(
        "Time slot must be at least 15 minutes long"
      );
    });

    it("should reject time slots exceeding maximum duration", async () => {
      const availabilityData = {
        date: new Date("2024-12-01"),
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "14:00", // More than 4 hours
          },
        ],
        createdBy: testUser._id,
      };

      const availability = new Availability(availabilityData);
      await expect(availability.save()).rejects.toThrow(
        "Time slot cannot exceed 4 hours"
      );
    });
  });

  describe("Time Slot Methods", () => {
    let availability;

    beforeEach(async () => {
      availability = await Availability.create({
        date: new Date("2024-12-01"),
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isAvailable: true,
            maxBookings: 2,
            currentBookings: 0,
          },
          {
            startTime: "10:00",
            endTime: "11:00",
            isAvailable: true,
            maxBookings: 1,
            currentBookings: 1,
          },
        ],
        createdBy: testUser._id,
      });
    });

    it("should check if slot can accept booking", () => {
      expect(availability.timeSlots[0].canAcceptBooking()).toBe(true);
      expect(availability.timeSlots[1].canAcceptBooking()).toBe(false);
    });

    it("should check if slot is fully booked", () => {
      expect(availability.timeSlots[0].isFullyBooked()).toBe(false);
      expect(availability.timeSlots[1].isFullyBooked()).toBe(true);
    });

    it("should book a time slot", () => {
      const slot = availability.bookTimeSlot(0, testUser._id);
      expect(slot.currentBookings).toBe(1);
      expect(availability.auditLog).toHaveLength(2); // Created + slot modified
    });

    it("should cancel booking in time slot", () => {
      availability.timeSlots[1].currentBookings = 1;
      const slot = availability.cancelBookingInSlot(1, testUser._id);
      expect(slot.currentBookings).toBe(0);
    });

    it("should throw error when booking unavailable slot", () => {
      expect(() => {
        availability.bookTimeSlot(1, testUser._id);
      }).toThrow("Time slot is not available for booking");
    });
  });

  describe("Business Rule Validation", () => {
    beforeEach(async () => {
      // Create default settings
      await AvailabilitySettings.create({
        _id: "availability_settings",
        workingDays: [1, 2, 3, 4, 5],
        advanceBookingDays: 30,
        breakTimes: [
          {
            startTime: "12:00",
            endTime: "13:00",
            name: "Lunch",
            isActive: true,
          },
        ],
      });
    });

    it("should validate against break times", async () => {
      const availabilityData = {
        date: new Date("2024-12-02"), // Monday
        timeSlots: [
          {
            startTime: "12:30",
            endTime: "13:30", // Overlaps with lunch break
            isAvailable: true,
          },
        ],
        createdBy: testUser._id,
      };

      const availability = new Availability(availabilityData);
      await expect(availability.save()).rejects.toThrow(
        "conflicts with break time"
      );
    });

    it("should validate advance booking limit", async () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 40); // More than 30 days

      const availabilityData = {
        date: farFuture,
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
          },
        ],
        createdBy: testUser._id,
      };

      const availability = new Availability(availabilityData);
      await expect(availability.save()).rejects.toThrow(
        "more than 30 days in advance"
      );
    });
  });

  describe("Static Methods", () => {
    beforeEach(async () => {
      // Create test availability records
      await Availability.create({
        date: new Date("2024-12-01"),
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isAvailable: true,
            maxBookings: 1,
            currentBookings: 0,
          },
        ],
        createdBy: testUser._id,
        status: "active",
      });

      await Availability.create({
        date: new Date("2024-12-02"),
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isAvailable: true,
            maxBookings: 1,
            currentBookings: 1,
          },
        ],
        createdBy: testUser._id,
        status: "active",
        isHoliday: true,
      });
    });

    it("should get availability range", async () => {
      const startDate = new Date("2024-12-01");
      const endDate = new Date("2024-12-02");

      const availabilities = await Availability.getAvailabilityRange(
        startDate,
        endDate
      );
      expect(availabilities).toHaveLength(2);
    });

    it("should get availability range with filters", async () => {
      const startDate = new Date("2024-12-01");
      const endDate = new Date("2024-12-02");

      const holidays = await Availability.getAvailabilityRange(
        startDate,
        endDate,
        {
          isHoliday: true,
        }
      );
      expect(holidays).toHaveLength(1);
      expect(holidays[0].isHoliday).toBe(true);
    });

    it("should find availability by date", async () => {
      const availability = await Availability.findByDate("2024-12-01");
      expect(availability).toBeDefined();
      expect(availability.date.toISOString().split("T")[0]).toBe("2024-12-01");
    });

    it("should get availability statistics", async () => {
      const startDate = new Date("2024-12-01");
      const endDate = new Date("2024-12-02");

      const stats = await Availability.getAvailabilityStats(startDate, endDate);
      expect(stats).toHaveLength(1);
      expect(stats[0].totalSlots).toBe(2);
      expect(stats[0].availableSlots).toBe(1);
      expect(stats[0].currentBookings).toBe(1);
    });

    it("should create default availability", async () => {
      // Create settings first
      await AvailabilitySettings.create({
        _id: "availability_settings",
        workingDays: [1, 2, 3, 4, 5],
        defaultTimeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            maxBookings: 1,
            isActive: true,
          },
        ],
        breakTimes: [],
      });

      const date = new Date("2024-12-03"); // Tuesday
      const availability = await Availability.createDefaultAvailability(
        date,
        testUser._id
      );

      expect(availability.timeSlots).toHaveLength(1);
      expect(availability.timeSlots[0].startTime).toBe("09:00");
    });
  });

  describe("Audit Logging", () => {
    it("should create audit log entry on creation", async () => {
      const availability = await Availability.create({
        date: new Date("2024-12-01"),
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
          },
        ],
        createdBy: testUser._id,
      });

      expect(availability.auditLog).toHaveLength(1);
      expect(availability.auditLog[0].action).toBe("created");
      expect(availability.auditLog[0].performedBy.toString()).toBe(
        testUser._id.toString()
      );
    });

    it("should add audit entry when booking slot", async () => {
      const availability = await Availability.create({
        date: new Date("2024-12-01"),
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            maxBookings: 2,
            currentBookings: 0,
          },
        ],
        createdBy: testUser._id,
      });

      availability.bookTimeSlot(0, testUser._id);

      expect(availability.auditLog).toHaveLength(2); // Created + slot modified
      expect(availability.auditLog[1].action).toBe("slot_modified");
      expect(availability.auditLog[1].changes.action).toBe("booking_added");
    });
  });

  describe("Virtual Properties", () => {
    it("should calculate available slots count", async () => {
      const availability = await Availability.create({
        date: new Date("2024-12-01"),
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isAvailable: true,
            maxBookings: 1,
            currentBookings: 0,
          },
          {
            startTime: "10:00",
            endTime: "11:00",
            isAvailable: true,
            maxBookings: 1,
            currentBookings: 1,
          },
          {
            startTime: "11:00",
            endTime: "12:00",
            isAvailable: false,
            maxBookings: 1,
            currentBookings: 0,
          },
        ],
        createdBy: testUser._id,
      });

      expect(availability.availableSlotsCount).toBe(1);
    });

    it("should calculate total capacity", async () => {
      const availability = await Availability.create({
        date: new Date("2024-12-01"),
        timeSlots: [
          { startTime: "09:00", endTime: "10:00", maxBookings: 2 },
          { startTime: "10:00", endTime: "11:00", maxBookings: 1 },
        ],
        createdBy: testUser._id,
      });

      expect(availability.totalCapacity).toBe(3);
    });

    it("should format date correctly", async () => {
      const availability = await Availability.create({
        date: new Date("2024-12-01"),
        timeSlots: [{ startTime: "09:00", endTime: "10:00" }],
        createdBy: testUser._id,
      });

      expect(availability.formattedDate).toBe("2024-12-01");
    });
  });
});
