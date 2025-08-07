import React, { useState, useEffect } from "react";
import { CalendarIcon, UserIcon, CogIcon } from "@heroicons/react/24/outline";

const AuditLogFilters = ({ filters, filterOptions, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...localFilters,
      [key]: value === "" ? null : value,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Format date for input
  const formatDateForInput = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Date Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <CalendarIcon className="h-4 w-4 inline mr-1" />
          Start Date
        </label>
        <input
          type="date"
          value={formatDateForInput(localFilters.startDate)}
          onChange={(e) => handleFilterChange("startDate", e.target.value)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#346870] focus:border-[#346870] sm:text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <CalendarIcon className="h-4 w-4 inline mr-1" />
          End Date
        </label>
        <input
          type="date"
          value={formatDateForInput(localFilters.endDate)}
          onChange={(e) => handleFilterChange("endDate", e.target.value)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#346870] focus:border-[#346870] sm:text-sm"
        />
      </div>

      {/* Action Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <CogIcon className="h-4 w-4 inline mr-1" />
          Action
        </label>
        <select
          value={localFilters.action || ""}
          onChange={(e) => handleFilterChange("action", e.target.value)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#346870] focus:border-[#346870] sm:text-sm"
        >
          <option value="">All Actions</option>
          {filterOptions.actions.map((action) => (
            <option key={action} value={action}>
              {action.replace(/_/g, " ").toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Resource Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <UserIcon className="h-4 w-4 inline mr-1" />
          Resource
        </label>
        <select
          value={localFilters.resource || ""}
          onChange={(e) => handleFilterChange("resource", e.target.value)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#346870] focus:border-[#346870] sm:text-sm"
        >
          <option value="">All Resources</option>
          {filterOptions.resources.map((resource) => (
            <option key={resource} value={resource}>
              {resource.charAt(0).toUpperCase() + resource.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Admin ID Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <UserIcon className="h-4 w-4 inline mr-1" />
          Admin User ID
        </label>
        <input
          type="text"
          value={localFilters.adminId || ""}
          onChange={(e) => handleFilterChange("adminId", e.target.value)}
          placeholder="Enter admin user ID"
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#346870] focus:border-[#346870] sm:text-sm"
        />
      </div>

      {/* Resource ID Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <CogIcon className="h-4 w-4 inline mr-1" />
          Resource ID
        </label>
        <input
          type="text"
          value={localFilters.resourceId || ""}
          onChange={(e) => handleFilterChange("resourceId", e.target.value)}
          placeholder="Enter resource ID"
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#346870] focus:border-[#346870] sm:text-sm"
        />
      </div>

      {/* Quick Date Filters */}
      <div className="space-y-2 md:col-span-2 lg:col-span-3">
        <label className="block text-sm font-medium text-gray-700">
          Quick Date Filters
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const today = new Date();
              handleFilterChange(
                "startDate",
                today.toISOString().split("T")[0]
              );
              handleFilterChange("endDate", today.toISOString().split("T")[0]);
            }}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Today
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              handleFilterChange(
                "startDate",
                yesterday.toISOString().split("T")[0]
              );
              handleFilterChange(
                "endDate",
                yesterday.toISOString().split("T")[0]
              );
            }}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Yesterday
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const lastWeek = new Date(today);
              lastWeek.setDate(lastWeek.getDate() - 7);
              handleFilterChange(
                "startDate",
                lastWeek.toISOString().split("T")[0]
              );
              handleFilterChange("endDate", today.toISOString().split("T")[0]);
            }}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const lastMonth = new Date(today);
              lastMonth.setDate(lastMonth.getDate() - 30);
              handleFilterChange(
                "startDate",
                lastMonth.toISOString().split("T")[0]
              );
              handleFilterChange("endDate", today.toISOString().split("T")[0]);
            }}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const firstDayOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
              );
              handleFilterChange(
                "startDate",
                firstDayOfMonth.toISOString().split("T")[0]
              );
              handleFilterChange("endDate", today.toISOString().split("T")[0]);
            }}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            This Month
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogFilters;
