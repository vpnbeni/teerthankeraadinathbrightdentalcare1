import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { vi } from "vitest";
import HolidayManager from "../../../components/availability/HolidayManager";
import availabilityReducer from "../../../store/availabilitySlice";

// Mock the availability service
vi.mock("../../../services/availability", () => ({
  default: {
    getHolidays: vi.fn(),
    addHoliday: vi.fn(),
    updateHoliday: vi.fn(),
    deleteHoliday: vi.fn(),
    bulkAddHolidays: vi.fn(),
  },
}));

// Mock toast utility
vi.mock("../../../shared/utils/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      availability: availabilityReducer,
    },
    preloadedState: {
      availability: {
        holidays: [],
        holidaysLoading: false,
        holidaysError: null,
        ...initialState,
      },
    },
  });
};

const renderWithProvider = (component, store) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe("HolidayManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders holiday manager with header and controls", () => {
    const store = createTestStore();
    renderWithProvider(<HolidayManager />, store);

    expect(screen.getByText("Holiday Manager")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manage holiday dates when appointments are not available"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Add Holiday")).toBeInTheDocument();
    expect(screen.getByText("Bulk Import")).toBeInTheDocument();
  });

  test("shows empty state when no holidays exist", () => {
    const store = createTestStore();
    renderWithProvider(<HolidayManager />, store);

    expect(screen.getByText("No holidays")).toBeInTheDocument();
    expect(
      screen.getByText(/No holidays have been added for/)
    ).toBeInTheDocument();
  });

  test("displays holidays list when holidays exist", () => {
    const mockHolidays = [
      {
        _id: "1",
        date: "2024-01-01",
        name: "New Year's Day",
        description: "National Holiday",
        isRecurring: true,
      },
      {
        _id: "2",
        date: "2024-07-04",
        name: "Independence Day",
        description: "",
        isRecurring: false,
      },
    ];

    const store = createTestStore({ holidays: mockHolidays });
    renderWithProvider(<HolidayManager />, store);

    expect(screen.getByText("New Year's Day")).toBeInTheDocument();
    expect(screen.getByText("Independence Day")).toBeInTheDocument();
    expect(screen.getByText("Recurring")).toBeInTheDocument();
  });

  test("opens add holiday form when Add Holiday button is clicked", () => {
    const store = createTestStore();
    renderWithProvider(<HolidayManager />, store);

    fireEvent.click(screen.getByText("Add Holiday"));

    expect(screen.getByText("Add New Holiday")).toBeInTheDocument();
    expect(screen.getByLabelText("Date *")).toBeInTheDocument();
    expect(screen.getByLabelText("Holiday Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Description (Optional)")).toBeInTheDocument();
  });

  test("validates required fields in holiday form", async () => {
    const store = createTestStore();
    renderWithProvider(<HolidayManager />, store);

    fireEvent.click(screen.getByText("Add Holiday"));
    fireEvent.click(
      screen.getByText("Add Holiday", { selector: 'button[type="submit"]' })
    );

    await waitFor(() => {
      expect(screen.getByText("Date is required")).toBeInTheDocument();
      expect(screen.getByText("Holiday name is required")).toBeInTheDocument();
    });
  });

  test("opens bulk import modal when Bulk Import button is clicked", () => {
    const store = createTestStore();
    renderWithProvider(<HolidayManager />, store);

    fireEvent.click(screen.getByText("Bulk Import"));

    expect(screen.getByText("Bulk Import Holidays")).toBeInTheDocument();
    expect(screen.getByText("Holiday Data")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  test("filters holidays by selected year", () => {
    const mockHolidays = [
      {
        _id: "1",
        date: "2024-01-01",
        name: "New Year's Day 2024",
        description: "",
        isRecurring: false,
      },
      {
        _id: "2",
        date: "2025-01-01",
        name: "New Year's Day 2025",
        description: "",
        isRecurring: false,
      },
    ];

    const store = createTestStore({ holidays: mockHolidays });
    renderWithProvider(<HolidayManager />, store);

    // Should show current year by default
    expect(screen.getByText("New Year's Day 2024")).toBeInTheDocument();
    expect(screen.queryByText("New Year's Day 2025")).not.toBeInTheDocument();

    // Change year filter
    const yearSelect = screen.getByDisplayValue("2024");
    fireEvent.change(yearSelect, { target: { value: "2025" } });

    expect(screen.queryByText("New Year's Day 2024")).not.toBeInTheDocument();
    expect(screen.getByText("New Year's Day 2025")).toBeInTheDocument();
  });

  test("shows loading state", () => {
    const store = createTestStore({ holidaysLoading: true });
    renderWithProvider(<HolidayManager />, store);

    expect(screen.getByText("Loading holidays...")).toBeInTheDocument();
  });

  test("shows error state", () => {
    const store = createTestStore({ holidaysError: "Failed to load holidays" });
    renderWithProvider(<HolidayManager />, store);

    expect(screen.getByText("Failed to load holidays")).toBeInTheDocument();
  });

  test("displays holiday summary statistics", () => {
    const mockHolidays = [
      {
        _id: "1",
        date: "2024-01-01",
        name: "New Year's Day",
        description: "",
        isRecurring: true,
      },
      {
        _id: "2",
        date: "2024-07-04",
        name: "Independence Day",
        description: "",
        isRecurring: false,
      },
    ];

    const store = createTestStore({ holidays: mockHolidays });
    renderWithProvider(<HolidayManager />, store);

    expect(screen.getByText("Holiday Summary")).toBeInTheDocument();
    expect(screen.getByText("Total Holidays:")).toBeInTheDocument();
    expect(screen.getByText("This Year:")).toBeInTheDocument();
    expect(screen.getByText("Recurring:")).toBeInTheDocument();
    expect(screen.getByText("One-time:")).toBeInTheDocument();
  });
});
