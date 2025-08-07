import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Modal from "../common/Modal";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import OTPVerification from "./OTPVerification";
import ForgotPasswordForm from "./ForgotPasswordForm";
import PaymentForm from "../subscription/PaymentForm";
import { clearTempData, setRegistrationStep } from "../../store/authSlice";
import { Toast } from "../../shared/components";
import { SUCCESS_MESSAGES } from "../../shared/constants";

const AuthModal = ({
  isOpen,
  onClose,
  initialMode = "login",
  selectedPlan = null,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registrationStep, isAuthenticated, user, tempUserData } = useSelector(
    (state) => state.auth
  );
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'forgot-password'
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      onClose();
      navigate("/dashboard");
    }
  }, [isAuthenticated, onClose, navigate]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const handleClose = () => {
    dispatch(clearTempData());
    setMode("login");
    onClose();
  };

  const handleSwitchToLogin = () => {
    dispatch(clearTempData());
    setMode("login");
  };

  const handleSwitchToRegister = () => {
    setMode("register");
  };

  const handleForgotPassword = () => {
    setMode("forgot-password");
  };

  const handleOTPSuccess = () => {
    // After OTP verification, user is authenticated
    // Check if user needs to complete payment or can go to dashboard
    if (user?.subscription?.status === "suspended") {
      // User needs to complete payment
      dispatch(setRegistrationStep("payment"));
    } else {
      // User is fully registered, close modal and redirect
      onClose();
      navigate("/dashboard");
    }
  };

  const handlePasswordResetSuccess = () => {
    setShowSuccessToast(true);
    setMode("login");
  };

  const handleBackFromOTP = () => {
    dispatch(setRegistrationStep("details"));
    setMode("register");
  };

  const handlePaymentSuccess = (paymentData) => {
    setShowSuccessToast(true);
    onClose();
    navigate("/dashboard");
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    // Could show error toast or handle differently
  };

  const renderContent = () => {
    if (mode === "register" && registrationStep === "otp") {
      return (
        <OTPVerification
          onBack={handleBackFromOTP}
          onSuccess={handleOTPSuccess}
        />
      );
    }

    if (mode === "register" && registrationStep === "payment") {
      return (
        <PaymentForm
          selectedPlan={selectedPlan}
          userDetails={tempUserData || user}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      );
    }

    switch (mode) {
      case "login":
        return (
          <LoginForm
            onClose={handleClose}
            onSwitchToRegister={handleSwitchToRegister}
            onForgotPassword={handleForgotPassword}
          />
        );
      case "register":
        return (
          <RegisterForm
            onClose={handleClose}
            onSwitchToLogin={handleSwitchToLogin}
            selectedPlan={selectedPlan}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordForm
            onBack={handleSwitchToLogin}
            onSuccess={handlePasswordResetSuccess}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        {renderContent()}
      </Modal>

      {showSuccessToast && (
        <Toast
          type="success"
          message="Password reset successful! Please sign in with your new password."
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </>
  );
};

export default AuthModal;
