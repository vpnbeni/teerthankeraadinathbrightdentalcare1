// Export all utility functions
export * from "./formatters.js";
export * from "./validators.js";

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
    morning: "Have a great day ahead!",
    afternoon: "Hope you're having a productive day!",
    evening: "Hope you had a wonderful day!",
    night: "Time to relax and unwind!"
  };
  
  return messages[period];
};
