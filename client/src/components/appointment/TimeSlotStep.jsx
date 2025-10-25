import { useState, useEffect } from "react";
import appointmentService from "../../services/appointments";
import availabilityService from "../../services/availability";
import { LoadingSpinner } from "../../shared/components";

// Component to show availability information to patients
const AvailabilityInfo = ({ selectedDate }) => {
	const [availabilityInfo, setAvailabilityInfo] = useState(null);

	useEffect(() => {
		const fetchAvailabilityInfo = async () => {
			if (!selectedDate) return;

			try {
				// Use frontend-generated availability to avoid extra network calls
				const response = await availabilityService.generateAvailabilityForDate(
					selectedDate
				);
				if (response.data.success && response.data.data) {
					setAvailabilityInfo(response.data.data);
				}
			} catch (error) {
				console.error("Failed to fetch availability info:", error);
			}
		};

		fetchAvailabilityInfo();
	}, [selectedDate]);

	if (!availabilityInfo) return null;

	const getAvailabilityMessage = () => {
		if (availabilityInfo.type === "holiday") {
			return {
				type: "holiday",
				icon: "🎉",
				title: "Holiday",
				message: availabilityInfo.holiday?.reason || "This date is a holiday",
				color: "text-red-600 bg-red-50 border-red-200",
			};
		}

		if (availabilityInfo.available && availabilityInfo.template) {
			const template = availabilityInfo.template;
			if (template.isDefault) {
				return {
					type: "regular",
					icon: "⏰",
					title: "Regular Hours",
					message: `Standard clinic hours: ${template.workingHours.start} - ${template.workingHours.end}`,
					color: "text-green-600 bg-green-50 border-green-200",
					template: template,
				};
			} else {
				return {
					type: "custom",
					icon: "📅",
					title: `${template.name}`,
					message: `Extended hours: ${template.workingHours.start} - ${template.workingHours.end}`,
					color: "text-blue-600 bg-blue-50 border-blue-200",
					template: template,
				};
			}
		}

		return null;
	};

	const info = getAvailabilityMessage();
	if (!info) return null;

	return (
		<div className={`border rounded-lg p-4 ${info.color}`}>
			<div className="flex items-start">
				<span className="text-lg mr-3 mt-0.5">{info.icon}</span>
				<div className="flex-1">
					<h4 className="font-medium text-sm">{info.title}</h4>
					<p className="text-sm mt-1">{info.message}</p>
					{info.template && (
						<div className="mt-2 text-xs space-y-1">
							<div>Slot Duration: {info.template.slotDuration} minutes</div>
							{info.template.breakTimes && info.template.breakTimes.length > 0 && (
								<div>
									Break Times: {info.template.breakTimes.map(bt => `${bt.start}-${bt.end}`).join(', ')}
								</div>
							)}
							<div>{availabilityInfo.totalSlots} total slots, {availabilityInfo.availableSlots} available</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

const TimeSlotStep = ({ data, onDataChange }) => {
	const [availableSlots, setAvailableSlots] = useState([]);
	const [selectedSlot, setSelectedSlot] = useState(data.selectedTimeSlot);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (data.selectedDate) {
			fetchAvailableSlots();
		}
	}, [data.selectedDate]);

	const fetchAvailableSlots = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await appointmentService.getAvailableSlots(
				data.selectedDate
			);

			if (response.data.success) {
				const slots = response.data.data.availableSlots || [];
				const metadata = response.data.data.metadata || {};

				// Handle special cases based on new availability system metadata
				if (metadata.isHoliday) {
					setError(
						`This date is a holiday: ${metadata.holidayName || "Holiday"
						}. Please select a different date.`
					);
					setAvailableSlots([]);
					return;
				}

				if (!metadata.isWorkingDay) {
					setError(
						"This date is not a working day. Please select a different date."
					);
					setAvailableSlots([]);
					return;
				}

				if (metadata.isCustom && metadata.customReason) {
					// Show info about custom availability
					console.log(
						`Custom availability for this date: ${metadata.customReason}`
					);
				}

				// Filter out any undefined or invalid slots
				const validSlots = slots.filter(
					(slot) => slot && typeof slot === "string" && slot.includes("-")
				);
				setAvailableSlots(validSlots);
			} else {
				setError(
					response.data.message || "Failed to load available time slots."
				);
				setAvailableSlots([]);
			}
		} catch (error) {
			console.error("Failed to fetch available slots:", error);

			// Handle specific error cases
			if (error.response?.status === 400) {
				setError(
					error.response.data.message ||
					"Invalid date selected. Please choose a different date."
				);
			} else {
				setError(
					error.response?.data?.message ||
					"Failed to load available time slots. Please try again."
				);
			}
			setAvailableSlots([]);
		} finally {
			setLoading(false);
		}
	};

	const handleSlotSelect = (slot) => {
		setSelectedSlot(slot);
		// Auto-save the selected slot
		onDataChange({ selectedTimeSlot: slot });
	};

	const formatTime = (timeString) => {
		if (!timeString || typeof timeString !== "string") {
			console.error("Invalid timeString:", timeString);
			return "Invalid Time";
		}

		const [start, end] = timeString.split("-");
		if (!start || !end) {
			console.error("Invalid time format:", timeString);
			return timeString; // Return as-is if format is unexpected
		}

		const formatSingleTime = (time) => {
			const [hours, minutes] = time.split(":");
			const hour = parseInt(hours);
			const ampm = hour >= 12 ? "PM" : "AM";
			const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
			return `${displayHour}:${minutes} ${ampm}`;
		};

		return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
	};

	const getTimeSlotPeriod = (timeString) => {
		if (!timeString || typeof timeString !== "string") {
			return "Unknown";
		}

		const [start] = timeString.split("-");
		if (!start) return "Unknown";

		const timeParts = start.split(":");
		if (!timeParts[0]) return "Unknown";

		const hour = parseInt(timeParts[0]);

		if (hour < 12) return "Morning";
		if (hour < 17) return "Afternoon";
		return "Evening";
	};

	const groupSlotsByPeriod = () => {
		const grouped = {
			Morning: [],
			Afternoon: [],
			Evening: [],
		};

		availableSlots.forEach((slot) => {
			if (slot && typeof slot === "string") {
				const period = getTimeSlotPeriod(slot);
				if (period !== "Unknown" && grouped[period]) {
					grouped[period].push(slot);
				}
			}
		});

		return grouped;
	};

	const selectedDate = new Date(data.selectedDate);

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<h3 className="text-lg font-semibold text-gray-800 mb-2">
						Select Time Slot
					</h3>
					<p className="text-gray-600">Loading available time slots...</p>
				</div>
				<div className="flex justify-center py-8">
					<LoadingSpinner size="medium" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<h3 className="text-lg font-semibold text-gray-800 mb-2">
						Select Time Slot
					</h3>
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
						{error}
					</div>
				</div>
			</div>
		);
	}

	if (availableSlots.length === 0) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<h3 className="text-lg font-semibold text-gray-800 mb-2">
						Select Time Slot
					</h3>
					<p className="text-gray-600 mb-4">
						{selectedDate.toLocaleDateString("en-IN", {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
				</div>

				<div className="text-center py-8">
					<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h4 className="text-lg font-medium text-gray-800 mb-2">
						No Available Slots
					</h4>
					<p className="text-gray-600 mb-4">
						All time slots are booked for this date. Please select a different
						date.
					</p>
				</div>
			</div>
		);
	}

	const groupedSlots = groupSlotsByPeriod();

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="text-center">
				<h3 className="text-lg font-semibold text-gray-800 mb-1">Select Time Slot</h3>
				<p className="text-sm text-gray-600">
					{selectedDate.toLocaleDateString("en-IN", {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</p>
			</div>

			{/* Time Slots by Period */}
			<div className="space-y-4">
				{Object.entries(groupedSlots).map(([period, slots]) => {
					if (slots.length === 0) return null;

					const periodIcons = {
						Morning: "🌅",
						Afternoon: "☀️",
						Evening: "🌆"
					};

					return (
						<div key={period} className="bg-white border border-gray-200 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-3">
								<span className="text-lg">{periodIcons[period]}</span>
								<div>
									<h4 className="text-sm font-semibold text-gray-900">{period}</h4>
									<p className="text-xs text-gray-500">{slots.length} available</p>
								</div>
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
								{slots.map((slot) => (
									<button
										key={slot}
										type="button"
										onClick={() => handleSlotSelect(slot)}
										className={`relative px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all ${selectedSlot === slot
												? "border-[#346870] bg-[#346870] text-white shadow-md"
												: "border-gray-200 bg-white text-gray-700 hover:border-[#346870] hover:bg-[#346870]/5"
											}`}
									>
										<div className="flex items-center justify-center gap-1">
											<svg className={`w-3 h-3 ${selectedSlot === slot ? "text-white" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span>{formatTime(slot)}</span>
										</div>
										{selectedSlot === slot && (
											<div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
												<svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											</div>
										)}
									</button>
								))}
							</div>
						</div>
					);
				})}
			</div>

			{/* Selected Slot Display */}
			{selectedSlot && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
							<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div>
							<p className="text-xs font-medium text-green-700 uppercase">Selected Time</p>
							<p className="text-base font-bold text-gray-900">{formatTime(selectedSlot)}</p>
						</div>
					</div>
				</div>
			)}

			{/* Availability Information */}
			<AvailabilityInfo selectedDate={data.selectedDate} />

			{/* Info Banner */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
						<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<h4 className="text-sm font-semibold text-blue-900 mb-1">Appointment Duration</h4>
						<p className="text-xs text-blue-800">
							Each appointment slot is 1 hour long. Please arrive 10 minutes early for check-in and registration.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TimeSlotStep;
