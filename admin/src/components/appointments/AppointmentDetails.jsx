import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateAppointment,
  confirmAppointment,
  completeAppointment,
  rescheduleAppointment,
  cancelAppointment,
} from "../../store/appointmentSlice";
import RescheduleModal from "./RescheduleModal";
import CancellationModal from "./CancellationModal";
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

  // Update notes when appointment changes
  useEffect(() => {
    if (currentAppointment?.notes !== notes) {
      setNotes(currentAppointment?.notes || "");
    }
  }, [currentAppointment?.notes]);

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
        updateAppointment({
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

  const tabs = [
    { id: "details", label: "Details" },
    { id: "history", label: "History" },
    { id: "patient", label: "Patient Info" },
  ];

  const canReschedule = ["scheduled", "confirmed"].includes(
    currentAppointment.status
  );
  const canCancel = ["scheduled", "confirmed"].includes(
    currentAppointment.status
  );
  const canComplete = ["confirmed"].includes(currentAppointment.status);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl animate-scale-in sm:rounded-3xl rounded-2xl">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-primary-50 to-primary-100/50 p-6 sm:p-8 border-b border-primary-200/50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl sm:text-2xl">
                    {currentAppointment.userId?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 truncate">
                  {currentAppointment.userId?.name || "Unknown Patient"}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span
                    className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${getStatusColor(
                      currentAppointment.status
                    )}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                    {currentAppointment.status.charAt(0).toUpperCase() +
                      currentAppointment.status.slice(1)}
                  </span>
                  <div className="flex items-center gap-2 text-gray-700 bg-white/70 px-3 sm:px-4 py-2 rounded-xl">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium text-sm sm:text-base">
                      {formatDate(currentAppointment.date)} at{" "}
                      {currentAppointment.timeSlot}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-3 hover:bg-white/50 rounded-2xl transition-all duration-200 group flex-shrink-0 ml-2"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-gray-900 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200 gap-4 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {currentAppointment.status === "scheduled" && (
              <button
                onClick={() => handleStatusChange("confirmed")}
                className="inline-flex items-center px-4 sm:px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                disabled={loading}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Confirm
              </button>
            )}
            {canComplete && (
              <button
                onClick={() => handleStatusChange("completed")}
                className="inline-flex items-center px-4 sm:px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                disabled={loading}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Mark Complete
              </button>
            )}
            {canReschedule && (
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="inline-flex items-center px-4 sm:px-5 py-2.5 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                disabled={loading}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Reschedule
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setShowCancellationModal(true)}
                className="inline-flex items-center px-4 sm:px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                disabled={loading}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Cancel
              </button>
            )}
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-gray-600">
              <LoadingSpinner size="sm" />
              <span className="text-sm font-medium">Processing...</span>
            </div>
          )}
        </div>

        {/* Enhanced Tabs */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <nav className="flex space-x-1 bg-gray-100 rounded-2xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Enhanced Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[55vh]">
          {activeTab === "details" && (
            <div className="space-y-8">
              {/* Appointment Details Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-600 rounded-xl">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Appointment Information
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/70 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Date & Time
                      </label>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatDate(currentAppointment.date)} at{" "}
                        {currentAppointment.timeSlot}
                      </p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Status
                      </label>
                      <p className="text-lg font-bold text-gray-900 mt-1 capitalize">
                        {currentAppointment.status}
                      </p>
                    </div>
                    {currentAppointment.sessionNumber && (
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          Session Number
                        </label>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          #{currentAppointment.sessionNumber}
                        </p>
                      </div>
                    )}
                    <div className="bg-white/70 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Created
                      </label>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatDate(currentAppointment.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 border border-emerald-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-600 rounded-xl">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Patient Information
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/70 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Name
                      </label>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {currentAppointment.userId?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-4">
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Phone
                      </label>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatPhoneNumber(currentAppointment.userId?.phone)}
                      </p>
                    </div>
                    {currentAppointment.userId?.email && (
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          Email
                        </label>
                        <p className="text-lg font-bold text-gray-900 mt-1 break-all">
                          {currentAppointment.userId.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Notes Section */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-600 rounded-xl">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Notes & Comments
                  </h3>
                </div>
                <div className="space-y-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this appointment, treatment details, patient concerns, or any other relevant information..."
                    rows={5}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white/70 placeholder-gray-500 text-gray-900"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {notes.length > 0
                        ? `${notes.length} characters`
                        : "No notes added yet"}
                    </span>
                    <button
                      onClick={handleNotesUpdate}
                      className="inline-flex items-center px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading || notes === currentAppointment.notes}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {notes === currentAppointment.notes
                        ? "Notes Saved"
                        : "Update Notes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600 rounded-xl">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Appointment History
                </h3>
              </div>
              {currentAppointment.rescheduleHistory?.length > 0 ? (
                <div className="space-y-4">
                  {currentAppointment.rescheduleHistory.map(
                    (history, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                              <p className="font-bold text-gray-900 text-lg">
                                Rescheduled
                              </p>
                            </div>
                            <div className="space-y-2">
                              <div className="bg-white/70 rounded-xl p-3">
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                  Original Date & Time
                                </p>
                                <p className="text-gray-900 font-medium">
                                  {formatDate(history.originalDate)} at{" "}
                                  {history.originalTimeSlot}
                                </p>
                              </div>
                              <div className="bg-white/70 rounded-xl p-3">
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                  Reason
                                </p>
                                <p className="text-gray-900 font-medium">
                                  {history.reason || "No reason provided"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="bg-amber-100 rounded-xl p-3">
                              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                                Rescheduled On
                              </p>
                              <p className="text-sm font-bold text-amber-800">
                                {formatDate(history.rescheduleDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    No Reschedule History
                  </h4>
                  <p className="text-gray-600">
                    This appointment has never been rescheduled.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "patient" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Patient Details
                </h3>
              </div>
              {currentAppointment.userId ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-6 border border-indigo-200/50">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Personal Information
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          Full Name
                        </label>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {currentAppointment.userId.name}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          Phone Number
                        </label>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatPhoneNumber(currentAppointment.userId.phone)}
                        </p>
                      </div>
                      {currentAppointment.userId.email && (
                        <div className="bg-white/70 rounded-xl p-4">
                          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                            Email Address
                          </label>
                          <p className="text-lg font-bold text-gray-900 mt-1 break-all">
                            {currentAppointment.userId.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {currentAppointment.userId.subscription && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border border-green-200/50">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Subscription Details
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white/70 rounded-xl p-4">
                          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                            Status
                          </label>
                          <p className="text-lg font-bold text-gray-900 mt-1 capitalize">
                            {currentAppointment.userId.subscription.status}
                          </p>
                        </div>
                        <div className="bg-white/70 rounded-xl p-4">
                          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                            Sessions Progress
                          </label>
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg font-bold text-gray-900">
                                {
                                  currentAppointment.userId.subscription
                                    .sessionsRemaining
                                }{" "}
                                /{" "}
                                {
                                  currentAppointment.userId.subscription
                                    .totalSessions
                                }
                              </span>
                              <span className="text-sm font-medium text-gray-600">
                                {Math.round(
                                  (currentAppointment.userId.subscription
                                    .sessionsRemaining /
                                    currentAppointment.userId.subscription
                                      .totalSessions) *
                                    100
                                )}
                                % remaining
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                                style={{
                                  width: `${
                                    (currentAppointment.userId.subscription
                                      .sessionsRemaining /
                                      currentAppointment.userId.subscription
                                        .totalSessions) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Patient Information Unavailable
                  </h4>
                  <p className="text-gray-600">
                    Unable to load patient details for this appointment.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default AppointmentDetails;
