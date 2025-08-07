import React, { useState } from "react";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

const BulkActionsModal = ({
  isOpen,
  selectedAppointments,
  onClose,
  onBulkAction,
  loading = false,
}) => {
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");
  const [notifyPatients, setNotifyPatients] = useState(true);
  const [restoreSessions, setRestoreSessions] = useState(true);
  const [errors, setErrors] = useState({});

  if (!isOpen || !selectedAppointments?.length) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!action) {
      newErrors.action = "Please select an action";
    }

    if (action === "cancel" && !reason.trim()) {
      newErrors.reason = "Cancellation reason is required";
    } else if (action === "cancel" && reason.trim().length < 5) {
      newErrors.reason = "Reason must be at least 5 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const actionData = {
      action,
      appointmentIds: selectedAppointments.map((apt) => apt._id),
    };

    if (action === "cancel") {
      actionData.reason = reason.trim();
      actionData.notifyPatients = notifyPatients;
      actionData.restoreSessions = restoreSessions;
    }

    onBulkAction(actionData);
  };

  const handleClose = () => {
    if (!loading) {
      setAction("");
      setReason("");
      setNotifyPatients(true);
      setRestoreSessions(true);
      setErrors({});
      onClose();
    }
  };

  const getActionLabel = () => {
    switch (action) {
      case "cancel":
        return "Cancel";
      case "confirm":
        return "Confirm";
      case "complete":
        return "Mark as Complete";
      default:
        return "Apply";
    }
  };

  const getActionColor = () => {
    switch (action) {
      case "cancel":
        return "bg-red-600 hover:bg-red-500 focus-visible:outline-red-600";
      case "confirm":
        return "bg-green-600 hover:bg-green-500 focus-visible:outline-green-600";
      case "complete":
        return "bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600";
      default:
        return "bg-primary-600 hover:bg-primary-500 focus-visible:outline-primary-600";
    }
  };

  const hasSubscriptionAppointments = selectedAppointments.some(
    (apt) => apt.userId?.subscription?.status === "active" && apt.sessionNumber
  );

  const availableActions = [
    {
      value: "cancel",
      label: "Cancel Appointments",
      description: "Cancel selected appointments",
    },
    {
      value: "confirm",
      label: "Confirm Appointments",
      description: "Confirm scheduled appointments",
    },
    {
      value: "complete",
      label: "Mark as Complete",
      description: "Mark confirmed appointments as completed",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                {/* Icon */}
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3-6h3.75m-3.75 3h3.75m-3.75 3h3.75M5.25 6.75h13.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25V9a2.25 2.25 0 012.25-2.25z"
                    />
                  </svg>
                </div>

                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Bulk Actions
                  </h3>

                  {/* Selected Appointments Info */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      <strong>{selectedAppointments.length}</strong> appointment
                      {selectedAppointments.length !== 1 ? "s" : ""} selected
                    </p>
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {selectedAppointments.slice(0, 5).map((apt, index) => (
                        <p key={apt._id} className="text-xs text-gray-500">
                          • {apt.userId?.name || "Unknown"} -{" "}
                          {new Date(apt.date).toLocaleDateString()} at{" "}
                          {apt.timeSlot}
                        </p>
                      ))}
                      {selectedAppointments.length > 5 && (
                        <p className="text-xs text-gray-500 italic">
                          ... and {selectedAppointments.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Selection */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Action *
                    </label>
                    <div className="mt-2 space-y-2">
                      {availableActions.map((actionOption) => (
                        <div
                          key={actionOption.value}
                          className="flex items-start"
                        >
                          <div className="flex h-5 items-center">
                            <input
                              id={actionOption.value}
                              name="action"
                              type="radio"
                              value={actionOption.value}
                              checked={action === actionOption.value}
                              onChange={(e) => {
                                setAction(e.target.value);
                                if (errors.action) {
                                  setErrors({ ...errors, action: null });
                                }
                              }}
                              className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                              disabled={loading}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor={actionOption.value}
                              className="font-medium text-gray-700"
                            >
                              {actionOption.label}
                            </label>
                            <p className="text-gray-500">
                              {actionOption.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.action && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.action}
                      </p>
                    )}
                  </div>

                  {/* Cancellation Reason (only for cancel action) */}
                  {action === "cancel" && (
                    <div className="mt-4">
                      <label
                        htmlFor="bulk-reason"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Cancellation Reason *
                      </label>
                      <textarea
                        id="bulk-reason"
                        name="bulk-reason"
                        rows={3}
                        value={reason}
                        onChange={(e) => {
                          setReason(e.target.value);
                          if (errors.reason) {
                            setErrors({ ...errors, reason: null });
                          }
                        }}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                          errors.reason
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="Please provide a reason for cancelling these appointments..."
                        disabled={loading}
                      />
                      {errors.reason && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Options for cancellation */}
                  {action === "cancel" && (
                    <div className="mt-4 space-y-3">
                      {/* Email Notification */}
                      <div className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            id="notify-patients"
                            name="notify-patients"
                            type="checkbox"
                            checked={notifyPatients}
                            onChange={(e) =>
                              setNotifyPatients(e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            disabled={loading}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="notify-patients"
                            className="font-medium text-gray-700"
                          >
                            Send email notifications to patients
                          </label>
                          <p className="text-gray-500">
                            Patients will receive emails about the cancellations
                          </p>
                        </div>
                      </div>

                      {/* Session Restoration */}
                      {hasSubscriptionAppointments && (
                        <div className="flex items-start">
                          <div className="flex h-5 items-center">
                            <input
                              id="restore-sessions"
                              name="restore-sessions"
                              type="checkbox"
                              checked={restoreSessions}
                              onChange={(e) =>
                                setRestoreSessions(e.target.checked)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              disabled={loading}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="restore-sessions"
                              className="font-medium text-gray-700"
                            >
                              Restore sessions to patients' subscriptions
                            </label>
                            <p className="text-gray-500">
                              Add back session counts to patients' subscriptions
                              where applicable
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warning Message */}
                  {action && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Warning:</strong> This action will be
                            applied to all {selectedAppointments.length}{" "}
                            selected appointment
                            {selectedAppointments.length !== 1 ? "s" : ""}. This
                            cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={loading || !action}
                className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto ${getActionColor()}`}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  `${getActionLabel()} ${
                    selectedAppointments.length
                  } Appointment${selectedAppointments.length !== 1 ? "s" : ""}`
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsModal;
