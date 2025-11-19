import React, { useState, useEffect } from "react";
import appointmentService from "../../services/appointments";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import DatePicker from "../common/DatePicker";
import { formatDate } from "../../shared/utils/formatters";
import { toast } from "react-hot-toast";

const FollowUpBooking = ({ appointment, onFollowUpAdded }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
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

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const response = await appointmentService.getAvailableSlots(selectedDate);
      console.log("Available slots response:", response.data);
      
      // Handle the API response structure correctly
      if (response.data.success && response.data.data) {
        setAvailableSlots(response.data.data.availableSlots || []);
      } else {
        setAvailableSlots([]);
      }
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
      const response = await appointmentService.addFollowUp(appointment._id, {
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        notes: notes.trim() || undefined,
      });

      if (response.data.success) {
        toast.success("Follow-up consultancy scheduled successfully");
        // Reset form
        setSelectedDate("");
        setSelectedTimeSlot("");
        setNotes("");
        setAvailableSlots([]);
        // Notify parent component
        if (onFollowUpAdded) {
          onFollowUpAdded(response.data.data);
        }
      }
    } catch (error) {
      console.error("Failed to add follow-up:", error);
      toast.error(error.response?.data?.message || "Failed to schedule follow-up");
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
    maxDate.setMonth(maxDate.getMonth() + 3);
    // Avoid timezone conversion by using local date components
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSlotAvailable = (slot) => {
    return availableSlots.includes(slot);
  };

  // Only show follow-up booking for completed appointments
  if (appointment.status !== "completed") {
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
          Follow-ups Not Available
        </h4>
        <p className="text-gray-600">
          Follow-up consultations can only be scheduled for completed consultations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-600 rounded-xl">
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
        <h3 className="text-2xl font-bold text-gray-900">
          Schedule Follow-up
        </h3>
      </div>

      {/* Follow-up Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Selection */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-600 rounded-xl">
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
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Select Follow-up Date *
              </h3>
              <p className="text-xs text-gray-600">
                Choose a date for the follow-up consultancy
              </p>
            </div>
          </div>
          <div className="bg-white/70 rounded-xl p-4">
            <DatePicker
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedTimeSlot(""); // Reset time slot when date changes
              }}
              minDate={getMinDate()}
              maxDate={getMaxDate()}
              placeholder="Click to select follow-up date"
              required
              className="w-full"
            />
          </div>
        </div>

        {/* Time Slot Selection */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-600 rounded-xl">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-900 mb-1">
                Select Time Slot *
              </label>
              <p className="text-xs text-gray-600">
                Available time slots for the selected date
              </p>
            </div>
            {selectedDate && (
              <button
                type="button"
                onClick={loadAvailableSlots}
                disabled={loadingSlots}
                className="p-2 bg-purple-100 hover:bg-purple-200 rounded-xl transition-colors duration-200 disabled:opacity-50"
                title="Refresh available slots"
              >
                <svg
                  className={`w-5 h-5 text-purple-600 ${
                    loadingSlots ? "animate-spin" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
          </div>
          {selectedDate ? (
            <div className="bg-white/70 rounded-xl p-4">
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                  <span className="ml-3 text-gray-600 font-medium">
                    Loading available slots...
                  </span>
                </div>
              ) : (
                                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {timeSlots.map((slot) => {
                          const available = isSlotAvailable(slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTimeSlot(slot)}
                              disabled={!available}
                              className={`relative p-3 text-xs font-semibold rounded-lg border-2 transition-all duration-200 ${
                          selectedTimeSlot === slot
                            ? "bg-purple-600 text-white border-purple-600 shadow-lg transform scale-105"
                            : available
                            ? "bg-white text-gray-700 border-purple-200 hover:bg-purple-50 hover:border-purple-300 hover:shadow-md"
                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{slot}</span>
                        </div>
                        {!available && (
                          <div className="text-xs mt-2 font-medium">
                            Unavailable
                          </div>
                        )}
                        {selectedTimeSlot === slot && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                            <svg
                              className="w-4 h-4 text-purple-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/70 rounded-xl p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-purple-400"
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
              <p className="text-gray-600 font-medium">
                Please select a date first to see available time slots
              </p>
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-600 rounded-xl">
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
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-1">
                Follow-up Notes
              </label>
              <p className="text-xs text-gray-600">
                Optional: Add notes about this follow-up consultancy
              </p>
            </div>
          </div>
          <div className="bg-white/70 rounded-xl p-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Check healing progress, remove stitches, review treatment plan..."
              rows={2}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white placeholder-gray-500 text-gray-900 text-sm"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-600">
                {notes.length}/500 characters
              </span>
              <span className="text-xs text-blue-600 font-medium">
                Optional field
              </span>
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-green-900 mb-2">
                Follow-up Information
              </h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <p className="text-xs text-green-800 font-medium">
                    Follow-ups do not count towards session limits
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <p className="text-xs text-green-800 font-medium">
                    Patient will receive automatic email notifications
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <p className="text-xs text-green-800 font-medium">
                    Follow-up will appear under this consultancy in patient dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !selectedDate || !selectedTimeSlot}
            className="inline-flex justify-center items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Scheduling Follow-up...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                    clipRule="evenodd"
                  />
                </svg>
                Schedule Follow-up
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FollowUpBooking;
