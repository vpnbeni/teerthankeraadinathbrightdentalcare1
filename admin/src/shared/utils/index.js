// Export all utility functions
export * from "./formatters.js";
export * from "./validators.js";
export * from "./helpers.js";
export * from "./api-helpers.js";
export * from "./encryption.js";
export * from "./toast.js";

// Export accessibility utilities
export * from "./accessibility.js";
export * from "./accessibility-testing.js";

// Export validation schemas
export * from "./validation-schemas.js";

/**
 * Get time-based greeting message
 * @param {string} name - User's name
 * @returns {string} - Time-based greeting
 */
export const getTimeBasedGreeting = (name = "User") => {
  const hour = new Date().getHours();

  let greeting;

  if (hour >= 5 && hour < 12) {
    greeting = "Good morning";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good evening";
  } else {
    greeting = "Good night";
  }

  return `${greeting}, ${name}!`;
};

/**
 * Get time period for additional context
 * @returns {string} - Current time period
 */
export const getTimePeriod = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 17) {
    return "afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "evening";
  } else {
    return "night";
  }
};

/**
 * Get contextual message based on time
 * @returns {string} - Contextual message for the time period
 */
export const getTimeBasedMessage = () => {
  const period = getTimePeriod();

  const messages = {
    morning: "Have a great day managing your clinic!",
    afternoon: "Hope your administrative tasks are going smoothly!",
    evening: "Hope you had a productive day!",
    night: "Time to review today's clinic operations!",
  };

  return messages[period];
};
