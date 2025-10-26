import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  updateAppointment,
  confirmAppointment,
  completeAppointment,
  rescheduleAppointment,
  cancelAppointment,
  adminUpdateAppointment,
} from "../../store/appointmentSlice";
import RescheduleModal from "./RescheduleModal";
import CancellationModal from "./CancellationModal";
import FollowUpBooking from "./FollowUpBooking";
import FollowUpList from "./FollowUpList";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import { formatDate, formatPhoneNumber } from "../../shared/utils/formatters";
import { toast } from "react-hot-toast";

const AppointmentDetails = ({
  appointment: initialAppointment,
  onClose,
  onAppointmentUpdated,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Get the updated appointment from Redux store
  const appointments = useSelector((state) => state.appointments.appointments);
  const currentAppointment =
    appointments.find((apt) => apt._id === initialAppointment?._id) ||
    initialAppointment;

  const [notes, setNotes] = useState(currentAppointment?.notes || "");
  const [newComment, setNewComment] = useState("");
  const [followUps, setFollowUps] = useState(currentAppointment?.followUps || []);

  // Update notes and follow-ups when appointment changes
  useEffect(() => {
    if (currentAppointment?.notes !== notes) {
      setNotes(currentAppointment?.notes || "");
    }
    if (currentAppointment?.followUps !== followUps) {
      setFollowUps(currentAppointment?.followUps || []);
    }
  }, [currentAppointment?.notes, currentAppointment?.followUps]);

  if (!currentAppointment) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "completed":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border border-red-200";
      case "rescheduled":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      if (newStatus === "confirmed") {
        // Use the dedicated confirm endpoint for admin confirmation
        await dispatch(confirmAppointment(currentAppointment._id)).unwrap();
        toast.success("Appointment confirmed successfully");
      } else if (newStatus === "completed") {
        // Use the dedicated complete endpoint for admin completion
        await dispatch(completeAppointment(currentAppointment._id)).unwrap();
        toast.success("Appointment completed successfully");
      } else {
        // Use generic update for other status changes
        await dispatch(
          updateAppointment({
            appointmentId: currentAppointment._id,
            updateData: { status: newStatus },
          })
        ).unwrap();
        toast.success(`Appointment ${newStatus} successfully`);
      }

      // Notify parent component about the update
      if (onAppointmentUpdated) {
        onAppointmentUpdated();
      }
    } catch (error) {
      toast.error(error || `Failed to ${newStatus} appointment`);
    } finally {
      setLoading(false);
    }
  };

  const handleNotesUpdate = async () => {
    setLoading(true);
    try {
      await dispatch(
        adminUpdateAppointment({
          appointmentId: currentAppointment._id,
          updateData: { notes },
        })
      ).unwrap();
      toast.success("Notes updated successfully");

      // Notify parent component about the update
      if (onAppointmentUpdated) {
        onAppointmentUpdated();
      }
    } catch (error) {
      toast.error(error || "Failed to update notes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        adminUpdateAppointment({
          appointmentId: currentAppointment._id,
          updateData: { comment: newComment.trim() },
        })
      ).unwrap();
      toast.success("Comment added successfully");
      setNewComment("");

      // Notify parent component about the update
      if (onAppointmentUpdated) {
        onAppointmentUpdated();
      }
    } catch (error) {
      toast.error(error || "Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (rescheduleData) => {
    setLoading(true);
    try {
      await dispatch(
        rescheduleAppointment({
          appointmentId: currentAppointment._id,
          ...rescheduleData,
        })
      ).unwrap();
      toast.success("Appointment rescheduled successfully");
      setShowRescheduleModal(false);

      // Notify parent component about the update
      if (onAppointmentUpdated) {
        onAppointmentUpdated();
      }
    } catch (error) {
      toast.error(error || "Failed to reschedule appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (cancellationData) => {
    setLoading(true);
    try {
      await dispatch(
        cancelAppointment({
          appointmentId: currentAppointment._id,
          ...cancellationData,
        })
      ).unwrap();
      toast.success("Appointment cancelled successfully");
      setShowCancellationModal(false);

      // Notify parent component about the update
      if (onAppointmentUpdated) {
        onAppointmentUpdated();
      }

      onClose();
    } catch (error) {
      toast.error(error || "Failed to cancel appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpAdded = (newFollowUp) => {
    setFollowUps(prev => [...prev, newFollowUp]);
    
    // Notify parent component about the update
    if (onAppointmentUpdated) {
      onAppointmentUpdated();
    }
  };

  const tabs = [
    { id: "details", label: "Details" },
    { id: "comments", label: "Comments" },
    { id: "notes", label: "Notes" },
    { id: "followups", label: "Follow-ups" },
  ];

  const canReschedule = ["scheduled", "confirmed"].includes(
    currentAppointment.status
  );
  const canCancel = ["scheduled", "confirmed"].includes(
    currentAppointment.status
  );
  const canComplete = ["confirmed"].includes(currentAppointment.status);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200/50"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Premium Header - Matching UserEditor Style */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-8 flex-shrink-0">
          {/* Ambient background effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <span className="text-white font-bold text-lg sm:text-2xl">
                    {currentAppointment.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-7 sm:h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-3xl font-bold text-white truncate">
                  {currentAppointment.userId?.name || "Unknown Patient"}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                  <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold ${getStatusColor(currentAppointment.status)}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></div>
                    {currentAppointment.status.charAt(0).toUpperCase() + currentAppointment.status.slice(1)}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-300 bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium truncate">
                      {formatDate(currentAppointment.date)} • {currentAppointment.timeSlot}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Enhanced Action Buttons - Mobile Optimized */}
        <div className="flex-shrink-0 p-3 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            {currentAppointment.status === "scheduled" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStatusChange("confirmed")}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 text-white font-semibold rounded-lg sm:rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm flex-1 sm:flex-none min-w-0"
                disabled={loading}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="truncate">Confirm</span>
              </motion.button>
            )}
            {canComplete && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStatusChange("completed")}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-purple-600 text-white font-semibold rounded-lg sm:rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm flex-1 sm:flex-none min-w-0"
                disabled={loading}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                <span className="truncate">Complete</span>
              </motion.button>
            )}
            {canReschedule && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowRescheduleModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-amber-600 text-white font-semibold rounded-lg sm:rounded-xl hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm flex-1 sm:flex-none min-w-0"
                disabled={loading}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span className="truncate">Reschedule</span>
              </motion.button>
            )}
            {canCancel && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCancellationModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-red-600 text-white font-semibold rounded-lg sm:rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm flex-1 sm:flex-none min-w-0"
                disabled={loading}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="truncate">Cancel</span>
              </motion.button>
            )}
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-gray-600 mt-3">
              <LoadingSpinner size="sm" />
              <span className="text-xs sm:text-sm font-medium">Processing...</span>
            </div>
          )}
        </div>

        {/* Enhanced Tabs - Mobile Optimized */}
        <div className="flex-shrink-0 px-3 sm:px-6 pt-3 sm:pt-4 pb-2">
          <nav className="flex space-x-1 bg-gray-100 rounded-xl sm:rounded-2xl p-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Enhanced Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-4 sm:pb-6">
          {activeTab === "details" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Appointment Details Cards - Mobile Optimized */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200/50 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg sm:rounded-xl">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-xl font-bold text-gray-900">
                      Appointment Info
                    </h3>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white/70 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <label className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Date & Time
                      </label>
                      <p className="text-sm sm:text-lg font-bold text-gray-900 mt-1">
                        {formatDate(currentAppointment.date)} at {currentAppointment.timeSlot}
                      </p>
                    </div>
                    <div className="bg-white/70 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <label className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Status
                      </label>
                      <p className="text-sm sm:text-lg font-bold text-gray-900 mt-1 capitalize">
                        {currentAppointment.status}
                      </p>
                    </div>
                    {currentAppointment.sessionNumber && (
                      <div className="bg-white/70 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <label className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          Session Number
                        </label>
                        <p className="text-sm sm:text-lg font-bold text-gray-900 mt-1">
                          #{currentAppointment.sessionNumber}
                        </p>
                      </div>
                    )}
                    <div className="bg-white/70 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <label className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Created
                      </label>
                      <p className="text-sm sm:text-lg font-bold text-gray-900 mt-1">
                        {formatDate(currentAppointment.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-200/50 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-1.5 sm:p-2 bg-emerald-600 rounded-lg sm:rounded-xl">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-xl font-bold text-gray-900">
                      Patient Info
                    </h3>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white/70 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <label className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Name
                      </label>
                      <p className="text-sm sm:text-lg font-bold text-gray-900 mt-1">
                        {currentAppointment.userId?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="bg-white/70 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <label className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Phone
                      </label>
                      <p className="text-sm sm:text-lg font-bold text-gray-900 mt-1">
                        {formatPhoneNumber(currentAppointment.userId?.phone)}
                      </p>
                    </div>
                    {currentAppointment.userId?.email && (
                      <div className="bg-white/70 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <label className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          Email
                        </label>
                        <p className="text-sm sm:text-lg font-bold text-gray-900 mt-1 break-all">
                          {currentAppointment.userId.email}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "comments" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Add New Comment - Mobile Optimized */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200/50">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Add New Comment</h4>
                <div className="space-y-3 sm:space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment about this appointment..."
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-blue-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white/70 placeholder-gray-500 text-gray-900 text-sm sm:text-base"
                    maxLength={500}
                  />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {newComment.length}/500 characters
                    </span>
                    <button
                      onClick={handleAddComment}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-lg sm:rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      disabled={loading || !newComment.trim()}
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments List - Mobile Optimized */}
              {currentAppointment.comments && currentAppointment.comments.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {currentAppointment.comments.map((comment, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs sm:text-sm font-bold">
                            {comment.addedBy?.name?.charAt(0)?.toUpperCase() || "A"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {comment.addedBy?.name || "Admin"}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {formatDate(comment.addedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 ml-0 sm:ml-13">
                        <p className="text-gray-900 leading-relaxed text-sm sm:text-base">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                    No Comments Yet
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600">
                    Add the first comment about this appointment.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "notes" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Notes Section - Mobile Optimized */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200/50">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Clinical Notes</h4>
                <div className="space-y-3 sm:space-y-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this appointment, treatment details, patient concerns, or any other relevant information..."
                    rows={6}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white/70 placeholder-gray-500 text-gray-900 text-sm sm:text-base"
                    maxLength={1000}
                  />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {notes.length}/1000 characters
                      {notes.length > 0 && currentAppointment.updatedAt ? (
                        <span className="hidden sm:inline"> • Last updated: {formatDate(currentAppointment.updatedAt)}</span>
                      ) : ""}
                    </span>
                    <button
                      onClick={handleNotesUpdate}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 bg-purple-600 text-white font-semibold rounded-lg sm:rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      disabled={loading || notes === currentAppointment.notes}
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {notes === currentAppointment.notes ? "Notes Saved" : "Update Notes"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes History - Mobile Optimized */}
              {currentAppointment.notes && (
                <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Current Notes</h4>
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                      {currentAppointment.notes || "No notes have been added yet."}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "followups" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Follow-up Booking Form */}
              <FollowUpBooking 
                appointment={currentAppointment}
                onFollowUpAdded={handleFollowUpAdded}
              />
              
              {/* Divider */}
              {followUps.length > 0 && (
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-white text-xs text-gray-500 font-medium">
                      Existing Follow-ups
                    </span>
                  </div>
                </div>
              )}

              {/* Follow-up List */}
              <FollowUpList 
                followUps={followUps} 
                appointmentId={currentAppointment._id} 
                onUpdate={onAppointmentUpdated}
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <RescheduleModal
          appointment={currentAppointment}
          onClose={() => setShowRescheduleModal(false)}
          onReschedule={handleReschedule}
        />
      )}

      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={showCancellationModal}
        appointment={currentAppointment}
        onClose={() => setShowCancellationModal(false)}
        onCancel={handleCancel}
        loading={loading}
      />
    </motion.div>
    </AnimatePresence>
  );
};

export default AppointmentDetails;
