import AvailabilityTemplate from "../models/AvailabilityTemplate.js";
import Holiday from "../models/Holiday.js";
import Appointment from "../models/Appointment.js";
import performanceMonitor from "../utils/performanceMonitor.js";

class AvailabilityService {
	/**
	 * Get template data and holiday information for frontend processing
	 * @param {Date} date - The date to check availability for
	 * @param {Object} options - Options for availability calculation
	 * @returns {Object} Template data and holiday info for frontend processing
	 */
	async getAvailabilityTemplateForDate(date, options = {}) {
		try {
			const targetDate = new Date(date);
			targetDate.setHours(0, 0, 0, 0);

			// 0. Early return for past dates to optimize performance
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (targetDate < today) {
				performanceMonitor.trackPastDateSkip();
				return {
					available: false,
					reason: "Past date",
					type: "past_date",
					holiday: null,
					template: null,
					bookedSlots: [],
				};
			}

			// 1. Check if it's a holiday first
			const holiday = await Holiday.isHoliday(targetDate);
			if (holiday) {
				return {
					available: false,
					reason: holiday.reason,
					type: "holiday",
					holiday: holiday,
					template: null,
					bookedSlots: [],
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
					template: null,
					bookedSlots: [],
				};
			}

					// 3. Get booked appointments for this date only (including follow-ups)
		const dateStart = new Date(targetDate);
		dateStart.setHours(0, 0, 0, 0);
		const dateEnd = new Date(targetDate);
		dateEnd.setHours(23, 59, 59, 999);
		
		console.log(`🕐 DEBUG: Searching for appointments between ${dateStart.toISOString()} and ${dateEnd.toISOString()}`);
		
		const bookedAppointments = await Appointment.find({
			date: {
				$gte: dateStart,
				$lt: dateEnd,
			},
			status: { $nin: ["cancelled"] },
		}).select("timeSlot");

					// 4. Get follow-ups scheduled for this date
		console.log(`🔍 DEBUG: Searching for follow-ups between ${dateStart.toISOString()} and ${dateEnd.toISOString()}`);
		
		const followUpAppointments = await Appointment.find({
			"followUps": {
				$elemMatch: {
					"date": {
						$gte: dateStart,
						$lt: dateEnd,
					},
					"status": { $in: ["scheduled", "confirmed", "completed"] }
				}
			}
		}).select("followUps");
		
		console.log(`📊 DEBUG: Found ${followUpAppointments.length} appointments with potential follow-ups`);

			// Extract time slots from regular appointments
			const bookedTimeSlots = bookedAppointments.map((apt) => apt.timeSlot);

					// Extract time slots from follow-ups scheduled for this date
		const followUpTimeSlots = [];
		followUpAppointments.forEach((appointment, appointmentIndex) => {
			console.log(`📋 Processing appointment ${appointmentIndex + 1}/${followUpAppointments.length}: ${appointment._id}`);
			appointment.followUps.forEach((followUp, followUpIndex) => {
				const followUpDate = new Date(followUp.date);
				followUpDate.setHours(0, 0, 0, 0);
				const targetDateCopy = new Date(targetDate);
				targetDateCopy.setHours(0, 0, 0, 0);
				
				console.log(`  📅 Follow-up ${followUpIndex + 1}: ${followUp.timeSlot}, date: ${followUpDate.toISOString()}, target: ${targetDateCopy.toISOString()}, status: ${followUp.status}`);
				
				// Only include follow-ups for the target date that are active (scheduled, confirmed, or completed)
				if (followUpDate.getTime() === targetDateCopy.getTime() && 
					["scheduled", "confirmed", "completed"].includes(followUp.status)) {
					followUpTimeSlots.push(followUp.timeSlot);
					console.log(`  ✅ ADDED: ${followUp.timeSlot} on ${followUpDate.toDateString()}, status: ${followUp.status}`);
				} else {
					console.log(`  ❌ SKIPPED: Date match: ${followUpDate.getTime() === targetDateCopy.getTime()}, Status OK: ${["scheduled", "confirmed", "completed"].includes(followUp.status)}`);
				}
			});
		});

			// Combine both regular appointments and follow-up slots
			const allBookedTimeSlots = [...bookedTimeSlots, ...followUpTimeSlots];
			console.log(`📅 Date: ${targetDate.toDateString()}`);
			console.log(`🏥 Regular appointments: ${bookedTimeSlots.length} - ${JSON.stringify(bookedTimeSlots)}`);
			console.log(`🔄 Follow-ups: ${followUpTimeSlots.length} - ${JSON.stringify(followUpTimeSlots)}`);
			console.log(`📋 Total booked slots: ${allBookedTimeSlots.length} - ${JSON.stringify(allBookedTimeSlots)}`);

			// 5. Return template data for frontend processing
			return {
				available: true,
				reason: null,
				type: "available",
				holiday: null,
				template: {
					id: template._id,
					name: template.templateName,
					isDefault: template.isDefault,
					workingHours: template.workingHours,
					slotDuration: template.slotDuration,
					breakTimes: template.breakTimes,
				},
				bookedSlots: allBookedTimeSlots,
			};
		} catch (error) {
			console.error("Error getting availability template for date:", error);
			throw new Error("Failed to get availability template for date");
		}
	}

