import React, { useState } from "react";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

const CancellationModal = ({
  isOpen,
  appointment,
  onClose,
  onCancel,
  loading = false,
}) => {
  const [reason, setReason] = useState("");
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [restoreSession, setRestoreSession] = useState(true);
  const [errors, setErrors] = useState({});

  if (!isOpen || !appointment) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!reason.trim()) {
      newErrors.reason = "Cancellation reason is required";
    } else if (reason.trim().length < 5) {
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

    onCancel({
      reason: reason.trim(),
      notifyPatient,
      restoreSession,
    });
  };

  const handleClose = () => {
    if (!loading) {
      setReason("");
      setNotifyPatient(true);
      setRestoreSession(true);
      setErrors({});
      onClose();
    }
  };

  const hasSubscription = appointment.userId?.subscription?.status === "active";
  const canRestoreSession = hasSubscription && appointment.sessionNumber;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 pb-4 pt-6 sm:p-8 sm:pb-4">
              <div className="sm:flex sm:items-start">
                {/* Warning Icon */}
                <div className="mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-red-50 border-2 border-red-100 sm:mx-0 sm:h-12 sm:w-12">
                  <svg
                    className="h-7 w-7 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </div>

                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-2">
                    Cancel Appointment
                  </h3>

                  {/* Appointment Info */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">
                          Patient:
                        </span>
                        <span className="text-gray-900 font-semibold">
                          {appointment.userId?.name || "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Date:</span>
                        <span className="text-gray-900 font-semibold">
                          {new Date(appointment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Time:</span>
                        <span className="text-gray-900 font-semibold">
                          {appointment.timeSlot}
                        </span>
                      </div>
                      {appointment.sessionNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">
                            Session:
                          </span>
                          <span className="text-gray-900 font-semibold">
                            #{appointment.sessionNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cancellation Reason */}
                  <div className="mt-6">
                    <label
                      htmlFor="reason"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Cancellation Reason *
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      rows={3}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        if (errors.reason) {
                          setErrors({ ...errors, reason: null });
                        }
                      }}
                      className={`block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200 ${
                        errors.reason ? "ring-red-300 focus:ring-red-500" : ""
                      }`}
                      placeholder="Please provide a reason for cancelling this appointment..."
                      disabled={loading}
                    />
                    {errors.reason && (
                      <p className="mt-2 text-sm text-red-600 font-medium">
                        {errors.reason}
                      </p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="mt-6 space-y-4">
                    {/* Email Notification */}
                    <div className="flex items-start">
                      <div className="flex h-6 items-center">
                        <input
                          id="notify-patient"
                          name="notify-patient"
                          type="checkbox"
                          checked={notifyPatient}
                          onChange={(e) => setNotifyPatient(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                          disabled={loading}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="notify-patient"
                          className="font-semibold text-gray-700"
                        >
                          Send email notification to patient
                        </label>
                        <p className="text-gray-500 mt-1">
                          Patient will receive an email about the cancellation
                        </p>
                      </div>
                    </div>

                    {/* Session Restoration */}
                    {canRestoreSession && (
                      <div className="flex items-start">
                        <div className="flex h-6 items-center">
                          <input
                            id="restore-session"
                            name="restore-session"
                            type="checkbox"
                            checked={restoreSession}
                            onChange={(e) =>
                              setRestoreSession(e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                            disabled={loading}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="restore-session"
                            className="font-semibold text-gray-700"
                          >
                            Restore session to patient's subscription
                          </label>
                          <p className="text-gray-500 mt-1">
                            Add back the session count to patient's subscription
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warning Message */}
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex">
                      <svg
                        className="h-5 w-5 text-amber-500 flex-shrink-0"
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
                        <p className="text-sm text-amber-800 font-medium">
                          <strong>Warning:</strong> This action cannot be
                          undone. The appointment will be permanently cancelled.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto transition-all duration-200"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Appointment"
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto transition-all duration-200"
              >
                Keep Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CancellationModal;
