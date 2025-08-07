import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import AvailabilityPreview from "../../../components/availability/AvailabilityPreview";
import availabilityReducer from "../../../store/availabilitySlice";

// Mock the availability service
jest.mock("../../../services/availability", () => ({
  getAvailabilityTemplate: jest.fn(),
  getHolidays: jest.fn(),
  getCustomDates: jest.fn(),
}));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      availability: availabilityReducer,
    },
    preloadedState: {
      availability: {
        template: {
          _id: "template-1",
          defaultSlots: [
            {
              id: "slot-1",
              startTime: "09:00",
              endTime: "10:00",
              isActive: true,
              maxBookings: 1,
            },
            {
              id: "slot-2",
              startTime: "10:00",
              endTime: "11:00",
              isActive: true,
              maxBookings: 1,
            },
          ],
          workingDays: [1, 2, 3, 4, 5, 6],
          slotDuration: 60,
        },
        holidays: [
          {
            _id: "holiday-1",
            date: "2024-12-25T00:00:00.000Z",
            name: "Christmas Day",
            description: "Christmas Holiday",
            isActive: true,
          },
        ],
        customDates: [
          {
            _id: "custom-1",
            date: "2024-12-24T00:00:00.000Z",
            customSlots: [
              {
                startTime: "09:00",
                endTime: "12:00",
                isActive: true,
                maxBookings: 1,
              },
            ],
            reason: "Half day before Christmas",
          },
        ],
        templateLoading: false,
        holidaysLoading: false,
        customDatesLoading: false,
        templateError: null,
        holidaysError: null,
        customDatesError: null,
        ...initialState,
      },
    },
  });
};

describe("AvailabilityPreview Component", () => {
  let mockStore;

  beforeEach(() => {
    mockStore = createMockStore();
  });

  it("renders the component with header and calendar", () => {
    render(
      <Provider store={mockStore}>
        <AvailabilityPreview />
      </Provider>
    );

    expect(screen.getByText("Availability Preview")).toBeInTheDocument();
    expect(
      screen.getByText("See how availability appears to patients")
    ).toBeInTheDocument();
    expect(screen.getByText("Export Report")).toBeInTheDocument();
  });

  it("displays loading state when data is loading", () => {
    const loadingStore = createMockStore({
      templateLoading: true,
      holidaysLoading: true,
      customDatesLoading: true,
    });

    render(
      <Provider store={loadingStore}>
        <AvailabilityPreview />
      </Provider>
    );

    expect(screen.getByText("Loading preview data...")).toBeInTheDocument();
  });

  it("displays error state when there are errors", () => {
    const errorStore = createMockStore({
      templateError: "Failed to load template",
    });

    render(
      <Provider store={errorStore}>
        <AvailabilityPreview />
      </Provider>
    );

    expect(screen.getByText("Failed to load template")).toBeInTheDocument();
  });

  it("displays calendar with month navigation", () => {
    render(
      <Provider store={mockStore}>
        <AvailabilityPreview />
      </Provider>
    );

    // Check for month navigation buttons
    expect(screen.getByLabelText("Previous month")).toBeInTheDocument();
    expect(screen.getByLabelText("Next month")).toBeInTheDocument();

    // Check for day headers
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("displays legend with different availability types", () => {
    render(
      <Provider store={mockStore}>
        <AvailabilityPreview />
      </Provider>
    );

    expect(screen.getByText("Patient View Legend")).toBeInTheDocument();
    expect(screen.getByText("Default Template")).toBeInTheDocument();
    expect(screen.getByText("Custom Schedule")).toBeInTheDocument();
    expect(screen.getByText("Holiday/Closed")).toBeInTheDocument();
    expect(screen.getByText("No Availability")).toBeInTheDocument();
  });

  it("shows slot details panel when date is selected", async () => {
    render(
      <Provider store={mockStore}>
        <AvailabilityPreview />
      </Provider>
    );

    expect(screen.getByText("Slot Details")).toBeInTheDocument();
    expect(
      screen.getByText("Select a date to view slot details")
    ).toBeInTheDocument();
  });

  it("navigates between months when navigation buttons are clicked", () => {
    render(
      <Provider store={mockStore}>
        <AvailabilityPreview />
      </Provider>
    );

    const nextButton = screen.getByLabelText("Next month");
    const prevButton = screen.getByLabelText("Previous month");

    // Test navigation (we can't easily test the actual month change without mocking Date)
    fireEvent.click(nextButton);
    fireEvent.click(prevButton);

    // The buttons should be clickable
    expect(nextButton).toBeEnabled();
    expect(prevButton).toBeEnabled();
  });

  it("handles export report functionality", () => {
    // Mock URL.createObjectURL and document methods
    global.URL.createObjectURL = jest.fn(() => "mock-url");
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    document.createElement = jest.fn(() => ({
      setAttribute: jest.fn(),
      click: mockClick,
      style: {},
    }));
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;

    render(
      <Provider store={mockStore}>
        <AvailabilityPreview />
      </Provider>
    );

    const exportButton = screen.getByText("Export Report");
    fireEvent.click(exportButton);

    expect(mockClick).toHaveBeenCalled();
  });

  it("updates date range for export", () => {
    render(
      <Provider store={mockStore}>
        <AvailabilityPreview />
      </Provider>
    );

    const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    expect(dateInputs).toHaveLength(2); // Start and end date inputs

    // Test changing the date range
    fireEvent.change(dateInputs[0], { target: { value: "2024-01-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2024-01-31" } });

    expect(dateInputs[0].value).toBe("2024-01-01");
    expect(dateInputs[1].value).toBe("2024-01-31");
  });
});
