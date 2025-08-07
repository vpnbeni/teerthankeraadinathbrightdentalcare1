/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate Indian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone number
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;

  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 && /^[6-9]/.test(cleaned);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and errors
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || typeof password !== "string") {
    return { isValid: false, errors: ["Password is required"] };
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} - Validation result
 */
export const validateRequired = (value, fieldName = "Field") => {
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0);

  return {
    isValid: !isEmpty,
    error: isEmpty ? `${fieldName} is required` : null,
  };
};

/**
 * Validate date format and range
 * @param {string} date - Date string to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
export const validateDate = (date, options = {}) => {
  const { minDate, maxDate, allowPast = true, allowFuture = true } = options;

  if (!date) {
    return { isValid: false, error: "Date is required" };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: "Invalid date format" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  if (!allowPast && dateObj < today) {
    return { isValid: false, error: "Date cannot be in the past" };
  }

  if (!allowFuture && dateObj > today) {
    return { isValid: false, error: "Date cannot be in the future" };
  }

  if (minDate && dateObj < new Date(minDate)) {
    return { isValid: false, error: `Date must be after ${minDate}` };
  }

  if (maxDate && dateObj > new Date(maxDate)) {
    return { isValid: false, error: `Date must be before ${maxDate}` };
  }

  return { isValid: true, error: null };
};

/**
 * Validate age range
 * @param {string} dateOfBirth - Date of birth
 * @param {object} options - Age validation options
 * @returns {object} - Validation result
 */
export const validateAge = (dateOfBirth, options = {}) => {
  const { minAge = 0, maxAge = 120 } = options;

  if (!dateOfBirth) {
    return { isValid: false, error: "Date of birth is required" };
  }

  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    return { isValid: false, error: "Invalid date of birth" };
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < minAge) {
    return { isValid: false, error: `Age must be at least ${minAge} years` };
  }

  if (age > maxAge) {
    return { isValid: false, error: `Age cannot exceed ${maxAge} years` };
  }

  return { isValid: true, error: null, age };
};

/**
 * Validate form data against schema
 * @param {object} data - Form data to validate
 * @param {object} schema - Validation schema
 * @returns {object} - Validation result with errors
 */
export const validateForm = (data, schema) => {
  const errors = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required
    if (rules.required) {
      const requiredResult = validateRequired(value, rules.label || field);
      if (!requiredResult.isValid) {
        errors[field] = requiredResult.error;
        isValid = false;
        continue;
      }
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) continue;

    // Email validation
    if (rules.type === "email" && !isValidEmail(value)) {
      errors[field] = "Please enter a valid email address";
      isValid = false;
    }

    // Phone validation
    if (rules.type === "phone" && !isValidPhone(value)) {
      errors[field] = "Please enter a valid 10-digit phone number";
      isValid = false;
    }

    // Password validation
    if (rules.type === "password") {
      const passwordResult = validatePassword(value);
      if (!passwordResult.isValid) {
        errors[field] = passwordResult.errors[0];
        isValid = false;
      }
    }

    // Date validation
    if (rules.type === "date") {
      const dateResult = validateDate(value, rules.dateOptions || {});
      if (!dateResult.isValid) {
        errors[field] = dateResult.error;
        isValid = false;
      }
    }

    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `${rules.label || field} must be at least ${
        rules.minLength
      } characters`;
      isValid = false;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${rules.label || field} cannot exceed ${
        rules.maxLength
      } characters`;
      isValid = false;
    }

    // Custom validation
    if (rules.custom && typeof rules.custom === "function") {
      const customResult = rules.custom(value, data);
      if (!customResult.isValid) {
        errors[field] = customResult.error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
};
