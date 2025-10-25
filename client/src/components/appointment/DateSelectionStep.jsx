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
          className={`group relative h-12 w-12 rounded-2xl text-sm font-bold transition-all duration-300 ${bgColor} ${textColor} ${hoverColor} ${
            isDisabled ? "cursor-not-allowed opacity-50" : "hover:scale-110 hover:shadow-lg"
          } ${isSelected ? "scale-110 shadow-xl ring-2 ring-[#346870]/30" : ""}`}
        >
          <span className="relative z-10">{day}</span>
          {indicator}
          {isSelected && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-2xl blur-md opacity-50"></div>
          )}
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
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {/* Premium Header */}
        {/* <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Select Appointment Date</h3>
              <p className="text-gray-600 text-xs md:text-sm">Choose your preferred date from available slots</p>
            </div>
          </div>
        </div> */}

        {/* Premium Calendar Container */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 md:p-6 shadow-lg">
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-100/20 to-pink-100/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative max-w-md mx-auto ">
          {/* Calendar Header with Premium Styling */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="group w-10 h-10 bg-white/80 hover:bg-gradient-to-br hover:from-[#346870] hover:to-[#5fa8b5] border border-gray-200 hover:border-transparent rounded-xl flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <h4 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                {monthNames[currentDate.getMonth()]}
              </h4>
              <p className="text-sm text-gray-600 font-medium">{currentDate.getFullYear()}</p>
            </div>

            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="group w-10 h-10 bg-white/80 hover:bg-gradient-to-br hover:from-[#346870] hover:to-[#5fa8b5] border border-gray-200 hover:border-transparent rounded-xl flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names with Premium Styling */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {dayNames.map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center text-xs font-bold text-gray-600 uppercase tracking-wider"
              >
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Calendar Grid with Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoadingSpinner size="medium" />
              <p className="text-sm text-gray-600 font-medium">Loading available dates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
          )}
        </div>
      </div>

        {/* Premium Selected Date Display */}
        {selectedDate && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#346870]/10 via-[#4a8a95]/10 to-[#5fa8b5]/10 backdrop-blur-sm border border-[#346870]/30 rounded-2xl p-5 shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#5fa8b5]/20 to-[#346870]/20 rounded-full blur-2xl -mr-12 -mt-12"></div>
          <div className="relative flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-2xl flex items-center justify-center shadow-xl shadow-[#346870]/30">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#346870] uppercase tracking-wider mb-1">Selected Date</p>
              <p className="text-base md:text-lg font-bold text-gray-900">
                {selectedDate.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {(() => {
                const availability = getDateAvailability(selectedDate);
                if (availability?.template) {
                  return (
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 rounded-lg font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {availability.template.workingHours.start}-{availability.template.workingHours.end}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 rounded-lg font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {availability.totalSlots} slots
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
        )}

        {/* Premium Legend */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 md:p-5 shadow-md">
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-lg shadow-md"></div>
              <span className="font-medium text-gray-700">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-300 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              </div>
              <span className="font-medium text-gray-700">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-50 border-2 border-green-300 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <span className="font-medium text-gray-700">Regular</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-50 border-2 border-blue-300 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span className="font-medium text-gray-700">Extended</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-50 border-2 border-red-300 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <span className="font-medium text-gray-700">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-lg"></div>
              <span className="font-medium text-gray-700">Unavailable</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed pt-2 border-t border-gray-200">
            Color indicators show different availability templates with varying clinic hours
          </p>
        </div>
      </div>

        {/* Premium Action Buttons */}
        <div className="flex justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 px-6 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-2xl hover:border-gray-300 hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedDate}
          className="group inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-[#346870] via-[#4a8a95] to-[#5fa8b5] text-white text-sm font-bold rounded-2xl hover:shadow-2xl hover:shadow-[#346870]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:-translate-y-0.5 shadow-xl"
        >
          <span>Continue to Time Selection</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelectionStep;
