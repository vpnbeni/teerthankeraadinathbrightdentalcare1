import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import HolidayManager from "../../../components/availability/HolidayManager";
import availabilityReducer from "../../../store/availabilitySlice";

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

describe("HolidayManager Integration", () => {
  test("renders without crashing", () => {
    const store = createTestStore();
    renderWithProvider(<HolidayManager />, store);

    // Basic rendering test
    expect(screen.getByText("Holiday Manager")).toBeInTheDocument();
    expect(screen.getByText("Add Holiday")).toBeInTheDocument();
    expect(screen.getByText("Bulk Import")).toBeInTheDocument();
  });

  test("shows empty state when no holidays", () => {
    const store = createTestStore();
    renderWithProvider(<HolidayManager />, store);

    expect(screen.getByText("No holidays")).toBeInTheDocument();
  });

  test("displays holidays when they exist", () => {
    const mockHolidays = [
      {
        _id: "1",
        date: "2024-01-01",
        name: "New Year's Day",
        description: "National Holiday",
        isRecurring: true,
      },
    ];

    const store = createTestStore({ holidays: mockHolidays });
    renderWithProvider(<HolidayManager />, store);

    expect(screen.getByText("New Year's Day")).toBeInTheDocument();
  });
});
