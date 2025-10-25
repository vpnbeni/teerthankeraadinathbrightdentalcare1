import React, { useState, useEffect } from "react";
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

const TimeSlotStep = ({ data, onNext, onBack, onDataChange }) => {
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
						`This date is a holiday: ${
							metadata.holidayName || "Holiday"
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
	};

	const handleNext = () => {
		if (!selectedSlot) return;
		onDataChange({ selectedTimeSlot: selectedSlot });
		onNext();
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
				<div className="flex justify-between pt-4 border-t">
					<button
						type="button"
						onClick={onBack}
						className="btn-secondary px-6 py-2"
					>
						Back
					</button>
					<button
						type="button"
						onClick={fetchAvailableSlots}
						className="btn-primary px-6 py-2"
					>
						Retry
					</button>
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

				<div className="flex justify-between pt-4 border-t">
					<button
						type="button"
						onClick={onBack}
						className="btn-secondary px-6 py-2"
					>
						Back to Date Selection
					</button>
				</div>
			</div>
		);
	}

	const groupedSlots = groupSlotsByPeriod();

	return (
		<div className="h-full flex flex-col">
			<div className="flex-1 overflow-y-auto space-y-5 pr-1">
				{/* Premium Header */}
				<div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 shadow-lg">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
					<div className="relative flex items-center gap-3">
						<div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/25">
							<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Select Time Slot</h3>
							<p className="text-gray-600 text-xs md:text-sm font-medium">
								{selectedDate.toLocaleDateString("en-IN", {
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</div>
					</div>
				</div>

				{/* Premium Time Slots by Period */}
				<div className="space-y-5">
				{Object.entries(groupedSlots).map(([period, slots]) => {
					if (slots.length === 0) return null;

					const periodColors = {
						Morning: { gradient: "from-amber-500 to-orange-600", bg: "from-amber-50 to-orange-50", icon: "🌅" },
						Afternoon: { gradient: "from-yellow-500 to-amber-600", bg: "from-yellow-50 to-amber-50", icon: "☀️" },
						Evening: { gradient: "from-indigo-500 to-purple-600", bg: "from-indigo-50 to-purple-50", icon: "🌆" }
					};

					const colors = periodColors[period];

					return (
						<div key={period} className="relative overflow-hidden bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 shadow-md">
							<div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors.bg} rounded-full blur-3xl opacity-50 -mr-12 -mt-12"></div>
							
							<div className="relative flex items-center gap-3 mb-4">
								<div className={`w-10 h-10 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-lg text-xl`}>
									{colors.icon}
								</div>
								<div>
									<h4 className="text-base md:text-lg font-bold text-gray-900">{period}</h4>
									<p className="text-xs text-gray-600">{slots.length} slots available</p>
								</div>
							</div>

							<div className="relative grid grid-cols-2 md:grid-cols-3 gap-3">
								{slots.map((slot) => (
									<button
										key={slot}
										type="button"
										onClick={() => handleSlotSelect(slot)}
										className={`group relative p-4 rounded-2xl border-2 text-sm font-bold transition-all duration-300 ${
											selectedSlot === slot
												? "border-[#346870] bg-gradient-to-br from-[#346870] to-[#5fa8b5] text-white shadow-xl scale-105"
												: "border-gray-200 bg-white/80 text-gray-700 hover:border-[#346870] hover:bg-gradient-to-br hover:from-[#346870]/10 hover:to-[#5fa8b5]/10 hover:scale-105 hover:shadow-lg"
										}`}
									>
										<div className="flex items-center justify-center gap-2">
											<svg className={`w-4 h-4 ${selectedSlot === slot ? "text-white" : "text-gray-400 group-hover:text-[#346870]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span>{formatTime(slot)}</span>
										</div>
										{selectedSlot === slot && (
											<div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
												<svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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

				{/* Premium Selected Slot Display */}
				{selectedSlot && (
					<div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border border-green-200/60 rounded-2xl p-5 shadow-lg">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
					<div className="relative flex items-center gap-4">
						<div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/30">
							<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div className="flex-1">
							<p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Selected Time</p>
							<p className="text-lg md:text-xl font-bold text-gray-900">{formatTime(selectedSlot)}</p>
						</div>
					</div>
					</div>
				)}

				{/* Availability Information */}
				<AvailabilityInfo selectedDate={data.selectedDate} />

				{/* Premium Info Banner */}
				<div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border border-blue-200/60 rounded-2xl p-5 shadow-md">
				<div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
				<div className="relative flex items-start gap-4">
					<div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
						<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div className="flex-1">
						<h4 className="font-bold text-blue-900 mb-2 text-sm md:text-base">Appointment Duration</h4>
						<p className="text-xs md:text-sm text-blue-800 leading-relaxed">
							Each appointment slot is 1 hour long. Please arrive 10 minutes early for check-in and registration.
						</p>
					</div>
				</div>
			</div>
			</div>

			{/* Premium Action Buttons */}
			<div className="flex justify-between gap-3 pt-2">
				<button
					type="button"
					onClick={onBack}
					className="group inline-flex items-center gap-2 px-6 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-2xl hover:border-gray-300 hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
				>
					<svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
					</svg>
					<span>Back</span>
				</button>
				<button
					type="button"
					onClick={handleNext}
					disabled={!selectedSlot}
					className="group inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-[#346870] via-[#4a8a95] to-[#5fa8b5] text-white text-sm font-bold rounded-2xl hover:shadow-2xl hover:shadow-[#346870]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:-translate-y-0.5 shadow-xl"
				>
					<span>Continue to Confirmation</span>
					<svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</button>
			</div>
		</div>
	);
};

export default TimeSlotStep;
