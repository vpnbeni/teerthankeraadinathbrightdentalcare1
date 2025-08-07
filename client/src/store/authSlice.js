import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../services/auth";

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await authService.verifyOTP(otpData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "OTP verification failed"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  "auth/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.checkAuth();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Authentication check failed"
      );
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  registrationStep: "details", // 'details', 'otp', 'payment'
  tempUserData: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setRegistrationStep: (state, action) => {
      state.registrationStep = action.payload;
    },
    setTempUserData: (state, action) => {
      state.tempUserData = action.payload;
    },
    clearTempData: (state) => {
      state.tempUserData = null;
      state.registrationStep = "details";
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log("Login successful:", action.payload);
        state.isLoading = false;
        state.isAuthenticated = true;
        // Handle nested response structure
        state.user = action.payload.data?.user || action.payload.user;
        state.token = action.payload.data?.token || action.payload.token;
        state.error = null;
        console.log("User set in Redux store after login:", state.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        console.log("Registration successful, payload:", action.payload);
        console.log("User data from payload:", action.payload.user);
        state.isLoading = false;
        state.registrationStep = "otp";
        state.tempUserData = action.payload.user;
        console.log("tempUserData set to:", state.tempUserData);
        console.log("Phone number in tempUserData:", state.tempUserData?.phone);
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        console.log("OTP verification successful:", action.payload);
        state.isLoading = false;
        state.isAuthenticated = true;
        // Handle nested response structure
        state.user = action.payload.data?.user || action.payload.user;
        state.registrationStep = "payment";
        state.tempUserData = null;
        state.error = null;
        console.log("User set in Redux store after OTP:", state.user);
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.tempUserData = null;
        state.registrationStep = "details";
        state.error = null;
      })
      // Check Auth Status
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        console.log("Auth check successful:", action.payload);
        state.isAuthenticated = true;
        // Fix: The user data is nested in action.payload.data.user, not action.payload.user
        state.user = action.payload.data?.user || action.payload.user;
        state.error = null;
        console.log("User set in Redux store:", state.user);
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        console.log("Auth check failed:", action.payload);
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      });
  },
});

export const {
  clearError,
  setRegistrationStep,
  setTempUserData,
  clearTempData,
} = authSlice.actions;
export default authSlice.reducer;
