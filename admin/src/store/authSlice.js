import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../services/auth";
import { validateAdminAuthContext, clearUserTokens } from "../utils/authGuard.js";

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true, // Start with loading true to prevent premature redirects
  error: null,
};

// Async thunk for admin login
export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      console.log(
        "Auth slice: Attempting login with credentials:",
        credentials
      );
      const response = await authService.login(credentials);
      console.log("Auth slice: Login response:", response);

      // Handle the response structure - the login endpoint returns user directly
      const userData = response.data?.user || response.data?.data;
      console.log("Auth slice: extracted login user data:", userData);

      return { user: userData };
    } catch (error) {
      console.error("Auth slice: Login error:", error);
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

// Async thunk for checking auth status
export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        return { user: null, isAuthenticated: false };
      }

      const response = await authService.getCurrentUser();
      console.log("Auth slice: checkAuthStatus response:", response);

      // Handle the nested data structure from the API
      // The API returns user data directly in response.data.data
      const userData = response.data?.data || response.data?.user;
      console.log("Auth slice: extracted user data:", userData);

      // Validate that this user should be using the admin app
      if (userData && !validateAdminAuthContext(userData)) {
        console.warn("Auth slice: Non-admin user detected - clearing session");
        clearUserTokens();
        localStorage.removeItem("adminToken");
        throw new Error("Non-admin users cannot access admin application");
      }

      return { user: userData, isAuthenticated: true };
    } catch (error) {
      console.error("Auth slice: checkAuthStatus error:", error);
      localStorage.removeItem("adminToken");
      return { user: null, isAuthenticated: false };
    }
  }
);

// Async thunk for logout
export const logoutAdmin = createAsyncThunk(
  "auth/logoutAdmin",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return {};
    } catch (error) {
      // Even if logout fails on server, clear local state
      return {};
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // Clear both admin and user tokens
      localStorage.removeItem("adminToken");
      clearUserTokens();
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Check auth status cases
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.isAuthenticated;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Logout cases
      .addCase(logoutAdmin.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.loading = false;
        // Clear both admin and user tokens
        localStorage.removeItem("adminToken");
        clearUserTokens();
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutAdmin.rejected, (state) => {
        state.loading = false;
        // Clear both admin and user tokens even on failure
        localStorage.removeItem("adminToken");
        clearUserTokens();
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
