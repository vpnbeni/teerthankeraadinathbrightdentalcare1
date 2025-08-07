import React, { useState, useEffect, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const DatePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select a date",
  disabled = false,
  className = "",
  label,
  required = false,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value) : null
  );
  const containerRef = useRef(null);

  const months = [
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

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatInputValue = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const isDateDisabled = (date) => {
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    return false;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleDateSelect = (date) => {
    if (isDateDisabled(date)) return;

    setSelectedDate(date);
    onChange(formatInputValue(date));
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const canNavigatePrev = () => {
    if (!minDate) return true;
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(currentMonth.getMonth() - 1);
    const minDateObj = new Date(minDate);
    return (
      prevMonth.getFullYear() > minDateObj.getFullYear() ||
      (prevMonth.getFullYear() === minDateObj.getFullYear() &&
        prevMonth.getMonth() >= minDateObj.getMonth())
    );
  };

  const canNavigateNext = () => {
    if (!maxDate) return true;
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(currentMonth.getMonth() + 1);
    const maxDateObj = new Date(maxDate);
    return (
      nextMonth.getFullYear() < maxDateObj.getFullYear() ||
      (nextMonth.getFullYear() === maxDateObj.getFullYear() &&
        nextMonth.getMonth() <= maxDateObj.getMonth())
    );
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-3 text-left bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-gray-200 hover:border-gray-300"
          } ${isOpen ? "ring-2 ring-primary-500 border-primary-500" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`${
                selectedDate ? "text-gray-900 font-medium" : "text-gray-500"
              }`}
            >
              {selectedDate ? formatDate(selectedDate) : placeholder}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </button>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-4 py-3 border-b border-primary-200">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigateMonth(-1)}
                  disabled={!canNavigatePrev()}
                  className="p-2 hover:bg-white/50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-primary-600" />
                </button>

                <h3 className="text-lg font-bold text-primary-900">
                  {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>

                <button
                  type="button"
                  onClick={() => navigateMonth(1)}
                  disabled={!canNavigateNext()}
                  className="p-2 hover:bg-white/50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5 text-primary-600" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="h-10" />;
                  }

                  const disabled = isDateDisabled(date);
                  const today = isToday(date);
                  const selected = isSelected(date);

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                      disabled={disabled}
                      className={`
                        h-10 w-10 text-sm font-medium rounded-xl transition-all duration-200 relative
                        ${
                          selected
                            ? "bg-primary-600 text-white shadow-lg transform scale-105"
                            : disabled
                            ? "text-gray-300 cursor-not-allowed"
                            : today
                            ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                        ${!disabled && !selected ? "hover:shadow-md" : ""}
                      `}
                    >
                      {date.getDate()}
                      {today && !selected && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    if (!isDateDisabled(today)) {
                      handleDateSelect(today);
                    }
                  }}
                  disabled={isDateDisabled(new Date())}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(null);
                    onChange("");
                    setIsOpen(false);
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};

export default DatePicker;
