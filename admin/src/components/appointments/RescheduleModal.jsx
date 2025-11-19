import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import appointmentService from "../../services/appointments";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import DatePicker from "../common/DatePicker";
import { formatDate } from "../../shared/utils/formatters";
import { toast } from "react-hot-toast";

const RescheduleModal = ({ appointment, onClose, onReschedule }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const timeSlots = [
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
  ];

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  // Refresh available slots when modal opens to ensure fresh data
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, []);

  const loadAvailableSlots = async (forceRefresh = false) => {
    setLoadingSlots(true);
    try {
      const response = await appointmentService.getAvailableSlots(
        selectedDate,
        forceRefresh
      );

      // Ensure we're getting the actual data from backend
      console.log("Available slots response:", response?.data);
      const slots = response?.data?.data?.availableSlots;
      setAvailableSlots(Array.isArray(slots) ? slots : []);
    } catch (error) {
      console.error("Failed to load available slots:", error);
      toast.error("Failed to load available time slots");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTimeSlot) {
      toast.error("Please select both date and time slot");
      return;
    }

    setLoading(true);
    try {
      await onReschedule({
        newDate: selectedDate,
        newTimeSlot: selectedTimeSlot,
        reason: reason || "Rescheduled by admin",
      });

      toast.success("Consultation rescheduled successfully");
      onClose(); // Close the modal on success
    } catch (error) {
      console.error("Reschedule error:", error);
      toast.error(error.message || "Failed to reschedule consultancy");
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Avoid timezone conversion by using local date components
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 months ahead
    // Avoid timezone conversion by using local date components
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSlotAvailable = (slot) => {
    return availableSlots.includes(slot);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-3 sm:p-4 text-center sm:items-center">
          {/* Backdrop with elegant blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-4xl"
          >
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60">
              {/* Ambient Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-white to-blue-50/40 pointer-events-none" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
              
              <form onSubmit={handleSubmit} className="relative">
                {/* Premium Header - Mobile Optimized */}
                <div className="relative px-4 sm:px-8 pt-5 sm:pt-8 pb-4 sm:pb-6 border-b border-slate-200/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 sm:gap-4 flex-1">
                      {/* Animated Icon */}
                      <motion.div
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
                        className="relative flex-shrink-0"
                      >
                        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                          <svg
                            className="w-5 h-5 sm:w-7 sm:h-7 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                          </svg>
                        </div>
                        {/* Pulse effect */}
                        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-amber-500/20 animate-ping" />
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <motion.h2
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 mb-1 sm:mb-2 tracking-tight leading-tight"
                        >
                          Reschedule Consultation
                        </motion.h2>
                        <motion.p
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 }}
                          className="text-xs sm:text-sm md:text-base text-slate-600 leading-snug"
                        >
                          Choose a new date and time that works better
                        </motion.p>
                      </div>
                    </div>
                    
                    {/* Close Button */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      disabled={loading}
                      className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Current Appointment Card - Mobile Optimized */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mx-4 sm:mx-8 my-4 sm:my-6 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl sm:rounded-2xl blur-xl" />
                  <div className="relative bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 border border-slate-200/60 shadow-sm">
                    <div className="flex items-start gap-2.5 sm:gap-4">
                      {/* Patient Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <span className="text-white text-base sm:text-xl font-bold">
                            {appointment.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-md sm:rounded-lg flex items-center justify-center shadow-md">
                          <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Consultation Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3 truncate">
                          {appointment.userId?.name || "Unknown Patient"}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 sm:gap-2.5 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-sm">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Current Date</p>
                              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{formatDate(appointment.date)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:gap-2.5 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-sm">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Current Time</p>
                              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{appointment.timeSlot}</p>
                            </div>
                          </div>
                          
                          {appointment.sessionNumber && (
                            <div className="flex items-center gap-2 sm:gap-2.5 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-sm sm:col-span-2">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Session Number</p>
                                <p className="text-xs sm:text-sm font-bold text-slate-900">#{appointment.sessionNumber}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Form Content - Mobile Optimized */}
                <div className="px-4 sm:px-8 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
                  {/* Date Selection - Mobile Optimized */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm sm:text-base font-bold text-slate-900">
                          Select New Date
                          <span className="text-rose-500 ml-1">*</span>
                        </label>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          Available from tomorrow up to 3 months ahead
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <DatePicker
                        value={selectedDate}
                        onChange={(date) => {
                          setSelectedDate(date);
                          setSelectedTimeSlot("");
                        }}
                        minDate={getMinDate()}
                        maxDate={getMaxDate()}
                        placeholder="Click to select a new consultancy date"
                        required
                        className="w-full"
                      />
                    </div>
                  </motion.div>

                  {/* Time Slot Selection - Mobile Optimized */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm sm:text-base font-bold text-slate-900">
                            Select Time Slot
                            <span className="text-rose-500 ml-1">*</span>
                          </label>
                          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
                            Choose your preferred time
                          </p>
                        </div>
                      </div>
                      {selectedDate && (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => loadAvailableSlots(true)}
                          disabled={loadingSlots}
                          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loadingSlots ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="hidden sm:inline">Refresh</span>
                        </motion.button>
                      )}
                    </div>
                    
                    {selectedDate ? (
                      loadingSlots ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl sm:rounded-2xl border border-slate-200/60">
                          <div className="relative">
                            <LoadingSpinner size="sm" className="sm:hidden" />
                            <LoadingSpinner size="md" className="hidden sm:block" />
                            <div className="absolute inset-0 animate-ping">
                              <LoadingSpinner size="sm" className="opacity-20 sm:hidden" />
                              <LoadingSpinner size="md" className="opacity-20 hidden sm:block" />
                            </div>
                          </div>
                          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 font-semibold">Loading available slots...</p>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1">Please wait a moment</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                          {timeSlots.map((slot, index) => {
                            const available = isSlotAvailable(slot);
                            const isSelected = selectedTimeSlot === slot;
                            return (
                              <motion.button
                                key={slot}
                                type="button"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={available ? { scale: 1.05, y: -2 } : {}}
                                whileTap={available ? { scale: 0.95 } : {}}
                                onClick={() => available && setSelectedTimeSlot(slot)}
                                disabled={!available}
                                className={`relative p-2.5 sm:p-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 ${
                                  isSelected
                                    ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/40 border-2 border-violet-400"
                                    : available
                                    ? "bg-white text-slate-700 border-2 border-slate-200 hover:border-violet-300 hover:shadow-md"
                                    : "bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed opacity-50"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                                  <svg className={`w-3 h-3 sm:w-4 sm:h-4 ${isSelected ? 'text-white' : available ? 'text-slate-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  <span className="leading-tight">{slot}</span>
                                </div>
                                {!available && (
                                  <span className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-400 rounded-full" />
                                )}
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center shadow-md"
                                  >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </motion.div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-300">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAwLCAwLCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="relative"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </motion.div>
                        <p className="text-slate-700 font-bold text-base sm:text-lg mb-1 sm:mb-2">Select a Date First</p>
                        <p className="text-slate-500 text-xs sm:text-sm">Choose a date above to view available time slots</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Reason Section - Mobile Optimized */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm sm:text-base font-bold text-slate-900">
                          Reason for Rescheduling
                          <span className="text-slate-400 text-xs sm:text-sm font-normal ml-1 sm:ml-2">(Optional)</span>
                        </label>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
                          Help us understand the context
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Patient requested different time, doctor availability changed, emergency rescheduling..."
                        rows={3}
                        maxLength={500}
                        className="block w-full rounded-lg sm:rounded-xl border-0 py-3 sm:py-4 px-3 sm:px-4 text-slate-900 bg-white shadow-sm ring-2 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 text-xs sm:text-sm leading-5 sm:leading-6 transition-all duration-200 resize-none"
                      />
                      <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-[10px] sm:text-xs text-slate-400 font-medium bg-white/90 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                        {reason.length}/500
                      </div>
                    </div>
                  </motion.div>

                  {/* Info Notice - Mobile Optimized */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl sm:rounded-2xl blur-xl" />
                    <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-blue-200/60">
                      <div className="flex gap-2.5 sm:gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1.5 sm:mb-2">Automatic Notifications</h4>
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-start gap-1.5 sm:gap-2">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">Patient will receive <span className="font-semibold">SMS notification</span> about the reschedule</p>
                            </div>
                            <div className="flex items-start gap-1.5 sm:gap-2">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed"><span className="font-semibold">Email notification</span> will be sent (if available)</p>
                            </div>
                            <div className="flex items-start gap-1.5 sm:gap-2">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">Original consultancy will be <span className="font-semibold">automatically cancelled</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Action Buttons - Mobile Optimized */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="relative px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-slate-50 to-slate-100/50 border-t border-slate-200/60"
                >
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-white text-slate-700 font-semibold text-xs sm:text-sm shadow-sm ring-2 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </motion.button>
                    
                    <motion.button
                      type="submit"
                      whileHover={!loading && selectedDate && selectedTimeSlot ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!loading && selectedDate && selectedTimeSlot ? { scale: 0.98 } : {}}
                      disabled={loading || !selectedDate || !selectedTimeSlot}
                      className="relative inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/40 hover:shadow-xl hover:shadow-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 overflow-hidden group"
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-1.5 sm:mr-2" />
                          <span>Rescheduling...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                          <span>Reschedule Consultation</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default RescheduleModal;
