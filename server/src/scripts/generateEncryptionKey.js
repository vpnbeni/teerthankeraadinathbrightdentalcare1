import crypto from "crypto";

/**
 * Generate encryption key for HIPAA compliance
 * This script generates a secure 256-bit encryption key
 */

const generateEncryptionKey = () => {
  const key = crypto.randomBytes(32); // 256 bits
  return key.toString("hex");
};

const key = generateEncryptionKey();

console.log("🔐 Generated Encryption Key:");
console.log(key);
console.log("");
console.log("Add this to your .env file:");
console.log(`ENCRYPTION_KEY=${key}`);
console.log("");
console.log(
  "⚠️ IMPORTANT: Store this key securely and never commit it to version control!"
);
console.log("⚠️ In production, use a secure key management system.");

export { generateEncryptionKey };
