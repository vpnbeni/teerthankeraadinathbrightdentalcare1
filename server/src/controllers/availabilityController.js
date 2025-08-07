import Availability from "../models/Availability.js";
import AvailabilitySettings from "../models/AvailabilitySettings.js";
import Appointment from "../models/Appointment.js";

/**
 * Availability Controller
 * Handles availability management for admin panel
 */

/**
 * @desc    Get availability slots for date range
 * @route   GET /api/admin/availability
 * @access  Private (Admin)
 */
export const getAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date",
      });
    }

    const availability = await Availability.getAvailabilityRange(start, end);

    res.status(200).json({
      success: true,
      data: availability,
      message: "Availability retrieved successfully",
    });
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving availability",
    });
  }
};

/**
 * @desc    Create new availability slots
 * @route   POST /api/admin/availability
 * @access  Private (Admin)
 */
export const createAvailability = async (req, res) => {
  try {
    const { date, timeSlots, isHoliday, notes } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const availabilityDate = new Date(date);
    if (isNaN(availabilityDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Check if availability already exists for this date
    const existingAvailability = await Availability.findOne({
      date: availabilityDate,
    });
    if (existingAvailability) {
      return res.status(400).json({
        success: false,
        message:
          "Availability already exists for this date. Use PUT to update.",
      });
    }

    // Validate time slots if provided
    if (timeSlots && timeSlots.length > 0) {
      for (const slot of timeSlots) {
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({
            success: false,
            message: "Each time slot must have startTime and endTime",
          });
        }

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return res.status(400).json({
            success: false,
            message: "Time must be in HH:MM format",
          });
        }
      }
    }

    const availability = new Availability({
      date: availabilityDate,
      timeSlots: timeSlots || [],
      isHoliday: isHoliday || false,
      notes: notes || "",
      createdBy: req.user.id,
    });

    await availability.save();

    await availability.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      data: availability,
      message: "Availability created successfully",
    });
  } catch (error) {
    console.error("Create availability error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating availability",
    });
  }
};

/**
 * @desc    Update existing availability slots
 * @route   PUT /api/admin/availability/:id
 * @access  Private (Admin)
 */
export const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeSlots, isHoliday, notes } = req.body;

    const availability = await Availability.findById(id);
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    // Validate time slots if provided
    if (timeSlots && timeSlots.length > 0) {
      for (const slot of timeSlots) {
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({
            success: false,
            message: "Each time slot must have startTime and endTime",
          });
        }

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return res.status(400).json({
            success: false,
            message: "Time must be in HH:MM format",
          });
        }
      }
    }

    // Update fields
    if (timeSlots !== undefined) availability.timeSlots = timeSlots;
    if (isHoliday !== undefined) availability.isHoliday = isHoliday;
    if (notes !== undefined) availability.notes = notes;
    availability.updatedBy = req.user.id;

    await availability.save();
    await availability.populate("createdBy updatedBy", "name email");

    res.status(200).json({
      success: true,
      data: availability,
      message: "Availability updated successfully",
    });
  } catch (error) {
    console.error("Update availability error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating availability",
    });
  }
};

/**
 * @desc    Delete availability slot with validation
 * @route   DELETE /api/admin/availability/:id
 * @access  Private (Admin)
 */
export const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // Allow force deletion

    const availability = await Availability.findById(id);
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    // Check for existing appointments unless force delete
    if (!force) {
      const existingAppointments = await Appointment.find({
        appointmentDate: availability.date,
        status: { $in: ["confirmed", "pending"] },
      });

      if (existingAppointments.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete availability with existing appointments",
          data: {
            appointmentCount: existingAppointments.length,
            appointments: existingAppointments.map((apt) => ({
              id: apt._id,
              time: apt.appointmentTime,
              patientName: apt.patientName,
              status: apt.status,
            })),
          },
        });
      }
    }

    await Availability.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Availability deleted successfully",
    });
  } catch (error) {
    console.error("Delete availability error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting availability",
    });
  }
};

