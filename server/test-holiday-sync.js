import mongoose from "mongoose";
import config from "./src/config/config.js";
import Availability from "./src/models/Availability.js";
import AvailabilitySettings from "./src/models/AvailabilitySettings.js";

const testHolidaySync = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get current settings
    const settings = await AvailabilitySettings.getSettings();
    console.log(
      "Current holidays:",
      settings.holidays.map((h) => ({
        name: h.name,
        date: h.date,
        dateString: h.date.toISOString().split("T")[0],
      }))
    );

    // Test different date formats for August 9th
    const testDates = [
      new Date("2025-08-09T00:00:00.000Z"),
      new Date("2025-08-09T18:30:00.000Z"),
      new Date("2025-08-09"),
      "2025-08-09",
    ];

    console.log("\nTesting holiday detection for different date formats:");
    testDates.forEach((testDate, index) => {
      const isHoliday = settings.isHoliday(testDate);
      console.log(`${index + 1}. ${testDate} -> isHoliday: ${isHoliday}`);
    });

    // Find all August 9th availability records
    const aug9Records = await Availability.find({
      date: {
        $gte: new Date("2025-08-09T00:00:00.000Z"),
        $lt: new Date("2025-08-10T00:00:00.000Z"),
      },
    });

    console.log(
      `\nFound ${aug9Records.length} availability records for August 9th:`
    );
    aug9Records.forEach((record, index) => {
      console.log(
        `${index + 1}. Date: ${record.date.toISOString()}, isHoliday: ${
          record.isHoliday
        }`
      );

      // Test if this specific date should be a holiday
      const shouldBeHoliday = settings.isHoliday(record.date);
      console.log(`   Should be holiday: ${shouldBeHoliday}`);

      if (record.isHoliday !== shouldBeHoliday) {
        console.log("   ❌ Holiday status mismatch!");
      } else {
        console.log("   ✅ Holiday status correct");
      }
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

testHolidaySync();
