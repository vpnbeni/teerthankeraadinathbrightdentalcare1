import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import sessionService from "../services/sessions";

// Async thunks
export const fetchSessions = createAsyncThunk(
  "sessions/fetchSessions",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await sessionService.getSessions(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch sessions"
      );
    }
  }
);

export const createSession = createAsyncThunk(
  "sessions/createSession",
  async (sessionData, { rejectWithValue }) => {
    try {
      const response = await sessionService.createSession(sessionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create session"
      );
    }
  }
);

export const updateSession = createAsyncThunk(
  "sessions/updateSession",
  async ({ sessionId, sessionData }, { rejectWithValue }) => {
    try {
      const response = await sessionService.updateSession(
        sessionId,
        sessionData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update session"
      );
    }
  }
);

export const deleteSession = createAsyncThunk(
  "sessions/deleteSession",
  async (sessionId, { rejectWithValue }) => {
    try {
      await sessionService.deleteSession(sessionId);
      return sessionId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete session"
      );
    }
  }
);

const initialState = {
  sessions: [],
  selectedSession: null,
  totalSessions: 0,
  currentPage: 1,
  totalPages: 1,
  loading: false,
  error: null,
  filters: {
    userId: "",
    dateRange: "",
    completedBy: "",
  },
};

const sessionSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        userId: "",
        dateRange: "",
        completedBy: "",
      };
    },
    clearSelectedSession: (state) => {
      state.selectedSession = null;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload.sessions;
        state.totalSessions = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create session
      .addCase(createSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions.unshift(action.payload.session);
        state.totalSessions += 1;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update session
      .addCase(updateSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSession = action.payload.session;
        state.sessions = state.sessions.map((session) =>
          session._id === updatedSession._id ? updatedSession : session
        );
        if (state.selectedSession?._id === updatedSession._id) {
          state.selectedSession = updatedSession;
        }
      })
      .addCase(updateSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete session
      .addCase(deleteSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = state.sessions.filter(
          (session) => session._id !== action.payload
        );
        state.totalSessions -= 1;
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  clearSelectedSession,
  setCurrentPage,
} = sessionSlice.actions;

export default sessionSlice.reducer;
