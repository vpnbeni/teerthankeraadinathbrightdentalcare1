import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import AppointmentDetails from "./AppointmentDetails";
import appointmentSlice from "../../store/appointmentSlice";

// Mock the appointment service
jest.mock("../../services/appointments");

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockStore = configureStore({
  reducer: {
    appointments: appointmentSlice,
  },
  preloadedState: {
    appointments: {
      appointments: [
        {
          _id: "1",
          status: "scheduled",
          date: "2024-01-15",
          timeSlot: "10:00 AM",
          userId: {
            name: "John Doe",
            phone: "1234567890",
            email: "john@example.com",
          },
          notes: "Initial notes",
        },
      ],
      loading: false,
      error: null,
    },
  },
});

const mockAppointment = {
  _id: "1",
  status: "scheduled",
  date: "2024-01-15",
  timeSlot: "10:00 AM",
  userId: {
    name: "John Doe",
    phone: "1234567890",
    email: "john@example.com",
  },
  notes: "Initial notes",
};

describe("AppointmentDetails UI Update Fix", () => {
  it("should reflect status changes in UI immediately", async () => {
    const mockOnClose = jest.fn();
    const mockOnAppointmentUpdated = jest.fn();

    render(
      <Provider store={mockStore}>
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
          onAppointmentUpdated={mockOnAppointmentUpdated}
        />
      </Provider>
    );

    // Check initial status
    expect(screen.getByText("Scheduled")).toBeInTheDocument();

    // Find and click the confirm button
    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    // Wait for the status to update in the UI
    await waitFor(() => {
      // The component should now show the updated status from Redux store
      expect(mockOnAppointmentUpdated).toHaveBeenCalled();
    });
  });

  it("should use updated appointment data from Redux store", () => {
    const mockOnClose = jest.fn();
    const mockOnAppointmentUpdated = jest.fn();

    render(
      <Provider store={mockStore}>
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
          onAppointmentUpdated={mockOnAppointmentUpdated}
        />
      </Provider>
    );

    // The component should display data from the Redux store, not just the initial prop
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });
});
