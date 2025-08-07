import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userService from "../services/users";

// Async thunks
export const fetchRecentUsers = createAsyncThunk(
  "users/fetchRecentUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await userService.getRecentUsers(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  users: [],
  recentUsers: [],
  selectedUser: null,
  totalUsers: 0,
  currentPage: 1,
  totalPages: 1,
  loading: false,
  error: null,
  filters: {
    search: "",
    status: "",
    planType: "",
  },
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setTotalUsers: (state, action) => {
      state.totalUsers = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setTotalPages: (state, action) => {
      state.totalPages = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: "",
        status: "",
        planType: "",
      };
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    updateUserInList: (state, action) => {
      const updatedUser = action.payload;
      state.users = state.users.map((user) =>
        user._id === updatedUser._id ? updatedUser : user
      );
      if (state.selectedUser?._id === updatedUser._id) {
        state.selectedUser = updatedUser;
      }
    },
    removeUserFromList: (state, action) => {
      const userId = action.payload;
      state.users = state.users.filter((user) => user._id !== userId);
      state.totalUsers = Math.max(0, state.totalUsers - 1);
      if (state.selectedUser?._id === userId) {
        state.selectedUser = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRecentUsers
      .addCase(fetchRecentUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.recentUsers = action.payload.users || action.payload;
        state.error = null;
      })
      .addCase(fetchRecentUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setUsers,
  setLoading,
  setError,
  clearError,
  setTotalUsers,
  setCurrentPage,
  setTotalPages,
  setFilters,
  clearFilters,
  setSelectedUser,
  clearSelectedUser,
  updateUserInList,
  removeUserFromList,
} = userSlice.actions;

export default userSlice.reducer;