	/**
	 * Get availability for a date range - returns template data for frontend processing
	 * @param {Date} startDate - Start date of the range
	 * @param {Date} endDate - End date of the range
	 * @param {Object} options - Options for availability calculation
	 * @returns {Object} Template data and holiday info for each date in the range
	 */
	async getAvailabilityTemplatesForDateRange(startDate, endDate, options = {}) {
		try {
			const start = new Date(startDate);
			const end = new Date(endDate);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const dateTemplates = {};

			// Iterate through each date in the range
			const currentDate = new Date(start);
			while (currentDate <= end) {
				const dateKey = currentDate.toISOString().split("T")[0];

				// Skip past dates - mark them as unavailable without processing
				if (currentDate < today) {
					performanceMonitor.trackPastDateSkip();
					dateTemplates[dateKey] = {
						available: false,
						reason: "Past date",
						type: "past_date",
						holiday: null,
						template: null,
						bookedSlots: [],
					};
				} else {
					// Get template data for current and future dates
					dateTemplates[dateKey] = await this.getAvailabilityTemplateForDate(
						currentDate,
						options
					);
				}

				currentDate.setDate(currentDate.getDate() + 1);
			}

			return dateTemplates;
		} catch (error) {
			console.error("Error getting availability templates for date range:", error);
			throw new Error("Failed to get availability templates for date range");
		}
	}

	/**
	 * Get all templates and holidays for frontend processing
	 * @param {Date} startDate - Start date of the range
	 * @param {Date} endDate - End date of the range
	 * @returns {Object} All templates and holidays in the date range
	 */
	async getAvailabilityDataForRange(startDate, endDate) {
		try {
			const start = new Date(startDate);
			const end = new Date(endDate);

			// Get all templates
			const templates = await AvailabilityTemplate.find({ isActive: true })
				.select('_id templateName isDefault workingHours slotDuration breakTimes applicableDates')
				.lean();

			// Get all holidays in the date range
			const holidays = await Holiday.find({
				date: {
					$gte: start,
					$lte: end,
				},
			}).lean();

			// Get all booked appointments in the date range
			const bookedAppointments = await Appointment.find({
				date: {
					$gte: start,
					$lt: new Date(end.getTime() + 24 * 60 * 60 * 1000),
				},
				status: { $nin: ["cancelled"] },
			}).select("date timeSlot").lean();

			// Get follow-up appointments in the date range
			const followUpAppointments = await Appointment.find({
				"followUps": {
					$elemMatch: {
						"date": {
							$gte: start,
							$lt: new Date(end.getTime() + 24 * 60 * 60 * 1000),
						},
						"status": { $in: ["scheduled", "confirmed", "completed"] }
					}
				}
			}).select("followUps").lean();

			// Group booked appointments by date
			const bookedSlotsByDate = {};
			bookedAppointments.forEach(apt => {
				const dateKey = apt.date.toISOString().split("T")[0];
				if (!bookedSlotsByDate[dateKey]) {
					bookedSlotsByDate[dateKey] = [];
				}
				bookedSlotsByDate[dateKey].push(apt.timeSlot);
			});

			// Add follow-up appointments to booked slots
			followUpAppointments.forEach(appointment => {
				appointment.followUps.forEach(followUp => {
					if (["scheduled", "confirmed", "completed"].includes(followUp.status)) {
						const followUpDate = new Date(followUp.date);
						const dateKey = followUpDate.toISOString().split("T")[0];
						if (!bookedSlotsByDate[dateKey]) {
							bookedSlotsByDate[dateKey] = [];
						}
						bookedSlotsByDate[dateKey].push(followUp.timeSlot);
					}
				});
			});

			return {
				templates: templates.map(template => ({
					id: template._id,
					name: template.templateName,
					isDefault: template.isDefault,
					workingHours: template.workingHours,
					slotDuration: template.slotDuration,
					breakTimes: template.breakTimes,
					applicableDates: template.applicableDates,
				})),
				holidays: holidays.map(holiday => ({
					id: holiday._id,
					date: holiday.date.toISOString().split("T")[0],
					reason: holiday.reason,
				})),
				bookedSlots: bookedSlotsByDate,
			};
		} catch (error) {
			console.error("Error getting availability data for range:", error);
			throw new Error("Failed to get availability data for range");
		}
	}

