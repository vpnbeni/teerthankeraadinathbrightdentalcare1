// Validation schemas for admin panel forms
const PATTERNS = {
  phone: /^[6-9]\d{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  time: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
};

// Basic validators
const validators = {
  required:
    (message = "This field is required") =>
    (value) => {
      if (
        !value ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return message;
      }
      return null;
    },

  email:
    (message = "Please enter a valid email") =>
    (value) => {
      if (value && !PATTERNS.email.test(value)) {
        return message;
      }
      return null;
    },

  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message || `Must be no more than ${max} characters`;
    }
    return null;
  },

  pattern: (regex, message) => (value) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },
};

// User validation schemas
export const userValidationSchemas = {
  personalInfo: {
    name: [
      validators.required("Name is required"),
      validators.minLength(2, "Name must be at least 2 characters"),
    ],
    phone: [
      validators.required("Phone number is required"),
      validators.pattern(PATTERNS.phone, "Please enter a valid phone number"),
    ],
    email: [validators.email("Please enter a valid email address")],
  },
};

// Validation helpers
export const validationHelpers = {
  validateObject: (data, schema) => {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      for (const rule of rules) {
        const error = rule(value, data);
        if (error) {
          errors[field] = error;
          isValid = false;
          break;
        }
      }
    }

    return { isValid, errors };
  },
};

export default {
  userValidationSchemas,
  validationHelpers,
};
