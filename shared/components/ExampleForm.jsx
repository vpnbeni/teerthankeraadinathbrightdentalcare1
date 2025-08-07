import React from "react";
import { FormField, useFormValidation, validators } from "./FormValidation";
import { LoadingButton } from "./LoadingStates";
import { useToast } from "./Toast";

// Example form demonstrating enhanced validation
const ExampleForm = ({ onSubmit, initialData = {} }) => {
  const { showSuccess, showError } = useToast();

  // Form validation schema
  const validationSchema = {
    name: [
      validators.required("Name is required"),
      validators.minLength(2, "Name must be at least 2 characters"),
      validators.maxLength(50, "Name must be less than 50 characters"),
    ],
    email: [
      validators.required("Email is required"),
      validators.email("Please enter a valid email address"),
    ],
    phone: [
      validators.required("Phone number is required"),
      validators.phone("Please enter a valid Indian phone number"),
    ],
    age: [
      validators.required("Age is required"),
      validators.number("Age must be a number"),
      validators.min(18, "Must be at least 18 years old"),
      validators.max(100, "Age must be less than 100"),
    ],
    gender: [
      validators.required("Please select gender"),
      validators.oneOf(
        ["male", "female", "other"],
        "Please select a valid gender"
      ),
    ],
    terms: [
      validators.custom(
        (value) => value === true,
        "You must accept the terms and conditions"
      ),
    ],
  };

  // Initialize form with validation
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    getFieldProps,
    getFieldMeta,
    isValid,
    isDirty,
  } = useFormValidation(
    {
      name: "",
      email: "",
      phone: "",
      age: "",
      gender: "",
      terms: false,
      ...initialData,
    },
    validationSchema,
    {
      validateOnChange: true,
      validateOnBlur: true,
    }
  );

  // Handle form submission
  const onFormSubmit = async (formData) => {
    try {
      await onSubmit(formData);
      showSuccess("Form submitted successfully!");
      resetForm();
    } catch (error) {
      showError("Failed to submit form. Please try again.");
      throw error;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Example Form</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onFormSubmit);
        }}
        className="space-y-4"
      >
        {/* Name Field */}
        <FormField
          label="Full Name"
          error={touched.name ? errors.name : null}
          required
        >
          <input
            {...getFieldProps("name")}
            type="text"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            placeholder="Enter your full name"
          />
        </FormField>

        {/* Email Field */}
        <FormField
          label="Email Address"
          error={touched.email ? errors.email : null}
          required
        >
          <input
            {...getFieldProps("email")}
            type="email"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            placeholder="Enter your email"
          />
        </FormField>

        {/* Phone Field */}
        <FormField
          label="Phone Number"
          error={touched.phone ? errors.phone : null}
          required
          helpText="Enter 10-digit Indian mobile number"
        >
          <input
            {...getFieldProps("phone")}
            type="tel"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            placeholder="9876543210"
          />
        </FormField>

        {/* Age Field */}
        <FormField label="Age" error={touched.age ? errors.age : null} required>
          <input
            {...getFieldProps("age")}
            type="number"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            placeholder="Enter your age"
            min="18"
            max="100"
          />
        </FormField>

        {/* Gender Field */}
        <FormField
          label="Gender"
          error={touched.gender ? errors.gender : null}
          required
        >
          <select
            {...getFieldProps("gender")}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </FormField>

        {/* Terms Checkbox */}
        <FormField error={touched.terms ? errors.terms : null}>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="terms"
              checked={values.terms}
              onChange={handleChange}
              onBlur={handleBlur}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">
              I accept the{" "}
              <a href="#" className="text-primary hover:underline">
                terms and conditions
              </a>
            </span>
          </label>
        </FormField>

        {/* Form Actions */}
        <div className="flex space-x-4 pt-4">
          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            loadingText="Submitting..."
            disabled={!isValid || !isDirty}
            className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Form
          </LoadingButton>

          <button
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        {/* Form Status */}
        <div className="text-sm text-gray-500 pt-2">
          <p>Form Status: {isValid ? "Valid" : "Invalid"}</p>
          <p>Has Changes: {isDirty ? "Yes" : "No"}</p>
          <p>Submitting: {isSubmitting ? "Yes" : "No"}</p>
        </div>
      </form>
    </div>
  );
};

export default ExampleForm;
