import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPhone,
  validatePassword,
  validateName,
  isValidOTP,
  validateFile,
  validateAppointmentDate,
  validateRequiredFields,
} from "../validation.js";

describe("Validation Utils", () => {
  describe("isValidEmail", () => {
    it("should return true for valid email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "firstname.lastname@company.com",
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it("should return false for invalid email addresses", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user..name@example.com",
        "user@.com",
        "",
        null,
        undefined,
        123,
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it("should handle email with whitespace", () => {
      expect(isValidEmail("  test@example.com  ")).toBe(true);
      expect(isValidEmail("  invalid-email  ")).toBe(false);
    });
  });

  describe("isValidPhone", () => {
    it("should return true for valid Indian phone numbers", () => {
      const validPhones = [
        "9876543210",
        "8765432109",
        "7654321098",
        "6543210987",
      ];

      validPhones.forEach((phone) => {
        expect(isValidPhone(phone)).toBe(true);
      });
    });

    it("should return false for invalid phone numbers", () => {
      const invalidPhones = [
        "123456789", // Too short
        "12345678901", // Too long
        "5876543210", // Starts with 5
        "0876543210", // Starts with 0
        "abcdefghij", // Contains letters
        "",
        null,
        undefined,
        123456789,
      ];

      invalidPhones.forEach((phone) => {
        expect(isValidPhone(phone)).toBe(false);
      });
    });

    it("should handle phone with whitespace", () => {
      expect(isValidPhone("  9876543210  ")).toBe(true);
      expect(isValidPhone("  123456789  ")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should return valid for strong passwords", () => {
      const strongPasswords = ["Password123!", "MyStr0ng@Pass", "Secure#Pass1"];

      strongPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.message).toBe("");
      });
    });

    it("should return invalid for weak passwords", () => {
      const weakPasswords = [
        { password: "", expectedMessage: "This field is required" },
        { password: "123", expectedMessage: "Password must be at least" },
        { password: "password", expectedMessage: "Password must contain" },
        { password: "PASSWORD123", expectedMessage: "Password must contain" },
        { password: "Password", expectedMessage: "Password must contain" },
      ];

      weakPasswords.forEach(({ password, expectedMessage }) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain(expectedMessage);
      });
    });

    it("should handle non-string inputs", () => {
      const invalidInputs = [null, undefined, 123, {}, []];

      invalidInputs.forEach((input) => {
        const result = validatePassword(input);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe("This field is required");
      });
    });
  });

  describe("validateName", () => {
    it("should return valid for proper names", () => {
      const validNames = [
        "John Doe",
        "Mary Jane Smith",
        "Dr. John Smith Jr.",
        "Anne-Marie O'Connor",
      ];

      validNames.forEach((name) => {
        const result = validateName(name);
        expect(result.isValid).toBe(true);
        expect(result.message).toBe("");
      });
    });

    it("should return invalid for improper names", () => {
      const invalidNames = [
        { name: "", expectedMessage: "This field is required" },
        { name: "A", expectedMessage: "Name must be at least" },
        { name: "John123", expectedMessage: "Name can only contain" },
        { name: "John@Doe", expectedMessage: "Name can only contain" },
      ];

      invalidNames.forEach(({ name, expectedMessage }) => {
        const result = validateName(name);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain(expectedMessage);
      });
    });

    it("should handle whitespace trimming", () => {
      const result = validateName("  John Doe  ");
      expect(result.isValid).toBe(true);
    });
  });

  describe("isValidOTP", () => {
    it("should return true for valid OTP", () => {
      const validOTPs = ["123456", "000000", "999999"];

      validOTPs.forEach((otp) => {
        expect(isValidOTP(otp)).toBe(true);
      });
    });

    it("should return false for invalid OTP", () => {
      const invalidOTPs = [
        "12345", // Too short
        "1234567", // Too long
        "abcdef", // Contains letters
        "12 34 56", // Contains spaces
        "",
        null,
        undefined,
        123456,
      ];

      invalidOTPs.forEach((otp) => {
        expect(isValidOTP(otp)).toBe(false);
      });
    });
  });

  describe("validateFile", () => {
    it("should return valid for acceptable files", () => {
      const validFile = {
        size: 1024 * 1024, // 1MB
        type: "image/jpeg",
      };

      const result = validateFile(validFile);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });

    it("should return invalid for files that are too large", () => {
      const largeFile = {
        size: 10 * 1024 * 1024, // 10MB (assuming max is 5MB)
        type: "image/jpeg",
      };

      const result = validateFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("too large");
    });

    it("should return invalid for unsupported file types", () => {
      const unsupportedFile = {
        size: 1024 * 1024,
        type: "application/exe",
      };

      const result = validateFile(unsupportedFile);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("file type");
    });

    it("should return invalid for null file", () => {
      const result = validateFile(null);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("This field is required");
    });
  });

  describe("validateAppointmentDate", () => {
    it("should return valid for future dates within range", () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const result = validateAppointmentDate(futureDate);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
    });

    it("should return invalid for past dates", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      const result = validateAppointmentDate(pastDate);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("24 hours in advance");
    });

    it("should return invalid for dates too far in future", () => {
      const farFutureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000); // 100 days from now

      const result = validateAppointmentDate(farFutureDate);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("90 days in advance");
    });

    it("should return invalid for invalid date strings", () => {
      const result = validateAppointmentDate("invalid-date");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Invalid date");
    });
  });

  describe("validateRequiredFields", () => {
    it("should return valid when all required fields are present", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543210",
      };
      const requiredFields = ["name", "email", "phone"];

      const result = validateRequiredFields(data, requiredFields);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should return invalid when required fields are missing", () => {
      const data = {
        name: "John Doe",
        email: "",
        // phone is missing
      };
      const requiredFields = ["name", "email", "phone"];

      const result = validateRequiredFields(data, requiredFields);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("This field is required");
      expect(result.errors.phone).toBe("This field is required");
      expect(result.errors.name).toBeUndefined();
    });

    it("should handle whitespace-only values as missing", () => {
      const data = {
        name: "   ",
        email: "john@example.com",
      };
      const requiredFields = ["name", "email"];

      const result = validateRequiredFields(data, requiredFields);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe("This field is required");
    });
  });
});
