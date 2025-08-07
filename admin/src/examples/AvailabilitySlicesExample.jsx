import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAvailabilityTemplate,
  updateAvailabilityTemplate,
  addTemplateSlot,
  removeTemplateSlot,
  optimisticAddSlot,
  toggleSlotActive,
  clearError as clearTemplateError,
} from "../store/availabilityTemplateSlice";
import {
  fetchHolidays,
  addHoliday,
  deleteHoliday,
  optimisticAddHoliday,
  setFilters as setHolidayFilters,
  clearError as clearHolidayError,
} from "../store/holidaySlice";
import {
  fetchCustomDates,
  addCustomDate,
  deleteCustomDate,
  optimisticAddCustomDate,
  setPreviewDate,
  togglePreviewMode,
  clearError as clearCustomDateError,
} from "../store/customDateSlice";

/**
 * Example component demonstrating how to use the new availability Redux slices
 * This is for demonstration purposes and shows the integration patterns
 */
const AvailabilitySlicesExample = () => {
  const dispatch = useDispatch();

  // Template state
  const {
    template,
    loading: templateLoading,
    error: templateError,
  } = useSelector((state) => state.availabilityTemplate);

  // Holiday state
  const {
    holidays,
    loading: holidaysLoading,
    error: holidaysError,
    filters: holidayFilters,
  } = useSelector((state) => state.holidays);

  // Custom dates state
  const {
    customDates,
    loading: customDatesLoading,
    error: customDatesError,
    previewDate,
    isPreviewMode,
  } = useSelector((state) => state.customDates);

  // Load initial data
  useEffect(() => {
    dispatch(fetchAvailabilityTemplate());
    dispatch(fetchHolidays());
    dispatch(fetchCustomDates());
  }, [dispatch]);

  // Template management handlers
  const handleAddTemplateSlot = () => {
    const newSlot = {
      startTime: "19:00",
      endTime: "20:00",
      isActive: true,
      maxBookings: 1,
    };

    // Optimistic update for better UX
    dispatch(optimisticAddSlot(newSlot));

    // Then make the actual API call
    dispatch(addTemplateSlot(newSlot));
  };

  const handleToggleSlot = (slotId) => {
    dispatch(toggleSlotActive(slotId));
    // In a real implementation, you'd also dispatch an update to the server
  };

  const handleUpdateTemplate = () => {
    const updatedTemplate = {
      ...template,
      slotDuration: 30, // Change to 30-minute slots
    };
    dispatch(updateAvailabilityTemplate(updatedTemplate));
  };

  // Holiday management handlers
  const handleAddHoliday = () => {
    const newHoliday = {
      date: "2024-12-25",
      name: "Christmas Day",
      description: "Christmas holiday",
      isRecurring: true,
      isActive: true,
    };

    // Optimistic update
    dispatch(optimisticAddHoliday(newHoliday));

    // API call
    dispatch(addHoliday(newHoliday));
  };

  const handleFilterHolidays = () => {
    dispatch(
      setHolidayFilters({
        year: 2024,
        month: 12, // December
      })
    );
  };

  // Custom date management handlers
  const handleAddCustomDate = () => {
    const newCustomDate = {
      date: "2024-06-15",
      customSlots: [
        {
          startTime: "08:00",
          endTime: "09:00",
          isActive: true,
          maxBookings: 1,
        },
        {
          startTime: "20:00",
          endTime: "21:00",
          isActive: true,
          maxBookings: 1,
        },
      ],
      reason: "Extended hours for special event",
    };

    // Optimistic update
    dispatch(optimisticAddCustomDate(newCustomDate));

    // API call
    dispatch(addCustomDate(newCustomDate));
  };

  const handlePreviewDate = (date) => {
    dispatch(setPreviewDate(date));
    dispatch(togglePreviewMode());
  };

  // Error handling
  const handleClearErrors = () => {
    dispatch(clearTemplateError());
    dispatch(clearHolidayError());
    dispatch(clearCustomDateError());
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        Availability Management Redux Slices Example
      </h1>

      {/* Error Display */}
      {(templateError || holidaysError || customDatesError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">Errors:</h3>
          {templateError && (
            <p className="text-red-700">Template: {templateError}</p>
          )}
          {holidaysError && (
            <p className="text-red-700">Holidays: {holidaysError}</p>
          )}
          {customDatesError && (
            <p className="text-red-700">Custom Dates: {customDatesError}</p>
          )}
          <button
            onClick={handleClearErrors}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Errors
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Template Management</h2>

          {templateLoading ? (
            <div className="text-gray-500">Loading template...</div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Working Days: {template.workingDays.join(", ")}
                </p>
                <p className="text-sm text-gray-600">
                  Slot Duration: {template.slotDuration} minutes
                </p>
                <p className="text-sm text-gray-600">
                  Default Slots: {template.defaultSlots.length}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                {template.defaultSlots.map((slot, index) => (
                  <div
                    key={slot.id || index}
                    className={`flex items-center justify-between p-2 rounded ${
                      slot.isActive ? "bg-green-50" : "bg-gray-50"
                    }`}
                  >
                    <span className="text-sm">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <button
                      onClick={() => handleToggleSlot(slot.id)}
                      className={`px-2 py-1 text-xs rounded ${
                        slot.isActive
                          ? "bg-green-600 text-white"
                          : "bg-gray-400 text-white"
                      }`}
                    >
                      {slot.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleAddTemplateSlot}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Evening Slot (7-8 PM)
                </button>
                <button
                  onClick={handleUpdateTemplate}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Change to 30-min Slots
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Holiday Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Holiday Management</h2>

          {holidaysLoading ? (
            <div className="text-gray-500">Loading holidays...</div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Filter Year: {holidayFilters.year}
                </p>
                <p className="text-sm text-gray-600">
                  Total Holidays: {holidays.length}
                </p>
              </div>

              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {holidays.map((holiday) => (
                  <div
                    key={holiday._id}
                    className="flex items-center justify-between p-2 bg-red-50 rounded"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {holiday.name}
                      </span>
                      <p className="text-xs text-gray-600">
                        {new Date(holiday.date).toLocaleDateString()}
                      </p>
                    </div>
                    {holiday.isRecurring && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Recurring
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleAddHoliday}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Add Christmas Holiday
                </button>
                <button
                  onClick={handleFilterHolidays}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Filter December 2024
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Custom Date Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Custom Date Management</h2>

          {customDatesLoading ? (
            <div className="text-gray-500">Loading custom dates...</div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Custom Dates: {customDates.length}
                </p>
                {previewDate && (
                  <p className="text-sm text-blue-600">
                    Preview: {previewDate}
                  </p>
                )}
                {isPreviewMode && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Preview Mode
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {customDates.map((customDate) => (
                  <div
                    key={customDate._id}
                    className="p-2 bg-yellow-50 rounded"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {new Date(customDate.date).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-600">
                        {customDate.customSlots.length} slots
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {customDate.reason}
                    </p>
                    <button
                      onClick={() => handlePreviewDate(customDate.date)}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Preview
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleAddCustomDate}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Add Extended Hours (June 15)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* State Debug Info */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <h4 className="font-medium">Template Loading States:</h4>
            <p>Loading: {templateLoading.toString()}</p>
            <p>Error: {templateError || "None"}</p>
          </div>
          <div>
            <h4 className="font-medium">Holiday Loading States:</h4>
            <p>Loading: {holidaysLoading.toString()}</p>
            <p>Error: {holidaysError || "None"}</p>
          </div>
          <div>
            <h4 className="font-medium">Custom Date Loading States:</h4>
            <p>Loading: {customDatesLoading.toString()}</p>
            <p>Error: {customDatesError || "None"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySlicesExample;
