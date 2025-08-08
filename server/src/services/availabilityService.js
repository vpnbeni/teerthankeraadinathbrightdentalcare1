import AvailabilityTemplate from "../models/AvailabilityTemplate.js";
import Holiday from "../models/Holiday.js";
import Appointment from "../models/Appointment.js";

class AvailabilityService {
  /**
   * Get availability for a specific date
   * @param {Date} date - The date to check availability for
   * @param {Object} options - Options for availability calculation
   * @returns {Object} Availability data including slots and template info
   */
  async getAvailabilityForDate(date, options = {}) {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      // 1. Check if it's a holiday first
      const holiday = await Holiday.isHoliday(targetDate);
      if (holiday) {
        return {
          available: false,
          reason: holiday.reason,
          type: "holiday",
          holiday: holiday,
          slots: [],
          template: null,
        };
      }

      // 2. Check if any custom template applies to this date
      const template = await AvailabilityTemplate.getTemplateForDate(targetDate);
      
      if (!template) {
        return {
          available: false,
          reason: "No availability template configured",
          type: "no_template",
          holiday: null,
          slots: [],
          template: null,
        };
      }

      // 3. Generate time slots from template
      const allSlots = template.generateTimeSlots();

      // 4. Check which slots are already booked
      const bookedAppointments = await Appointment.find({
        date: {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
        status: { $nin: ["cancelled"] },
      }).select("timeSlot");

      const bookedTimeSlots = bookedAppointments.map(apt => apt.timeSlot);

      // 5. Mark slots as available or booked
      const slotsWithAvailability = allSlots.map(slot => ({
        ...slot,
        isAvailable: !bookedTimeSlots.includes(slot.timeSlot),
        isBooked: bookedTimeSlots.includes(slot.timeSlot),
      }));

      // 6. Filter slots based on options
      let finalSlots = slotsWithAvailability;
      if (options.onlyAvailable) {
        finalSlots = slotsWithAvailability.filter(slot => slot.isAvailable);
      }

      return {
        available: true,
        reason: null,
        type: "available",
        holiday: null,
        slots: finalSlots,
        template: {
          id: template._id,
          name: template.templateName,
          isDefault: template.isDefault,
          workingHours: template.workingHours,
          slotDuration: template.slotDuration,
          breakTimes: template.breakTimes,
        },
        totalSlots: allSlots.length,
        availableSlots: slotsWithAvailability.filter(slot => slot.isAvailable).length,
        bookedSlots: slotsWithAvailability.filter(slot => slot.isBooked).length,
      };
    } catch (error) {
      console.error("Error getting availability for date:", error);
      throw new Error("Failed to get availability for date");
    }
  }

  /**
   * Get availability for a date range
   * @param {Date} startDate - Start date of the range
   * @param {Date} endDate - End date of the range
   * @param {Object} options - Options for availability calculation
   * @returns {Object} Availability data for each date in the range
   */
  async getAvailabilityForDateRange(startDate, endDate, options = {}) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateAvailability = {};

