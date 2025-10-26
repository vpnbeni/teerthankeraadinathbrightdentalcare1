import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
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
import { motion, AnimatePresence } from "framer-motion";

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
      bgColor = "bg-indigo-100";
      textColor = "text-indigo-900";
    }

    return (
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative p-2 h-11 w-11 flex items-center justify-center rounded-xl cursor-pointer
          hover:shadow-md transition-all font-medium ${bgColor} ${textColor}
          ${isSelected ? "ring-2 ring-indigo-500 shadow-lg" : ""}
        `}
        onClick={() => handleDateSelect(date)}
      >
        {format(date, "d")}
        {indicator}
      </motion.div>
    );
  };

  // Show error state
  if (calendarError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load calendar data</h3>
            <p className="text-red-700 text-sm">
              {calendarError.message ||
                "An error occurred while loading the calendar"}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all"
            >
              Retry
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200/50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <CalendarIcon className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Legend</h3>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Default Template</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Custom Template</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 border border-indigo-200 rounded-lg shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">Selected</span>
          </div>
        </div>
      </motion.div>

      {/* Template Application Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="px-6 py-5 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ClockIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Apply Template to Dates
              </h3>
              <p className="text-sm text-gray-600">Select dates and apply a custom template</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyTemplate}
                disabled={
                  selectedDates.length === 0 ||
                  !selectedTemplate ||
                  applyTemplateMutation.isPending
                }
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {applyTemplateMutation.isPending
                  ? "Applying..."
                  : `Apply to ${selectedDates.length} date(s)`}
              </motion.button>
            </div>

            {selectedDates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-wrap gap-2 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100"
              >
                <span className="text-sm font-medium text-indigo-900">Selected dates:</span>
                {selectedDates.map((date, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700"
                  >
                    {format(date, "MMM dd")}
                  </span>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="px-6 py-5 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(currentDate, "MMMM yyyy")}
                </h3>
                {calendarFetching && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePreviousMonth}
                disabled={calendarLoading}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextMonth}
                disabled={calendarLoading}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </motion.button>
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
      </motion.div>

      {showApplyModal &&
        createPortal(
          <div className="fixed inset-0 z-[1000] bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="relative w-full max-w-md p-6 md:p-8 border border-gray-200 shadow-2xl rounded-3xl bg-white">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                      <ClockIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Apply Template
                      </h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Confirm template application
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowApplyModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <p className="text-sm font-semibold text-indigo-900 mb-1">Template:</p>
                    <p className="text-sm text-indigo-700">
                      {templates.find((t) => t._id === selectedTemplate)?.templateName}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                    <p className="text-sm font-semibold text-purple-900 mb-2">Selected Dates:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDates.map((date, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700"
                        >
                          {format(date, "MMM dd, yyyy")}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold mb-1">Note:</p>
                      <p className="text-amber-700">
                        This will override any existing custom templates for these dates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowApplyModal(false)}
                    disabled={applyTemplateMutation.isPending}
                    className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmApplyTemplate}
                    disabled={applyTemplateMutation.isPending}
                    className="flex-1 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 transition-all"
                  >
                    {applyTemplateMutation.isPending ? "Applying..." : "Apply Template"}
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
