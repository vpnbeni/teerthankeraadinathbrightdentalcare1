import mongoose from "mongoose";
import { config } from "../config/environment.js";
import Availability from "../models/Availability.js";
import AvailabilitySettings from "../models/AvailabilitySettings.js";

const generateFutureAvailability = async (monthsAhead = 3) => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    const settings = await AvailabilitySettings.getSettings();

    // Generate availability for the next X months
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsAhead);
    endDate.setHours(23, 59, 59, 999);

    console.log(`Generating availability from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    const generatedDates = [];
    const skippedDates = [];

    // Create a mock admin user ID for seeding
    const mockAdminId = new mongoose.Types.ObjectId();

    // Iterate through each date in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateToCheck = new Date(currentDate);

      // Check if it's a working day and not a holiday
      if (settings.isWorkingDay(dateToCheck) && !settings.isHoliday(dateToCheck)) {
        // Check if availability already exists
        const existingAvailability = await Availability.findOne({
          date: dateToCheck,
        });

        if (!existingAvailability) {
          const dayOfWeek = dateToCheck.getDay();
          const availableTimeSlots = settings.getTimeSlotsForDay(dayOfWeek);

          // Create new availability
          await Availability.create({
            date: dateToCheck,
            timeSlots: availableTimeSlots,
            createdBy: mockAdminId,
            status: "active",
          });

          generatedDates.push(dateToCheck.toISOString().split("T")[0]);
        } else {
          skippedDates.push(dateToCheck.toISOString().split("T")[0]);
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`\nFuture availability generation completed:`);
    console.log(`Generated: ${generatedDates.length} new dates`);
    console.log(`Skipped: ${skippedDates.length} dates (already exist)`);

    if (generatedDates.length > 0) {
      console.log(`\nGenerated availability for dates:`);
      generatedDates.slice(0, 10).forEach(date => {
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        console.log(`- ${date} (${dayName})`);
      });
      if (generatedDates.length > 10) {
        console.log(`... and ${generatedDates.length - 10} more dates`);
      }
    }

    console.log(`\nSchedule Summary:`);
    console.log(`Monday - Saturday: 8:00 AM - 6:00 PM (10 slots per day)`);
    console.log(`Sunday: 9:00 AM - 5:00 PM (8 slots per day)`);
    console.log(`No break times configured by default`);
    console.log(`Admin can add or remove slots as needed`);

    process.exit(0);
  } catch (error) {
    console.error("Future availability generation failed:", error);
    process.exit(1);
  }
};

// Get command line argument for months ahead (default 3)
const monthsAhead = process.argv[2] ? parseInt(process.argv[2]) : 3;
generateFutureAvailability(monthsAhead); 