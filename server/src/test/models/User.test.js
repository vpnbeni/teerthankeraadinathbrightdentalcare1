import { jest } from "@jest/globals";
import mongoose from "mongoose";
import User from "../../models/User.js";
import Plan from "../../models/Plan.js";
import { mockUser, mockAdminUser } from "../fixtures/users.js";
import { mockPlans } from "../fixtures/plans.js";

// Mock the encryption and audit services
jest.mock("../../services/encryptionService.js", () => ({
  encryptionService: {
    encryptMedicalInfo: jest.fn((data) => data),
    decryptMedicalInfo: jest.fn((data) => data),
  },
}));

jest.mock("../../services/auditService.js", () => ({
  auditService: {
    logAction: jest.fn(),
  },
}));

describe("User Model", () => {
  let testPlan;

  beforeEach(async () => {
    // Create a test plan
    testPlan = await Plan.create(mockPlans[0]);
  });

  describe("User Creation", () => {
    it("should create a user with valid data", async () => {
      const userData = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          planId: testPlan._id,
        },
      };

      const user = await User.create(userData);

      expect(user.name).toBe(userData.name);
      expect(user.phone).toBe(userData.phone);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe("patient");
      expect(user.isVerified).toBe(true);
      expect(user.subscription.planId.toString()).toBe(testPlan._id.toString());
      expect(user.subscription.status).toBe("active");
    });

    it("should create an admin user", async () => {
      const adminData = {
        ...mockAdminUser,
        subscription: {
          planId: testPlan._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          sessionsRemaining: 0,
          totalSessions: 0,
          status: "active",
        },
      };

      const admin = await User.create(adminData);

      expect(admin.name).toBe(adminData.name);
      expect(admin.role).toBe("admin");
    });

    it("should require name, phone, and subscription", async () => {
      const invalidUser = {
        email: "test@example.com",
        // Missing required fields
      };

      await expect(User.create(invalidUser)).rejects.toThrow();
    });

    it("should validate phone number format", async () => {
      const userData = {
        ...mockUser,
        phone: "123456789", // Invalid phone number
        subscription: {
          ...mockUser.subscription,
          planId: testPlan._id,
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should validate email format", async () => {
      const userData = {
        ...mockUser,
        email: "invalid-email", // Invalid email
        subscription: {
          ...mockUser.subscription,
          planId: testPlan._id,
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should enforce unique phone numbers", async () => {
      const userData = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          planId: testPlan._id,
        },
      };

      // Create first user
      await User.create(userData);

      // Try to create second user with same phone
      const duplicateUser = {
        ...userData,
        name: "Different Name",
        email: "different@example.com",
      };

      await expect(User.create(duplicateUser)).rejects.toThrow();
    });
  });

  describe("User Methods", () => {
    let user;

    beforeEach(async () => {
      const userData = {
        ...mockUser,
        passwordHash: "password123",
        subscription: {
          ...mockUser.subscription,
          planId: testPlan._id,
        },
      };
      user = await User.create(userData);
    });

    describe("matchPassword", () => {
      it("should return true for correct password", async () => {
        const isMatch = await user.matchPassword("password123");
        expect(isMatch).toBe(true);
      });

      it("should return false for incorrect password", async () => {
        const isMatch = await user.matchPassword("wrongpassword");
        expect(isMatch).toBe(false);
      });
    });

    describe("isSubscriptionActive", () => {
      it("should return true for active subscription", () => {
        const isActive = user.isSubscriptionActive();
        expect(isActive).toBe(true);
      });

      it("should return false for expired subscription", async () => {
        user.subscription.endDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
        await user.save();

        const isActive = user.isSubscriptionActive();
        expect(isActive).toBe(false);
      });

      it("should return false for suspended subscription", async () => {
        user.subscription.status = "suspended";
        await user.save();

        const isActive = user.isSubscriptionActive();
        expect(isActive).toBe(false);
      });

      it("should return false when no sessions remaining", async () => {
        user.subscription.sessionsRemaining = 0;
        await user.save();

        const isActive = user.isSubscriptionActive();
        expect(isActive).toBe(false);
      });
    });

    describe("consumeSession", () => {
      it("should consume a session successfully", async () => {
        const initialSessions = user.subscription.sessionsRemaining;

        await user.consumeSession();

        expect(user.subscription.sessionsRemaining).toBe(initialSessions - 1);
        expect(user.subscription.status).toBe("active");
      });

      it("should set status to expired when last session is consumed", async () => {
        user.subscription.sessionsRemaining = 1;
        await user.save();

        await user.consumeSession();

        expect(user.subscription.sessionsRemaining).toBe(0);
        expect(user.subscription.status).toBe("expired");
      });

      it("should throw error when no sessions remaining", async () => {
        user.subscription.sessionsRemaining = 0;
        await user.save();

        await expect(user.consumeSession()).rejects.toThrow(
          "No sessions remaining"
        );
      });
    });
  });

  describe("Static Methods", () => {
    beforeEach(async () => {
      // Create users with different subscription end dates
      const now = new Date();

      // User with subscription expiring in 3 days
      await User.create({
        name: "User 1",
        phone: "9876543210",
        email: "user1@example.com",
        subscription: {
          planId: testPlan._id,
          startDate: now,
          endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          sessionsRemaining: 2,
          totalSessions: 6,
          status: "active",
        },
      });

      // User with subscription expiring in 10 days
      await User.create({
        name: "User 2",
        phone: "9876543211",
        email: "user2@example.com",
        subscription: {
          planId: testPlan._id,
          startDate: now,
          endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
          sessionsRemaining: 3,
          totalSessions: 6,
          status: "active",
        },
      });

      // User with already expired subscription
      await User.create({
        name: "User 3",
        phone: "9876543212",
        email: "user3@example.com",
        subscription: {
          planId: testPlan._id,
          startDate: now,
          endDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
          sessionsRemaining: 0,
          totalSessions: 6,
          status: "expired",
        },
      });
    });

    describe("findExpiringSubscriptions", () => {
      it("should find subscriptions expiring within 7 days", async () => {
        const expiringUsers = await User.findExpiringSubscriptions(7);

        expect(expiringUsers).toHaveLength(1);
        expect(expiringUsers[0].name).toBe("User 1");
      });

      it("should find subscriptions expiring within 15 days", async () => {
        const expiringUsers = await User.findExpiringSubscriptions(15);

        expect(expiringUsers).toHaveLength(2);
        expect(expiringUsers.map((u) => u.name)).toContain("User 1");
        expect(expiringUsers.map((u) => u.name)).toContain("User 2");
      });

      it("should not include already expired subscriptions", async () => {
        const expiringUsers = await User.findExpiringSubscriptions(30);

        expect(expiringUsers.map((u) => u.name)).not.toContain("User 3");
      });
    });
  });

  describe("Validation", () => {
    it("should validate gender enum values", async () => {
      const userData = {
        ...mockUser,
        gender: "invalid-gender",
        subscription: {
          ...mockUser.subscription,
          planId: testPlan._id,
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should validate subscription status enum values", async () => {
      const userData = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          planId: testPlan._id,
          status: "invalid-status",
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should validate role enum values", async () => {
      const userData = {
        ...mockUser,
        role: "invalid-role",
        subscription: {
          ...mockUser.subscription,
          planId: testPlan._id,
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should validate sessions remaining is not negative", async () => {
      const userData = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          planId: testPlan._id,
          sessionsRemaining: -1,
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });
});
