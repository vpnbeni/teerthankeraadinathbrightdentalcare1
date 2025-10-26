import React from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const UserFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {/* Search */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Search
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all"
          />
        </div>
      </div>

      {/* Subscription Status */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Subscription Status
        </label>
        <select
          value={filters.status || ""}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: "right 0.5rem center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "1.5em 1.5em",
            paddingRight: "2.5rem",
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Plan Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Plan Type
        </label>
        <select
          value={filters.planType || ""}
          onChange={(e) => handleFilterChange("planType", e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: "right 0.5rem center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "1.5em 1.5em",
            paddingRight: "2.5rem",
          }}
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
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#346870]/20"
        >
          <XMarkIcon className="h-5 w-5" />
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default UserFilters;
