import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User, Plan, Payment } from "../../models/index.js";
import subscriptionRoutes from "../../routes/admin.js";
import { auth } from "../../middleware/auth.js";
import { adminOnly } from "../../middleware/adminAuth.js";
import emailService from "../../services/emailService.js";

// Mock email service
jest.mock("../../services/emailService.js", () => ({
  sendSubscriptionExtensionEmail: jest.fn(),
  sendSubscriptionPlanChangeEmail: jest.fn(),
  sendSubscriptionCancellationEmail: jest.fn(),
}));

// Mock auth middleware
jest.mock("../../middleware/auth.js", () => ({
  auth: (req, res, next) => {
    req.user = { id: "admin123", role: "admin" };
    next();
  },
}));

jest.mock("../../middleware/adminAuth.js", () => ({
  adminOnly: (req, res, next) => next(),
}));

jest.mock("../../middleware/auditMiddleware.js", () => ({
  auditUserAccess: (req, res, next) => next(),
  auditDataModification: () => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use("/api/admin", subscriptionRoutes);

describe("Subscription Management Endpoints", () => {
  let mongoServer;
  let testUser;
  let testPlan1;
  let testPlan2;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Disconnect existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Plan.deleteMany({});
    await Payment.deleteMany({});

    // Create test plans
    testPlan1 = await Plan.create({
      name: "Basic Plan",
      sessions: 5,
      price: 1000,
      duration: 3,
      isActive: true,
    });

    testPlan2 = await Plan.create({
      name: "Premium Plan",
      sessions: 10,
      price: 2000,
      duration: 6,
      isActive: true,
    });

    // Create test user with subscription
    testUser = await User.create({
      name: "Test User",
      phone: "9876543210",
      email: "test@example.com",
      subscription: {
        planId: testPlan1._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        sessionsRemaining: 3,
        status: "active",
      },
    });

    // Clear email service mocks
    jest.clearAllMocks();
  });

  describe("PUT /api/admin/users/:id/subscription/extend", () => {
    it("should extend user subscription successfully", async () => {
      const extensionData = {
        months: 2,
        reason: "Customer loyalty reward",
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/subscription/extend`)
        .send(extensionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Subscription extended successfully");
      expect(response.body.data.extensionDetails.months).toBe(2);
      expect(response.body.data.extensionDetails.reason).toBe(
        "Customer loyalty reward"
      );

      // Verify user subscription was updated
      const updatedUser = await User.findById(testUser._id);
      const originalEndDate = new Date(testUser.subscription.endDate);
      const expectedNewEndDate = new Date(originalEndDate);
      expectedNewEndDate.setMonth(expectedNewEndDate.getMonth() + 2);

      expect(updatedUser.subscription.endDate.getTime()).toBeCloseTo(
        expectedNewEndDate.getTime(),
        -4 // Allow 10 second difference
      );

      // Verify email was sent
      expect(emailService.sendSubscriptionExtensionEmail).toHaveBeenCalledWith(
        testUser.email,
        testUser.name,
        testPlan1.name,
        originalEndDate,
        expect.any(Date),
        2,
        "Customer loyalty reward"
      );
    });

    it("should reactivate expired subscription when extended", async () => {
      // Set subscription as expired
      testUser.subscription.status = "expired";
      await testUser.save();

      const extensionData = {
        months: 1,
        reason: "Reactivation",
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/subscription/extend`)
        .send(extensionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.status).toBe("active");
    });

    it("should return 400 for invalid extension months", async () => {
      const extensionData = {
        months: 0,
        reason: "Invalid extension",
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/subscription/extend`)
        .send(extensionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Extension months must be a positive number"
      );
    });

    it("should return 404 for non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const extensionData = {
        months: 2,
        reason: "Test",
      };

      const response = await request(app)
        .put(`/api/admin/users/${nonExistentId}/subscription/extend`)
        .send(extensionData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });

    it("should return 400 for user without subscription", async () => {
      const userWithoutSubscription = await User.create({
        name: "No Sub User",
        phone: "9876543211",
        email: "nosub@example.com",
      });

      const extensionData = {
        months: 2,
        reason: "Test",
      };

      const response = await request(app)
        .put(
          `/api/admin/users/${userWithoutSubscription._id}/subscription/extend`
        )
        .send(extensionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "User does not have an active subscription"
      );
    });
  });

  describe("PUT /api/admin/users/:id/subscription/change-plan", () => {
    it("should change user subscription plan successfully", async () => {
      const changeData = {
        newPlanId: testPlan2._id,
        reason: "User requested upgrade",
        adjustSessions: true,
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/subscription/change-plan`)
        .send(changeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Subscription plan changed successfully"
      );
      expect(response.body.data.subscription.planName).toBe("Premium Plan");
      expect(response.body.data.changeDetails.previousPlan).toBe("Basic Plan");
      expect(response.body.data.changeDetails.newPlan).toBe("Premium Plan");

      // Verify user subscription was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.subscription.planId.toString()).toBe(
        testPlan2._id.toString()
      );

      // Verify sessions were adjusted (3 sessions * (10/5) = 6 sessions)
      expect(updatedUser.subscription.sessionsRemaining).toBe(6);

      // Verify email was sent
      expect(emailService.sendSubscriptionPlanChangeEmail).toHaveBeenCalledWith(
        testUser.email,
        testUser.name,
        "Basic Plan",
        "Premium Plan",
        3,
        6,
        "User requested upgrade"
      );
    });

    it("should change plan without adjusting sessions when adjustSessions is false", async () => {
      const changeData = {
        newPlanId: testPlan2._id,
        reason: "Plan change without session adjustment",
        adjustSessions: false,
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/subscription/change-plan`)
        .send(changeData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify sessions were not adjusted
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.subscription.sessionsRemaining).toBe(3);
    });

    it("should return 404 for invalid new plan", async () => {
      const nonExistentPlanId = new mongoose.Types.ObjectId();
      const changeData = {
        newPlanId: nonExistentPlanId,
        reason: "Test",
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/subscription/change-plan`)
        .send(changeData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("New plan not found or inactive");
    });

    it("should return 400 for missing newPlanId", async () => {
      const changeData = {
        reason: "Test",
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/subscription/change-plan`)
        .send(changeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("New plan ID is required");
    });
  });

  describe("PUT /api/admin/users/:id/subscription/cancel", () => {
    it("should cancel user subscription successfully", async () => {
      const cancellationData = {
        reason: "User requested cancellation",
        immediate: false,
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/subscription/cancel`)
        .send(cancellationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Subscription cancelled successfully");
      expect(response.body.data.subscription.status).toBe("cancelled");
      expect(response.body.data.cancellationDetails.reason).toBe(
        "User requested cancellation"
      );
      expect(response.body.data.cancellationDetails.immediate).toBe(false);

      // Verify user subscription was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.subscription.status).toBe("cancelled");

      // For non-immediate cancellation, end date and sessions should remain unchanged
      expect(updatedUser.subscription.sessionsRemaining).toBe(3);

      // Verify email was sent
      expect(
        emailService.sendSubscriptionCancellationEmail
      ).toHaveBeenCalledWith(
        testUser.email,
        testUser.name,
        testPlan1.name,
        expect.any(Date),
        false,
        3,
        "User requested cancellation"
      );
    });

    it("should cancel subscription immediately when immediate is true", async () => {
      const cancellationData = {
        reason: "Immediate cancellation required",
        immediate: true,
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/subscription/cancel`)
        .send(cancellationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.status).toBe("cancelled");

      // Verify user subscription was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.subscription.status).toBe("cancelled");
      expect(updatedUser.subscription.sessionsRemaining).toBe(0);
      expect(updatedUser.subscription.endDate.getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });

    it("should return 400 for already cancelled subscription", async () => {
      // Cancel subscription first
      testUser.subscription.status = "cancelled";
      await testUser.save();

      const cancellationData = {
        reason: "Test",
        immediate: false,
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/subscription/cancel`)
        .send(cancellationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Subscription is already cancelled");
    });

    it("should return 404 for non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const cancellationData = {
        reason: "Test",
        immediate: false,
      };

      const response = await request(app)
        .put(`/api/admin/users/${nonExistentId}/subscription/cancel`)
        .send(cancellationData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });

    it("should return 400 for user without subscription", async () => {
      const userWithoutSubscription = await User.create({
        name: "No Sub User",
        phone: "9876543211",
        email: "nosub@example.com",
      });

      const cancellationData = {
        reason: "Test",
        immediate: false,
      };

      const response = await request(app)
        .put(
          `/api/admin/users/${userWithoutSubscription._id}/subscription/cancel`
        )
        .send(cancellationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "User does not have an active subscription"
      );
    });
  });
});
