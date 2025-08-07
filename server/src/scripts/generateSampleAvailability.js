import mongoose from "mongoose";
import { config } from "../config/environment.js";
import Availability from "../models/Availability.js";
import AvailabilitySettings from "../models/AvailabilitySettings.js";

const generateSampleAvailability = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    const settings = await AvailabilitySettings.getSettings();
    
    // Generate availability for the next 4 weeks
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 28); // 4 weeks
    
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
    
    console.log(`\nSample availability generation completed:`);
    console.log(`Generated: ${generatedDates.length} dates`);
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
    console.error("Sample availability generation failed:", error);
    process.exit(1);
  }
};

generateSampleAvailability(); 