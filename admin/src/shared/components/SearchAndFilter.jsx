/**
 * Search and Filter Component
 * Provides comprehensive search and filtering capabilities
 */

import React, { useState, useRef, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { useAccessibility, useResponsive } from "../hooks";
import { AccessibleButton, AccessibleModal } from "./";

const SearchAndFilter = ({
  searchValue = "",
  onSearchChange,
  filters = {},
  onFiltersChange,
  filterOptions = {},
  placeholder = "Search...",
  showFilters = true,
  className = "",
}) => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const { announce, isMobile } = useAccessibility();
  const { isBreakpoint } = useResponsive();

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (onSearchChange && localSearchValue !== searchValue) {
        onSearchChange(localSearchValue);
        if (localSearchValue) {
          announce(`Searching for ${localSearchValue}`);
        }
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localSearchValue, onSearchChange, searchValue, announce]);

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  const handleSearchChange = (e) => {
    setLocalSearchValue(e.target.value);
  };

  const handleSearchClear = () => {
    setLocalSearchValue("");
    if (onSearchChange) {
      onSearchChange("");
    }
    announce("Search cleared");
    searchInputRef.current?.focus();
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filters, [filterKey]: value };
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
    announce(`Filter ${filterKey} set to ${value}`);
  };

  const handleFilterClear = (filterKey) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
    announce(`Filter ${filterKey} cleared`);
  };

  const handleClearAllFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({});
    }
    setLocalSearchValue("");
    if (onSearchChange) {
      onSearchChange("");
    }
    announce("All filters and search cleared");
  };

  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(
      (key) => filters[key] && filters[key] !== ""
    ).length;
  };

  const renderFilterBadges = () => {
    const activeFilters = Object.entries(filters).filter(
      ([key, value]) => value && value !== ""
    );

    if (activeFilters.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {activeFilters.map(([key, value]) => (
          <span
            key={key}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#346870] text-white"
          >
            {key}: {value}
            <button
              onClick={() => handleFilterClear(key)}
              className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 admin-focus"
              aria-label={`Remove ${key} filter`}
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
        {activeFilters.length > 1 && (
          <button
            onClick={handleClearAllFilters}
            className="text-xs text-gray-600 hover:text-gray-800 underline admin-focus"
          >
            Clear all
          </button>
        )}
      </div>
    );
  };

  const renderFilterModal = () => (
    <AccessibleModal
      isOpen={isFilterModalOpen}
      onClose={() => setIsFilterModalOpen(false)}
      title="Filter Options"
      size="md"
    >
      <div className="space-y-4">
        {Object.entries(filterOptions).map(([filterKey, options]) => (
          <div key={filterKey}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
            </label>

            {Array.isArray(options) ? (
              <select
                value={filters[filterKey] || ""}
                onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 admin-focus"
              >
                <option value="">All</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : options.type === "date" ? (
              <input
                type="date"
                value={filters[filterKey] || ""}
                onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 admin-focus"
              />
            ) : options.type === "dateRange" ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  placeholder="Start date"
                  value={filters[`${filterKey}Start`] || ""}
                  onChange={(e) =>
                    handleFilterChange(`${filterKey}Start`, e.target.value)
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 admin-focus"
                />
                <input
                  type="date"
                  placeholder="End date"
                  value={filters[`${filterKey}End`] || ""}
                  onChange={(e) =>
                    handleFilterChange(`${filterKey}End`, e.target.value)
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 admin-focus"
                />
              </div>
            ) : (
              <input
                type="text"
                value={filters[filterKey] || ""}
                onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                placeholder={`Enter ${filterKey}`}
                className="w-full border border-gray-300 rounded-md px-3 py-2 admin-focus"
              />
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <AccessibleButton variant="secondary" onClick={handleClearAllFilters}>
            Clear All
          </AccessibleButton>
          <AccessibleButton
            variant="primary"
            onClick={() => setIsFilterModalOpen(false)}
          >
            Apply Filters
          </AccessibleButton>
        </div>
      </div>
    </AccessibleModal>
  );

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`search-and-filter ${className}`}>
      <div
        className={`flex gap-3 ${
          !isBreakpoint("md") ? "flex-col" : "items-center"
        }`}
      >
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={localSearchValue}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#346870] focus:border-[#346870] admin-focus"
            aria-label="Search"
          />
          {localSearchValue && (
            <button
              onClick={handleSearchClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center admin-focus mobile-tap-target"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        {showFilters && (
          <div className="flex items-center gap-2">
            <AccessibleButton
              variant="secondary"
              onClick={() => setIsFilterModalOpen(true)}
              leftIcon={<FunnelIcon className="h-4 w-4" />}
              className="relative"
              ariaLabel="Open filter options"
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#346870] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </AccessibleButton>

            {/* Quick Filter Toggle (Desktop) */}
            {isBreakpoint("lg") && Object.keys(filterOptions).length > 0 && (
              <AccessibleButton
                variant="ghost"
                leftIcon={<AdjustmentsHorizontalIcon className="h-4 w-4" />}
                ariaLabel="Toggle quick filters"
              >
                Quick
              </AccessibleButton>
            )}
          </div>
        )}
      </div>

      {/* Filter Badges */}
      {renderFilterBadges()}

      {/* Filter Modal */}
      {renderFilterModal()}
    </div>
  );
};

// Specialized search components
export const UserSearch = ({ onSearch, onFilter, ...props }) => {
  const filterOptions = {
    status: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "suspended", label: "Suspended" },
    ],
    subscription: [
      { value: "basic", label: "Basic" },
      { value: "premium", label: "Premium" },
      { value: "none", label: "No Subscription" },
    ],
    registrationDate: { type: "dateRange" },
  };

  return (
    <SearchAndFilter
      placeholder="Search users by name, email, or phone..."
      filterOptions={filterOptions}
      onSearchChange={onSearch}
      onFiltersChange={onFilter}
      {...props}
    />
  );
};

export const AppointmentSearch = ({ onSearch, onFilter, ...props }) => {
  const filterOptions = {
    status: [
      { value: "confirmed", label: "Confirmed" },
      { value: "pending", label: "Pending" },
      { value: "cancelled", label: "Cancelled" },
      { value: "completed", label: "Completed" },
    ],
    date: { type: "dateRange" },
    type: [
      { value: "consultation", label: "Consultation" },
      { value: "treatment", label: "Treatment" },
      { value: "followup", label: "Follow-up" },
    ],
  };

  return (
    <SearchAndFilter
      placeholder="Search appointments by patient name or ID..."
      filterOptions={filterOptions}
      onSearchChange={onSearch}
      onFiltersChange={onFilter}
      {...props}
    />
  );
};

export default SearchAndFilter;
