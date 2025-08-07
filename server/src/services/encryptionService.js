import crypto from "crypto";

/**
 * Encryption Service for HIPAA Compliance
 * Handles encryption/decryption of sensitive healthcare data
 */

class EncryptionService {
  constructor() {
    this.algorithm = "aes-256-cbc";
    this.keyLength = 32;
    this.ivLength = 16;

    // Use environment variable or generate a key (should be stored securely)
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  /**
   * Get or create encryption key
   */
  getOrCreateEncryptionKey() {
    if (process.env.ENCRYPTION_KEY) {
      return Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    }

    // In production, this should be stored in a secure key management system
    const key = crypto.randomBytes(this.keyLength);
    console.warn(
      "⚠️ Generated new encryption key. Store this securely:",
      key.toString("hex")
    );
    return key;
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text) {
    if (!text || typeof text !== "string") {
      return text;
    }

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      );

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      // Combine iv and encrypted data
      return iv.toString("hex") + ":" + encrypted;
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== "string") {
      return encryptedData;
    }

    try {
      const parts = encryptedData.split(":");
      if (parts.length !== 2) {
        throw new Error("Invalid encrypted data format");
      }

      const iv = Buffer.from(parts[0], "hex");
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      );

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data) {
    if (!data) return data;

    return crypto.createHash("sha256").update(data.toString()).digest("hex");
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Encrypt medical information object
   */
  encryptMedicalInfo(medicalInfo) {
    if (!medicalInfo || typeof medicalInfo !== "object") {
      return medicalInfo;
    }

    const encrypted = {};

    // Encrypt sensitive medical fields
    const sensitiveFields = [
      "systemicDiseases",
      "drugAllergies",
      "pastTreatments",
      "previousExperiences",
    ];

    for (const [key, value] of Object.entries(medicalInfo)) {
      if (sensitiveFields.includes(key) && Array.isArray(value)) {
        encrypted[key] = value.map((item) => this.encrypt(item));
      } else if (sensitiveFields.includes(key) && typeof value === "string") {
        encrypted[key] = this.encrypt(value);
      } else {
        encrypted[key] = value;
      }
    }

    return encrypted;
  }

  /**
   * Decrypt medical information object
   */
  decryptMedicalInfo(encryptedMedicalInfo) {
    if (!encryptedMedicalInfo || typeof encryptedMedicalInfo !== "object") {
      return encryptedMedicalInfo;
    }

    const decrypted = {};

    const sensitiveFields = [
      "systemicDiseases",
      "drugAllergies",
      "pastTreatments",
      "previousExperiences",
    ];

    for (const [key, value] of Object.entries(encryptedMedicalInfo)) {
      if (sensitiveFields.includes(key) && Array.isArray(value)) {
        decrypted[key] = value.map((item) => this.decrypt(item));
      } else if (sensitiveFields.includes(key) && typeof value === "string") {
        decrypted[key] = this.decrypt(value);
      } else {
        decrypted[key] = value;
      }
    }

    return decrypted;
  }

  /**
   * Encrypt session examination data
   */
  encryptExaminationData(examination) {
    if (!examination || typeof examination !== "object") {
      return examination;
    }

    const encrypted = { ...examination };

    // Encrypt sensitive examination fields
    const sensitiveFields = [
      "cariesStatus",
      "attritionAbrasion",
      "previousTreatments",
      "cappingStatus",
      "sinusIssues",
      "lesions",
      "tmjProblems",
      "stainsCalculus",
      "gumIssues",
    ];

    sensitiveFields.forEach((field) => {
      if (encrypted[field]) {
        if (Array.isArray(encrypted[field])) {
          encrypted[field] = encrypted[field].map((item) => this.encrypt(item));
        } else {
          encrypted[field] = this.encrypt(encrypted[field]);
        }
      }
    });

    // Encrypt custom fields
    if (encrypted.customFields && Array.isArray(encrypted.customFields)) {
      encrypted.customFields = encrypted.customFields.map((field) => ({
        fieldName: this.encrypt(field.fieldName),
        fieldValue: this.encrypt(field.fieldValue),
      }));
    }

    return encrypted;
  }

  /**
   * Decrypt session examination data
   */
  decryptExaminationData(encryptedExamination) {
    if (!encryptedExamination || typeof encryptedExamination !== "object") {
      return encryptedExamination;
    }

    const decrypted = { ...encryptedExamination };

    const sensitiveFields = [
      "cariesStatus",
      "attritionAbrasion",
      "previousTreatments",
      "cappingStatus",
      "sinusIssues",
      "lesions",
      "tmjProblems",
      "stainsCalculus",
      "gumIssues",
    ];

    sensitiveFields.forEach((field) => {
      if (decrypted[field]) {
        if (Array.isArray(decrypted[field])) {
          decrypted[field] = decrypted[field].map((item) => this.decrypt(item));
        } else {
          decrypted[field] = this.decrypt(decrypted[field]);
        }
      }
    });

    // Decrypt custom fields
    if (decrypted.customFields && Array.isArray(decrypted.customFields)) {
      decrypted.customFields = decrypted.customFields.map((field) => ({
        fieldName: this.decrypt(field.fieldName),
        fieldValue: this.decrypt(field.fieldValue),
      }));
    }

    return decrypted;
  }
}

export const encryptionService = new EncryptionService();
