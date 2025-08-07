import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  fetchAuditLogs,
  fetchAuditLogStats,
  exportAuditLogs,
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  clearError,
  setFilterOptions,
} from "../../store/auditSlice";
import auditService from "../../services/audit";
import { LoadingSpinner } from "../../shared/components";
import { formatDate, formatTime } from "../../shared/utils/formatters";
import toast from "react-hot-toast";
import AuditLogTable from "./AuditLogTable";
import AuditLogFilters from "./AuditLogFilters";
import AuditLogStats from "./AuditLogStats";

const AuditLogViewer = () => {
  const dispatch = useDispatch();
  const { logs, pagination, stats, filters, loading, error, filterOptions } =
    useSelector((state) => state.audit);

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("logs"); // logs, stats

  // Initialize filter options and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const options = await auditService.getFilterOptions();
        dispatch(setFilterOptions(options));

        // Load initial data
        dispatch(fetchAuditLogs(filters));
        dispatch(fetchAuditLogStats(filters));
      } catch (error) {
        toast.error("Failed to initialize audit log viewer");
      }
    };

    initializeData();
  }, [dispatch]);

  // Reload data when filters change
  useEffect(() => {
    dispatch(fetchAuditLogs({ ...filters, page: pagination.page }));
  }, [dispatch, filters, pagination.page]);

  // Handle search with debouncing
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    // In a real implementation, you might want to add search to the backend
    // For now, we'll just filter the current results
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
    dispatch(setPage(1)); // Reset to first page when filters change
  };

  // Handle clear filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchTerm("");
    dispatch(setPage(1));
  };

  // Handle export
  const handleExport = async () => {
    try {
      await dispatch(exportAuditLogs(filters)).unwrap();
      toast.success("Audit logs exported successfully");
    } catch (error) {
      toast.error("Failed to export audit logs");
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    dispatch(setPage(newPage));
  };

  const handleLimitChange = (newLimit) => {
    dispatch(setLimit(newLimit));
    dispatch(setPage(1));
  };

  // Filter logs based on search term (client-side filtering)
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.resource.toLowerCase().includes(searchLower) ||
      log.adminId?.name?.toLowerCase().includes(searchLower) ||
      log.adminId?.email?.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower)
    );
  });

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== null && value !== ""
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and monitor all administrative actions and system events
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] ${
                hasActiveFilters ? "ring-2 ring-[#346870]" : ""
              }`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                  Active
                </span>
              )}
            </button>
            <button
              onClick={handleExport}
              disabled={loading.export}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#346870] hover:bg-[#2a5359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50"
            >
              {loading.export ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : (
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              )}
              Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("logs")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "logs"
                  ? "border-[#346870] text-[#346870]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <DocumentTextIcon className="h-4 w-4 inline mr-2" />
              Audit Logs
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "stats"
                  ? "border-[#346870] text-[#346870]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <CalendarIcon className="h-4 w-4 inline mr-2" />
              Statistics
            </button>
          </nav>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <div className="flex space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <AuditLogFilters
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
          />
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#346870] focus:border-[#346870]"
            placeholder="Search audit logs by action, resource, admin, or description..."
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === "logs" && (
        <div className="bg-white shadow rounded-lg">
          {error.logs && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error.logs}</p>
                </div>
                <button
                  onClick={() => dispatch(clearError("logs"))}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <AuditLogTable
            logs={filteredLogs}
            pagination={pagination}
            loading={loading.logs}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      )}

      {activeTab === "stats" && (
        <div className="bg-white shadow rounded-lg">
          {error.stats && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error.stats}</p>
                </div>
                <button
                  onClick={() => dispatch(clearError("stats"))}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <AuditLogStats
            stats={stats}
            loading={loading.stats}
            onRefresh={() => dispatch(fetchAuditLogStats(filters))}
          />
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
