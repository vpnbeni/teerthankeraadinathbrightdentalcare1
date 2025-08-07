import { VALIDATION_RULES, ERROR_MESSAGES } from "../constants/validation.js";

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return VALIDATION_RULES.EMAIL.PATTERN.test(email.trim());
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  return VALIDATION_RULES.PHONE.PATTERN.test(phone.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { isValid: false, message: ERROR_MESSAGES.REQUIRED };
  }

  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
    };
  }

  if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    return {
      isValid: false,
      message: `Password cannot exceed ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`,
    };
  }

  if (!VALIDATION_RULES.PASSWORD.PATTERN.test(password)) {
    return { isValid: false, message: VALIDATION_RULES.PASSWORD.MESSAGE };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate name format
 * @param {string} name - Name to validate
 * @returns {object} - Validation result
 */
export const validateName = (name) => {
  if (!name || typeof name !== "string") {
    return { isValid: false, message: ERROR_MESSAGES.REQUIRED };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < VALIDATION_RULES.NAME.MIN_LENGTH) {
    return {
      isValid: false,
      message: `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters`,
    };
  }

  if (trimmedName.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
    return {
      isValid: false,
      message: `Name cannot exceed ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`,
    };
  }

  if (!VALIDATION_RULES.NAME.PATTERN.test(trimmedName)) {
    return { isValid: false, message: VALIDATION_RULES.NAME.MESSAGE };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} - True if valid
 */
export const isValidOTP = (otp) => {
  if (!otp || typeof otp !== "string") return false;
  return VALIDATION_RULES.OTP.PATTERN.test(otp.trim());
};

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @returns {object} - Validation result
 */
export const validateFile = (file) => {
  if (!file) {
    return { isValid: false, message: ERROR_MESSAGES.REQUIRED };
  }

  if (file.size > VALIDATION_RULES.FILE_UPLOAD.MAX_SIZE) {
    return { isValid: false, message: ERROR_MESSAGES.FILE_TOO_LARGE };
  }

  if (!VALIDATION_RULES.FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, message: ERROR_MESSAGES.INVALID_FILE_TYPE };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate appointment date
 * @param {Date|string} date - Date to validate
 * @returns {object} - Validation result
 */
export const validateAppointmentDate = (date) => {
  const appointmentDate = new Date(date);
  const now = new Date();
  const minDate = new Date(
    now.getTime() +
      VALIDATION_RULES.APPOINTMENT_DATE.MIN_ADVANCE_HOURS * 60 * 60 * 1000
  );
  const maxDate = new Date(
    now.getTime() +
      VALIDATION_RULES.APPOINTMENT_DATE.MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000
  );

  if (isNaN(appointmentDate.getTime())) {
    return { isValid: false, message: ERROR_MESSAGES.INVALID_DATE };
  }

  if (appointmentDate < minDate) {
    return {
      isValid: false,
      message: "Appointment must be booked at least 24 hours in advance",
    };
  }

  if (appointmentDate > maxDate) {
    return {
      isValid: false,
      message: "Appointment cannot be booked more than 90 days in advance",
    };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate form data against required fields
 * @param {object} data - Form data
 * @param {array} requiredFields - Array of required field names
 * @returns {object} - Validation result with errors object
 */
export const validateRequiredFields = (data, requiredFields) => {
  const errors = {};
  let isValid = true;

  requiredFields.forEach((field) => {
    if (
      !data[field] ||
      (typeof data[field] === "string" && !data[field].trim())
    ) {
      errors[field] = ERROR_MESSAGES.REQUIRED;
      isValid = false;
    }
  });

  return { isValid, errors };
};
