/**
 * UserDetailTabs Component Tests
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { vi } from "vitest";
import UserDetailTabs from "../../components/users/UserDetailTabs";
import userSlice from "../../store/userSlice";

// Mock the hooks
vi.mock("../../shared/hooks", () => ({
  useAccessibility: () => ({
    announce: vi.fn(),
    isMobile: false,
    isTouch: false,
  }),
  useResponsive: () => ({
    isBreakpoint: vi.fn(() => true),
  }),
  useFocusManagement: () => ({
    saveFocus: vi.fn(),
    restoreFocus: vi.fn(),
  }),
}));

// Mock the tab components
vi.mock("../../components/users/tabs/PersonalInfoTab", () => ({
  default: ({ user }) => <div>Personal Info for {user.name}</div>,
}));

vi.mock("../../components/users/tabs/MedicalInfoTab", () => ({
  default: ({ user }) => <div>Medical Info for {user.name}</div>,
}));

vi.mock("../../components/users/tabs/PaymentsTab", () => ({
  default: ({ user }) => <div>Payments for {user.name}</div>,
}));

vi.mock("../../components/users/tabs/BookingsTab", () => ({
  default: ({ user }) => <div>Bookings for {user.name}</div>,
}));

vi.mock("../../components/users/tabs/SubscriptionTab", () => ({
  default: ({ user }) => <div>Subscription for {user.name}</div>,
}));

vi.mock("../../components/users/tabs/DocumentsTab", () => ({
  default: ({ user }) => <div>Documents for {user.name}</div>,
}));

// Mock focus management utilities
vi.mock("../../shared/utils/accessibility", () => ({
  focusManagement: {
    trapFocus: vi.fn(() => vi.fn()),
  },
  keyboardNavigation: {
    handleKeyDown: vi.fn(),
    keys: {
      ARROW_LEFT: "ArrowLeft",
      ARROW_RIGHT: "ArrowRight",
      HOME: "Home",
      END: "End",
    },
  },
}));

describe("UserDetailTabs", () => {
  const mockUser = {
    _id: "user123",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    isVerified: true,
    subscription: {
      status: "active",
    },
  };

  const mockStore = configureStore({
    reducer: {
      users: userSlice,
    },
    preloadedState: {
      users: {
        selectedUser: mockUser,
        loading: false,
        error: null,
      },
    },
  });

  const defaultProps = {
    user: mockUser,
    onClose: vi.fn(),
    onEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock body style
    Object.defineProperty(document.body, "style", {
      value: { overflow: "" },
      writable: true,
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <UserDetailTabs {...defaultProps} {...props} />
      </Provider>
    );
  };

  it("renders user details modal", () => {
    renderComponent();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders all tabs", () => {
    renderComponent();

    expect(screen.getByText("Personal Info")).toBeInTheDocument();
    expect(screen.getByText("Medical Info")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    expect(screen.getByText("Subscription")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("shows personal info tab by default", () => {
    renderComponent();

    expect(screen.getByText("Personal Info for John Doe")).toBeInTheDocument();
  });

  it("switches tabs when clicked", async () => {
    renderComponent();

    const medicalTab = screen.getByText("Medical Info");
    fireEvent.click(medicalTab);

    await waitFor(() => {
      expect(screen.getByText("Medical Info for John Doe")).toBeInTheDocument();
    });
  });

  it("handles keyboard navigation between tabs", () => {
    renderComponent();

    const tabList = screen.getByRole("tablist");
    fireEvent.keyDown(tabList, { key: "ArrowRight" });

    const { keyboardNavigation } = require("../../shared/utils/accessibility");
    expect(keyboardNavigation.handleKeyDown).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", () => {
    const mockOnClose = vi.fn();
    renderComponent({ onClose: mockOnClose });

    const closeButton = screen.getByLabelText("Close user details");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onEdit when edit button is clicked", () => {
    const mockOnEdit = vi.fn();
    renderComponent({ onEdit: mockOnEdit });

    const editButton = screen.getByText("Edit User");
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });

  it("handles escape key to close modal", () => {
    const mockOnClose = vi.fn();
    renderComponent({ onClose: mockOnClose });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows loading state", () => {
    const loadingStore = configureStore({
      reducer: {
        users: userSlice,
      },
      preloadedState: {
        users: {
          selectedUser: null,
          loading: true,
          error: null,
        },
      },
    });

    render(
      <Provider store={loadingStore}>
        <UserDetailTabs {...defaultProps} />
      </Provider>
    );

    expect(screen.getByLabelText("Loading user details")).toBeInTheDocument();
  });

  it("applies proper ARIA attributes", () => {
    renderComponent();

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("aria-labelledby", "user-details-title");

    const tabList = screen.getByRole("tablist");
    expect(tabList).toHaveAttribute("aria-label", "User details tabs");

    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute("aria-selected");
      expect(tab).toHaveAttribute("aria-controls");
    });
  });

  it("shows verified badge when user is verified", () => {
    renderComponent();

    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("handles responsive layout", () => {
    // Mock mobile breakpoint
    const { useResponsive } = require("../../shared/hooks");
    useResponsive.mockReturnValue({
      isBreakpoint: vi.fn(() => false), // Mobile
    });

    renderComponent();

    // Should still render but with mobile-friendly layout
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("prevents body scroll when modal is open", () => {
    renderComponent();

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll when modal is closed", () => {
    const { unmount } = renderComponent();

    unmount();

    expect(document.body.style.overflow).toBe("");
  });

  it("focuses close button on mount", async () => {
    renderComponent();

    await waitFor(() => {
      const closeButton = screen.getByLabelText("Close user details");
      expect(closeButton).toHaveFocus();
    });
  });

  it("handles backdrop click to close", () => {
    const mockOnClose = vi.fn();
    renderComponent({ onClose: mockOnClose });

    const backdrop = screen.getByRole("dialog").parentElement;
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("prevents event propagation on modal content click", () => {
    const mockOnClose = vi.fn();
    renderComponent({ onClose: mockOnClose });

    const modalContent = screen.getByRole("dialog");
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
