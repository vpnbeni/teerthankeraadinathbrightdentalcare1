import React, { useState, useEffect } from "react";
import appointmentService from "../../services/appointments";
import { LoadingSpinner } from "../../shared/components";

const DateSelectionStep = ({ data, onNext, onBack, onDataChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    data.selectedDate ? new Date(data.selectedDate) : null
  );
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnavailableDates();
  }, [currentDate]);

  const fetchUnavailableDates = async () => {
    setLoading(true);
    try {
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      // Use the new available dates endpoint if available, otherwise fallback to checking individual dates
      try {
        const response = await appointmentService.getAvailableDates(
          startDate,
          endDate
        );

        if (response.data.success && response.data.data) {
          // Extract dates that are not available (holidays, non-working days, or fully booked)
          const allDatesInMonth = [];
          for (let day = 1; day <= getDaysInMonth(currentDate); day++) {
            const date = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day
            );
            allDatesInMonth.push(date.toDateString());
          }

          const availableDates = response.data.data.map((dateStr) =>
            new Date(dateStr).toDateString()
          );

          const unavailable = allDatesInMonth.filter(
            (dateStr) => !availableDates.includes(dateStr)
          );

          setUnavailableDates(unavailable);
        }
      } catch (availableDatesError) {
        // Fallback to checking individual slots if available-dates endpoint fails
        console.warn(
          "Available dates endpoint failed, falling back to individual slot checking:",
          availableDatesError
        );

        const unavailable = [];
        const daysInMonth = getDaysInMonth(currentDate);

        // Check each day in the month
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          );

          try {
            const response = await appointmentService.getAvailableSlots(date);
            if (response.data.success) {
              const slots = response.data.data.availableSlots || [];
              const metadata = response.data.data.metadata || {};

              // Mark as unavailable if:
              // - No available slots
              // - It's a holiday
              // - It's not a working day
              if (
                slots.length === 0 ||
                metadata.isHoliday ||
                !metadata.isWorkingDay
              ) {
                unavailable.push(date.toDateString());
              }
            }
          } catch (slotError) {
            // If we can't fetch slots for a date, mark it as unavailable
            unavailable.push(date.toDateString());
          }
        }

        setUnavailableDates(unavailable);
      }
    } catch (error) {
      console.error("Failed to fetch available dates:", error);
      setUnavailableDates([]); // Show all dates as available if we can't determine availability
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable past dates
    if (date < today) return true;

    // Disable dates more than 90 days in advance
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    if (date > maxDate) return true;

    // Disable unavailable dates
    if (unavailableDates.includes(date.toDateString())) return true;

    // Disable Sundays (assuming clinic is closed on Sundays)
    if (date.getDay() === 0) return true;

    return false;
  };

  const handleDateSelect = (date) => {
    if (isDateDisabled(date)) return;
    setSelectedDate(date);
  };

  const handleNext = () => {
    if (!selectedDate) return;
    onDataChange({ selectedDate: selectedDate.toISOString() });
    onNext();
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const isDisabled = isDateDisabled(date);
      const isSelected =
        selectedDate && date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(date)}
          disabled={isDisabled}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
            isSelected
              ? "bg-[#346870] text-white"
              : isToday
              ? "bg-blue-100 text-blue-600"
              : isDisabled
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Select Appointment Date
        </h3>
        <p className="text-gray-600">
          Choose a date for your dental appointment
        </p>
      </div>

      {/* Calendar */}
      <div className="max-w-md mx-auto">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <h4 className="text-lg font-semibold text-gray-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>

          <button
            type="button"
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="medium" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        )}
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-[#346870] bg-opacity-10 rounded-lg">
            <svg
              className="w-5 h-5 text-[#346870] mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[#346870] font-medium">
              Selected:{" "}
              {selectedDate.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#346870] rounded mr-2"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
            <span>Unavailable</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Appointments must be booked at least 24 hours in advance
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary px-6 py-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedDate}
          className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Time Selection
        </button>
      </div>
    </div>
  );
};

export default DateSelectionStep;
