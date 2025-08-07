/**
 * Enhanced form field component with comprehensive validation and error handling
 * Provides consistent form field styling and behavior across the admin panel
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const FormField = ({
  // Field configuration
  name,
  label,
  type = "text",
  placeholder,
  value = "",
  defaultValue,

  // Validation
  error,
  isValid,
  required = false,
  disabled = false,
  readOnly = false,

  // Event handlers
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  onKeyPress,

  // Styling
  className = "",
  inputClassName = "",
  labelClassName = "",
  errorClassName = "",

  // Field-specific props
  options = [], // For select fields
  rows = 3, // For textarea
  min,
  max,
  step,
  pattern,
  maxLength,
  minLength,

  // Enhanced features
  showValidationIcon = true,
  showCharacterCount = false,
  autoComplete,
  autoFocus = false,
  clearable = false,
  loading = false,
  helpText,

  // Accessibility
  ariaLabel,
  ariaDescribedBy,

  // Custom components
  leftIcon,
  rightIcon,
  prefix,
  suffix,

  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenFocused, setHasBeenFocused] = useState(false);
  const inputRef = useRef(null);

  // Generate unique IDs for accessibility
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  // Handle focus events
  const handleFocus = useCallback(
    (e) => {
      setIsFocused(true);
      setHasBeenFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    if (onChange) {
      const syntheticEvent = {
        target: { name, value: "" },
        type: "change",
      };
      onChange(syntheticEvent);
    }
    inputRef.current?.focus();
  }, [onChange, name]);

  // Auto-focus if specified
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Determine field state
  const hasError = Boolean(error && hasBeenFocused);
  const hasValue = Boolean(value || defaultValue);
  const showSuccess = isValid && hasValue && hasBeenFocused && !hasError;
  const characterCount = typeof value === "string" ? value.length : 0;

  // Build CSS classes
  const fieldClasses = ["relative", className].filter(Boolean).join(" ");

  const inputBaseClasses = [
    "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset",
    "placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6",
    "transition-colors duration-200",
    disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white",
    readOnly ? "bg-gray-50" : "",
  ];

  const inputStateClasses = [
    hasError
      ? "ring-red-300 focus:ring-red-500 text-red-900 placeholder:text-red-300"
      : showSuccess
      ? "ring-green-300 focus:ring-green-500"
      : "ring-gray-300 focus:ring-blue-500",
  ];

  const inputClasses = [
    ...inputBaseClasses,
    ...inputStateClasses,
    leftIcon || prefix ? "pl-10" : "pl-3",
    rightIcon || suffix || showValidationIcon || clearable ? "pr-10" : "pr-3",
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const labelClasses = [
    "block text-sm font-medium leading-6",
    hasError ? "text-red-700" : "text-gray-900",
    disabled ? "text-gray-500" : "",
    labelClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const errorClasses = ["mt-2 text-sm text-red-600", errorClassName]
    .filter(Boolean)
    .join(" ");

  // Build aria attributes
  const ariaAttributes = {
    "aria-label": ariaLabel || label,
    "aria-describedby":
      [error ? errorId : null, helpText ? helpId : null, ariaDescribedBy]
        .filter(Boolean)
        .join(" ") || undefined,
    "aria-invalid": hasError ? "true" : undefined,
    "aria-required": required ? "true" : undefined,
  };

  // Render input based on type
  const renderInput = () => {
    const commonProps = {
      ref: inputRef,
      id: fieldId,
      name,
      value: value || "",
      defaultValue,
      placeholder,
      disabled,
      readOnly,
      required,
      autoComplete,
      className: inputClasses,
      onChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown,
      onKeyPress,
      ...ariaAttributes,
      ...rest,
    };

    switch (type) {
      case "textarea":
        return (
          <textarea
            {...commonProps}
            rows={rows}
            maxLength={maxLength}
            minLength={minLength}
          />
        );

      case "select":
        return (
          <select {...commonProps}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case "number":
        return (
          <input
            {...commonProps}
            type="number"
            min={min}
            max={max}
            step={step}
          />
        );

      case "email":
        return (
          <input
            {...commonProps}
            type="email"
            pattern={pattern}
            maxLength={maxLength}
            minLength={minLength}
          />
        );

      case "tel":
        return (
          <input
            {...commonProps}
            type="tel"
            pattern={pattern}
            maxLength={maxLength}
            minLength={minLength}
          />
        );

      case "password":
        return (
          <input
            {...commonProps}
            type="password"
            maxLength={maxLength}
            minLength={minLength}
          />
        );

      case "date":
      case "datetime-local":
      case "time":
        return <input {...commonProps} type={type} min={min} max={max} />;

      default:
        return (
          <input
            {...commonProps}
            type={type}
            pattern={pattern}
            maxLength={maxLength}
            minLength={minLength}
          />
        );
    }
  };

  return (
    <div className={fieldClasses}>
      {/* Label */}
      {label && (
        <label htmlFor={fieldId} className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative mt-2">
        {/* Left icon or prefix */}
        {(leftIcon || prefix) && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon || (
              <span className="text-gray-500 sm:text-sm">{prefix}</span>
            )}
          </div>
        )}

        {/* Input field */}
        {renderInput()}

        {/* Right side elements */}
        <div className="absolute inset-y-0 right-0 flex items-center">
          {/* Loading spinner */}
          {loading && (
            <div className="pr-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Clear button */}
          {clearable && hasValue && !disabled && !readOnly && (
            <button
              type="button"
              onClick={handleClear}
              className="pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Clear field"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Validation icon */}
          {showValidationIcon && !loading && (
            <div className="pr-3">
              {hasError && (
                <ExclamationCircleIcon
                  className="h-5 w-5 text-red-500"
                  aria-hidden="true"
                />
              )}
              {showSuccess && (
                <CheckCircleIcon
                  className="h-5 w-5 text-green-500"
                  aria-hidden="true"
                />
              )}
            </div>
          )}

          {/* Right icon or suffix */}
          {(rightIcon || suffix) && !showValidationIcon && !loading && (
            <div className="pr-3 flex items-center pointer-events-none">
              {rightIcon || (
                <span className="text-gray-500 sm:text-sm">{suffix}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Character count */}
      {showCharacterCount && maxLength && (
        <div className="mt-1 text-right">
          <span
            className={`text-xs ${
              characterCount > maxLength * 0.9
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            {characterCount}/{maxLength}
          </span>
        </div>
      )}

      {/* Error message */}
      {hasError && (
        <p id={errorId} className={errorClasses} role="alert">
          {error}
        </p>
      )}

      {/* Help text */}
      {helpText && !hasError && (
        <p id={helpId} className="mt-2 text-sm text-gray-600">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Specialized form field components
export const TextFormField = (props) => <FormField {...props} type="text" />;

export const EmailFormField = (props) => (
  <FormField {...props} type="email" autoComplete="email" />
);

export const PhoneFormField = (props) => (
  <FormField
    {...props}
    type="tel"
    pattern="[6-9][0-9]{9}"
    maxLength={10}
    autoComplete="tel"
    placeholder="Enter 10-digit phone number"
  />
);

export const PasswordFormField = (props) => (
  <FormField {...props} type="password" autoComplete="current-password" />
);

export const NumberFormField = (props) => (
  <FormField {...props} type="number" />
);

export const DateFormField = (props) => <FormField {...props} type="date" />;

export const TimeFormField = (props) => <FormField {...props} type="time" />;

export const TextareaFormField = (props) => (
  <FormField {...props} type="textarea" showCharacterCount />
);

export const SelectFormField = (props) => (
  <FormField {...props} type="select" />
);

// Form field with validation hook integration
export const ValidatedFormField = ({
  name,
  validation,
  formState,
  ...props
}) => {
  const fieldMeta = formState?.getFieldMeta?.(name) || {};
  const fieldProps = formState?.getFieldProps?.(name) || {};

  return (
    <FormField
      {...props}
      {...fieldProps}
      name={name}
      error={fieldMeta.error}
      isValid={!fieldMeta.error && fieldMeta.touched && fieldMeta.value}
    />
  );
};

export default FormField;
