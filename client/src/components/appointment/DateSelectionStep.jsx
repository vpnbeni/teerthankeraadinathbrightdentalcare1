import React, { useState, useEffect } from "react";
import appointmentService from "../../services/appointments";
import availabilityService from "../../services/availability";
import { LoadingSpinner } from "../../shared/components";

const DateSelectionStep = ({ data, onNext, onBack, onDataChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    data.selectedDate ? new Date(data.selectedDate) : null
  );
  const [availabilityData, setAvailabilityData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonthAvailability();
  }, [currentDate]);

  const fetchMonthAvailability = async () => {
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

      // Use the new frontend availability processing for better performance
      const response = await availabilityService.generateAvailabilityForDateRange(
        startDate,
        endDate
      );

      if (response.data.success) {
        setAvailabilityData(response.data.data || {});
      } else {
        console.error("Failed to fetch availability data:", response.data.message);
        setAvailabilityData({});
      }
    } catch (error) {
      console.error("Failed to fetch availability data:", error);
      setAvailabilityData({});
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

  const getDateAvailability = (date) => {
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return availabilityData[dateKey];
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

    // Check availability data
    const availability = getDateAvailability(date);
    if (!availability || !availability.available) return true;

    // If no slots available, disable
    if (!availability.slots || availability.slots.length === 0) return true;

    return false;
  };

  const handleDateSelect = (date) => {
    if (isDateDisabled(date)) return;
    setSelectedDate(date);
  };

  const handleNext = () => {
    if (!selectedDate) return;
    // Store a date-only string to avoid timezone shifts across steps
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    onDataChange({ selectedDate: localDateString });
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
      const availability = getDateAvailability(date);

      // Determine styling based on availability and template
      let bgColor = "bg-white";
      let textColor = "text-gray-700";
      let hoverColor = "hover:bg-gray-100";
      let indicator = null;

      if (isDisabled) {
        bgColor = "bg-gray-50";
        textColor = "text-gray-300";
        hoverColor = "";
      } else if (availability) {
        if (availability.type === "holiday") {
          bgColor = "bg-red-50";
          textColor = "text-red-700";
          hoverColor = "hover:bg-red-100";
          indicator = (
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
          );
        } else if (availability.available) {
          if (availability.template?.isDefault) {
            bgColor = "bg-green-50";
            textColor = "text-green-700";
            hoverColor = "hover:bg-green-100";
            indicator = (
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            );
          } else {
            bgColor = "bg-blue-50";
            textColor = "text-blue-700";
            hoverColor = "hover:bg-blue-100";
            indicator = (
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            );
          }
        }
      }

      if (isSelected) {
        bgColor = "bg-[#346870]";
        textColor = "text-white";
        hoverColor = "hover:bg-[#346870]";
      } else if (isToday) {
        bgColor = isDisabled ? bgColor : "bg-yellow-100";
        textColor = isDisabled ? textColor : "text-yellow-800";
        hoverColor = isDisabled ? hoverColor : "hover:bg-yellow-200";
      }

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(date)}
          disabled={isDisabled}
          className={`relative h-10 w-10 rounded-lg text-sm font-medium transition-colors ${bgColor} ${textColor} ${hoverColor} ${
            isDisabled ? "cursor-not-allowed" : ""
          }`}
        >
          {day}
          {indicator}
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
            <div className="text-left">
              <span className="text-[#346870] font-medium block">
                Selected: {selectedDate.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {(() => {
                const availability = getDateAvailability(selectedDate);
                if (availability?.template) {
                  return (
                    <span className="text-xs text-gray-600">
                      {availability.template.name} • {availability.totalSlots} slots • {availability.template.workingHours.start}-{availability.template.workingHours.end}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="text-center space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#346870] rounded mr-2"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded flex items-center justify-center mr-2">
              <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
            </div>
            <span>Today</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded flex items-center justify-center mr-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            </div>
            <span>Regular Hours</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded flex items-center justify-center mr-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            </div>
            <span>Extended Hours</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded flex items-center justify-center mr-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            </div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
            <span>Unavailable</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Different colored dots indicate different availability templates with varying hours
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
