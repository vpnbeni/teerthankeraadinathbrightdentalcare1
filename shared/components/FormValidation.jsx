import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

// Form field wrapper with validation display
export const FormField = ({
  label,
  error,
  success,
  required = false,
  children,
  className = "",
  helpText = "",
}) => {
  const fieldId = React.useId();

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {React.cloneElement(children, {
          id: fieldId,
          className: `${children.props.className || ""} ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : success
              ? "border-green-300 focus:border-green-500 focus:ring-green-500"
              : "border-gray-300 focus:border-primary focus:ring-primary"
          }`,
        })}

        {/* Success/Error Icons */}
        {(error || success) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {error ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      {helpText && !error && !success && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* Success Message */}
      {success && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-4 w-4" />
          {success}
        </p>
      )}
    </div>
  );
};

// Form validation hook
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Validate single field
  const validateField = React.useCallback(
    (name, value) => {
      const rules = validationRules[name];
      if (!rules) return null;

      for (const rule of rules) {
        const error = rule(value, values);
        if (error) return error;
      }
      return null;
    },
    [validationRules, values]
  );

  // Validate all fields
  const validateForm = React.useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField, validationRules]);

  // Handle input change
  const handleChange = React.useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Real-time validation for touched fields
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
  );

  // Handle input blur
  const handleBlur = React.useCallback(
    (name) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField, values]
  );

  // Handle form submission
  const handleSubmit = React.useCallback(
    async (onSubmit) => {
      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched = Object.keys(validationRules).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      const isValid = validateForm();

      if (isValid) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error("Form submission error:", error);
        }
      }

      setIsSubmitting(false);
      return isValid;
    },
    [values, validateForm, validationRules]
  );

  // Reset form
  const resetForm = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set field error manually
  const setFieldError = React.useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  // Set multiple field errors
  const setFieldErrors = React.useCallback((errorObj) => {
    setErrors((prev) => ({ ...prev, ...errorObj }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldError,
    setFieldErrors,
    validateForm,
    isValid: Object.keys(errors).length === 0,
  };
};

// Common validation rules
export const validationRules = {
  required:
    (message = "This field is required") =>
    (value) => {
      if (!value || (typeof value === "string" && !value.trim())) {
        return message;
      }
      return null;
    },

  email:
    (message = "Please enter a valid email address") =>
    (value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return message;
      }
      return null;
    },

  phone:
    (message = "Please enter a valid phone number") =>
    (value) => {
      if (value && !/^[6-9]\d{9}$/.test(value.replace(/\D/g, ""))) {
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

  custom: (validator, message) => (value, allValues) => {
    if (!validator(value, allValues)) {
      return message;
    }
    return null;
  },
};

export default FormField;
