import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSelectedDate } from "../../store/appointmentSlice";
import { formatDate, formatPhoneNumber } from "../../shared/utils/formatters";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

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
        return "bg-gradient-to-br from-green-100 to-emerald-100 text-green-800 border border-green-200/50";
      case "scheduled":
        return "bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-800 border border-blue-200/50";
      case "completed":
        return "bg-gradient-to-br from-gray-100 to-slate-100 text-gray-800 border border-gray-200/50";
      case "cancelled":
        return "bg-gradient-to-br from-red-100 to-pink-100 text-red-800 border border-red-200/50";
      case "rescheduled":
        return "bg-gradient-to-br from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200/50";
      default:
        return "bg-gradient-to-br from-gray-100 to-slate-100 text-gray-800 border border-gray-200/50";
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
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSpinner size="lg" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 font-medium mt-4"
          >
            Loading calendar...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Calendar Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/60"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/25"
          >
            <CalendarIcon className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <motion.h2
              key={currentMonth.toISOString()}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-gray-900 tracking-tight"
            >
              {currentMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </motion.h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} this month
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateMonth(-1)}
            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200"
          >
            Today
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, x: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateMonth(1)}
            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-700" />
          </motion.button>
        </div>
      </motion.div>

      {/* Premium Calendar Grid */}
      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 gap-px bg-gray-200/60">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-b from-gray-50 to-white p-3 text-center"
            >
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {day}
              </span>
            </motion.div>
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
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                whileHover={{ scale: 1.02, zIndex: 10 }}
                onClick={() => handleDateClick(date)}
                className={`group relative min-h-[110px] p-2 bg-white cursor-pointer transition-all duration-200 ${
                  !isCurrentMonthDay ? "opacity-40" : ""
                } ${
                  isSelected
                    ? "ring-2 ring-green-500 ring-inset"
                    : isHolidayDate
                    ? "bg-red-50/50"
                    : "hover:bg-gray-50/80"
                }`}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-2">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`relative inline-flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                      isTodayDate
                        ? "w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full shadow-lg shadow-green-500/30"
                        : isHolidayDate
                        ? "text-red-600"
                        : isCurrentMonthDay
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {date.getDate()}
                    {isTodayDate && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-green-400 opacity-20"
                      />
                    )}
                  </motion.div>
                  
                  {dayAppointments.length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-bold rounded-full shadow-sm"
                    >
                      <span>{dayAppointments.length}</span>
                    </motion.div>
                  )}
                </div>

                {/* Holiday indicator */}
                {isHolidayDate && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 text-[10px] text-red-600 font-semibold mb-1.5 truncate"
                    title={holidayName}
                  >
                    <SparklesIcon className="w-3 h-3" />
                    <span className="truncate">{holidayName}</span>
                  </motion.div>
                )}

                {/* Appointments for this day */}
                <div className="space-y-1">
                  <AnimatePresence>
                    {dayAppointments.slice(0, 2).map((appointment, aptIndex) => (
                      <motion.div
                        key={appointment._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: aptIndex * 0.05 }}
                        whileHover={{ scale: 1.05, x: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentSelect(appointment);
                        }}
                        className={`relative text-[10px] p-1.5 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden ${getStatusColor(
                          appointment.status
                        )} hover:shadow-md`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative font-semibold truncate flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                          {appointment.timeSlot}
                        </div>
                        <div className="relative truncate opacity-80 mt-0.5">
                          {appointment.userId?.name || "Unknown"}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {dayAppointments.length > 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="text-[10px] text-gray-600 font-semibold text-center py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      +{dayAppointments.length - 2} more
                    </motion.div>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 border-2 border-green-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Premium Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-200/60"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <h3 className="text-sm font-bold text-gray-900">Status Legend</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { color: "bg-blue-100 border-blue-200", text: "Scheduled", icon: "📅" },
            { color: "bg-green-100 border-green-200", text: "Confirmed", icon: "✓" },
            { color: "bg-gray-100 border-gray-200", text: "Completed", icon: "✔" },
            { color: "bg-red-100 border-red-200", text: "Cancelled", icon: "✕" },
            { color: "bg-red-50 border-red-300", text: "Holiday", icon: "🎉" },
            { color: "bg-yellow-100 border-yellow-200", text: "Rescheduled", icon: "↻" },
          ].map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className={`w-4 h-4 ${item.color} border rounded-md flex items-center justify-center text-[8px]`}>
                {item.icon}
              </div>
              <span className="text-xs font-medium text-gray-700">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AppointmentCalendar;
