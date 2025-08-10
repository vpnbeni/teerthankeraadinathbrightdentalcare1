import React, { useState, useEffect, useRef } from "react";
import { LoadingSpinner } from "../../shared/components";
import { checkPhoneAvailability } from "../../services/auth";
import { VALIDATION_RULES } from "../../shared/constants";

const PhoneInput = ({
  value,
  onChange,
  onValidationChange,
  error,
  disabled = false,
  className = "",
  currentUserPhone = null, // Pass current user's phone to exclude from uniqueness check
}) => {
  const [phone, setPhone] = useState(value || "");
  const [isValidating, setIsValidating] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [lastCheckedPhone, setLastCheckedPhone] = useState("");

  const debounceTimeout = useRef(null);

  // Phone validation regex (Indian format)
  const phoneRegex = VALIDATION_RULES.PHONE.PATTERN;

  // Check phone availability
  const checkAvailability = async (phoneToCheck) => {
    if (
      !phoneToCheck ||
      !phoneRegex.test(phoneToCheck) ||
      phoneToCheck === lastCheckedPhone ||
      phoneToCheck === currentUserPhone // Skip check if it's the current user's phone
    ) {
      return;
    }

    setIsValidating(true);
    try {
      const response = await checkPhoneAvailability(phoneToCheck);
      setIsAvailable(response.available);
      setLastCheckedPhone(phoneToCheck);
    } catch (error) {
      console.error("Phone availability check failed:", error);
      setIsAvailable(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Debounced phone availability check
  const debouncedCheckAvailability = (phoneToCheck) => {
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      checkAvailability(phoneToCheck);
    }, 800); // 800ms delay
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    const newPhone = e.target.value.replace(/\D/g, "").slice(0, 10); // Only allow digits, max 10
    setPhone(newPhone);
    onChange(newPhone);

    // Reset states when phone changes
    setIsAvailable(null);
    setLastCheckedPhone("");

    // Clear any pending debounced calls
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Check availability with debounce if valid phone
    if (phoneRegex.test(newPhone)) {
      debouncedCheckAvailability(newPhone);
    }
  };

  // Update parent validation state
  useEffect(() => {
    const isValid = phoneRegex.test(phone);
    const isCurrentUserPhone = phone === currentUserPhone;

    onValidationChange?.({
      isValid,
      isAvailable: isCurrentUserPhone ? true : isAvailable, // Current user's phone is always "available"
      isUnique: isCurrentUserPhone || isAvailable !== false,
    });
  }, [phone, isAvailable, currentUserPhone, onValidationChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const isValidPhone = phoneRegex.test(phone);
  const isCurrentUserPhone = phone === currentUserPhone;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          disabled={disabled}
          className={`input-field pr-24 ${className} ${
            error ? "border-red-500" : ""
          } ${isCurrentUserPhone ? "bg-blue-50 border-blue-500" : ""}`}
          placeholder="Enter your phone number"
          maxLength={10}
        />

        {/* Loading spinner */}
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LoadingSpinner size="small" />
          </div>
        )}

        {/* Availability status */}
        {!isValidating && isValidPhone && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isCurrentUserPhone ? (
              <span className="text-blue-600 text-xs font-medium bg-blue-100 px-2 py-1 rounded">
                Current
              </span>
            ) : isAvailable === true ? (
              <span className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded">
                Available
              </span>
            ) : isAvailable === false ? (
              <span className="text-red-600 text-xs font-medium bg-red-100 px-2 py-1 rounded">
                In Use
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Invalid phone warning */}
      {phone && !isValidPhone && (
        <p className="text-orange-600 text-sm">
          Please enter a valid 10-digit Indian phone number
        </p>
      )}

      {/* Phone not available warning */}
      {isValidPhone && !isCurrentUserPhone && isAvailable === false && (
        <p className="text-red-600 text-sm">
          This phone number is already registered. Please use a different
          number.
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
