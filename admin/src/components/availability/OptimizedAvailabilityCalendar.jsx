import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { toast } from "react-hot-toast";
import {
  useCalendarAvailability,
  useApplyTemplateToDate,
} from "../../hooks/useAvailability";

const OptimizedAvailabilityCalendar = ({ templates = [], holidays = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Use React Query for calendar data with optimized caching
  const {
    data: availabilityResponse,
    isLoading: calendarLoading,
    error: calendarError,
    isFetching: calendarFetching,
  } = useCalendarAvailability(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  // Mutation for applying templates
  const applyTemplateMutation = useApplyTemplateToDate();

  // Extract availability data
  const availabilityData = availabilityResponse?.data || {};

  // Memoized calendar days calculation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Memoized date info calculation
  const getDateInfo = useMemo(() => {
    return (date) => {
      const dateKey = date.toISOString().split("T")[0];
      const availability = availabilityData[dateKey];
      const holiday = holidays.find((h) => isSameDay(new Date(h.date), date));

      return {
        availability,
        holiday,
        isSelected: selectedDates.some(
          (d) => d.toISOString().split("T")[0] === dateKey
        ),
      };
    };
  }, [availabilityData, holidays, selectedDates]);

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDates([]); // Clear selections when changing months
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDates([]); // Clear selections when changing months
  };

  const handleDateSelect = (date) => {
    if (!date) return;

    const dateKey = date.toISOString().split("T")[0];
    setSelectedDates((prev) => {
      const isSelected = prev.some(
        (d) => d.toISOString().split("T")[0] === dateKey
      );
      if (isSelected) {
        return prev.filter((d) => d.toISOString().split("T")[0] !== dateKey);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleApplyTemplate = () => {
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    setShowApplyModal(true);
  };

  const confirmApplyTemplate = async () => {
    try {
      const dates = selectedDates.map(
        (date) => date.toISOString().split("T")[0]
      );
      await applyTemplateMutation.mutateAsync({
        templateId: selectedTemplate,
        dates,
      });

      setShowApplyModal(false);
      setSelectedDates([]);
      setSelectedTemplate("");
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const renderDateCell = (date) => {
    const { availability, holiday, isSelected } = getDateInfo(date);

    let bgColor = "bg-white";
    let textColor = "text-gray-900";
    let indicator = null;

    if (holiday) {
      bgColor = "bg-red-50";
      textColor = "text-red-700";
      indicator = (
        <div className="w-2 h-2 bg-red-500 rounded-full absolute top-1 right-1"></div>
      );
    } else if (availability) {
      if (availability.available) {
        if (availability.template?.isDefault) {
          bgColor = "bg-green-50";
          textColor = "text-green-700";
          indicator = (
            <div className="w-2 h-2 bg-green-500 rounded-full absolute top-1 right-1"></div>
          );
        } else {
          bgColor = "bg-blue-50";
          textColor = "text-blue-700";
          indicator = (
            <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-1 right-1"></div>
          );
        }
      } else {
        bgColor = "bg-gray-50";
        textColor = "text-gray-500";
      }
    }

    if (isSelected) {
      bgColor = "bg-purple-100";
      textColor = "text-purple-900";
    }

    return (
      <div
        className={`
          relative p-2 h-10 w-10 flex items-center justify-center rounded cursor-pointer
          hover:bg-gray-100 transition-colors ${bgColor} ${textColor}
          ${isSelected ? "ring-2 ring-purple-500" : ""}
        `}
        onClick={() => handleDateSelect(date)}
      >
        {format(date, "d")}
        {indicator}
      </div>
    );
  };

  // Show error state
  if (calendarError) {
    return (
      <div className="space-y-6">
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-center gap-2 text-red-800">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="font-medium">Failed to load calendar data</span>
          </div>
          <p className="text-red-600 text-sm mt-2">
            {calendarError.message ||
              "An error occurred while loading the calendar"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Legend</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm">Default Template</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span className="text-sm">Custom Template</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <span className="text-sm">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
              <span className="text-sm">Selected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Template Application Controls */}
      <div className="border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Apply Template to Dates
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select template to apply</option>
                  {templates
                    .filter((t) => !t.isDefault)
                    .map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.templateName}
                      </option>
                    ))}
                </select>
              </div>
              <button
                onClick={handleApplyTemplate}
                disabled={
                  selectedDates.length === 0 ||
                  !selectedTemplate ||
                  applyTemplateMutation.isPending
                }
                className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {applyTemplateMutation.isPending
                  ? "Applying..."
                  : `Apply to ${selectedDates.length} date(s)`}
              </button>
            </div>

            {selectedDates.length > 0 && (
              <div className="text-sm text-gray-600">
                Selected dates:{" "}
                {selectedDates.map((date) => format(date, "MMM dd")).join(", ")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentDate, "MMMM yyyy")}
              {calendarFetching && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
              )}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousMonth}
                disabled={calendarLoading}
                className="p-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                disabled={calendarLoading}
                className="p-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {calendarLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const isCurrentMonth =
                    date.getMonth() === currentDate.getMonth();
                  return (
                    <div
                      key={index}
                      className={`${isCurrentMonth ? "" : "opacity-50"}`}
                    >
                      {renderDateCell(date)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Application Confirmation Modal */}
      {showApplyModal &&
        createPortal(
          <div className="fixed inset-0 z-[1000] bg-gray-600/50 overflow-y-auto">
            <div className="min-h-full flex items-start justify-center p-4">
              <div className="relative mt-20 w-full max-w-md p-5 border shadow-lg rounded-md bg-white">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Apply Template to Dates
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Are you sure you want to apply the selected template to{" "}
                    {selectedDates.length} date(s)?
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Template:</p>
                    <p className="text-sm text-gray-600">
                      {
                        templates.find((t) => t._id === selectedTemplate)
                          ?.templateName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Selected Dates:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedDates.map((date, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {format(date, "MMM dd, yyyy")}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Note:</p>
                      <p>
                        This will override any existing custom templates for
                        these dates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowApplyModal(false)}
                    disabled={applyTemplateMutation.isPending}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmApplyTemplate}
                    disabled={applyTemplateMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {applyTemplateMutation.isPending
                      ? "Applying..."
                      : "Apply Template"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default OptimizedAvailabilityCalendar;
