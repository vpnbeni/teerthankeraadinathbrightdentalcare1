import React from "react";

const AppointmentFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value && value !== ""
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Status
          </label>
          <div className="relative">
            <select
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="scheduled">📅 Scheduled</option>
              <option value="confirmed">✅ Confirmed</option>
              <option value="completed">🏁 Completed</option>
              <option value="cancelled">❌ Cancelled</option>
              <option value="rescheduled">🔄 Rescheduled</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Date Range
          </label>
          <div className="relative">
            <select
              value={filters.dateRange || ""}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">All Dates</option>
              <option value="today">🗓️ Today</option>
              <option value="tomorrow">📅 Tomorrow</option>
              <option value="this-week">📊 This Week</option>
              <option value="next-week">⏭️ Next Week</option>
              <option value="this-month">📆 This Month</option>
              <option value="next-month">🗓️ Next Month</option>
              <option value="overdue">⚠️ Overdue</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Time Slot Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Time Slot
          </label>
          <div className="relative">
            <select
              value={filters.timeSlot || ""}
              onChange={(e) => handleFilterChange("timeSlot", e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">All Times</option>
              <option value="morning">🌅 Morning (8 AM - 12 PM)</option>
              <option value="afternoon">☀️ Afternoon (12 PM - 4 PM)</option>
              <option value="evening">🌆 Evening (4 PM - 6 PM)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Actions
          </label>
          <div className="flex flex-col gap-2">
            <button
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className={`px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                hasActiveFilters
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100"
              }`}
            >
              <div className="flex items-center justify-center">
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear Filters
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-600 mr-2">
            Active filters:
          </span>
          {filters.status && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Status: {filters.status}
              <button
                onClick={() => handleFilterChange("status", "")}
                className="ml-2 text-primary-600 hover:text-primary-800"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}
          {filters.dateRange && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Date: {filters.dateRange}
              <button
                onClick={() => handleFilterChange("dateRange", "")}
                className="ml-2 text-primary-600 hover:text-primary-800"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}
          {filters.timeSlot && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Time: {filters.timeSlot}
              <button
                onClick={() => handleFilterChange("timeSlot", "")}
                className="ml-2 text-primary-600 hover:text-primary-800"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentFilters;
