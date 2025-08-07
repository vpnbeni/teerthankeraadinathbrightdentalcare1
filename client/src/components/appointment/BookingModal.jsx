import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Modal from "../common/Modal";
import PersonalDetailsStep from "./PersonalDetailsStep";
import DateSelectionStep from "./DateSelectionStep";
import TimeSlotStep from "./TimeSlotStep";
import BookingConfirmation from "./BookingConfirmation";
import appointmentService from "../../services/appointments";
import sessionLimitsService from "../../services/sessionLimits";
import { LoadingSpinner } from "../../shared/components";
import { canUserBookAppointment } from "../../utils/sessionLimits";

const BookingModal = ({ isOpen, onClose, onSuccess, refreshTrigger }) => {
  const { user } = useSelector((state) => state.auth);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loadingSessionInfo, setLoadingSessionInfo] = useState(false);

  // Fetch real-time session information
  const fetchSessionInfo = async () => {
    if (!user?.subscription) return;

    setLoadingSessionInfo(true);
    try {
      const response = await sessionLimitsService.getSessionLimits();
      if (response.success) {
        setSessionInfo(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch session info:", error);
    } finally {
      setLoadingSessionInfo(false);
    }
  };

  // Check if user can book appointments based on session limits
  const canBookAppointment = () => {
    if (sessionInfo) {
      return sessionInfo.canBookMore && sessionInfo.sessionsRemaining > 0;
    }
    // Fallback to original logic if session info not loaded
    const { canBook } = canUserBookAppointment(user);
    return canBook;
  };

  // Fetch session info when modal opens or when refresh is triggered
  useEffect(() => {
    if (isOpen && user?.subscription) {
      fetchSessionInfo();
    }
  }, [isOpen, user?.subscription, refreshTrigger]);

  const [bookingData, setBookingData] = useState({
    personalDetails: {
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      address: user?.address || "",
      alternativePhone: user?.alternativePhone || "",
    },
    medicalInfo: {
      systemicDiseases: user?.medicalInfo?.systemicDiseases || [],
      drugAllergies: user?.medicalInfo?.drugAllergies || [],
      isPregnant: user?.medicalInfo?.isPregnant || false,
      pastTreatments: user?.medicalInfo?.pastTreatments || [],
      previousExperiences: user?.medicalInfo?.previousExperiences || [],
    },
    selectedDate: null,
    selectedTimeSlot: null,
    notes: "",
  });

  const steps = [
    {
      id: 1,
      title: "Personal Details",
      description: "Verify your information",
    },
    { id: 2, title: "Select Date", description: "Choose appointment date" },
    { id: 3, title: "Select Time", description: "Pick available time slot" },
    { id: 4, title: "Confirmation", description: "Review and confirm" },
  ];

  const handleClose = () => {
    setCurrentStep(1);
    setError(null);
    setSessionInfo(null); // Clear session info when closing
    setBookingData({
      ...bookingData,
      selectedDate: null,
      selectedTimeSlot: null,
      notes: "",
    });
    onClose();
  };

  const handleNext = () => {
    setError(null);
    // Refresh session info before proceeding to ensure we have latest data
    if (currentStep === 1) {
      fetchSessionInfo();
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleStepData = (stepData) => {
    setBookingData({ ...bookingData, ...stepData });
  };

  const handleConfirmBooking = async () => {
    // Refresh session info before final validation to ensure we have the latest data
    await fetchSessionInfo();

    // Final validation before booking
    if (!canBookAppointment()) {
      let errorMessage = "You cannot book this appointment.";

      if (sessionInfo) {
        if (sessionInfo.sessionsRemaining <= 0) {
          errorMessage =
            "No sessions remaining in your current plan. Please upgrade your plan.";
        } else if (!sessionInfo.canBookMore) {
          errorMessage = `You have already booked ${sessionInfo.confirmedAppointments} appointment(s). Complete or cancel existing appointments to book new ones.`;
        } else if (sessionInfo.availableBookings <= 0) {
          errorMessage = `You can book ${sessionInfo.sessionsRemaining} sessions total, but you already have ${sessionInfo.confirmedAppointments} confirmed appointments.`;
        }
      } else {
        errorMessage = "Unable to verify session limits. Please try again.";
      }

      setError(errorMessage);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate slot availability one more time before booking
      const slotValidation = await appointmentService.getAvailableSlots(
        bookingData.selectedDate
      );

      if (slotValidation.data.success) {
        const availableSlots = slotValidation.data.data.availableSlots || [];
        const metadata = slotValidation.data.data.metadata || {};

        // Check if the selected slot is still available
        if (!availableSlots.includes(bookingData.selectedTimeSlot)) {
          setError(
            "The selected time slot is no longer available. Please select a different time."
          );
          return;
        }

        // Check for special conditions
        if (metadata.isHoliday) {
          setError(
            `Cannot book on holiday: ${
              metadata.holidayName || "Holiday"
            }. Please select a different date.`
          );
          return;
        }

        if (!metadata.isWorkingDay) {
          setError(
            "Cannot book on non-working day. Please select a different date."
          );
          return;
        }
      }

      const appointmentData = {
        date: bookingData.selectedDate,
        timeSlot: bookingData.selectedTimeSlot,
        notes: bookingData.notes,
        personalDetails: bookingData.personalDetails,
        medicalInfo: bookingData.medicalInfo,
      };

      const response = await appointmentService.createAppointment(
        appointmentData
      );

      if (response.data.success) {
        // Refresh session info to get updated counts
        await fetchSessionInfo();
        onSuccess(response.data.data);
        handleClose();
      }
    } catch (error) {
      // Handle specific session limit errors
      if (error.response?.data?.requiresUpgrade) {
        setError(
          error.response.data.message +
            " Please upgrade your plan to book more appointments."
        );
      } else if (error.response?.status === 400) {
        setError(
          error.response.data.message ||
            "Invalid booking request. Please check your selection and try again."
        );
      } else if (error.response?.status === 409) {
        setError(
          "This time slot has been booked by another patient. Please select a different time."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to book appointment. Please try again."
        );
        console.error("Booking error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalDetailsStep
            data={bookingData}
            onNext={handleNext}
            onDataChange={handleStepData}
          />
        );
      case 2:
        return (
          <DateSelectionStep
            data={bookingData}
            onNext={handleNext}
            onBack={handleBack}
            onDataChange={handleStepData}
          />
        );
      case 3:
        return (
          <TimeSlotStep
            data={bookingData}
            onNext={handleNext}
            onBack={handleBack}
            onDataChange={handleStepData}
          />
        );
      case 4:
        return (
          <BookingConfirmation
            data={bookingData}
            onConfirm={handleConfirmBooking}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Book Appointment</h2>
          <p className="text-gray-600 mt-1">
            Schedule your dental visit in a few simple steps
          </p>
          {user?.subscription && (
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-[#346870] bg-opacity-10 text-[#346870] text-sm font-medium rounded-full">
              {loadingSessionInfo ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-1">Loading...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {sessionInfo
                    ? sessionInfo.sessionsRemaining
                    : user.subscription.sessionsRemaining}{" "}
                  sessions remaining
                </>
              )}
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? "bg-[#346870] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > step.id ? (
                    <svg
                      className="w-5 h-5"
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
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-gray-800">
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-600">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? "bg-[#346870]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="min-h-[400px]">{renderStep()}</div>
      </div>
    </Modal>
  );
};

export default BookingModal;
