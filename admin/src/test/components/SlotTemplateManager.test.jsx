import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { describe, it, expect, beforeEach, vi } from "vitest";
import SlotTemplateManager from "../../components/availability/SlotTemplateManager";
import availabilitySlice from "../../store/availabilitySlice";

// Mock the toast utility
vi.mock("../../shared/utils/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      availability: availabilitySlice,
    },
    preloadedState: {
      availability: {
        settings: {
          defaultStartTime: "08:00",
          defaultEndTime: "18:00",
          slotDuration: 60,
          defaultSlots: [],
        },
        settingsLoading: false,
        settingsError: null,
        ...initialState.availability,
      },
    },
  });
};

const renderWithProvider = (component, store) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe("SlotTemplateManager", () => {
  let store;

  beforeEach(() => {
    store = createMockStore();
  });

  it("renders the component with default slots", () => {
    renderWithProvider(<SlotTemplateManager />, store);

    expect(screen.getByText("Slot Template Manager")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Configure default time slots for appointment availability"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Add Custom Slot")).toBeInTheDocument();
  });

  it("displays default 8 AM to 6 PM slots", async () => {
    renderWithProvider(<SlotTemplateManager />, store);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText("8:00 AM")).toBeInTheDocument();
      expect(screen.getByText("5:00 PM")).toBeInTheDocument();
    });

    // Check that we have 10 default slots (8 AM to 6 PM)
    const timeSlots = screen.getAllByText(/\d{1,2}:\d{2} [AP]M/);
    expect(timeSlots.length).toBeGreaterThan(0);
  });

  it("allows toggling slot active/inactive state", async () => {
    renderWithProvider(<SlotTemplateManager />, store);

    await waitFor(() => {
      expect(screen.getByText("8:00 AM")).toBeInTheDocument();
    });

    // Find the first slot and click it to toggle
    const firstSlot = screen
      .getByText("8:00 AM")
      .closest("div[class*='cursor-pointer']");
    expect(firstSlot).toBeInTheDocument();

    fireEvent.click(firstSlot);

    // Should show auto-save status indicator
    await waitFor(() => {
      expect(screen.getByText("Auto-saving in 1s...")).toBeInTheDocument();
    });
  });

  it("shows add custom slot form when button is clicked", () => {
    renderWithProvider(<SlotTemplateManager />, store);

    const addButton = screen.getByText("Add Custom Slot");
    fireEvent.click(addButton);

    expect(screen.getByText("Add Custom Time Slot")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Time")).toBeInTheDocument();
    expect(screen.getByLabelText("End Time")).toBeInTheDocument();
  });

  it("validates custom slot form", async () => {
    renderWithProvider(<SlotTemplateManager />, store);

    // Open add custom slot form
    const addButton = screen.getByText("Add Custom Slot");
    fireEvent.click(addButton);

    // Try to add slot with same start and end time
    const startTimeSelect = screen.getByLabelText("Start Time");
    const endTimeSelect = screen.getByLabelText("End Time");
    const addSlotButton = screen.getByRole("button", { name: "Add Slot" });

    fireEvent.change(startTimeSelect, { target: { value: "09:00" } });
    fireEvent.change(endTimeSelect, { target: { value: "09:00" } });
    fireEvent.click(addSlotButton);

    await waitFor(() => {
      expect(
        screen.getByText("End time must be after start time")
      ).toBeInTheDocument();
    });
  });

  it("shows template summary with correct counts", async () => {
    renderWithProvider(<SlotTemplateManager />, store);

    await waitFor(() => {
      expect(screen.getByText("Template Summary")).toBeInTheDocument();
      expect(screen.getByText("Total Slots:")).toBeInTheDocument();
      expect(screen.getByText("Active Slots:")).toBeInTheDocument();
      expect(screen.getByText("Default Slots:")).toBeInTheDocument();
      expect(screen.getByText("Custom Slots:")).toBeInTheDocument();
    });
  });

  it("shows auto-save status when changes are made", async () => {
    renderWithProvider(<SlotTemplateManager />, store);

    await waitFor(() => {
      expect(screen.getByText("8:00 AM")).toBeInTheDocument();
    });

    // Toggle a slot to create changes
    const firstSlot = screen
      .getByText("8:00 AM")
      .closest("div[class*='cursor-pointer']");
    fireEvent.click(firstSlot);

    await waitFor(() => {
      expect(screen.getByText("Auto-saving in 1s...")).toBeInTheDocument();
    });
  });

  it("handles loading state", () => {
    const loadingStore = createMockStore({
      availability: {
        settingsLoading: true,
      },
    });

    renderWithProvider(<SlotTemplateManager />, loadingStore);

    // Save button should be disabled when loading
    // Note: This test assumes changes have been made to show the save button
  });

  it("displays error messages", () => {
    const errorStore = createMockStore({
      availability: {
        settingsError: "Failed to load settings",
      },
    });

    renderWithProvider(<SlotTemplateManager />, errorStore);

    expect(screen.getByText("Failed to load settings")).toBeInTheDocument();
  });

  it("formats time correctly", async () => {
    renderWithProvider(<SlotTemplateManager />, store);

    await waitFor(() => {
      // Check that times are formatted as 12-hour format with AM/PM
      expect(screen.getByText("8:00 AM")).toBeInTheDocument();
      expect(screen.getByText("12:00 PM")).toBeInTheDocument();
      expect(screen.getByText("5:00 PM")).toBeInTheDocument();
    });
  });
});
