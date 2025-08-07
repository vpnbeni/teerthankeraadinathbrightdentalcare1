import { DATE_FORMATS, WORKING_DAYS, TIME_SLOTS } from "../constants/index.js";

/**
 * Format date to display format (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Format date to API format (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} - API formatted date string
 */
export const formatDateForAPI = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  return d.toISOString().split("T")[0];
};

/**
 * Format date and time for display
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const dateStr = formatDate(d);
  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateStr} ${timeStr}`;
};

/**
 * Format time for display
 * @param {string} time - Time in HH:mm format
 * @returns {string} - Formatted time string
 */
export const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Check if a date is a working day
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if working day
 */
export const isWorkingDay = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;

  return WORKING_DAYS.includes(d.getDay());
};

/**
 * Get available dates for appointment booking
 * @param {number} daysAhead - Number of days to look ahead (default 90)
 * @returns {Array} - Array of available dates
 */
export const getAvailableDates = (daysAhead = 90) => {
  const dates = [];
  const today = new Date();
  const startDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Start from tomorrow

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);

    if (isWorkingDay(date)) {
      dates.push({
        date: formatDateForAPI(date),
        display: formatDate(date),
        dayName: date.toLocaleDateString("en-IN", { weekday: "long" }),
      });
    }
  }

  return dates;
};

/**
 * Get available time slots for a given date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} bookedSlots - Array of already booked time slots
 * @returns {Array} - Array of available time slots
 */
export const getAvailableTimeSlots = (date, bookedSlots = []) => {
  if (!isWorkingDay(new Date(date))) {
    return [];
  }

  return TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot.value));
};

/**
 * Calculate age from date of birth
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {number} - Age in years
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;

  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
export const isPastDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  return d < today;
};

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - Date to compare
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffMins) < 60) {
    return diffMins > 0
      ? `in ${diffMins} minutes`
      : `${Math.abs(diffMins)} minutes ago`;
  } else if (Math.abs(diffHours) < 24) {
    return diffHours > 0
      ? `in ${diffHours} hours`
      : `${Math.abs(diffHours)} hours ago`;
  } else {
    return diffDays > 0
      ? `in ${diffDays} days`
      : `${Math.abs(diffDays)} days ago`;
  }
};
