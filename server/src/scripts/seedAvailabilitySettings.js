import mongoose from "mongoose";
import { config } from "../config/environment.js";
import AvailabilitySettings from "../models/AvailabilitySettings.js";

const seedAvailabilitySettings = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if settings already exist
    const existingSettings = await AvailabilitySettings.findById("availability_settings");
    
    if (existingSettings) {
      console.log("Availability settings already exist. Updating with new defaults...");
      
      // Update existing settings with new defaults
      existingSettings.workingDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday (all days)
      existingSettings.defaultTimeSlots = [
        // Monday to Saturday slots (8 AM - 6 PM)
        {
          startTime: "08:00",
          endTime: "09:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "09:00",
          endTime: "10:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "10:00",
          endTime: "11:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "11:00",
          endTime: "12:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "12:00",
          endTime: "13:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "13:00",
          endTime: "14:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "14:00",
          endTime: "15:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "15:00",
          endTime: "16:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "16:00",
          endTime: "17:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "17:00",
          endTime: "18:00",
          maxBookings: 1,
          isActive: true,
        },
      ];
      
      // Sunday slots (9 AM - 5 PM) - will be handled by custom day settings
      existingSettings.customDaySettings = {
        "0": { // Sunday
          startTime: "09:00",
          endTime: "17:00",
          isCustom: true,
        },
      };
      
      existingSettings.breakTimes = []; // No default break times
      existingSettings.slotDuration = 60; // 1 hour slots
      
      await existingSettings.save();
      console.log("Updated existing availability settings");
    } else {
      console.log("Creating new availability settings...");
      
      // Create new settings
      const settings = new AvailabilitySettings({
        _id: "availability_settings",
        workingDays: [0, 1, 2, 3, 4, 5, 6], // Sunday to Saturday (all days)
        defaultTimeSlots: [
          // Monday to Saturday slots (8 AM - 6 PM)
          {
            startTime: "08:00",
            endTime: "09:00",
            maxBookings: 1,
            isActive: true,
          },
          {
            startTime: "09:00",
            endTime: "10:00",
            maxBookings: 1,
            isActive: true,
          },
          {
            startTime: "10:00",
            endTime: "11:00",
            maxBookings: 1,
            isActive: true,
          },
          {
            startTime: "11:00",
            endTime: "12:00",
            maxBookings: 1,
            isActive: true,
          },
          {
            startTime: "12:00",
            endTime: "13:00",
            maxBookings: 1,
            isActive: true,
          },
          {
            startTime: "13:00",
            endTime: "14:00",
            maxBookings: 1,
            isActive: true,
          },
          {
            startTime: "14:00",
            endTime: "15:00",
            maxBookings: 1,
            isActive: true,
          },
          {
            startTime: "15:00",
            endTime: "16:00",
            maxBookings: 1,
            isActive: true,
          },
          {
            startTime: "16:00",
            endTime: "17:00",
            maxBookings: 1,
            isActive: true,
          },
          {
            startTime: "17:00",
            endTime: "18:00",
            maxBookings: 1,
            isActive: true,
          },
        ],
        // Sunday slots (9 AM - 5 PM) - will be handled by custom day settings
        customDaySettings: {
          "0": { // Sunday
            startTime: "09:00",
            endTime: "17:00",
            isCustom: true,
          },
        },
        breakTimes: [], // No default break times
        slotDuration: 60, // 1 hour slots
        businessRules: {
          maxBookingsPerDay: 20,
          maxBookingsPerSlot: 1,
          allowSameDayBooking: true,
          allowWeekendBooking: true,
          requireApprovalForBooking: false,
        },
        notificationSettings: {
          notifyOnNewBooking: true,
          notifyOnCancellation: true,
          adminEmail: "support@teerthankeraadinathbrightdentalcare.in",
        },
      });
      
      await settings.save();
      console.log("Created new availability settings");
    }

    console.log("Availability settings seeding completed successfully");
    console.log("\nDefault Schedule:");
    console.log("Monday - Saturday: 8:00 AM - 6:00 PM");
    console.log("Sunday: 9:00 AM - 5:00 PM");
    console.log("No break times configured by default");
    console.log("Admin can add or remove slots as needed");
    
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedAvailabilitySettings(); 