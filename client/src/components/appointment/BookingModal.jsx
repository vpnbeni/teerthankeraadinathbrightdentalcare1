import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Modal from "../common/Modal";
import PersonalDetailsStep from "./PersonalDetailsStep";
import DateSelectionStep from "./DateSelectionStep";
import TimeSlotStep from "./TimeSlotStep";
import BookingConfirmation from "./BookingConfirmation";
import appointmentService from "../../services/appointments";
import toast from "react-hot-toast";
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
            `Cannot book on holiday: ${metadata.holidayName || "Holiday"
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
        toast.success(
          response.data.message || "Appointment booked successfully"
        );
        handleClose();
      }
    } catch (error) {
      // Handle specific session limit errors
      if (error.response?.data?.requiresUpgrade) {
        const msg =
          (error.response.data.message ||
            "Booking requires an upgrade.") +
          " Please upgrade your plan to book more appointments.";
        setError(msg);
        toast.error(msg);
      } else if (error.response?.status === 400) {
        const msg =
          error.response.data.message ||
          "Invalid booking request. Please check your selection and try again.";
        setError(msg);
        toast.error(msg);
      } else if (error.response?.status === 409) {
        const msg =
          "This time slot has been booked by another patient. Please select a different time.";
        setError(msg);
        toast.error(msg);
      } else {
        const msg =
          error.response?.data?.message ||
          "Failed to book appointment. Please try again.";
        setError(msg);
        toast.error(msg);
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
    <Modal isOpen={isOpen} onClose={handleClose} size="booking">
      <div className="h-full flex flex-col">
        {/* Compact Header */}
        <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
              <p className="text-xs text-gray-600">Step {currentStep} of {steps.length}</p>
            </div>
          </div>

          {user?.subscription && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#346870]/10 border border-[#346870]/20 text-[#346870] text-xs font-semibold rounded-lg">
              {loadingSessionInfo ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{sessionInfo ? sessionInfo.sessionsRemaining : user.subscription.sessionsRemaining} sessions left</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Compact Progress Bar */}
        <div className="flex-shrink-0 py-4">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentStep >= step.id
                      ? "bg-gradient-to-br from-[#346870] to-[#5fa8b5] text-white shadow-md"
                      : "bg-gray-100 text-gray-400"
                    }`}>
                    {currentStep > step.id ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`hidden md:block text-xs font-medium ${currentStep >= step.id ? "text-gray-900" : "text-gray-500"
                    }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden min-w-[20px]">
                    <div className={`h-full transition-all duration-500 ${currentStep > step.id ? "bg-gradient-to-r from-[#346870] to-[#5fa8b5] w-full" : "w-0"
                      }`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Compact Error Banner */}
        {error && (
          <div className="flex-shrink-0 mb-4 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-800 text-sm font-medium flex-1">{error}</p>
          </div> 
        )}

        {/* Step Content - No extra wrapper */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {renderStep()}
        </div>
      </div>
    </Modal>
  );
};

export default BookingModal;
