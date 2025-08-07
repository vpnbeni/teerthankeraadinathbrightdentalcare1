import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";
import {
  register,
  login,
  verifyPhone,
  logout,
} from "../../controllers/authController.js";
import { authService } from "../../services/authService.js";
import {
  mockUser,
  mockUserRegistration,
  mockLoginCredentials,
} from "../fixtures/users.js";

// Mock the auth service
jest.mock("../../services/authService.js", () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    verifyPhone: jest.fn(),
    logout: jest.fn(),
    setTokenCookie: jest.fn(),
    clearTokenCookie: jest.fn(),
  },
}));

// Create Express app for testing
const app = express();
app.use(express.json());

// Set up routes
app.post("/auth/register", register);
app.post("/auth/login", login);
app.post("/auth/verify-phone", verifyPhone);
app.post("/auth/logout", logout);

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const registrationData = {
        ...mockUserRegistration,
        planId: "507f1f77bcf86cd799439011",
      };

      const mockResponse = {
        user: { ...mockUser, _id: "507f1f77bcf86cd799439012" },
        message: "Registration successful",
      };

      authService.register.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/register")
        .send(registrationData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockResponse,
      });

      expect(authService.register).toHaveBeenCalledWith({
        name: registrationData.name,
        phone: registrationData.phone,
        email: registrationData.email,
        planId: registrationData.planId,
        address: undefined,
        gender: undefined,
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          name: "John Doe",
          // Missing phone and planId
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "Name, phone, and plan ID are required",
      });

      expect(authService.register).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid phone number", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          name: "John Doe",
          phone: "123456789", // Invalid phone number
          planId: "507f1f77bcf86cd799439011",
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "Please provide a valid Indian phone number",
      });

      expect(authService.register).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          name: "John Doe",
          phone: "9876543210",
          email: "invalid-email", // Invalid email
          planId: "507f1f77bcf86cd799439011",
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "Please provide a valid email address",
      });

      expect(authService.register).not.toHaveBeenCalled();
    });

    it("should handle registration service errors", async () => {
      const registrationData = {
        ...mockUserRegistration,
        planId: "507f1f77bcf86cd799439011",
      };

      authService.register.mockRejectedValue(new Error("User already exists"));

      const response = await request(app)
        .post("/auth/register")
        .send(registrationData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "User already exists",
      });
    });
  });

  describe("POST /auth/login", () => {
    it("should login user successfully", async () => {
      const mockResponse = {
        user: { ...mockUser, _id: "507f1f77bcf86cd799439012" },
        token: "mock-jwt-token",
      };

      authService.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/login")
        .send(mockLoginCredentials)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockResponse.user,
          message: "Login successful",
        },
      });

      expect(authService.login).toHaveBeenCalledWith(
        mockLoginCredentials.phone,
        mockLoginCredentials.password
      );
      expect(authService.setTokenCookie).toHaveBeenCalledWith(
        expect.any(Object),
        mockResponse.token
      );
    });

    it("should return 400 if phone is missing", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          password: "password123",
          // Missing phone
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "Phone number is required",
      });

      expect(authService.login).not.toHaveBeenCalled();
    });

    it("should handle login service errors", async () => {
      authService.login.mockRejectedValue(new Error("Invalid credentials"));

      const response = await request(app)
        .post("/auth/login")
        .send(mockLoginCredentials)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid credentials",
      });
    });
  });

  describe("POST /auth/verify-phone", () => {
    it("should verify phone successfully", async () => {
      const verificationData = {
        phone: "9876543210",
        otp: "123456",
      };

      const mockResponse = {
        user: { ...mockUser, _id: "507f1f77bcf86cd799439012" },
        token: "mock-jwt-token",
      };

      authService.verifyPhone.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/verify-phone")
        .send(verificationData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockResponse.user,
          message: "Phone number verified successfully",
        },
      });

      expect(authService.verifyPhone).toHaveBeenCalledWith(
        verificationData.phone,
        verificationData.otp
      );
      expect(authService.setTokenCookie).toHaveBeenCalledWith(
        expect.any(Object),
        mockResponse.token
      );
    });

    it("should return 400 if phone or OTP is missing", async () => {
      const response = await request(app)
        .post("/auth/verify-phone")
        .send({
          phone: "9876543210",
          // Missing OTP
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "Phone number and OTP are required",
      });

      expect(authService.verifyPhone).not.toHaveBeenCalled();
    });

    it("should handle verification service errors", async () => {
      const verificationData = {
        phone: "9876543210",
        otp: "123456",
      };

      authService.verifyPhone.mockRejectedValue(new Error("Invalid OTP"));

      const response = await request(app)
        .post("/auth/verify-phone")
        .send(verificationData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid OTP",
      });
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout user successfully", async () => {
      const mockResponse = {
        message: "Logout successful",
      };

      authService.logout.mockResolvedValue(mockResponse);

      // Mock req.user for authenticated request
      const mockReq = { user: { _id: "507f1f77bcf86cd799439012" } };

      // Create a custom route handler for testing logout with authenticated user
      app.post("/auth/logout-test", (req, res, next) => {
        req.user = mockReq.user;
        logout(req, res, next);
      });

      const response = await request(app).post("/auth/logout-test").expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockResponse,
      });

      expect(authService.clearTokenCookie).toHaveBeenCalledWith(
        expect.any(Object)
      );
      expect(authService.logout).toHaveBeenCalledWith(mockReq.user._id);
    });

    it("should handle logout service errors", async () => {
      authService.logout.mockRejectedValue(new Error("Logout failed"));

      // Create a custom route handler for testing logout error
      app.post("/auth/logout-error-test", (req, res, next) => {
        req.user = { _id: "507f1f77bcf86cd799439012" };
        logout(req, res, next);
      });

      const response = await request(app)
        .post("/auth/logout-error-test")
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: "Logout failed",
      });
    });
  });
});
