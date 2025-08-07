import React, { useState } from "react";

const DateRangeFilter = ({ dateRange, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState(dateRange);

  const presetRanges = [
    {
      label: "Last 7 days",
      getValue: () => ({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      }),
    },
    {
      label: "Last 30 days",
      getValue: () => ({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      }),
    },
    {
      label: "Last 3 months",
      getValue: () => ({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      }),
    },
    {
      label: "This year",
      getValue: () => ({
        startDate: new Date(new Date().getFullYear(), 0, 1)
          .toISOString()
          .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      }),
    },
  ];

  const handleApply = () => {
    onChange(tempDateRange);
    setIsOpen(false);
  };

  const handlePresetSelect = (preset) => {
    const newRange = preset.getValue();
    setTempDateRange(newRange);
    onChange(newRange);
    setIsOpen(false);
  };

  const formatDateRange = (range) => {
    const start = new Date(range.startDate).toLocaleDateString();
    const end = new Date(range.endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <span className="text-gray-600">📅</span>
        <span className="text-sm font-medium text-gray-700">
          {formatDateRange(dateRange)}
        </span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Select Date Range
            </h3>

            {/* Preset Ranges */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Quick Select
              </p>
              {presetRanges.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Range */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3">
                Custom Range
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tempDateRange.startDate}
                    onChange={(e) =>
                      setTempDateRange({
                        ...tempDateRange,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempDateRange.endDate}
                    onChange={(e) =>
                      setTempDateRange({
                        ...tempDateRange,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default DateRangeFilter;
