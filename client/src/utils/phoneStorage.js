/**
 * Phone Storage Utility
 * Handles storing and retrieving phone numbers for OTP verification
 */

const PHONE_STORAGE_KEY = "registrationPhone";

export const phoneStorage = {
  /**
   * Store phone number for OTP verification
   */
  store: (phone) => {
    if (phone) {
      localStorage.setItem(PHONE_STORAGE_KEY, phone);
      console.log("Phone number stored for OTP verification:", phone);
    }
  },

  /**
   * Retrieve stored phone number
   */
  get: () => {
    const phone = localStorage.getItem(PHONE_STORAGE_KEY);
    console.log("Retrieved phone number from storage:", phone);
    return phone;
  },

  /**
   * Clear stored phone number
   */
  clear: () => {
    localStorage.removeItem(PHONE_STORAGE_KEY);
    console.log("Phone number cleared from storage");
  },

  /**
   * Check if phone number is stored
   */
  exists: () => {
    return !!localStorage.getItem(PHONE_STORAGE_KEY);
  },
};

export default phoneStorage;
