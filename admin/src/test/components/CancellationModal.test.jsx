import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import CancellationModal from "../../components/appointments/CancellationModal";

describe("CancellationModal", () => {
  const mockAppointment = {
    _id: "123",
    userId: {
      name: "John Doe",
      subscription: {
        status: "active",
      },
    },
    date: "2024-01-15",
    timeSlot: "10:00 AM",
    sessionNumber: 1,
  };

  const defaultProps = {
    isOpen: true,
    appointment: mockAppointment,
    onClose: vi.fn(),
    onCancel: vi.fn(),
    loading: false,
  };

  it("renders modal when open", () => {
    render(<CancellationModal {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: "Cancel Consultation" })
    ).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<CancellationModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByRole("heading", { name: "Cancel Consultation" })
    ).not.toBeInTheDocument();
  });
});
