import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import auditService from "../services/audit.js";

// Async thunks
export const fetchAuditLogs = createAsyncThunk(
  "audit/fetchAuditLogs",
  async (params, { rejectWithValue }) => {
    try {
      const response = await auditService.getAuditLogs(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch audit logs"
      );
    }
  }
);

export const fetchAuditLogStats = createAsyncThunk(
  "audit/fetchAuditLogStats",
  async (params, { rejectWithValue }) => {
    try {
      const response = await auditService.getAuditLogStats(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch audit log statistics"
      );
    }
  }
);

export const fetchResourceAuditLogs = createAsyncThunk(
  "audit/fetchResourceAuditLogs",
  async ({ resource, resourceId, params }, { rejectWithValue }) => {
    try {
      const response = await auditService.getResourceAuditLogs(
        resource,
        resourceId,
        params
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch resource audit logs"
      );
    }
  }
);

export const fetchAdminAuditLogs = createAsyncThunk(
  "audit/fetchAdminAuditLogs",
  async ({ adminId, params }, { rejectWithValue }) => {
    try {
      const response = await auditService.getAdminAuditLogs(adminId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin audit logs"
      );
    }
  }
);

export const exportAuditLogs = createAsyncThunk(
  "audit/exportAuditLogs",
  async (params, { rejectWithValue }) => {
    try {
      const response = await auditService.exportAuditLogs(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to export audit logs"
      );
    }
  }
);

const initialState = {
  // Main audit logs
  logs: [],
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },

  // Statistics
  stats: {
    totalLogs: 0,
    actionStats: [],
    resourceStats: [],
    adminStats: [],
    recentActivity: [],
  },

  // Resource-specific logs
  resourceLogs: [],
  resourcePagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },

  // Admin-specific logs
  adminLogs: [],
  adminInfo: null,
  adminPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },

  // Filters
  filters: {
    startDate: null,
    endDate: null,
    adminId: null,
    action: null,
    resource: null,
    resourceId: null,
  },

  // UI state
  loading: {
    logs: false,
    stats: false,
    resourceLogs: false,
    adminLogs: false,
    export: false,
  },
  error: {
    logs: null,
    stats: null,
    resourceLogs: null,
    adminLogs: null,
    export: null,
  },

  // Filter options
  filterOptions: {
    actions: [],
    resources: [],
  },
};

const auditSlice = createSlice({
  name: "audit",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
    },
    clearError: (state, action) => {
      const errorType = action.payload;
      if (errorType) {
        state.error[errorType] = null;
      } else {
        state.error = initialState.error;
      }
    },
    setFilterOptions: (state, action) => {
      state.filterOptions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch audit logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading.logs = true;
        state.error.logs = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading.logs = false;
        state.logs = action.payload.logs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading.logs = false;
        state.error.logs = action.payload;
      })

      // Fetch audit log stats
      .addCase(fetchAuditLogStats.pending, (state) => {
        state.loading.stats = true;
        state.error.stats = null;
      })
      .addCase(fetchAuditLogStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
      })
      .addCase(fetchAuditLogStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error.stats = action.payload;
      })

      // Fetch resource audit logs
      .addCase(fetchResourceAuditLogs.pending, (state) => {
        state.loading.resourceLogs = true;
        state.error.resourceLogs = null;
      })
      .addCase(fetchResourceAuditLogs.fulfilled, (state, action) => {
        state.loading.resourceLogs = false;
        state.resourceLogs = action.payload.logs;
        state.resourcePagination = action.payload.pagination;
      })
      .addCase(fetchResourceAuditLogs.rejected, (state, action) => {
        state.loading.resourceLogs = false;
        state.error.resourceLogs = action.payload;
      })

      // Fetch admin audit logs
      .addCase(fetchAdminAuditLogs.pending, (state) => {
        state.loading.adminLogs = true;
        state.error.adminLogs = null;
      })
      .addCase(fetchAdminAuditLogs.fulfilled, (state, action) => {
        state.loading.adminLogs = false;
        state.adminLogs = action.payload.logs;
        state.adminInfo = action.payload.adminInfo;
        state.adminPagination = action.payload.pagination;
      })
      .addCase(fetchAdminAuditLogs.rejected, (state, action) => {
        state.loading.adminLogs = false;
        state.error.adminLogs = action.payload;
      })

      // Export audit logs
      .addCase(exportAuditLogs.pending, (state) => {
        state.loading.export = true;
        state.error.export = null;
      })
      .addCase(exportAuditLogs.fulfilled, (state) => {
        state.loading.export = false;
      })
      .addCase(exportAuditLogs.rejected, (state, action) => {
        state.loading.export = false;
        state.error.export = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  clearError,
  setFilterOptions,
} = auditSlice.actions;

export default auditSlice.reducer;
