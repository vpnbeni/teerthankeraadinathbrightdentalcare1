import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User, Appointment, Payment, Plan } from "../../models/index.js";
import adminRoutes from "../../routes/admin.js";
import { auth } from "../../middleware/auth.js";
import { adminOnly } from "../../middleware/adminAuth.js";

const app = express();
app.use(express.json());

// Mock middleware for testing
app.use((req, res, next) => {
  req.user = {
    _id: new mongoose.Types.ObjectId(),
    role: "admin",
    name: "Test Admin",
    email: "admin@test.com",
  };
  next();
});

app.use("/api/admin", adminRoutes);

describe("Admin User Management Endpoints", () => {
  let mongoServer;
  let testUser;
  let testPlan;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test plan
    testPlan = await Plan.create({
      name: "Test Plan",
      sessions: 6,
      price: 1000,
      duration: 12,
      isActive: true,
    });

    // Create test user
    testUser = await User.create({
      name: "John Doe",
      phone: "9876543210",
      email: "john@test.com",
      address: "123 Test Street",
      gender: "male",
      alternativePhone: "9876543211",
      medicalInfo: {
        systemicDiseases: ["Diabetes"],
        drugAllergies: ["Penicillin"],
        isPregnant: false,
        pastTreatments: ["Root Canal"],
        previousExperiences: ["Good experience"],
      },
      subscription: {
        planId: testPlan._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        sessionsRemaining: 6,
        status: "active",
      },
    });

    // Create test appointments
    await Appointment.create([
      {
        userId: testUser._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        timeSlot: "09:00-10:00",
        status: "scheduled",
        sessionNumber: 1,
      },
      {
        userId: testUser._id,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        timeSlot: "10:00-11:00",
        status: "completed",
        sessionNumber: 2,
      },
    ]);

    // Create test payments
    await Payment.create([
      {
        userId: testUser._id,
        planId: testPlan._id,
        amount: 1000,
        status: "completed",
        razorpayOrderId: "order_test123",
        razorpayPaymentId: "pay_test123",
        transactionDate: new Date(),
        paymentMethod: "card",
      },
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("GET /api/admin/users/:id/details", () => {
    it("should get comprehensive user details", async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}/details`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.name).toBe("John Doe");
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.totalAppointments).toBe(2);
      expect(response.body.data.statistics.totalPayments).toBe(1);
      expect(response.body.data.recentActivity).toBeDefined();
    });

    it("should return 404 for non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/admin/users/${nonExistentId}/details`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });
  });

  describe("PUT /api/admin/users/:id/personal", () => {
    it("should update user personal information", async () => {
      const updateData = {
        name: "John Updated",
        phone: "9876543210",
        email: "john.updated@test.com",
        address: "456 Updated Street",
        gender: "male",
        alternativePhone: "9876543212",
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/personal`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe("John Updated");
      expect(response.body.data.user.email).toBe("john.updated@test.com");
      expect(response.body.data.user.address).toBe("456 Updated Street");
    });

    it("should return 400 for invalid phone number", async () => {
      const updateData = {
        name: "John Doe",
        phone: "invalid-phone",
        email: "john@test.com",
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/personal`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should return 404 for non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        name: "John Doe",
        phone: "9876543210",
      };

      const response = await request(app)
        .put(`/api/admin/users/${nonExistentId}/personal`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });
  });

  describe("PUT /api/admin/users/:id/medical", () => {
    it("should update user medical information", async () => {
      const updateData = {
        systemicDiseases: ["Hypertension", "Diabetes"],
        drugAllergies: ["Aspirin"],
        isPregnant: false,
        pastTreatments: ["Cleaning", "Filling"],
        previousExperiences: ["Excellent service"],
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/medical`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.medicalInfo.systemicDiseases).toEqual([
        "Hypertension",
        "Diabetes",
      ]);
      expect(response.body.data.user.medicalInfo.drugAllergies).toEqual([
        "Aspirin",
      ]);
    });

    it("should return 404 for non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        systemicDiseases: ["Diabetes"],
      };

      const response = await request(app)
        .put(`/api/admin/users/${nonExistentId}/medical`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });
  });

  describe("GET /api/admin/users/:id/payments", () => {
    it("should get user payment history", async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}/payments`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toBeDefined();
      expect(response.body.data.payments.length).toBe(1);
      expect(response.body.data.payments[0].amount).toBe(1000);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.completed).toBe(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should filter payments by status", async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}/payments?status=completed`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments.length).toBe(1);
      expect(response.body.data.payments[0].status).toBe("completed");
    });

    it("should return 404 for non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/admin/users/${nonExistentId}/payments`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });
  });

  describe("GET /api/admin/users/:id/bookings", () => {
    it("should get user booking history", async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}/bookings`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toBeDefined();
      expect(response.body.data.appointments.length).toBe(2);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.total).toBe(2);
      expect(response.body.data.upcomingAppointments).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it("should filter appointments by status", async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}/bookings?status=completed`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments.length).toBe(1);
      expect(response.body.data.appointments[0].status).toBe("completed");
    });

    it("should return 404 for non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/admin/users/${nonExistentId}/bookings`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });
  });
});
