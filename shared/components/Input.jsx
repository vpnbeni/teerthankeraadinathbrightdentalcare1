import React, { useState, useId } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useAccessibility } from "../hooks/useAccessibility";
import { formAccessibility } from "../utils/accessibility";

const Input = React.forwardRef(
  (
    {
      label,
      type = "text",
      placeholder,
      value,
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      required = false,
      error,
      success,
      helperText,
      icon,
      iconPosition = "left",
      size = "medium",
      fullWidth = false,
      autoComplete,
      autoFocus = false,
      maxLength,
      minLength,
      pattern,
      className = "",
      inputClassName = "",
      labelClassName = "",
      ...props
    },
    ref
  ) => {
    const { announce, fontSize } = useAccessibility();
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);

    const inputId = useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const descriptionId = `${inputId}-description`;

    // Handle password visibility toggle
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
      announce(showPassword ? "Password hidden" : "Password visible");
    };

    // Handle focus events
    const handleFocus = (e) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e) => {
      setFocused(false);
      onBlur?.(e);
    };

    // Determine input type
    const inputType = type === "password" && showPassword ? "text" : type;

    // Base styles
    const baseInputStyles = `
    w-full rounded-lg border transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
    placeholder:text-gray-400
  `;

    // Size styles
    const sizeStyles = {
      small: "px-3 py-2 text-sm min-h-[36px]",
      medium: "px-4 py-2.5 text-sm min-h-[42px]",
      large: "px-4 py-3 text-base min-h-[48px]",
    };

    // State styles
    const getStateStyles = () => {
      if (error) {
        return `
        border-red-300 bg-red-50 text-red-900
        focus:border-red-500 focus:ring-red-500/20
        placeholder:text-red-400
      `;
      }

      if (success) {
        return `
        border-green-300 bg-green-50 text-green-900
        focus:border-green-500 focus:ring-green-500/20
      `;
      }

      return `
      border-gray-300 bg-white text-gray-900
      focus:border-primary focus:ring-primary/20
      hover:border-gray-400
    `;
    };

    // Icon styles
    const iconStyles = {
      small: "h-4 w-4",
      medium: "h-5 w-5",
      large: "h-5 w-5",
    };

    // Build input className
    const inputClasses = `
    ${baseInputStyles}
    ${sizeStyles[size]}
    ${getStateStyles()}
    ${icon && iconPosition === "left" ? "pl-10" : ""}
    ${icon && iconPosition === "right" ? "pr-10" : ""}
    ${type === "password" ? "pr-10" : ""}
    ${fullWidth ? "w-full" : ""}
    ${inputClassName}
  `
      .trim()
      .replace(/\s+/g, " ");

    // Label styles
    const labelStyles = `
    block text-sm font-medium mb-1.5
    ${error ? "text-red-700" : success ? "text-green-700" : "text-gray-700"}
    ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}
    ${labelClassName}
  `
      .trim()
      .replace(/\s+/g, " ");

    // Build aria attributes
    const ariaAttributes = {
      "aria-invalid": !!error,
      "aria-required": required,
      "aria-describedby":
        [error && errorId, helperText && helperId, success && descriptionId]
          .filter(Boolean)
          .join(" ") || undefined,
    };

    // Icon component
    const IconComponent = icon;
    const renderIcon = () => {
      if (!IconComponent) return null;

      return (
        <div
          className={`
        absolute top-1/2 transform -translate-y-1/2 text-gray-400
        ${iconPosition === "left" ? "left-3" : "right-3"}
        ${error ? "text-red-400" : success ? "text-green-400" : ""}
      `}
        >
          <IconComponent className={iconStyles[size]} />
        </div>
      );
    };

    // Password toggle button
    const renderPasswordToggle = () => {
      if (type !== "password") return null;

      return (
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className={iconStyles[size]} />
          ) : (
            <Eye className={iconStyles[size]} />
          )}
        </button>
      );
    };

    // Status message component
    const StatusMessage = ({ type, message, id }) => {
      const icons = {
        error: <AlertCircle className="h-4 w-4" />,
        success: <CheckCircle className="h-4 w-4" />,
        helper: <Info className="h-4 w-4" />,
      };

      const colors = {
        error: "text-red-600",
        success: "text-green-600",
        helper: "text-gray-600",
      };

      return (
        <div
          id={id}
          className={`flex items-center gap-1.5 mt-1.5 text-sm ${colors[type]}`}
          role={type === "error" ? "alert" : "status"}
          aria-live={type === "error" ? "assertive" : "polite"}
        >
          {icons[type]}
          <span>{message}</span>
        </div>
      );
    };

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {iconPosition === "left" && renderIcon()}

          {/* Input field */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            maxLength={maxLength}
            minLength={minLength}
            pattern={pattern}
            className={inputClasses}
            {...ariaAttributes}
            {...props}
          />

          {/* Right icon */}
          {iconPosition === "right" && renderIcon()}

          {/* Password toggle */}
          {renderPasswordToggle()}
        </div>

        {/* Error message */}
        {error && <StatusMessage type="error" message={error} id={errorId} />}

        {/* Success message */}
        {success && (
          <StatusMessage type="success" message={success} id={descriptionId} />
        )}

        {/* Helper text */}
        {helperText && !error && !success && (
          <StatusMessage type="helper" message={helperText} id={helperId} />
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Textarea component with similar accessibility features
export const Textarea = React.forwardRef(
  (
    {
      label,
      placeholder,
      value,
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      required = false,
      error,
      success,
      helperText,
      rows = 4,
      resize = "vertical",
      maxLength,
      minLength,
      fullWidth = false,
      className = "",
      textareaClassName = "",
      labelClassName = "",
      ...props
    },
    ref
  ) => {
    const { announce } = useAccessibility();
    const [focused, setFocused] = useState(false);

    const textareaId = useId();
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const descriptionId = `${textareaId}-description`;

    // Handle focus events
    const handleFocus = (e) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e) => {
      setFocused(false);
      onBlur?.(e);
    };

    // Base styles
    const baseTextareaStyles = `
    w-full rounded-lg border transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
    placeholder:text-gray-400 px-4 py-2.5 text-sm
  `;

    // Resize styles
    const resizeStyles = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    // State styles
    const getStateStyles = () => {
      if (error) {
        return `
        border-red-300 bg-red-50 text-red-900
        focus:border-red-500 focus:ring-red-500/20
        placeholder:text-red-400
      `;
      }

      if (success) {
        return `
        border-green-300 bg-green-50 text-green-900
        focus:border-green-500 focus:ring-green-500/20
      `;
      }

      return `
      border-gray-300 bg-white text-gray-900
      focus:border-primary focus:ring-primary/20
      hover:border-gray-400
    `;
    };

    // Build textarea className
    const textareaClasses = `
    ${baseTextareaStyles}
    ${getStateStyles()}
    ${resizeStyles[resize]}
    ${fullWidth ? "w-full" : ""}
    ${textareaClassName}
  `
      .trim()
      .replace(/\s+/g, " ");

    // Label styles
    const labelStyles = `
    block text-sm font-medium mb-1.5
    ${error ? "text-red-700" : success ? "text-green-700" : "text-gray-700"}
    ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}
    ${labelClassName}
  `
      .trim()
      .replace(/\s+/g, " ");

    // Build aria attributes
    const ariaAttributes = {
      "aria-invalid": !!error,
      "aria-required": required,
      "aria-describedby":
        [error && errorId, helperText && helperId, success && descriptionId]
          .filter(Boolean)
          .join(" ") || undefined,
    };

    // Status message component (reused from Input)
    const StatusMessage = ({ type, message, id }) => {
      const icons = {
        error: <AlertCircle className="h-4 w-4" />,
        success: <CheckCircle className="h-4 w-4" />,
        helper: <Info className="h-4 w-4" />,
      };

      const colors = {
        error: "text-red-600",
        success: "text-green-600",
        helper: "text-gray-600",
      };

      return (
        <div
          id={id}
          className={`flex items-center gap-1.5 mt-1.5 text-sm ${colors[type]}`}
          role={type === "error" ? "alert" : "status"}
          aria-live={type === "error" ? "assertive" : "polite"}
        >
          {icons[type]}
          <span>{message}</span>
        </div>
      );
    };

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {/* Label */}
        {label && (
          <label htmlFor={textareaId} className={labelStyles}>
            {label}
          </label>
        )}

        {/* Textarea field */}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          minLength={minLength}
          className={textareaClasses}
          {...ariaAttributes}
          {...props}
        />

        {/* Character count */}
        {maxLength && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-500">
              {value?.length || 0}/{maxLength}
            </span>
          </div>
        )}

        {/* Error message */}
        {error && <StatusMessage type="error" message={error} id={errorId} />}

        {/* Success message */}
        {success && (
          <StatusMessage type="success" message={success} id={descriptionId} />
        )}

        {/* Helper text */}
        {helperText && !error && !success && (
          <StatusMessage type="helper" message={helperText} id={helperId} />
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Input;
