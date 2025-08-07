import { useState, useCallback, useMemo } from "react";

// Enhanced form validation hook with common patterns
export const useFormValidation = (
  initialValues,
  validationSchema,
  options = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    revalidateOnSubmit = true,
    enableReinitialize = false,
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Reinitialize form when initialValues change
  useMemo(() => {
    if (enableReinitialize) {
      setValues(initialValues);
      setErrors({});
      setTouched({});
    }
  }, [initialValues, enableReinitialize]);

  // Validate single field
  const validateField = useCallback(
    (name, value, allValues = values) => {
      const fieldSchema = validationSchema[name];
      if (!fieldSchema) return null;

      for (const validator of fieldSchema) {
        const error = validator(value, allValues);
        if (error) return error;
      }
      return null;
    },
    [validationSchema, values]
  );

  // Validate all fields
  const validateForm = useCallback(
    (valuesToValidate = values) => {
      const newErrors = {};
      let isValid = true;

      Object.keys(validationSchema).forEach((fieldName) => {
        const error = validateField(
          fieldName,
          valuesToValidate[fieldName],
          valuesToValidate
        );
        if (error) {
          newErrors[fieldName] = error;
          isValid = false;
        }
      });

      return { errors: newErrors, isValid };
    },
    [validationSchema, validateField, values]
  );

  // Set field value
  const setFieldValue = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Validate on change if enabled and field is touched
      if (validateOnChange && (touched[name] || submitCount > 0)) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateOnChange, touched, submitCount, validateField]
  );

  // Set multiple field values
  const setFieldValues = useCallback(
    (newValues) => {
      setValues((prev) => ({ ...prev, ...newValues }));

      if (validateOnChange) {
        const { errors: newErrors } = validateForm({ ...values, ...newValues });
        setErrors((prev) => ({ ...prev, ...newErrors }));
      }
    },
    [validateOnChange, validateForm, values]
  );

  // Set field touched
  const setFieldTouched = useCallback(
    (name, isTouched = true) => {
      setTouched((prev) => ({ ...prev, [name]: isTouched }));

      // Validate on blur if enabled
      if (validateOnBlur && isTouched) {
        const error = validateField(name, values[name]);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateOnBlur, validateField, values]
  );

  // Set field error manually
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  // Set multiple field errors
  const setFieldErrors = useCallback((errorObj) => {
    setErrors((prev) => ({ ...prev, ...errorObj }));
  }, []);

  // Handle input change
  const handleChange = useCallback(
    (nameOrEvent, value) => {
      let fieldName, fieldValue;

      if (typeof nameOrEvent === "string") {
        fieldName = nameOrEvent;
        fieldValue = value;
      } else {
        const event = nameOrEvent;
        fieldName = event.target.name;
        fieldValue =
          event.target.type === "checkbox"
            ? event.target.checked
            : event.target.value;
      }

      setFieldValue(fieldName, fieldValue);
    },
    [setFieldValue]
  );

  // Handle input blur
  const handleBlur = useCallback(
    (nameOrEvent) => {
      let fieldName;

      if (typeof nameOrEvent === "string") {
        fieldName = nameOrEvent;
      } else {
        fieldName = nameOrEvent.target.name;
      }

      setFieldTouched(fieldName, true);
    },
    [setFieldTouched]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (onSubmit) => {
      setIsSubmitting(true);
      setSubmitCount((prev) => prev + 1);

      // Mark all fields as touched
      const allTouched = Object.keys(validationSchema).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // Validate form
      const { errors: validationErrors, isValid } = validateForm();
      setErrors(validationErrors);

      if (isValid) {
        try {
          await onSubmit(values);
        } catch (error) {
          // Handle submission errors
          if (error.response?.data?.errors) {
            setFieldErrors(error.response.data.errors);
          }
          throw error;
        }
      }

      setIsSubmitting(false);
      return isValid;
    },
    [values, validateForm, validationSchema, setFieldErrors]
  );

  // Reset form
  const resetForm = useCallback(
    (newValues = initialValues) => {
      setValues(newValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      setSubmitCount(0);
    },
    [initialValues]
  );

  // Get field props for easy integration
  const getFieldProps = useCallback(
    (name) => ({
      name,
      value: values[name] || "",
      onChange: handleChange,
      onBlur: handleBlur,
    }),
    [values, handleChange, handleBlur]
  );

  // Get field meta information
  const getFieldMeta = useCallback(
    (name) => ({
      value: values[name],
      error: errors[name],
      touched: touched[name],
      initialValue: initialValues[name],
    }),
    [values, errors, touched, initialValues]
  );

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Check if form is dirty (has changes)
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    // Values and state
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    isValid,
    isDirty,

    // Field operations
    setFieldValue,
    setFieldValues,
    setFieldTouched,
    setFieldError,
    setFieldErrors,

    // Event handlers
    handleChange,
    handleBlur,
    handleSubmit,

    // Form operations
    validateForm,
    validateField,
    resetForm,

    // Helper functions
    getFieldProps,
    getFieldMeta,
  };
};

// Common validation rules
export const validators = {
  required:
    (message = "This field is required") =>
    (value) => {
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
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

  number:
    (message = "Must be a valid number") =>
    (value) => {
      if (value && isNaN(Number(value))) {
        return message;
      }
      return null;
    },

  min: (min, message) => (value) => {
    if (value && Number(value) < min) {
      return message || `Must be at least ${min}`;
    }
    return null;
  },

  max: (max, message) => (value) => {
    if (value && Number(value) > max) {
      return message || `Must be no more than ${max}`;
    }
    return null;
  },

  oneOf: (options, message) => (value) => {
    if (value && !options.includes(value)) {
      return message || `Must be one of: ${options.join(", ")}`;
    }
    return null;
  },

  custom: (validator, message) => (value, allValues) => {
    if (!validator(value, allValues)) {
      return message;
    }
    return null;
  },

  // Async validator wrapper
  async: (asyncValidator, message) => async (value, allValues) => {
    try {
      const isValid = await asyncValidator(value, allValues);
      return isValid ? null : message;
    } catch (error) {
      return message;
    }
  },
};

export default useFormValidation;
