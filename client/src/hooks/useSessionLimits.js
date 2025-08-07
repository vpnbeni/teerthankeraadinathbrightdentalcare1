import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import sessionLimitsService from "../services/sessionLimits";

/**
 * Custom hook for managing session limits
 * Provides session limit information and booking eligibility
 */
export const useSessionLimits = () => {
  const { user } = useSelector((state) => state.auth);
  const [sessionLimits, setSessionLimits] = useState({
    totalSessions: 0,
    sessionsRemaining: 0,
    confirmedAppointments: 0,
    canBookMore: false,
    availableBookings: 0,
    subscriptionStatus: "none",
    planName: null,
  });
  const [canBook, setCanBook] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessionLimits = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [limitsResponse, canBookResponse] = await Promise.all([
        sessionLimitsService.getSessionLimits(),
        sessionLimitsService.canBookAppointment(),
      ]);

      if (limitsResponse.success) {
        setSessionLimits(limitsResponse.data);
      }

      if (canBookResponse.success) {
        setCanBook(canBookResponse.data.canBook);
        setBookingMessage(canBookResponse.data.message);
      }
    } catch (err) {
      console.error("Session limits fetch error:", err);
      setError(err.response?.data?.message || "Failed to fetch session limits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionLimits();
  }, [user]);

  const refreshSessionLimits = () => {
    fetchSessionLimits();
  };

  return {
    sessionLimits,
    canBook,
    bookingMessage,
    loading,
    error,
    refreshSessionLimits,
  };
};