	/**
	 * LEGACY: Get availability for a specific date (server-generated slots)
	 * Backward-compatibility wrapper used by older clients and endpoints
	 */
	async getAvailabilityForDate(date, options = {}) {
		try {
			const targetDate = new Date(date);
			targetDate.setHours(0, 0, 0, 0);

			// Early return for past dates
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			if (targetDate < today) {
				performanceMonitor.trackPastDateSkip();
				return {
					available: false,
					reason: "Past date",
					type: "past_date",
					holiday: null,
					slots: [],
					template: null,
					totalSlots: 0,
					availableSlots: 0,
					bookedSlots: 0,
				};
			}

			// Holiday check
			const holiday = await Holiday.isHoliday(targetDate);
			if (holiday) {
				return {
					available: false,
					reason: holiday.reason,
					type: "holiday",
					holiday: holiday,
					slots: [],
					template: null,
					totalSlots: 0,
					availableSlots: 0,
					bookedSlots: 0,
				};
			}

			// Template for date
			const template = await AvailabilityTemplate.getTemplateForDate(targetDate);
			if (!template) {
				return {
					available: false,
					reason: "No availability template configured",
					type: "no_template",
					holiday: null,
					slots: [],
					template: null,
					totalSlots: 0,
					availableSlots: 0,
					bookedSlots: 0,
				};
			}

			// Generate time slots from template (legacy server-side)
			const allSlots = template.generateTimeSlots();

			// Booked slots for the date (including follow-ups)
			const dateStart = new Date(targetDate);
			dateStart.setHours(0, 0, 0, 0);
			const dateEnd = new Date(targetDate);
			dateEnd.setHours(23, 59, 59, 999);
			
			console.log(`🕐 [getAvailabilityForDate] DEBUG: Searching for appointments between ${dateStart.toISOString()} and ${dateEnd.toISOString()}`);
			
			const bookedAppointments = await Appointment.find({
				date: {
					$gte: dateStart,
					$lt: dateEnd,
				},
				status: { $nin: ["cancelled"] },
			}).select("timeSlot");

			// Get follow-ups scheduled for this date
			console.log(`🔍 [getAvailabilityForDate] DEBUG: Searching for follow-ups between ${dateStart.toISOString()} and ${dateEnd.toISOString()}`);
			
			const followUpAppointments = await Appointment.find({
				"followUps": {
					$elemMatch: {
						"date": {
							$gte: dateStart,
							$lt: dateEnd,
						},
						"status": { $in: ["scheduled", "confirmed", "completed"] }
					}
				}
			}).select("followUps");
			
			console.log(`📊 [getAvailabilityForDate] DEBUG: Found ${followUpAppointments.length} appointments with potential follow-ups`);

			const bookedTimeSlots = bookedAppointments.map((apt) => apt.timeSlot);

			// Extract follow-up time slots for this date
			const followUpTimeSlots = [];
			followUpAppointments.forEach((appointment, appointmentIndex) => {
				console.log(`📋 [getAvailabilityForDate] Processing appointment ${appointmentIndex + 1}/${followUpAppointments.length}: ${appointment._id}`);
				appointment.followUps.forEach((followUp, followUpIndex) => {
					const followUpDate = new Date(followUp.date);
					followUpDate.setHours(0, 0, 0, 0);
					const targetDateCopy = new Date(targetDate);
					targetDateCopy.setHours(0, 0, 0, 0);
					
					console.log(`  📅 [getAvailabilityForDate] Follow-up ${followUpIndex + 1}: ${followUp.timeSlot}, date: ${followUpDate.toISOString()}, target: ${targetDateCopy.toISOString()}, status: ${followUp.status}`);
					
					// Only include follow-ups for the target date that are active (scheduled, confirmed, or completed)
					const dateMatches = followUpDate.getTime() === targetDateCopy.getTime();
					const statusOk = ["scheduled", "confirmed", "completed"].includes(followUp.status);
					
					if (dateMatches && statusOk) {
						followUpTimeSlots.push(followUp.timeSlot);
						console.log(`  ✅ [getAvailabilityForDate] ADDED: ${followUp.timeSlot} on ${followUpDate.toDateString()}, status: ${followUp.status}`);
					} else {
						console.log(`  ❌ [getAvailabilityForDate] SKIPPED: Date match: ${dateMatches}, Status OK: ${statusOk}`);
					}
				});
			});

			// Combine both regular appointments and follow-up slots
			const allBookedTimeSlots = [...bookedTimeSlots, ...followUpTimeSlots];
			console.log(`📅 [getAvailabilityForDate] Date: ${targetDate.toDateString()}`);
			console.log(`🏥 [getAvailabilityForDate] Regular appointments: ${bookedTimeSlots.length}`);
			console.log(`🔄 [getAvailabilityForDate] Follow-ups: ${followUpTimeSlots.length}`);
			console.log(`📋 [getAvailabilityForDate] Total booked: ${allBookedTimeSlots.length}`);

			// Mark availability
			const slotsWithAvailability = allSlots.map((slot) => ({
				...slot,
				isAvailable: !allBookedTimeSlots.includes(slot.timeSlot),
				isBooked: allBookedTimeSlots.includes(slot.timeSlot),
			}));

			let finalSlots = slotsWithAvailability;
			if (options.onlyAvailable) {
				finalSlots = slotsWithAvailability.filter((slot) => slot.isAvailable);
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
				availableSlots: slotsWithAvailability.filter((slot) => slot.isAvailable).length,
				bookedSlots: slotsWithAvailability.filter((slot) => slot.isBooked).length,
			};
		} catch (error) {
			console.error("Error getting availability for date:", error);
			throw new Error("Failed to get availability for date");
		}
	}

