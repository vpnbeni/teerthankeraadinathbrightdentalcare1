import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import AvailabilityCalculator from "../../services/availabilityCalculator.js";
import AvailabilityTemplate from "../../models/AvailabilityTemplate.js";
import Holiday from "../../models/Holiday.js";
import CustomDateAvailability from "../../models/CustomDateAvailability.js";
import Appointment from "../../models/Appointment.js";
import User from "../../models/User.js";

describe("AvailabilityCalculator Integration Tests", () => {
  let mongoServer;
  let calculator;
  let testUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      phone: "1234567890",
      password: "hashedpassword",
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    calculator = new AvailabilityCalculator();

    // Clear all collections
    await AvailabilityTemplate.deleteMany({});
    await Holiday.deleteMany({});
    await CustomDateAvailability.deleteMany({});
    await Appointment.deleteMany({});

    // Clear calculator cache
    calculator.clearCache();
  });

  describe("Template-based availability", () => {
    it("should return default template slots for working days", async () => {
      // Create default template
      await AvailabilityTemplate.create({
        _id: "availability_template",
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
            maxBookings: 1,
          },
          {
            startTime: "14:00",
            endTime: "15:00",
            isActive: true,
            maxBookings: 1,
          },
        ],
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        updatedBy: testUser._id,
      });

      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 7); // Next week
      // Ensure it's a weekday (Monday = 1)
      while (testDate.getDay() === 0 || testDate.getDay() === 6) {
        testDate.setDate(testDate.getDate() + 1);
      }

      const result = await calculator.getAvailableSlotsForDate(testDate);

      expect(result.isDefault).toBe(true);
      expect(result.source).toBe("template");
      expect(result.slots).toHaveLength(3);
      expect(result.availableSlots).toBe(3);
      expect(result.slots[0]).toMatchObject({
        startTime: "09:00",
        endTime: "10:00",
        isAvailable: true,
        maxBookings: 1,
        currentBookings: 0,
      });
    });

    it("should return empty slots for non-working days", async () => {
      // Create template with Monday-Friday working days
      await AvailabilityTemplate.create({
        _id: "availability_template",
        defaultSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isActive: true,
            maxBookings: 1,
          },
        ],
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        updatedBy: testUser._id,
      });

      const sunday = new Date();
      sunday.setDate(sunday.getDate() + (7 - sunday.getDay())); // Next Sunday

      const result = await calculator.getAvailableSlotsForDate(sunday);

      expect(result.isWorkingDay).toBe(false);
      expect(result.source).toBe("template");
      expect(result.slots).toHaveLength(0);
      expect(result.availableSlots).toBe(0);
    });
  });

  describe("Holiday handling", () => {
    it("should return empty slots for holiday dates", async () => {
      // Create template
      await AvailabilityTemplate.create({
        _id: "availability_template",
        defaultSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isActive: true,
            maxBookings: 1,
          },
        ],
        workingDays: [1, 2, 3, 4, 5, 6, 0], // All days
        updatedBy: testUser._id,
      });

      const holidayDate = new Date();
      holidayDate.setDate(holidayDate.getDate() + 7);

      // Create holiday
      await Holiday.create({
        date: holidayDate,
        name: "Test Holiday",
        description: "Integration test holiday",
        createdBy: testUser._id,
      });

      const result = await calculator.getAvailableSlotsForDate(holidayDate);

      expect(result.isHoliday).toBe(true);
      expect(result.holidayName).toBe("Test Holiday");
      expect(result.source).toBe("holiday");
      expect(result.slots).toHaveLength(0);
      expect(result.availableSlots).toBe(0);
    });
  });

  describe("Custom date availability", () => {
    it("should return custom slots for dates with custom availability", async () => {
      // Create template
      await AvailabilityTemplate.create({
        _id: "availability_template",
        defaultSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isActive: true,
            maxBookings: 1,
          },
        ],
        workingDays: [1, 2, 3, 4, 5],
        updatedBy: testUser._id,
      });

      const customDate = new Date();
      customDate.setDate(customDate.getDate() + 7);

      // Create custom date availability
      await CustomDateAvailability.create({
        date: customDate,
        customSlots: [
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
            maxBookings: 2,
          },
        ],
        reason: "Extended hours",
        notes: "Special event coverage",
        createdBy: testUser._id,
      });

      const result = await calculator.getAvailableSlotsForDate(customDate);

      expect(result.isCustom).toBe(true);
      expect(result.customReason).toBe("Extended hours");
      expect(result.source).toBe("custom");
      expect(result.slots).toHaveLength(2);
      expect(result.availableSlots).toBe(2);
      expect(result.slots[1]).toMatchObject({
        startTime: "08:00",
        endTime: "09:00",
        isAvailable: true,
        maxBookings: 2,
        currentBookings: 0,
      });
    });
  });

  describe("Booking integration", () => {
    it("should filter out booked slots", async () => {
      // Create template
      await AvailabilityTemplate.create({
        _id: "availability_template",
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
            maxBookings: 1,
          },
        ],
        workingDays: [1, 2, 3, 4, 5, 6, 0],
        updatedBy: testUser._id,
      });

      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 7);

      // Create existing appointment
      await Appointment.create({
        userId: testUser._id,
        date: testDate,
        timeSlot: "09:00-10:00",
        status: "confirmed",
      });

      const result = await calculator.getAvailableSlotsForDate(testDate);

      expect(result.slots).toHaveLength(2);
      expect(result.availableSlots).toBe(1); // One slot is booked

      const bookedSlot = result.slots.find((s) => s.timeSlot === "09:00-10:00");
      const availableSlot = result.slots.find(
        (s) => s.timeSlot === "10:00-11:00"
      );

      expect(bookedSlot.isAvailable).toBe(false);
      expect(bookedSlot.currentBookings).toBe(1);
      expect(availableSlot.isAvailable).toBe(true);
      expect(availableSlot.currentBookings).toBe(0);
    });

    it("should validate slot booking correctly", async () => {
      // Create template
      await AvailabilityTemplate.create({
        _id: "availability_template",
        defaultSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isActive: true,
            maxBookings: 1,
          },
        ],
        workingDays: [1, 2, 3, 4, 5, 6, 0],
        updatedBy: testUser._id,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(9, 0, 0, 0);

      const result = await calculator.validateSlotBooking(
        futureDate,
        "09:00-10:00"
      );

      expect(result.isValid).toBe(true);
      expect(result.slot).toMatchObject({
        startTime: "09:00",
        endTime: "10:00",
        maxBookings: 1,
        currentBookings: 0,
        remainingCapacity: 1,
      });
    });
  });

  describe("Caching behavior", () => {
    it("should cache template data across multiple calls", async () => {
      // Create template
      const template = await AvailabilityTemplate.create({
        _id: "availability_template",
        defaultSlots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            isActive: true,
            maxBookings: 1,
          },
        ],
        workingDays: [1, 2, 3, 4, 5],
        updatedBy: testUser._id,
      });

      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 7);
      // Ensure it's a weekday
      while (testDate.getDay() === 0 || testDate.getDay() === 6) {
        testDate.setDate(testDate.getDate() + 1);
      }

      // First call
      const result1 = await calculator.getAvailableSlotsForDate(testDate);

      // Second call should use cached data
      const result2 = await calculator.getAvailableSlotsForDate(testDate);

      expect(result1).toEqual(result2);
      expect(result1.isDefault).toBe(true);
      expect(result1.slots).toHaveLength(1);
    });
  });
});
