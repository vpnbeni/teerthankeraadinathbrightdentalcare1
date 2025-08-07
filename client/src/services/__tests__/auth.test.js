import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import authService from "../auth";
import api from "../api";

// Mock the api module
vi.mock("../api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe("register", () => {
    it("should register a new user", async () => {
      const userData = {
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
      };
      const mockResponse = {
        data: {
          success: true,
          message: "Registration successful",
          data: { user: userData },
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.register(userData);

      expect(api.post).toHaveBeenCalledWith("/auth/register", userData);
      expect(result).toEqual(mockResponse);
    });

    it("should handle registration errors", async () => {
      const userData = { name: "John Doe", phone: "9876543210" };
      const error = new Error("Registration failed");

      api.post.mockRejectedValue(error);

      await expect(authService.register(userData)).rejects.toThrow(
        "Registration failed"
      );
    });
  });

  describe("verifyOTP", () => {
    it("should verify OTP successfully", async () => {
      const otpData = { phone: "9876543210", otp: "123456" };
      const mockResponse = {
        data: {
          success: true,
          message: "OTP verified successfully",
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.verifyOTP(otpData);

      expect(api.post).toHaveBeenCalledWith("/auth/verify-otp", otpData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("login", () => {
    it("should login user and store token", async () => {
      const credentials = { phone: "9876543210", password: "password123" };
      const mockResponse = {
        data: {
          success: true,
          token: "mock-jwt-token",
          data: {
            user: { id: "1", name: "John Doe", phone: "9876543210" },
          },
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith("/auth/login", credentials);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "token",
        "mock-jwt-token"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should login without storing token if not provided", async () => {
      const credentials = { phone: "9876543210", password: "password123" };
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: "1", name: "John Doe", phone: "9876543210" },
          },
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith("/auth/login", credentials);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe("logout", () => {
    it("should logout user and remove token", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Logout successful",
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.logout();

      expect(api.post).toHaveBeenCalledWith("/auth/logout");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("checkAuth", () => {
    it("should check authentication with valid token", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: "1", name: "John Doe", phone: "9876543210" },
          },
        },
      };

      localStorageMock.getItem.mockReturnValue("mock-jwt-token");
      api.get.mockResolvedValue(mockResponse);

      const result = await authService.checkAuth();

      expect(localStorageMock.getItem).toHaveBeenCalledWith("token");
      expect(api.get).toHaveBeenCalledWith("/auth/me");
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when no token found", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await expect(authService.checkAuth()).rejects.toThrow("No token found");
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe("resendOTP", () => {
    it("should resend OTP successfully", async () => {
      const phone = "9876543210";
      const mockResponse = {
        data: {
          success: true,
          message: "OTP sent successfully",
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.resendOTP(phone);

      expect(api.post).toHaveBeenCalledWith("/auth/resend-otp", { phone });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("requestPasswordReset", () => {
    it("should request password reset successfully", async () => {
      const phone = "9876543210";
      const mockResponse = {
        data: {
          success: true,
          message: "Password reset OTP sent",
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.requestPasswordReset(phone);

      expect(api.post).toHaveBeenCalledWith("/auth/forgot-password", { phone });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const resetData = {
        phone: "9876543210",
        otp: "123456",
        newPassword: "newPassword123",
      };
      const mockResponse = {
        data: {
          success: true,
          message: "Password reset successful",
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.resetPassword(resetData);

      expect(api.post).toHaveBeenCalledWith("/auth/reset-password", resetData);
      expect(result).toEqual(mockResponse);
    });
  });
});
