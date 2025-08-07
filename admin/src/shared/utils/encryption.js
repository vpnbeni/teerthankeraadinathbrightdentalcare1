/**
 * Simple base64 encoding (not for security, just for data transformation)
 * @param {string} str - String to encode
 * @returns {string} - Base64 encoded string
 */
export const encodeBase64 = (str) => {
  if (typeof str !== "string") return "";
  return btoa(unescape(encodeURIComponent(str)));
};

/**
 * Simple base64 decoding
 * @param {string} str - Base64 string to decode
 * @returns {string} - Decoded string
 */
export const decodeBase64 = (str) => {
  if (typeof str !== "string") return "";
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (error) {
    console.error("Failed to decode base64:", error);
    return "";
  }
};

/**
 * Generate a simple hash (not cryptographically secure)
 * @param {string} str - String to hash
 * @returns {string} - Hash string
 */
export const simpleHash = (str) => {
  if (typeof str !== "string") return "";

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Mask sensitive data for display
 * @param {string} str - String to mask
 * @param {number} visibleStart - Number of characters to show at start
 * @param {number} visibleEnd - Number of characters to show at end
 * @param {string} maskChar - Character to use for masking
 * @returns {string} - Masked string
 */
export const maskSensitiveData = (
  str,
  visibleStart = 2,
  visibleEnd = 2,
  maskChar = "*"
) => {
  if (typeof str !== "string" || str.length <= visibleStart + visibleEnd) {
    return str;
  }

  const start = str.substring(0, visibleStart);
  const end = str.substring(str.length - visibleEnd);
  const maskLength = str.length - visibleStart - visibleEnd;
  const mask = maskChar.repeat(maskLength);

  return start + mask + end;
};

/**
 * Generate a random token (not cryptographically secure)
 * @param {number} length - Length of token
 * @returns {string} - Random token
 */
export const generateToken = (length = 32) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

/**
 * Obfuscate email for display
 * @param {string} email - Email to obfuscate
 * @returns {string} - Obfuscated email
 */
export const obfuscateEmail = (email) => {
  if (typeof email !== "string" || !email.includes("@")) {
    return email;
  }

  const [username, domain] = email.split("@");
  const maskedUsername = maskSensitiveData(username, 1, 1);

  return `${maskedUsername}@${domain}`;
};

/**
 * Obfuscate phone number for display
 * @param {string} phone - Phone number to obfuscate
 * @returns {string} - Obfuscated phone number
 */
export const obfuscatePhone = (phone) => {
  if (typeof phone !== "string") return phone;

  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 2)}****${cleaned.substring(6)}`;
  }

  return maskSensitiveData(phone, 2, 2);
};

/**
 * Simple XOR cipher (not for security, just for basic obfuscation)
 * @param {string} text - Text to cipher
 * @param {string} key - Cipher key
 * @returns {string} - Ciphered text
 */
export const xorCipher = (text, key) => {
  if (typeof text !== "string" || typeof key !== "string") return text;

  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }

  return result;
};

/**
 * Check if string contains potentially sensitive data patterns
 * @param {string} str - String to check
 * @returns {boolean} - True if potentially sensitive
 */
export const containsSensitiveData = (str) => {
  if (typeof str !== "string") return false;

  const patterns = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{10}\b/, // Phone number
    /\bpassword\b/i, // Password field
    /\btoken\b/i, // Token field
    /\bapi[_-]?key\b/i, // API key
  ];

  return patterns.some((pattern) => pattern.test(str));
};
