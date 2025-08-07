/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Normalize a date to start of day in UTC
 * This ensures consistent date comparison regardless of timezone
 * @param {Date|string} date - The date to normalize
 * @returns {Date} - Normalized date at start of day UTC
 */
export const normalizeToStartOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Get date string in YYYY-MM-DD format
 * @param {Date|string} date - The date to format
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const getDateString = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

/**
 * Compare two dates ignoring time component
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} - True if dates are the same day
 */
export const isSameDate = (date1, date2) => {
  return getDateString(date1) === getDateString(date2);
};

/**
 * Check if a date falls within a date range (inclusive)
 * @param {Date|string} date - Date to check
 * @param {Date|string} startDate - Start of range
 * @param {Date|string} endDate - End of range
 * @returns {boolean} - True if date is within range
 */
export const isDateInRange = (date, startDate, endDate) => {
  const d = getDateString(date);
  const start = getDateString(startDate);
  const end = getDateString(endDate);
  return d >= start && d <= end;
};

/**
 * Add days to a date
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date with days added
 */
export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Get the start and end of a date range for database queries
 * This ensures we capture all records for the given date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Object} - Object with start and end dates
 */
export const getDateRangeForQuery = (startDate, endDate) => {
  const start = normalizeToStartOfDay(startDate);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999); // End of day

  return { start, end };
};
