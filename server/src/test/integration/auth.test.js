import request from "supertest";
import app from "../../../server.js";
import User from "../../models/User.js";
import Plan from "../../models/Plan.js";
import { mockPlans } from "../fixtures/plans.js";


describe("Auth Integration Tests", () => {
  let testPlan;

  beforeEach(async () => {
    // Create a test plan
    testPlan = await Plan.create(mockPlans[0]);
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const registrationData = {
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        planId: testPlan._id.toString(),
        address: "123 Main St",
        gender: "male",
      };

      // OTP will be sent via real service

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(registrationData.name);
      expect(response.body.data.user.phone).toBe(registrationData.phone);
      expect(response.body.data.user.email).toBe(registrationData.email);

      // Verify user was created in database
      const user = await User.findOne({ phone: registrationData.phone });
      expect(user).toBeTruthy();
      expect(user.name).toBe(registrationData.name);
      expect(user.subscription.planId.toString()).toBe(testPlan._id.toString());
    });

    it("should return 400 for duplicate phone number", async () => {
      const registrationData = {
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        planId: testPlan._id.toString(),
      };

      // Create first user
      await User.create({
        ...registrationData,
        subscription: {
          planId: testPlan._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          sessionsRemaining: 6,
          totalSessions: 6,
          status: "active",
        },
      });

      // Try to register with same phone
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...registrationData,
          name: "Jane Doe",
          email: "jane@example.com",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    it("should return 400 for invalid phone number", async () => {
      const registrationData = {
        name: "John Doe",
        phone: "123456789", // Invalid phone
        email: "john@example.com",
        planId: testPlan._id.toString(),
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("valid Indian phone number");
    });

    it("should return 400 for invalid plan ID", async () => {
      const registrationData = {
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        planId: "invalid-plan-id",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/verify-phone", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        subscription: {
          planId: testPlan._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          sessionsRemaining: 6,
          totalSessions: 6,
          status: "active",
        },
        isVerified: false,
      });
    });

    it("should verify phone number successfully", async () => {
      const verificationData = {
        phone: "9876543210",
        otp: "123456",
      };

      // OTP verification will use real service

      const response = await request(app)
        .post("/api/auth/verify-phone")
        .send(verificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.phone).toBe(verificationData.phone);
      expect(response.body.data.message).toContain("verified successfully");

      // Verify user is marked as verified in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isVerified).toBe(true);

      // Check that token cookie is set
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 400 for invalid OTP", async () => {
      const verificationData = {
        phone: "9876543210",
        otp: "000000",
      };

      // OTP verification will use real service

      const response = await request(app)
        .post("/api/auth/verify-phone")
        .send(verificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid OTP");
    });

    it("should return 400 for non-existent phone number", async () => {
      const verificationData = {
        phone: "9999999999",
        otp: "123456",
      };

      // OTP verification will use real service

      const response = await request(app)
        .post("/api/auth/verify-phone")
        .send(verificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });
  });

  describe("POST /api/auth/login", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        passwordHash: "password123",
        subscription: {
          planId: testPlan._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          sessionsRemaining: 6,
          totalSessions: 6,
          status: "active",
        },
        isVerified: true,
      });
    });

    it("should login user with valid credentials", async () => {
      const loginData = {
        phone: "9876543210",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.phone).toBe(loginData.phone);
      expect(response.body.data.message).toBe("Login successful");

      // Check that token cookie is set
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 401 for invalid password", async () => {
      const loginData = {
        phone: "9876543210",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid");
    });

    it("should return 401 for non-existent user", async () => {
      const loginData = {
        phone: "9999999999",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should return 401 for unverified user", async () => {
      // Create unverified user
      await User.create({
        name: "Jane Doe",
        phone: "9876543211",
        email: "jane@example.com",
        passwordHash: "password123",
        subscription: {
          planId: testPlan._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          sessionsRemaining: 6,
          totalSessions: 6,
          status: "active",
        },
        isVerified: false,
      });

      const loginData = {
        phone: "9876543211",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not verified");
    });
  });
});
