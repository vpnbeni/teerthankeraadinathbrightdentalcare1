import React, { useState } from "react";

const UserFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={filters.search || ""}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
        />
      </div>
      {/* Subscription Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subscription Status
        </label>
        <select
          value={filters.status || ""}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Plan Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Plan Type
        </label>
        <select
          value={filters.planType || ""}
          onChange={(e) => handleFilterChange("planType", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
        >
          <option value="">All Plans</option>
          <option value="Standard Plan">Standard Plan</option>
          <option value="Premium Plan">Premium Plan</option>
          <option value="Basic Plan">Basic Plan</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      <div className="flex items-end">
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default UserFilters;
