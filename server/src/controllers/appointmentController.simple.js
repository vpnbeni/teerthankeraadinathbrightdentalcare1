import { Appointment, User } from "../models/index.js";
import emailService from "../services/emailService.js";

/**
 * Simplified Appointment Controller
 * Clean and straightforward appointment management
 */

// Helper function to validate appointment data
const validateAppointmentData = (data) => {
  const { date, timeSlot } = data;

  if (!date || !timeSlot) {
    throw new Error("Date and time slot are required");
  }

  const appointmentDate = new Date(date);
  if (appointmentDate < new Date()) {
    throw new Error("Cannot book appointments in the past");
  }

  return appointmentDate;
};

// Helper function to check slot availability
const checkSlotAvailability = async (date, timeSlot, excludeId = null) => {
  const query = { date, timeSlot, status: { $ne: "cancelled" } };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingAppointment = await Appointment.findOne(query);
  return !existingAppointment;
};

/**
 * Get all appointments with filters and pagination
 */
export const getAllAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      userId,
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Appointment.countDocuments(query);

    // Fetch appointments
    const appointments = await Appointment.find(query)
      .populate("userId", "name phone email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out appointments with deleted users
    const validAppointments = appointments.filter(
      (appointment) => appointment.userId !== null
    );

    res.json({
      success: true,
      data: {
        appointments: validAppointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAppointments: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId).populate(
      "userId",
      "name phone email"
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      data: { appointment },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create new appointment
 */
export const createAppointment = async (req, res) => {
  try {
    const { date, timeSlot, notes, userId } = req.body;

    // Validate input
    const appointmentDate = validateAppointmentData({ date, timeSlot });

    // Check availability
    const isAvailable = await checkSlotAvailability(appointmentDate, timeSlot);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Time slot is not available",
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      userId: userId || req.user._id,
      date: appointmentDate,
      timeSlot,
      notes: notes || "",
      status: "scheduled",
    });

    const populatedAppointment = await Appointment.findById(
      appointment._id
    ).populate("userId", "name phone email");

    res.status(201).json({
      success: true,
      data: { appointment: populatedAppointment },
      message: "Appointment created successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update appointment
 */
export const updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { date, timeSlot, notes, status } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // If updating date/time, validate and check availability
    if (date || timeSlot) {
      const newDate = date ? new Date(date) : appointment.date;
      const newTimeSlot = timeSlot || appointment.timeSlot;

      const isAvailable = await checkSlotAvailability(
        newDate,
        newTimeSlot,
        appointmentId
      );
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Time slot is not available",
        });
      }

      appointment.date = newDate;
      appointment.timeSlot = newTimeSlot;
    }

    // Update other fields
    if (notes !== undefined) appointment.notes = notes;
    if (status) appointment.status = status;

    await appointment.save();

    const updatedAppointment = await Appointment.findById(
      appointmentId
    ).populate("userId", "name phone email");

    res.json({
      success: true,
      data: { appointment: updatedAppointment },
      message: "Appointment updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reschedule appointment
 */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newDate, newTimeSlot, reason } = req.body;

    if (!newDate || !newTimeSlot) {
      return res.status(400).json({
        success: false,
        message: "New date and time slot are required",
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check availability
    const appointmentDate = new Date(newDate);
    const isAvailable = await checkSlotAvailability(
      appointmentDate,
      newTimeSlot,
      appointmentId
    );
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Time slot is not available",
      });
    }

    // Update appointment
    appointment.date = appointmentDate;
    appointment.timeSlot = newTimeSlot;
    appointment.status = "scheduled";

    // Add reschedule history
    if (!appointment.rescheduleHistory) {
      appointment.rescheduleHistory = [];
    }
    appointment.rescheduleHistory.push({
      previousDate: appointment.date,
      previousTimeSlot: appointment.timeSlot,
      newDate: appointmentDate,
      newTimeSlot,
      reason: reason || "Rescheduled by admin",
      rescheduledBy: req.user._id,
      rescheduledAt: new Date(),
    });

    await appointment.save();

    const updatedAppointment = await Appointment.findById(
      appointmentId
    ).populate("userId", "name phone email");

    res.json({
      success: true,
      data: { appointment: updatedAppointment },
      message: "Appointment rescheduled successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    // Update appointment status
    appointment.status = "cancelled";
    appointment.cancellationReason = reason || "Cancelled by admin";
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = req.user._id;

    await appointment.save();

    const updatedAppointment = await Appointment.findById(
      appointmentId
    ).populate("userId", "name phone email");

    res.json({
      success: true,
      data: { appointment: updatedAppointment },
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Complete appointment
 */
export const completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.status = "completed";
    appointment.completedAt = new Date();
    await appointment.save();

    const updatedAppointment = await Appointment.findById(
      appointmentId
    ).populate("userId", "name phone email");

    // Consume a session from the user's subscription
    try {
      const user = await User.findById(updatedAppointment.userId._id);
      if (
        user &&
        user.subscription &&
        user.subscription.sessionsRemaining > 0
      ) {
        await user.consumeSession();
        console.log(
          `Session consumed for user ${user.name}. Remaining: ${user.subscription.sessionsRemaining}`
        );
      }
    } catch (error) {
      console.error("Failed to consume session:", error);
      // Don't fail the appointment completion if session consumption fails
    }

    // Send appointment completion email (non-blocking)
    if (updatedAppointment.userId.email) {
      emailService
        .sendAppointmentCompletionEmail(
          updatedAppointment.userId.email,
          updatedAppointment.userId.name,
          updatedAppointment.date,
          updatedAppointment.timeSlot
        )
        .catch((error) => {
          console.error("Failed to send appointment completion email:", error);
        });
    }

    res.json({
      success: true,
      data: { appointment: updatedAppointment },
      message: "Appointment completed successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get available dates in a range
 */
export const getAvailableDates = async (req, res) => {
  try {
    const { startDate, endDate, includeUnavailable = false } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before or equal to end date",
      });
    }

    // Limit range to prevent excessive queries (max 90 days)
    const maxRangeDays = 90;
    const rangeDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (rangeDays > maxRangeDays) {
      return res.status(400).json({
        success: false,
        message: `Date range cannot exceed ${maxRangeDays} days`,
      });
    }

    // Use new AvailabilityCalculator service
    const { default: AvailabilityCalculator } = await import(
      "../services/availabilityCalculator.js"
    );
    const calculator = new AvailabilityCalculator();

    const availableDates = await calculator.getAvailableDatesInRange(
      start,
      end,
      { includeUnavailable: includeUnavailable === "true" }
    );

    // Set cache-control headers with optimized caching
    res.set({
      "Cache-Control": "public, max-age=300", // Cache for 5 minutes for date ranges
      ETag: `"${startDate}-${endDate}-${availableDates.length}"`,
    });

    res.json({
      success: true,
      data: {
        startDate: start,
        endDate: end,
        availableDates,
        totalDates: availableDates.length,
        availableDatesCount: availableDates.filter((d) => d.availableSlots > 0)
          .length,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Validate slot booking
 */
export const validateSlotBooking = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Date and time slot are required",
      });
    }

    // Use new AvailabilityCalculator service
    const { default: AvailabilityCalculator } = await import(
      "../services/availabilityCalculator.js"
    );
    const calculator = new AvailabilityCalculator();

    const validation = await calculator.validateSlotBooking(date, timeSlot);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get available time slots for a date
 */
export const getAvailableTimeSlots = async (req, res) => {
  try {
    const { date } = req.params;
    const { onlyAvailable = true } = req.query;
    const appointmentDate = new Date(date);

    // Check if date is in the past
    if (appointmentDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: "Cannot get slots for past dates",
      });
    }

    // Use new AvailabilityCalculator service
    const { default: AvailabilityCalculator } = await import(
      "../services/availabilityCalculator.js"
    );
    const calculator = new AvailabilityCalculator();

    const availability = await calculator.getAvailableSlotsForDate(
      appointmentDate,
      { onlyAvailable: onlyAvailable === "true" }
    );

    // Transform slots to maintain backward compatibility
    const availableSlots = availability.slots.map((slot) => slot.timeSlot);

    // Set cache-control headers with optimized caching
    res.set({
      "Cache-Control": "public, max-age=60", // Cache for 1 minute for better performance
      ETag: `"${date}-${availability.availableSlots}"`, // ETag based on date and available count
    });

    res.json({
      success: true,
      data: {
        date: appointmentDate,
        availableSlots, // Backward compatible format
        totalSlots: availability.totalSlots,
        availableCount: availability.availableSlots,
        // Enhanced metadata from new system
        metadata: {
          source: availability.source,
          isHoliday: availability.isHoliday || false,
          holidayName: availability.holidayName,
          isCustom: availability.isCustom || false,
          customReason: availability.customReason,
          isWorkingDay: availability.isWorkingDay !== false,
          slots: availability.slots, // Detailed slot information
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Bulk operations
 */
export const bulkUpdateAppointments = async (req, res) => {
  try {
    const { appointmentIds, action, reason } = req.body;

    if (
      !appointmentIds ||
      !Array.isArray(appointmentIds) ||
      appointmentIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Appointment IDs array is required",
      });
    }

    const validActions = ["cancel", "complete", "confirm"];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be one of: cancel, complete, confirm",
      });
    }

    const results = { successful: [], failed: [] };

    for (const appointmentId of appointmentIds) {
      try {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
          results.failed.push({
            appointmentId,
            error: "Appointment not found",
          });
          continue;
        }

        // Apply the action
        switch (action) {
          case "cancel":
            appointment.status = "cancelled";
            appointment.cancellationReason =
              reason || "Bulk cancelled by admin";
            appointment.cancelledAt = new Date();
            appointment.cancelledBy = req.user._id;
            break;
          case "complete":
            appointment.status = "completed";
            appointment.completedAt = new Date();
            break;
          case "confirm":
            appointment.status = "confirmed";
            break;
        }

        await appointment.save();

        // Handle completion-specific actions
        if (action === "complete") {
          const populatedAppointment = await Appointment.findById(
            appointmentId
          ).populate("userId", "name phone email");

          // Consume a session from the user's subscription
          try {
            const user = await User.findById(populatedAppointment.userId._id);
            if (
              user &&
              user.subscription &&
              user.subscription.sessionsRemaining > 0
            ) {
              await user.consumeSession();
              console.log(
                `Session consumed for user ${user.name}. Remaining: ${user.subscription.sessionsRemaining}`
              );
            }
          } catch (error) {
            console.error("Failed to consume session:", error);
            // Don't fail the appointment completion if session consumption fails
          }

          // Send completion email
          if (populatedAppointment.userId.email) {
            emailService
              .sendAppointmentCompletionEmail(
                populatedAppointment.userId.email,
                populatedAppointment.userId.name,
                populatedAppointment.date,
                populatedAppointment.timeSlot
              )
              .catch((error) => {
                console.error(
                  "Failed to send appointment completion email:",
                  error
                );
              });
          }
        }

        results.successful.push({ appointmentId, action });
      } catch (error) {
        results.failed.push({ appointmentId, error: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Bulk ${action} completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get appointment statistics
 */
export const getAppointmentStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get status counts
    const statusStats = await Appointment.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get today's appointments
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayCount = await Appointment.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
    });

    // Get upcoming appointments
    const upcomingCount = await Appointment.countDocuments({
      date: { $gte: new Date() },
      status: { $in: ["scheduled", "confirmed"] },
    });

    // Get total appointments in date range
    const totalCount = await Appointment.countDocuments({
      date: { $gte: start, $lte: end },
    });

    res.json({
      success: true,
      data: {
        statistics: statusStats,
        totalAppointments: totalCount,
        todayAppointments: todayCount,
        upcomingAppointments: upcomingCount,
        dateRange: { startDate: start, endDate: end },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