/**
 * @desc    Get availability settings
 * @route   GET /api/admin/availability/settings
 * @access  Private (Admin)
 */
export const getAvailabilitySettings = async (req, res) => {
  try {
    const settings = await AvailabilitySettings.getSettings();

    res.status(200).json({
      success: true,
      data: settings,
      message: "Availability settings retrieved successfully",
    });
  } catch (error) {
    console.error("Get availability settings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving availability settings",
    });
  }
};

/**
 * @desc    Update availability settings
 * @route   PUT /api/admin/availability/settings
 * @access  Private (Admin)
 */
export const updateAvailabilitySettings = async (req, res) => {
  try {
    const {
      workingDays,
      defaultTimeSlots,
      breakTimes,
      advanceBookingDays,
      minimumNoticeHours,
      holidays,
      autoGenerateAvailability,
      autoGenerateDaysAhead,
      defaultStartTime,
      defaultEndTime,
      sundayStartTime,
      sundayEndTime,
      slotDuration,
      customDaySettings,
    } = req.body;

    let settings = await AvailabilitySettings.findById("availability_settings");

    if (!settings) {
      settings = new AvailabilitySettings({ _id: "availability_settings" });
    }

    // Update fields if provided
    if (workingDays !== undefined) settings.workingDays = workingDays;
    if (defaultTimeSlots !== undefined)
      settings.defaultTimeSlots = defaultTimeSlots;
    if (breakTimes !== undefined) settings.breakTimes = breakTimes;
    if (advanceBookingDays !== undefined)
      settings.advanceBookingDays = advanceBookingDays;
    if (minimumNoticeHours !== undefined)
      settings.minimumNoticeHours = minimumNoticeHours;
    if (holidays !== undefined) settings.holidays = holidays;
    if (autoGenerateAvailability !== undefined)
      settings.autoGenerateAvailability = autoGenerateAvailability;
    if (autoGenerateDaysAhead !== undefined)
      settings.autoGenerateDaysAhead = autoGenerateDaysAhead;
    if (defaultStartTime !== undefined)
      settings.defaultStartTime = defaultStartTime;
    if (defaultEndTime !== undefined) settings.defaultEndTime = defaultEndTime;
    if (sundayStartTime !== undefined)
      settings.sundayStartTime = sundayStartTime;
    if (sundayEndTime !== undefined) settings.sundayEndTime = sundayEndTime;
    if (slotDuration !== undefined) settings.slotDuration = slotDuration;
    if (customDaySettings !== undefined)
      settings.customDaySettings = customDaySettings;

    settings.updatedBy = req.user.id;

    await settings.save();
    await settings.populate("updatedBy", "name email");

    // Note: Automatic holiday sync temporarily disabled to prevent loops
    // Use the manual sync endpoint: POST /api/admin/availability/sync-holidays
    // if (holidays !== undefined) {
    //   try {
    //     await syncHolidaysWithAvailability(settings, req.user.id);
    //   } catch (error) {
    //     console.error('Error syncing holidays:', error);
    //   }
    // }

    res.status(200).json({
      success: true,
      data: settings,
      message: "Availability settings updated successfully",
    });
  } catch (error) {
    console.error("Update availability settings error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating availability settings",
    });
  }
};

/**
 * @desc    Generate availability for date range based on settings
 * @route   POST /api/admin/availability/generate
 * @access  Private (Admin)
 */
