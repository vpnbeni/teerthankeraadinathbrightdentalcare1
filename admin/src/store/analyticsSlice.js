import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import analyticsService from "../services/analytics";

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  "analytics/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Analytics slice: Fetching dashboard stats...");
      const response = await analyticsService.getDashboardStats();
      console.log("Analytics slice: Dashboard stats response:", response);
      return response.data;
    } catch (error) {
      console.error("Analytics slice: Dashboard stats error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard stats"
      );
    }
  }
);

export const fetchPaymentAnalytics = createAsyncThunk(
  "analytics/fetchPaymentAnalytics",
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log(
        "Analytics slice: Fetching payment analytics with params:",
        params
      );
      const response = await analyticsService.getPaymentAnalytics(params);
      console.log("Analytics slice: Payment analytics response:", response);
      return response.data;
    } catch (error) {
      console.error("Analytics slice: Payment analytics error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payment analytics"
      );
    }
  }
);

export const fetchBookingAnalytics = createAsyncThunk(
  "analytics/fetchBookingAnalytics",
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log(
        "Analytics slice: Fetching booking analytics with params:",
        params
      );
      const response = await analyticsService.getBookingAnalytics(params);
      console.log("Analytics slice: Booking analytics response:", response);
      return response.data;
    } catch (error) {
      console.error("Analytics slice: Booking analytics error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch booking analytics"
      );
    }
  }
);

const initialState = {
  dashboardStats: {
    totalUsers: 0,
    activeSubscriptions: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  },
  paymentAnalytics: {
    monthlyRevenue: [],
    planDistribution: [],
    paymentMethods: [],
  },
  bookingAnalytics: {
    appointmentPatterns: [],
    timeSlotUtilization: [],
    cancellationRates: [],
  },
  loading: {
    dashboard: false,
    payments: false,
    bookings: false,
  },
  error: null,
  dateRange: {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  },
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    clearFilters: (state) => {
      state.dateRange = {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.dashboard = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.dashboard = false;
        // Map the API response structure to what the dashboard expects
        const { overview, growth } = action.payload.data || {};
        state.dashboardStats = {
          totalUsers: overview?.totalUsers || 0,
          activeSubscriptions: overview?.activeSubscriptions || 0,
          totalAppointments: overview?.totalAppointments || 0,
          totalRevenue: overview?.totalRevenue || 0,
          monthlyRevenue: overview?.totalRevenue || 0, // Using totalRevenue as monthlyRevenue
          todayAppointments: overview?.todayAppointments || 0,
          upcomingAppointments: overview?.upcomingAppointments || 0,
          userGrowth: growth?.userGrowth || 0,
          appointmentChange: growth?.appointmentGrowth || 0,
          revenueChange: growth?.revenueGrowth || 0,
        };
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.dashboard = false;
        state.error = action.payload;
      })
      // Payment analytics
      .addCase(fetchPaymentAnalytics.pending, (state) => {
        state.loading.payments = true;
        state.error = null;
      })
      .addCase(fetchPaymentAnalytics.fulfilled, (state, action) => {
        state.loading.payments = false;
        console.log(
          "Analytics slice: Payment analytics payload:",
          action.payload
        );
        // Map the API response structure to what the components expect
        const {
          overview,
          trends,
          revenueByPlan,
          paymentMethodDistribution,
          failedPayments,
        } = action.payload.data || {};
        console.log("Analytics slice: Extracted data:", {
          overview,
          trends,
          revenueByPlan,
          paymentMethodDistribution,
          failedPayments,
        });
        state.paymentAnalytics = {
          overview: overview || {},
          monthlyRevenue: trends || [],
          planDistribution: revenueByPlan || [],
          paymentMethods: paymentMethodDistribution || [],
          failedPayments: failedPayments || {
            count: 0,
            potentialRevenueLoss: 0,
          },
          trends: trends || [],
          revenueByPlan: revenueByPlan || [],
          paymentMethodDistribution: paymentMethodDistribution || [],
        };
        console.log(
          "Analytics slice: Final paymentAnalytics state:",
          state.paymentAnalytics
        );
      })
      .addCase(fetchPaymentAnalytics.rejected, (state, action) => {
        state.loading.payments = false;
        state.error = action.payload;
      })
      // Booking analytics
      .addCase(fetchBookingAnalytics.pending, (state) => {
        state.loading.bookings = true;
        state.error = null;
      })
      .addCase(fetchBookingAnalytics.fulfilled, (state, action) => {
        state.loading.bookings = false;
        console.log(
          "Analytics slice: Booking analytics payload:",
          action.payload
        );
        // Map the API response structure to what the components expect
        const {
          overview,
          statusDistribution,
          dailyTrends,
          timeSlotPopularity,
          rescheduleAnalysis,
        } = action.payload.data || {};
        console.log("Analytics slice: Extracted booking data:", {
          overview,
          statusDistribution,
          dailyTrends,
          timeSlotPopularity,
          rescheduleAnalysis,
        });
        state.bookingAnalytics = {
          overview: overview || {},
          statusDistribution: statusDistribution || [],
          dailyTrends: dailyTrends || [],
          timeSlotPopularity: timeSlotPopularity || [],
          rescheduleAnalysis: rescheduleAnalysis || {},
          // Legacy mappings for backward compatibility
          appointmentPatterns: dailyTrends || [],
          timeSlotUtilization: timeSlotPopularity || [],
          cancellationRates: statusDistribution || [],
        };
        console.log(
          "Analytics slice: Final bookingAnalytics state:",
          state.bookingAnalytics
        );
      })
      .addCase(fetchBookingAnalytics.rejected, (state, action) => {
        state.loading.bookings = false;
        state.error = action.payload;
      });
  },
});

// Add missing actions
export const fetchAnalyticsData = createAsyncThunk(
  "analytics/fetchAnalyticsData",
  async (dateRange, { dispatch, rejectWithValue }) => {
    try {
      // Fetch all analytics data
      const results = await Promise.allSettled([
        dispatch(fetchDashboardStats()),
        dispatch(fetchPaymentAnalytics(dateRange)),
        dispatch(fetchBookingAnalytics(dateRange)),
      ]);

      // Check if any failed
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length > 0) {
        console.warn("Some analytics requests failed:", failed);
      }

      return true;
    } catch (error) {
      return rejectWithValue("Failed to fetch analytics data");
    }
  }
);

export const { clearError, setDateRange, clearFilters } =
  analyticsSlice.actions;
export default analyticsSlice.reducer;