      // Iterate through each date in the range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateKey = currentDate.toISOString().split('T')[0];
        dateAvailability[dateKey] = await this.getAvailabilityForDate(currentDate, options);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dateAvailability;
    } catch (error) {
      console.error("Error getting availability for date range:", error);
      throw new Error("Failed to get availability for date range");
    }
  }

  /**
   * Check if a specific time slot is available on a date
   * @param {Date} date - The date to check
   * @param {String} timeSlot - The time slot to check (e.g., "09:00-10:00")
   * @param {String} excludeAppointmentId - Appointment ID to exclude from check (for rescheduling)
   * @returns {Object} Availability status and details
   */
  async isTimeSlotAvailable(date, timeSlot, excludeAppointmentId = null) {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      // Check if date is a holiday
      const holiday = await Holiday.isHoliday(targetDate);
      if (holiday) {
        return {
          available: false,
          reason: `Holiday: ${holiday.reason}`,
          type: "holiday",
        };
      }

      // Get template for the date
      const template = await AvailabilityTemplate.getTemplateForDate(targetDate);
      if (!template) {
        return {
          available: false,
          reason: "No availability template configured",
          type: "no_template",
        };
      }

      // Check if the time slot is valid for this template
      const validSlots = template.generateTimeSlots();
      const isValidSlot = validSlots.some(slot => slot.timeSlot === timeSlot);
      
      if (!isValidSlot) {
        return {
          available: false,
          reason: "Time slot is not available in the current schedule",
          type: "invalid_slot",
        };
      }

      // Check if slot is already booked
      const query = {
        date: {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
        timeSlot,
        status: { $nin: ["cancelled"] },
      };

      if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
      }

      const existingAppointment = await Appointment.findOne(query);
      
      if (existingAppointment) {
        return {
          available: false,
          reason: "Time slot is already booked",
          type: "booked",
        };
      }

      return {
        available: true,
        reason: null,
        type: "available",
        template: {
          id: template._id,
          name: template.templateName,
          isDefault: template.isDefault,
        },
      };
    } catch (error) {
      console.error("Error checking time slot availability:", error);
      throw new Error("Failed to check time slot availability");
    }
  }

  /**
   * Get available dates in a range (dates that have at least one available slot)
   * @param {Date} startDate - Start date of the range
   * @param {Date} endDate - End date of the range
   * @returns {Array} Array of available dates
   */
  async getAvailableDates(startDate, endDate) {
    try {
      const availableDates = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      const currentDate = new Date(start);
      while (currentDate <= end) {
        const availability = await this.getAvailabilityForDate(currentDate, { onlyAvailable: true });
        
        if (availability.available && availability.slots.length > 0) {
          availableDates.push({
            date: new Date(currentDate),
            dateString: currentDate.toISOString().split('T')[0],
            availableSlots: availability.slots.length,
            totalSlots: availability.totalSlots,
            template: availability.template,
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availableDates;
    } catch (error) {
      console.error("Error getting available dates:", error);
      throw new Error("Failed to get available dates");
    }
  }

  /**
   * Create or update an availability template
   * @param {Object} templateData - Template data
   * @param {String} userId - ID of the user creating/updating the template
   * @returns {Object} Created or updated template
   */
  async createTemplate(templateData, userId) {
    try {
      const template = new AvailabilityTemplate({
        ...templateData,
        createdBy: userId,
      });

      await template.save();
      return template;
    } catch (error) {
      console.error("Error creating template:", error);
      throw new Error("Failed to create availability template");
    }
  }

  /**
   * Update an availability template
   * @param {String} templateId - Template ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated template
   */
  async updateTemplate(templateId, updateData) {
    try {
      const template = await AvailabilityTemplate.findByIdAndUpdate(
        templateId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!template) {
        throw new Error("Template not found");
      }

      return template;
    } catch (error) {
      console.error("Error updating template:", error);
      throw new Error("Failed to update availability template");
    }
  }

  /**
   * Delete an availability template
   * @param {String} templateId - Template ID
   * @returns {Boolean} Success status
   */
  async deleteTemplate(templateId) {
    try {
      const template = await AvailabilityTemplate.findById(templateId);
      
      if (!template) {
        throw new Error("Template not found");
      }

      if (template.isDefault) {
        throw new Error("Cannot delete the default template");
      }

      await AvailabilityTemplate.findByIdAndDelete(templateId);
      return true;
    } catch (error) {
      console.error("Error deleting template:", error);
      throw new Error("Failed to delete availability template");
    }
  }

  /**
   * Get all availability templates
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of templates
   */
  async getTemplates(filters = {}) {
    try {
      const query = { isActive: true, ...filters };
      const templates = await AvailabilityTemplate.find(query)
        .populate("createdBy", "name email")
        .sort({ isDefault: -1, createdAt: -1 });

      return templates;
    } catch (error) {
      console.error("Error getting templates:", error);
      throw new Error("Failed to get availability templates");
    }
  }

  /**
   * Apply template to specific dates
   * @param {String} templateId - Template ID
   * @param {Array} dates - Array of dates to apply template to
   * @returns {Object} Updated template
   */
  async applyTemplateToDate(templateId, dates) {
    try {
      const template = await AvailabilityTemplate.findById(templateId);
      
      if (!template) {
        throw new Error("Template not found");
      }

      if (template.isDefault) {
        throw new Error("Cannot apply dates to default template");
      }

      await template.addDates(dates);
      return template;
    } catch (error) {
      console.error("Error applying template to dates:", error);
      throw new Error("Failed to apply template to dates");
    }
  }

  /**
   * Remove template from specific dates
   * @param {String} templateId - Template ID
   * @param {Array} dates - Array of dates to remove template from
   * @returns {Object} Updated template
   */
  async removeTemplateFromDates(templateId, dates) {
    try {
      const template = await AvailabilityTemplate.findById(templateId);
      
      if (!template) {
        throw new Error("Template not found");
      }

      await template.removeDates(dates);
      return template;
    } catch (error) {
      console.error("Error removing template from dates:", error);
      throw new Error("Failed to remove template from dates");
    }
  }
}

export default AvailabilityService;