	/**
	 * LEGACY: Get availability for a date range (server-generated slots)
	 */
	async getAvailabilityForDateRange(startDate, endDate, options = {}) {
		try {
			const start = new Date(startDate);
			const end = new Date(endDate);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const dateAvailability = {};
			const currentDate = new Date(start);
			while (currentDate <= end) {
				const dateKey = currentDate.toISOString().split("T")[0];
				if (currentDate < today) {
					performanceMonitor.trackPastDateSkip();
					dateAvailability[dateKey] = {
						available: false,
						reason: "Past date",
						type: "past_date",
						holiday: null,
						slots: [],
						template: null,
						totalSlots: 0,
						availableSlots: 0,
						bookedSlots: 0,
					};
				} else {
					dateAvailability[dateKey] = await this.getAvailabilityForDate(
						currentDate,
						options
					);
				}
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
	 */
	async isTimeSlotAvailable(date, timeSlot, excludeAppointmentId = null) {
		try {
			const targetDate = new Date(date);
			targetDate.setHours(0, 0, 0, 0);

			// Early return for past dates - they're never available
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (targetDate < today) {
				return {
					available: false,
					reason: "Cannot book appointments for past dates",
					type: "past_date",
				};
			}

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
			const isValidSlot = validSlots.some((slot) => slot.timeSlot === timeSlot);

			if (!isValidSlot) {
				return {
					available: false,
					reason: "Time slot is not available in the current schedule",
					type: "invalid_slot",
				};
			}

			// Check if slot is already booked by regular appointments
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
					reason: "Time slot is already booked by an appointment",
					type: "booked",
				};
			}

			// Check if slot is already booked by follow-ups
			const followUpQuery = {
				"followUps": {
					$elemMatch: {
						"date": {
							$gte: new Date(targetDate.setHours(0, 0, 0, 0)),
							$lt: new Date(targetDate.setHours(23, 59, 59, 999)),
						},
						"timeSlot": timeSlot,
						"status": { $in: ["scheduled", "confirmed", "completed"] }
					}
				}
			};

			if (excludeAppointmentId) {
				followUpQuery._id = { $ne: excludeAppointmentId };
			}

			const existingFollowUp = await Appointment.findOne(followUpQuery);

			if (existingFollowUp) {
				return {
					available: false,
					reason: "Time slot is already booked by a follow-up appointment",
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
	 */
	async getAvailableDates(startDate, endDate) {
		try {
			const availableDates = [];
			const start = new Date(startDate);
			const end = new Date(endDate);

			const currentDate = new Date(start);
			while (currentDate <= end) {
				const availability = await this.getAvailabilityForDate(currentDate, {
					onlyAvailable: true,
				});

				if (availability.available && availability.slots.length > 0) {
					availableDates.push({
						date: new Date(currentDate),
						dateString: currentDate.toISOString().split("T")[0],
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

	/** Template CRUD methods omitted for brevity (unchanged) */
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
