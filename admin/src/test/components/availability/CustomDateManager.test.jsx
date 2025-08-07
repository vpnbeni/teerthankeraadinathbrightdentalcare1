import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import CustomDateManager from "../../../components/availability/CustomDateManager";
import availabilitySlice from "../../../store/availabilitySlice";

// Mock the availability service
jest.mock("../../../services/availability", () => ({
  getCustomDates: jest.fn(),
  addCustomDate: jest.fn(),
  updateCustomDate: jest.fn(),
  deleteCustomDate: jest.fn(),
  bulkAddCustomDates: jest.fn(),
}));

// Mock toast utility
jest.mock("../../../shared/utils/toast", () => ({
  showToast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      availability: availabilitySlice,
    },
    preloadedState: {
      availability: {
        customDates: [],
        customDatesLoading: false,
        customDatesError: null,
        template: {
          defaultSlots: [
            { startTime: "08:00", endTime: "09:00", isActive: true },
            { startTime: "09:00", endTime: "10:00", isActive: true },
          ],
          workingDays: [1, 2, 3, 4, 5, 6],
        },
        ...initialState,
      },
    },
  });
};

const renderWithProvider = (component, store) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe("CustomDateManager", () => {
  let mockStore;

  beforeEach(() => {
    mockStore = createMockStore();
    jest.clearAllMocks();
  });

  test("renders CustomDateManager component", () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    expect(screen.getByText("Custom Date Manager")).toBeInTheDocument();
    expect(
      screen.getByText("Set custom availability for specific dates")
    ).toBeInTheDocument();
  });

  test("shows add custom date button", () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    expect(screen.getByText("Add Custom Date")).toBeInTheDocument();
  });

  test("opens add form when add button is clicked", () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    const addButton = screen.getByText("Add Custom Date");
    fireEvent.click(addButton);

    expect(screen.getByText("Add Custom Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Date *")).toBeInTheDocument();
    expect(screen.getByLabelText("Reason *")).toBeInTheDocument();
  });

  test("shows bulk import button", () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    expect(screen.getByText("Bulk Import")).toBeInTheDocument();
  });

  test("shows preview button", () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  test("displays empty state when no custom dates exist", () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    expect(screen.getByText("No custom dates")).toBeInTheDocument();
    expect(
      screen.getByText(/No custom dates have been added for/)
    ).toBeInTheDocument();
  });

  test("displays custom dates when they exist", () => {
    const storeWithCustomDates = createMockStore({
      customDates: [
        {
          _id: "1",
          date: "2024-12-25",
          reason: "Christmas Day",
          customSlots: [
            {
              startTime: "09:00",
              endTime: "12:00",
              isActive: true,
              maxBookings: 1,
            },
          ],
        },
      ],
    });

    renderWithProvider(<CustomDateManager />, storeWithCustomDates);

    expect(screen.getByText("Christmas Day")).toBeInTheDocument();
    expect(screen.getByText("1 time slots")).toBeInTheDocument();
  });

  test("opens slot editor when add slot button is clicked", async () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    // Open add form first
    const addButton = screen.getByText("Add Custom Date");
    fireEvent.click(addButton);

    // Click add slot button
    const addSlotButton = screen.getByText("Add Slot");
    fireEvent.click(addSlotButton);

    expect(screen.getByText("Add Time Slot")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Time")).toBeInTheDocument();
    expect(screen.getByLabelText("End Time")).toBeInTheDocument();
  });

  test("validates required fields", async () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    // Open add form
    const addButton = screen.getByText("Add Custom Date");
    fireEvent.click(addButton);

    // Try to submit without filling required fields
    const submitButton = screen.getByText("Add Custom Date");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Date is required")).toBeInTheDocument();
      expect(screen.getByText("Reason is required")).toBeInTheDocument();
    });
  });

  test("shows year selector", () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    const currentYear = new Date().getFullYear();
    const yearSelect = screen.getByDisplayValue(currentYear.toString());
    expect(yearSelect).toBeInTheDocument();
  });

  test("opens preview modal when preview button is clicked", () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    const previewButton = screen.getByText("Preview");
    fireEvent.click(previewButton);

    expect(screen.getByText("Patient View Preview")).toBeInTheDocument();
    expect(screen.getByText("Select Date to Preview")).toBeInTheDocument();
  });

  test("opens bulk import modal when bulk import button is clicked", () => {
    renderWithProvider(<CustomDateManager />, mockStore);

    const bulkImportButton = screen.getByText("Bulk Import");
    fireEvent.click(bulkImportButton);

    expect(screen.getByText("Bulk Import Custom Dates")).toBeInTheDocument();
    expect(screen.getByText("Custom Date Data")).toBeInTheDocument();
  });

  test("displays loading state", () => {
    const loadingStore = createMockStore({
      customDatesLoading: true,
    });

    renderWithProvider(<CustomDateManager />, loadingStore);

    expect(screen.getByText("Loading custom dates...")).toBeInTheDocument();
  });

  test("displays error state", () => {
    const errorStore = createMockStore({
      customDatesError: "Failed to load custom dates",
    });

    renderWithProvider(<CustomDateManager />, errorStore);

    expect(screen.getByText("Failed to load custom dates")).toBeInTheDocument();
  });

  test("displays summary statistics", () => {
    const storeWithCustomDates = createMockStore({
      customDates: [
        {
          _id: "1",
          date: "2024-12-25",
          reason: "Christmas Day",
          customSlots: [
            {
              startTime: "09:00",
              endTime: "12:00",
              isActive: true,
              maxBookings: 1,
            },
            {
              startTime: "14:00",
              endTime: "17:00",
              isActive: true,
              maxBookings: 1,
            },
          ],
        },
        {
          _id: "2",
          date: "2024-12-31",
          reason: "New Year Eve",
          customSlots: [
            {
              startTime: "09:00",
              endTime: "15:00",
              isActive: true,
              maxBookings: 1,
            },
          ],
        },
      ],
    });

    renderWithProvider(<CustomDateManager />, storeWithCustomDates);

    expect(screen.getByText("Custom Date Summary")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Total Custom Dates
    expect(screen.getByText("3")).toBeInTheDocument(); // Total Slots
  });
});
