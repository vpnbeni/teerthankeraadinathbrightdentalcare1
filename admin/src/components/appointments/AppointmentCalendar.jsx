import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSelectedDate } from "../../store/appointmentSlice";
import { formatDate, formatPhoneNumber } from "../../shared/utils/formatters";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

const AppointmentCalendar = ({
  appointments = [],
  onAppointmentSelect,
  onRescheduleAppointment,
  loading = false,
}) => {
  const dispatch = useDispatch();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [availabilitySettings, setAvailabilitySettings] = useState(null);

  useEffect(() => {
    generateCalendarDays();
    fetchAvailabilitySettings();
  }, [currentMonth]);

  const fetchAvailabilitySettings = async () => {
    // Availability service removed - holidays functionality disabled
    console.log("Availability service removed - holidays functionality disabled");
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    setCalendarDays(days);
  };

  const getLocalDateKey = (input) => {
    const d = new Date(input);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getAppointmentsForDate = (date) => {
    const targetKey = getLocalDateKey(date);
    const filteredAppointments = appointments.filter((apt) => {
      // Prefer appointmentDateTime to avoid timezone shifting from UTC midnight dates
      if (apt.appointmentDateTime) {
        return getLocalDateKey(apt.appointmentDateTime) === targetKey;
      }

      // Fallback: if only apt.date exists, parse the YYYY-MM-DD part as a local date
      if (apt.date) {
        if (typeof apt.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(apt.date)) {
          const [yy, mm, dd] = apt.date.slice(0, 10).split("-").map(Number);
          const localDateFromUtcMidnight = new Date(yy, mm - 1, dd);
          return getLocalDateKey(localDateFromUtcMidnight) === targetKey;
        }

        // If it's already a Date or another string, fall back to local key comparison
        return getLocalDateKey(apt.date) === targetKey;
      }

      return false;
    });

    return filteredAppointments;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isHoliday = (date) => {
    if (!holidays || holidays.length === 0) return false;

    const getDateString = (d) => new Date(d).toISOString().split("T")[0];
    const inputDateString = getDateString(date);

    return holidays.some((holiday) => {
      if (!holiday.isActive) return false;

      if (holiday.isRecurring) {
        // For recurring holidays, compare month and day only
        const inputDate = new Date(date);
        const holidayDate = new Date(holiday.date);
        return (
          holidayDate.getUTCMonth() === inputDate.getUTCMonth() &&
          holidayDate.getUTCDate() === inputDate.getUTCDate()
        );
      } else {
        // For non-recurring holidays, compare exact date strings
        const holidayDateString = getDateString(holiday.date);
        return holidayDateString === inputDateString;
      }
    });
  };

  const getHolidayName = (date) => {
    if (!holidays || holidays.length === 0) return null;

    const getDateString = (d) => new Date(d).toISOString().split("T")[0];
    const inputDateString = getDateString(date);

    const holiday = holidays.find((holiday) => {
      if (!holiday.isActive) return false;

      if (holiday.isRecurring) {
        const inputDate = new Date(date);
        const holidayDate = new Date(holiday.date);
        return (
          holidayDate.getUTCMonth() === inputDate.getUTCMonth() &&
          holidayDate.getUTCDate() === inputDate.getUTCDate()
        );
      } else {
        const holidayDateString = getDateString(holiday.date);
        return holidayDateString === inputDateString;
      }
    });

    return holiday ? holiday.name : null;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    dispatch(setSelectedDate(dateStr));
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isSelectedDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    // For now, we'll use a simple approach - could be enhanced with Redux state
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="admin-card">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 text-sm bg-primary-100 text-primary-600 rounded-md hover:bg-primary-200"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500 border-b"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((date, index) => {
          const dayAppointments = getAppointmentsForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isSelected = isSelectedDate(date);
          const isHolidayDate = isHoliday(date);
          const holidayName = getHolidayName(date);

          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`min-h-[100px] p-1 border cursor-pointer hover:bg-gray-50 ${
                isSelected
                  ? "bg-primary-50 border-primary-300"
                  : isHolidayDate
                  ? "bg-red-50 border-red-200"
                  : "border-gray-200"
              } ${!isCurrentMonthDay ? "bg-gray-50 text-gray-400" : ""}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isTodayDate
                    ? "bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    : isHolidayDate
                    ? "text-red-600"
                    : ""
                }`}
              >
                {date.getDate()}
              </div>

              {/* Holiday indicator */}
              {isHolidayDate && (
                <div
                  className="text-xs text-red-600 font-medium mb-1 truncate"
                  title={holidayName}
                >
                  🎉 {holidayName}
                </div>
              )}

              {/* Appointments for this day */}
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <div
                    key={appointment._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentSelect(appointment);
                    }}
                    className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    <div className="font-medium truncate">
                      {appointment.timeSlot}
                    </div>
                    <div className="truncate">
                      {appointment.userId?.name || "Unknown"}
                    </div>
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 rounded"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-100 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 rounded"></div>
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
          <span>Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-100 rounded"></div>
          <span>Rescheduled</span>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;
