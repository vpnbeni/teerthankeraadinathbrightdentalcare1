import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { Toaster } from "react-hot-toast";

// Import your actual reducers
import authSlice from "../store/slices/authSlice";
import usersSlice from "../store/slices/usersSlice";
import appointmentsSlice from "../store/slices/appointmentsSlice";
import analyticsSlice from "../store/slices/analyticsSlice";

// Create a custom render function that includes providers
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authSlice,
        users: usersSlice,
        appointments: appointmentsSlice,
        analytics: analyticsSlice,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
          <Toaster />
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Mock admin user data for tests
export const mockAdminUser = {
  _id: "1",
  name: "Admin User",
  phone: "9876543210",
  email: "admin@example.com",
  role: "admin",
};

// Mock patient data
export const mockPatients = [
  {
    _id: "1",
    name: "John Doe",
    phone: "9876543210",
    email: "john@example.com",
    subscription: {
      planId: "1",
      sessionsRemaining: 5,
      totalSessions: 6,
      status: "active",
    },
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    _id: "2",
    name: "Jane Smith",
    phone: "9876543211",
    email: "jane@example.com",
    subscription: {
      planId: "2",
      sessionsRemaining: 7,
      totalSessions: 8,
      status: "active",
    },
    createdAt: "2024-01-02T00:00:00.000Z",
  },
];

// Mock appointment data
export const mockAppointments = [
  {
    _id: "1",
    userId: "1",
    user: { name: "John Doe", phone: "9876543210" },
    date: "2024-01-15T10:00:00.000Z",
    timeSlot: "10:00-11:00",
    status: "scheduled",
    sessionNumber: 1,
  },
  {
    _id: "2",
    userId: "2",
    user: { name: "Jane Smith", phone: "9876543211" },
    date: "2024-01-16T14:00:00.000Z",
    timeSlot: "14:00-15:00",
    status: "confirmed",
    sessionNumber: 2,
  },
];

// Mock analytics data
export const mockAnalytics = {
  totalUsers: 150,
  totalAppointments: 300,
  totalRevenue: 750000,
  completedSessions: 280,
  monthlyStats: {
    newUsers: 25,
    completedAppointments: 45,
    revenue: 112500,
  },
};

// Re-export everything
export * from "@testing-library/react";