export const generateAvailability = async (req, res) => {
  try {
    const { startDate, endDate, overwrite = false } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date",
      });
    }

    const settings = await AvailabilitySettings.getSettings();
    const generatedDates = [];
    const skippedDates = [];

    // Iterate through each date in the range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateToCheck = new Date(currentDate);
      const isHoliday = settings.isHoliday(dateToCheck);
      const isWorkingDay = settings.isWorkingDay(dateToCheck);

      // Generate availability for working days (including holidays for display)
      if (isWorkingDay) {
        // Check if availability already exists
        const existingAvailability = await Availability.findOne({
          date: dateToCheck,
        });

        if (!existingAvailability || overwrite) {
          const dayOfWeek = dateToCheck.getDay();
          // For holidays, create empty time slots or mark as unavailable
          const availableTimeSlots = isHoliday
            ? []
            : settings.getTimeSlotsForDay(dayOfWeek);

          if (existingAvailability && overwrite) {
            // Update existing
            existingAvailability.timeSlots = availableTimeSlots;
            existingAvailability.isHoliday = isHoliday;
            existingAvailability.updatedBy = req.user.id;
            await existingAvailability.save();
            generatedDates.push(dateToCheck.toISOString().split("T")[0]);
          } else {
            // Create new
            await Availability.create({
              date: dateToCheck,
              timeSlots: availableTimeSlots,
              isHoliday: isHoliday,
              createdBy: req.user.id,
            });
            generatedDates.push(dateToCheck.toISOString().split("T")[0]);
          }
        } else {
          skippedDates.push(dateToCheck.toISOString().split("T")[0]);
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: {
        generatedDates,
        skippedDates,
        totalGenerated: generatedDates.length,
        totalSkipped: skippedDates.length,
      },
      message: `Availability generated for ${generatedDates.length} dates`,
    });
  } catch (error) {
    console.error("Generate availability error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating availability",
    });
  }
};

/**
 * @desc    Manually sync holidays with existing availability records
 * @route   POST /api/admin/availability/sync-holidays
 * @access  Private (Admin)
 */
export const syncHolidays = async (req, res) => {
  try {
    const settings = await AvailabilitySettings.getSettings();
    const syncResult = await syncHolidaysWithAvailability(
      settings,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: syncResult,
      message: "Holiday synchronization completed successfully",
    });
  } catch (error) {
    console.error("Sync holidays error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while syncing holidays",
    });
  }
};

/**
 * Helper function to sync holiday settings with existing availability records
 * @param {Object} settings - The availability settings object
 * @param {String} userId - The user ID making the update
 */
const syncHolidaysWithAvailability = async (settings, userId) => {
  try {
    // Get all future availability records (from today onwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureAvailability = await Availability.find({
      date: { $gte: today },
      status: "active",
    });

    const bulkOperations = [];
    const syncedDates = [];

    for (const availability of futureAvailability) {
      const isHoliday = settings.isHoliday(availability.date);

      // Only update if holiday status has changed
      if (availability.isHoliday !== isHoliday) {
        bulkOperations.push({
          updateOne: {
            filter: { _id: availability._id },
            update: {
              $set: {
                isHoliday: isHoliday,
                updatedBy: userId,
                updatedAt: new Date(),
              },
              $inc: { version: 1 },
              $push: {
                auditLog: {
                  action: "holiday_sync",
                  performedBy: userId,
                  timestamp: new Date(),
                  changes: {
                    isHoliday: { from: availability.isHoliday, to: isHoliday },
                  },
                  reason: "Holiday settings updated",
                },
              },
            },
          },
        });

        syncedDates.push({
          date: availability.date.toISOString().split("T")[0],
          from: availability.isHoliday,
          to: isHoliday,
        });
      }
    }

    // Execute bulk operations if any
    if (bulkOperations.length > 0) {
      await Availability.bulkWrite(bulkOperations);
      console.log(
        `Synced holiday status for ${bulkOperations.length} availability records`
      );
    }

    return {
      totalRecordsChecked: futureAvailability.length,
      recordsUpdated: bulkOperations.length,
      syncedDates: syncedDates,
    };
  } catch (error) {
    console.error("Error syncing holidays with availability:", error);
    // For manual sync, throw error; for automatic sync, just log
    if (userId) {
      throw error;
    }
  }
};
