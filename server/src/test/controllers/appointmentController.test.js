import { jest } from "@jest/globals";
import { createAppointment } from "../../controllers/appointmentController.js";
import { Appointment, User } from "../../models/index.js";
import emailService from "../../services/emailService.js";

// Mock dependencies
jest.mock("../../models/index.js");
jest.mock("../../services/emailService.js");

describe("Appointment Controller - Email Update Feature", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: {
        _id: "user123",
        name: "Test User",
        phone: "9876543210",
        email: "old@gmail.com",
        medicalInfo: {},
        subscription: {
          status: "active",
          sessionsRemaining: 5,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        isSubscriptionActive: jest.fn().mockReturnValue(true),
      },
      body: {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        timeSlot: "10:00-11:00",
        notes: "Test appointment",
        personalDetails: {
          name: "Test User",
          phone: "9876543210",
          email: "verified@gmail.com", // new verified email
          address: "123 Test Street",
        },
        medicalInfo: {
          systemicDiseases: ["Diabetes"],
          drugAllergies: ["Penicillin"],
        },
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  test("should update user profile with verified email during appointment booking", async () => {
    // Mock Appointment methods
    Appointment.isTimeSlotAvailable = jest.fn().mockResolvedValue(true);
    Appointment.countDocuments = jest.fn().mockResolvedValue(0);
    Appointment.create = jest.fn().mockResolvedValue({
      _id: "appointment123",
      userId: "user123",
      date: mockReq.body.date,
      timeSlot: mockReq.body.timeSlot,
      notes: mockReq.body.notes,
      sessionNumber: 1,
    });
    Appointment.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: "appointment123",
        userId: {
          _id: "user123",
          name: "Test User",
          phone: "9876543210",
          email: "verified@gmail.com",
        },
        date: mockReq.body.date,
        timeSlot: mockReq.body.timeSlot,
        notes: mockReq.body.notes,
        sessionNumber: 1,
      }),
    });

    // Mock User update
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: "user123",
      email: "verified@gmail.com",
      address: "123 Test Street",
      medicalInfo: {
        systemicDiseases: ["Diabetes"],
        drugAllergies: ["Penicillin"],
      },
    });

    User.findById = jest.fn().mockResolvedValue({
      _id: "user123",
      name: "Test User",
      phone: "9876543210",
      email: "verified@gmail.com",
      address: "123 Test Street",
      medicalInfo: {
        systemicDiseases: ["Diabetes"],
        drugAllergies: ["Penicillin"],
      },
    });

    // Mock email service
    emailService.sendAppointmentConfirmationEmail = jest
      .fn()
      .mockResolvedValue();

    await createAppointment(mockReq, mockRes);

    // Verify user profile was updated
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      expect.objectContaining({
        email: "verified@gmail.com",
        address: "123 Test Street",
        medicalInfo: expect.objectContaining({
          systemicDiseases: ["Diabetes"],
          drugAllergies: ["Penicillin"],
        }),
      }),
      { new: true }
    );

    // Verify appointment was created
    expect(Appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user123",
        date: mockReq.body.date,
        timeSlot: mockReq.body.timeSlot,
        notes: mockReq.body.notes,
        sessionNumber: 1,
      })
    );

    // Verify email was sent to new email address
    expect(emailService.sendAppointmentConfirmationEmail).toHaveBeenCalledWith(
      "verified@gmail.com",
      "Test User",
      mockReq.body.date,
      mockReq.body.timeSlot
    );

    // Verify response includes profileUpdated flag
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          profileUpdated: true,
        }),
        message: "Appointment booked successfully",
      })
    );
  });

  test("should not update profile if no new information provided", async () => {
    // Remove personalDetails and medicalInfo from request
    delete mockReq.body.personalDetails;
    delete mockReq.body.medicalInfo;

    // Mock Appointment methods
    Appointment.isTimeSlotAvailable = jest.fn().mockResolvedValue(true);
    Appointment.countDocuments = jest.fn().mockResolvedValue(0);
    Appointment.create = jest.fn().mockResolvedValue({
      _id: "appointment123",
      userId: "user123",
    });
    Appointment.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: "appointment123",
        userId: {
          _id: "user123",
          name: "Test User",
          phone: "9876543210",
          email: "old@gmail.com",
        },
      }),
    });

    emailService.sendAppointmentConfirmationEmail = jest
      .fn()
      .mockResolvedValue();

    await createAppointment(mockReq, mockRes);

    // Verify user profile was NOT updated
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();

    // Verify response indicates no profile update
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          profileUpdated: false,
        }),
      })
    );
  });

  test("should only update email if it is different from current email", async () => {
    // Set same email as current user email
    mockReq.body.personalDetails.email = "old@gmail.com";

    // Mock Appointment methods
    Appointment.isTimeSlotAvailable = jest.fn().mockResolvedValue(true);
    Appointment.countDocuments = jest.fn().mockResolvedValue(0);
    Appointment.create = jest.fn().mockResolvedValue({
      _id: "appointment123",
      userId: "user123",
    });
    Appointment.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: "appointment123",
        userId: {
          _id: "user123",
          name: "Test User",
          phone: "9876543210",
          email: "old@gmail.com",
        },
      }),
    });

    User.findByIdAndUpdate = jest.fn().mockResolvedValue({});
    User.findById = jest.fn().mockResolvedValue(mockReq.user);
    emailService.sendAppointmentConfirmationEmail = jest
      .fn()
      .mockResolvedValue();

    await createAppointment(mockReq, mockRes);

    // Verify user profile was updated but email was not included (since it's the same)
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      expect.objectContaining({
        address: "123 Test Street",
        medicalInfo: expect.objectContaining({
          systemicDiseases: ["Diabetes"],
          drugAllergies: ["Penicillin"],
        }),
      }),
      { new: true }
    );

    // Verify email field was not included in the update
    const updateCall = User.findByIdAndUpdate.mock.calls[0][1];
    expect(updateCall).not.toHaveProperty("email");
  });
});
