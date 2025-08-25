import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { formatDate } from "../../shared/utils/formatters";
import { updateFollowUpStatus } from "../../store/appointmentSlice";
import { toast } from "react-hot-toast";
import ConfirmDialog from "../../shared/components/ConfirmDialog";

const FollowUpList = ({ followUps = [], appointmentId, onUpdate }) => {
  const dispatch = useDispatch();
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompleteFollowUp = async (followUpId) => {
    setLoading(true);
    try {
      await dispatch(updateFollowUpStatus({
        appointmentId,
        followUpId,
        status: "completed"
      })).unwrap();
      toast.success("Follow-up completed successfully");
      setShowCompleteConfirm(null);
      
      // Notify parent component to refresh data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      toast.error(error || "Failed to complete follow-up");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelFollowUp = async (followUpId, cancellationReason) => {
    setLoading(true);
    try {
      await dispatch(updateFollowUpStatus({
        appointmentId,
        followUpId,
        status: "cancelled",
        additionalData: { cancellationReason }
      })).unwrap();
      toast.success("Follow-up cancelled successfully");
      setShowCancelConfirm(null);
      
      // Notify parent component to refresh data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      toast.error(error || "Failed to cancel follow-up");
    } finally {
      setLoading(false);
    }
  };

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
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  if (!followUps || followUps.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
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
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          No Follow-ups Scheduled
        </h4>
        <p className="text-gray-600">
          Schedule follow-up appointments using the form above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-indigo-600 rounded-lg">
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          Scheduled Follow-ups ({followUps.length})
        </h3>
      </div>

      {followUps.map((followUp, index) => (
        <div
          key={followUp._id || index}
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow">
                    <span className="text-white font-bold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <svg
                      className="w-2.5 h-2.5 text-indigo-600"
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
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Follow-up #{index + 1}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(
                        followUp.status
                      )}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></div>
                      {followUp.status.charAt(0).toUpperCase() +
                        followUp.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-3 h-3 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Date
                    </label>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(followUp.date)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-3 h-3 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Time
                    </label>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {followUp.timeSlot}
                  </p>
                </div>
              </div>

              {followUp.notes && (
                <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-3 h-3 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Notes
                    </label>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {followUp.notes}
                  </p>
                </div>
              )}

              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Scheduled: {formatDate(followUp.createdAt || followUp.scheduledAt)}
                  </span>
                </div>
                {followUp.completedAt && (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-green-600">
                      Completed: {formatDate(followUp.completedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons for future implementation */}
            <div className="flex-shrink-0">
              <div className="flex flex-col gap-1">
                {["scheduled", "confirmed"].includes(followUp.status) && (
                  <button
                    type="button"
                    onClick={() => setShowCompleteConfirm(followUp._id)}
                    disabled={loading}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 border border-emerald-200 rounded hover:bg-emerald-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mark as completed"
                  >
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Complete
                  </button>
                )}
                {["scheduled", "confirmed"].includes(followUp.status) && (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(followUp._id)}
                    disabled={loading}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded hover:bg-red-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cancel follow-up"
                  >
                    <svg
                      className="w-3 h-3 mr-1"
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
            </div>
          </div>
        </div>
      ))}

      {/* Completion Confirmation Dialog */}
      {showCompleteConfirm && (
        <ConfirmDialog
          isOpen={!!showCompleteConfirm}
          onClose={() => setShowCompleteConfirm(null)}
          onConfirm={() => handleCompleteFollowUp(showCompleteConfirm)}
          title="Complete Follow-up"
          message="Are you sure you want to mark this follow-up as completed? This action cannot be undone."
          confirmText="Complete"
          confirmButtonClass="bg-emerald-600 hover:bg-emerald-700 text-white"
          loading={loading}
        />
      )}

      {/* Cancellation Confirmation Dialog */}
      {showCancelConfirm && (
        <ConfirmDialog
          isOpen={!!showCancelConfirm}
          onClose={() => setShowCancelConfirm(null)}
          onConfirm={(reason) => handleCancelFollowUp(showCancelConfirm, reason)}
          title="Cancel Follow-up"
          message="Are you sure you want to cancel this follow-up appointment?"
          confirmText="Cancel Follow-up"
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
          showReasonInput={true}
          reasonLabel="Cancellation Reason"
          reasonPlaceholder="Please provide a reason for cancellation..."
          loading={loading}
        />
      )}
    </div>
  );
};

export default FollowUpList;
