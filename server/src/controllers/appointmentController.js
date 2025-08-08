import mongoose from "mongoose";
import { Appointment, User } from "../models/index.js";
import emailService from "../services/emailService.js";
import AvailabilityService from "../services/availabilityService.js";

const availabilityService = new AvailabilityService();

/**
 * Appointment Controller
 * Handles all appointment-related HTTP requests
 */

/**
 * @desc    Create new appointment
 * @route   POST /api/appointments
 * @access  Private
 */
export const createAppointment = async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`🎯 REQUEST ${requestId}: Starting appointment creation`);

  try {
    const { date, timeSlot, notes, personalDetails, medicalInfo } = req.body;


    // Check if time slot is available using new availability service
    const appointmentDate = new Date(date);
    const slotAvailability = await availabilityService.isTimeSlotAvailable(
      appointmentDate,
      timeSlot
    );

    if (!slotAvailability.available) {
      return res.status(400).json({
        success: false,
        message: slotAvailability.reason || "Selected time slot is not available",
      });
    }

    // Update user profile with verified email and other details if provided
    if (personalDetails || medicalInfo) {
      const updateData = {};

      if (personalDetails) {
        // Only update email if it's different and verified (we assume it's verified if sent)
        if (personalDetails.email && personalDetails.email !== req.user.email) {
          updateData.email = personalDetails.email;
        }

        // Update other personal details if provided
        if (personalDetails.address)
          updateData.address = personalDetails.address;
        if (personalDetails.alternativePhone)
          updateData.alternativePhone = personalDetails.alternativePhone;
      }

      if (medicalInfo) {
        updateData.medicalInfo = {
          ...req.user.medicalInfo,
          ...medicalInfo,
        };
      }

      // Update user profile if there are changes
      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(req.user._id, updateData, { new: true });

        // Refresh user data for email sending
        req.user = await User.findById(req.user._id);
      }
    }

    const appointment = await Appointment.create({
      userId: req.user._id,
      date: appointmentDate,
      timeSlot,
      notes,
    });

    const populatedAppointment = await Appointment.findById(
      appointment._id
    ).populate("userId", "name phone email");

    // Send appointment confirmation email (non-blocking)
    if (populatedAppointment.userId.email) {
      emailService
        .sendAppointmentConfirmationEmail(
          populatedAppointment.userId.email,
          populatedAppointment.userId.name,
          populatedAppointment.date,
          populatedAppointment.timeSlot
        )
        .catch((error) => {
          console.error("Email sending failed (non-blocking):", error.message);
        });
    }

    // Send admin booking notification email (non-blocking)
    try {
      await emailService.sendAdminBookingNotificationEmail(
        populatedAppointment
      );
    } catch (error) {
      console.error(
        "Admin notification email failed (non-blocking):",
        error.message
      );
    }

    console.log("🎉 SUCCESS: Appointment created successfully");
    console.log("Appointment ID:", appointment._id);

    res.status(201).json({
      success: true,
      data: {
        appointment: populatedAppointment,
        profileUpdated: !!(personalDetails || medicalInfo),
      },
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user's appointments
 * @route   GET /api/appointments
 * @access  Private
 */
export const getUserAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const appointments = await Appointment.getUserAppointments(
      req.user._id,
      status
    );

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedAppointments = appointments.slice(
      skip,
      skip + parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        appointments: paginatedAppointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(appointments.length / parseInt(limit)),
          totalAppointments: appointments.length,
          hasNext:
            parseInt(page) < Math.ceil(appointments.length / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get user appointments error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get appointment details
 * @route   GET /api/appointments/:appointmentId
 * @access  Private
 */
export const getAppointmentDetails = async (req, res) => {
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

    // Check if user owns this appointment or is admin
    if (
      req.user.role !== "admin" &&
      appointment.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        appointment,
      },
    });
  } catch (error) {
    console.error("Get appointment details error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update appointment
 * @route   PUT /api/appointments/:appointmentId
 * @access  Private
 */
export const updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { date, timeSlot, notes } = req.body;

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

    // Check if user owns this appointment
    if (appointment.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if appointment can be updated (not in the past or completed)
    if (appointment.status === "completed" || appointment.isPast) {
      return res.status(400).json({
        success: false,
        message: "Cannot update past or completed appointments",
      });
    }

    // Store original appointment details for notifications
    const originalDate = appointment.date;
    const originalTimeSlot = appointment.timeSlot;
    let isRescheduled = false;

    // If date or time slot is being changed, check availability
    if (date || timeSlot) {
      const newDate = date ? new Date(date) : appointment.date;
      const newTimeSlot = timeSlot || appointment.timeSlot;

      const slotAvailability = await availabilityService.isTimeSlotAvailable(
        newDate,
        newTimeSlot,
        appointmentId
      );

      if (!slotAvailability.available) {
        return res.status(400).json({
          success: false,
          message: slotAvailability.reason || "Selected time slot is not available",
        });
      }

      // Check if this is actually a reschedule (date or time changed)
      if (
        newDate.getTime() !== originalDate.getTime() ||
        newTimeSlot !== originalTimeSlot
      ) {
        isRescheduled = true;

        // Use the reschedule method to maintain history
        await appointment.reschedule(
          newDate,
          newTimeSlot,
          req.user._id,
          "Patient requested reschedule"
        );
      } else {
        appointment.date = newDate;
        appointment.timeSlot = newTimeSlot;
      }
    }

    if (notes !== undefined) {
      appointment.notes = notes;
    }

    if (!isRescheduled) {
      await appointment.save();
    }

    const updatedAppointment = await Appointment.findById(
      appointmentId
    ).populate("userId", "name phone email");

    // Send admin notification for patient-initiated reschedule (non-blocking)
    if (isRescheduled) {
      try {
        await emailService.sendAdminRescheduleNotificationEmail(
          updatedAppointment,
          originalDate,
          originalTimeSlot,
          "Patient requested reschedule"
        );
      } catch (error) {
        console.error(
          "Admin reschedule notification email failed (non-blocking):",
          error.message
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        appointment: updatedAppointment,
      },
      message: isRescheduled
        ? "Appointment rescheduled successfully"
        : "Appointment updated successfully",
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Cancel appointment
 * @route   DELETE /api/appointments/:appointmentId
 * @access  Private
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate(
      "userId",
      "name phone email subscription"
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if user owns this appointment
    if (appointment.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if appointment can be cancelled
    if (
      appointment.status === "completed" ||
      appointment.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed or already cancelled appointments",
      });
    }

    // Cancel the appointment with reason and user info
    await appointment.cancel(reason, req.user._id);


    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("userId", "name phone email")
      .populate("cancellationDetails.cancelledBy", "name email");

    res.status(200).json({
      success: true,
      data: {
        appointment: updatedAppointment,
      },
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get available dates in a range
 * @route   GET /api/appointments/available-dates
 * @access  Private
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

    // Use new availability service
    const availableDates = await availabilityService.getAvailableDates(start, end);

    // Set cache-control headers with optimized caching
    res.set({
      "Cache-Control": "public, max-age=300", // Cache for 5 minutes for date ranges
      ETag: `"${startDate}-${endDate}-${availableDates.length}"`,
    });

    res.status(200).json({
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
    console.error("Get available dates error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Validate slot booking
 * @route   POST /api/appointments/validate-slot
 * @access  Private
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

    // Use new availability service
    const validation = await availabilityService.isTimeSlotAvailable(date, timeSlot);

    res.status(200).json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error("Validate slot booking error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get available time slots for a date
 * @route   GET /api/appointments/available-slots/:date
 * @access  Private
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

    // Use new availability service
    const availability = await availabilityService.getAvailabilityForDate(
      appointmentDate,
      { onlyAvailable: onlyAvailable === "true" }
    );

    // Handle cases where date is not available (holiday, no template, etc.)
    if (!availability.available) {
      return res.status(200).json({
        success: true,
        data: {
          date: appointmentDate,
          availableSlots: [],
          totalSlots: 0,
          availableCount: 0,
          metadata: {
            isHoliday: availability.type === "holiday",
            holidayName: availability.reason,
            reason: availability.reason,
            type: availability.type,
          },
        },
      });
    }

    // Transform slots to maintain backward compatibility
    const availableSlots = availability.slots.map((slot) => slot.timeSlot);

    // Set cache-control headers with optimized caching
    res.set({
      "Cache-Control": "public, max-age=60", // Cache for 1 minute for better performance
      ETag: `"${date}-${availability.availableSlots}"`, // ETag based on date and available count
    });

    res.status(200).json({
      success: true,
      data: {
        date: appointmentDate,
        availableSlots, // Backward compatible format
        totalSlots: availability.totalSlots,
        availableCount: availability.availableSlots,
        // Enhanced metadata from new system
        metadata: {
          template: availability.template,
          isHoliday: availability.type === "holiday",
          holidayName: availability.holiday?.reason,
          reason: availability.reason,
          type: availability.type,
          slots: availability.slots, // Detailed slot information
        },
      },
    });
  } catch (error) {
    console.error("Get available time slots error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all appointments (Admin only)
 * @route   GET /api/appointments/admin/all
 * @access  Private (Admin)
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

    let query = {};

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(query)
      .populate("userId", "name phone email")
      .sort({ date: -1, timeSlot: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        appointments,
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
    console.error("Get all appointments error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Reschedule appointment (Admin only)
 * @route   PUT /api/appointments/admin/:appointmentId/reschedule
 * @access  Private (Admin)
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

    // Store original appointment details for notifications
    const originalDate = appointment.date;
    const originalTimeSlot = appointment.timeSlot;

    await appointment.reschedule(newDate, newTimeSlot, req.user._id, reason);

    const updatedAppointment = await Appointment.findById(
      appointmentId
    ).populate("userId", "name phone email");

    // Send email notification to patient (non-blocking)
    if (updatedAppointment.userId.email) {
      emailService
        .sendAppointmentRescheduleNotificationEmail(
          updatedAppointment.userId.email,
          updatedAppointment.userId.name,
          originalDate,
          originalTimeSlot,
          updatedAppointment.date,
          updatedAppointment.timeSlot,
          reason
        )
        .catch((error) => {
          console.error(
            "Patient reschedule notification email failed (non-blocking):",
            error.message
          );
        });
    }

    // Send admin reschedule notification email (non-blocking)
    try {
      await emailService.sendAdminRescheduleNotificationEmail(
        updatedAppointment,
        originalDate,
        originalTimeSlot,
        reason
      );
    } catch (error) {
      console.error(
        "Admin reschedule notification email failed (non-blocking):",
        error.message
      );
    }

    res.status(200).json({
      success: true,
      data: {
        appointment: updatedAppointment,
      },
      message: "Appointment rescheduled successfully",
    });
  } catch (error) {
    console.error("Reschedule appointment error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Confirm appointment (Admin only)
 * @route   PUT /api/appointments/admin/:appointmentId/confirm
 * @access  Private (Admin)
 */
export const confirmAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Only scheduled appointments can be confirmed",
      });
    }

    // Update appointment status
    appointment.status = "confirmed";

    // Add admin action to history
    if (!appointment.adminActions) {
      appointment.adminActions = [];
    }

    appointment.adminActions.push({
      action: "confirm",
      performedBy: req.user._id,
      performedAt: new Date(),
      reason: "Admin confirmation",
    });

    await appointment.save();

    const updatedAppointment = await Appointment.findById(
      appointmentId
    ).populate("userId", "name phone email");

    res.status(200).json({
      success: true,
      data: {
        appointment: updatedAppointment,
      },
      message: "Appointment confirmed successfully",
    });
  } catch (error) {
    console.error("Confirm appointment error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to confirm appointment",
    });
  }
};

/**
 * @desc    Complete appointment (Admin only)
 * @route   PUT /api/appointments/admin/:appointmentId/complete
 * @access  Private (Admin)
 */
export const completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId).populate("userId");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already completed",
      });
    }

    await appointment.complete();

    const updatedAppointment = await Appointment.findById(
      appointmentId
    ).populate("userId", "name phone email");

    res.status(200).json({
      success: true,
      data: {
        appointment: updatedAppointment,
      },
      message: "Appointment completed successfully",
    });
  } catch (error) {
    console.error("Complete appointment error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Cancel appointment (Admin only)
 * @route   POST /api/appointments/admin/:appointmentId/cancel
 * @access  Private (Admin)
 */
export const adminCancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason, notifyPatient = true, restoreSession = true } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate(
      "userId",
      "name phone email subscription"
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    // Cancel the appointment with reason and admin info
    await appointment.cancel(reason, req.user._id);


    // Send email notification to patient if requested
    if (notifyPatient && appointment.userId.email) {
      try {
        await emailService.sendAppointmentCancellationEmail(
          appointment.userId.email,
          appointment.userId.name,
          appointment.date,
          appointment.timeSlot,
          reason
        );
      } catch (error) {
        console.error(
          "Email notification failed (non-blocking):",
          error.message
        );
      }
    }

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("userId", "name phone email")
      .populate("cancellationDetails.cancelledBy", "name email");

    res.status(200).json({
      success: true,
      data: {
        appointment: updatedAppointment,
      },
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Admin cancel appointment error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Bulk cancel appointments (Admin only)
 * @route   POST /api/appointments/admin/bulk-cancel
 * @access  Private (Admin)
 */
export const bulkCancelAppointments = async (req, res) => {
  try {
    const {
      appointmentIds,
      reason,
      notifyPatients = true,
      restoreSessions = true,
    } = req.body;

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

    const results = {
      successful: [],
      failed: [],
      totalProcessed: appointmentIds.length,
    };

    // Process each appointment
    for (const appointmentId of appointmentIds) {
      try {
        const appointment = await Appointment.findById(appointmentId).populate(
          "userId",
          "name phone email subscription"
        );

        if (!appointment) {
          results.failed.push({
            appointmentId,
            error: "Appointment not found",
          });
          continue;
        }

        if (appointment.status === "cancelled") {
          results.failed.push({
            appointmentId,
            error: "Appointment is already cancelled",
          });
          continue;
        }

        // Cancel the appointment
        await appointment.cancel(reason, req.user._id);


        // Send email notification if requested
        if (notifyPatients && appointment.userId.email) {
          try {
            await emailService.sendAppointmentCancellationEmail(
              appointment.userId.email,
              appointment.userId.name,
              appointment.date,
              appointment.timeSlot,
              reason
            );
          } catch (error) {
            console.error(
              `Email notification failed for appointment ${appointmentId}:`,
              error.message
            );
          }
        }

        results.successful.push({
          appointmentId,
          patientName: appointment.userId.name,
        });
      } catch (error) {
        results.failed.push({
          appointmentId,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Bulk cancellation completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
    });
  } catch (error) {
    console.error("Bulk cancel appointments error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Bulk update appointments (Admin only)
 * @route   POST /api/appointments/admin/bulk-update
 * @access  Private (Admin)
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

    if (!action || !["confirm", "complete"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Valid action is required (confirm, complete)",
      });
    }

    const results = {
      successful: [],
      failed: [],
    };

    // Process each appointment
    for (const appointmentId of appointmentIds) {
      try {
        const appointment = await Appointment.findById(appointmentId).populate(
          "userId",
          "name phone email subscription"
        );

        if (!appointment) {
          results.failed.push({
            appointmentId,
            error: "Appointment not found",
          });
          continue;
        }

        // Validate action based on current status
        if (action === "confirm" && appointment.status !== "scheduled") {
          results.failed.push({
            appointmentId,
            error: "Only scheduled appointments can be confirmed",
          });
          continue;
        }

        if (action === "complete" && appointment.status !== "confirmed") {
          results.failed.push({
            appointmentId,
            error: "Only confirmed appointments can be completed",
          });
          continue;
        }

        // Update appointment status
        appointment.status = action === "confirm" ? "confirmed" : "completed";

        // Add admin action to history
        if (!appointment.adminActions) {
          appointment.adminActions = [];
        }

        appointment.adminActions.push({
          action: action,
          performedBy: req.user._id,
          performedAt: new Date(),
          reason: reason || `Bulk ${action} by admin`,
        });

        await appointment.save();

        results.successful.push({
          appointmentId,
          appointment: await Appointment.findById(appointmentId)
            .populate("userId", "name phone email")
            .populate("adminActions.performedBy", "name email"),
        });
      } catch (error) {
        console.error(`Error processing appointment ${appointmentId}:`, error);
        results.failed.push({
          appointmentId,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Bulk ${action} completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
    });
  } catch (error) {
    console.error("Bulk update appointments error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get appointment statistics (Admin only)
 * @route   GET /api/appointments/admin/statistics
 * @access  Private (Admin)
 */
export const getAppointmentStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const statistics = await Appointment.aggregate([
      {
        $match: {
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalAppointments = await Appointment.countDocuments({
      date: { $gte: start, $lte: end },
    });

    const todayAppointments = await Appointment.countDocuments({
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lte: new Date().setHours(23, 59, 59, 999),
      },
    });

    const upcomingAppointments = await Appointment.countDocuments({
      date: { $gte: new Date() },
      status: { $in: ["scheduled", "confirmed"] },
    });

    res.status(200).json({
      success: true,
      data: {
        statistics,
        totalAppointments,
        todayAppointments,
        upcomingAppointments,
        dateRange: {
          startDate: start,
          endDate: end,
        },
      },
    });
  } catch (error) {
    console.error("Get appointment statistics error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
