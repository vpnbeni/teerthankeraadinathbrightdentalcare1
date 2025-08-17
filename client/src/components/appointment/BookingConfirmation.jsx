import React, { useState } from "react";
import { LoadingSpinner } from "../../shared/components";

const BookingConfirmation = ({ data, onConfirm, onBack, isLoading }) => {
  const [notes, setNotes] = useState(data.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDate = new Date(data.selectedDate);

  const formatTime = (timeString) => {
    const [start, end] = timeString.split("-");
    const formatSingleTime = (time) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;``
  };

  const handleConfirm = async () => {
    // Prevent double submissions
    if (isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({ ...data, notes });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Confirm Your Appointment
        </h3>
        <p className="text-gray-600">
          Please review your appointment details before confirming
        </p>
      </div>

      {/* Appointment Summary */}
      <div className="card">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
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
          Appointment Details
        </h4>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Date:</span>
            <div className="font-medium">
              {selectedDate.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div>
            <span className="text-gray-600">Time:</span>
            <div className="font-medium">
              {formatTime(data.selectedTimeSlot)}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="card">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Personal Information
        </h4>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Name:</span>
            <div className="font-medium">{data.personalDetails.name}</div>
          </div>

          <div>
            <span className="text-gray-600">Phone:</span>
            <div className="font-medium">{data.personalDetails.phone}</div>
          </div>

          {data.personalDetails.email && (
            <div>
              <span className="text-gray-600">Email:</span>
              <div className="font-medium">{data.personalDetails.email}</div>
            </div>
          )}

          {data.personalDetails.alternativePhone && (
            <div>
              <span className="text-gray-600">Alternative Phone:</span>
              <div className="font-medium">
                {data.personalDetails.alternativePhone}
              </div>
            </div>
          )}
        </div>

        {data.personalDetails.address && (
          <div className="mt-4 text-sm">
            <span className="text-gray-600">Address:</span>
            <div className="font-medium">{data.personalDetails.address}</div>
          </div>
        )}
      </div>

      {/* Medical Information */}
      {(data.medicalInfo.systemicDiseases ||
        data.medicalInfo.drugAllergies ||
        data.medicalInfo.pastTreatments ||
        data.medicalInfo.previousExperiences ||
        data.medicalInfo.isPregnant) && (
        <div className="card">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Medical Information
          </h4>

          <div className="space-y-3 text-sm">
            {data.medicalInfo.systemicDiseases && (
              <div>
                <span className="text-gray-600">Systemic Diseases:</span>
                <div className="font-medium">
                  {data.medicalInfo.systemicDiseases}
                </div>
              </div>
            )}

            {data.medicalInfo.drugAllergies && (
              <div>
                <span className="text-gray-600">Drug Allergies:</span>
                <div className="font-medium">
                  {data.medicalInfo.drugAllergies}
                </div>
              </div>
            )}

            {data.medicalInfo.pastTreatments && (
              <div>
                <span className="text-gray-600">Past Treatments:</span>
                <div className="font-medium">
                  {data.medicalInfo.pastTreatments}
                </div>
              </div>
            )}

            {data.medicalInfo.previousExperiences && (
              <div>
                <span className="text-gray-600">Previous Experiences:</span>
                <div className="font-medium">
                  {data.medicalInfo.previousExperiences}
                </div>
              </div>
            )}

            {data.medicalInfo.isPregnant && (
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-pink-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-pink-600 font-medium">
                  Currently pregnant
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Notes */}
      <div className="card">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Additional Notes (Optional)
        </h4>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="input-field"
          placeholder="Any specific concerns or requests for your appointment..."
          maxLength={500}
        />
        <div className="text-xs text-gray-500 mt-1">
          {notes.length}/500 characters
        </div>
      </div>

      {/* Profile Update Notice */}
      {data.personalDetails.email && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile Update
          </h4>
          <p className="text-sm text-green-700">
            Your verified email address and updated information will be saved to
            your profile and used for future appointment confirmations.
          </p>
        </div>
      )}

      {/* Important Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Important Information
        </h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Please arrive 10 minutes before your appointment time</li>
          <li>• Bring a valid ID and any relevant medical documents</li>
          <li>
            • You can reschedule or cancel up to 24 hours before your
            appointment
          </li>
          <li>• Late arrivals may result in shortened appointment time</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="btn-secondary px-6 py-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading || isSubmitting}
          className="btn-primary px-8 py-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(isLoading || isSubmitting) ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              <span className="ml-2">Booking...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Confirm Appointment
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
