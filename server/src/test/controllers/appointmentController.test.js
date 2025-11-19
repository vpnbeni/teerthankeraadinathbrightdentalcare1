import { setup, teardown } from "../setup.js";
import { completeAppointment } from "../../controllers/appointmentController.js";
import { User, Appointment } from "../../models/index.js";

beforeAll(setup);

afterAll(teardown);

describe("completeAppointment", () => {
  it("should complete an consultation and decrement the user's sessionsRemaining", async () => {
    // 1. Create a user with a subscription
    const user = await User.create({
      name: "Test User",
      phone: "1234567890",
      subscription: {
        sessionsRemaining: 5,
        status: "active",
      },
    });

    // 2. Create an appointment for the user
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointment = await Appointment.create({
      userId: user._id,
      date: tomorrow,
      timeSlot: "10:00-11:00",
      status: "confirmed",
    });

    // 3. Mock the request and response objects
    const req = {
      params: {
        appointmentId: appointment._id,
      },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    // 4. Call the completeAppointment function
    await completeAppointment(req, res);

    // 5. Assertions
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.subscription.sessionsRemaining).toBe(4);

    const updatedAppointment = await Appointment.findById(appointment._id);
    expect(updatedAppointment.status).toBe("completed");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Consultation completed successfully",
      })
    );
  });
});
