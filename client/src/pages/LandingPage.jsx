import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PlanSelector from "../components/subscription/PlanSelector";
import StreamlinedAuthModal from "../components/auth/StreamlinedAuthModal";
import PaymentForm from "../components/subscription/PaymentForm";
import AuthModal from "../components/auth/AuthModal";

const LandingPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user) => {
    setUserData(user);
    setAuthModalOpen(false);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    navigate('/dashboard');
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Keep payment modal open for retry
  };

  const handleLoginClick = () => {
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    setLoginModalOpen(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#346870] to-[#BDCFD1]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center text-white mb-12 relative">
          {/* Login Button - Top Right */}
          <div className="absolute top-0 right-0">
            <button
              onClick={handleLoginClick}
              className="bg-white text-[#346870] px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg"
            >
              Login
            </button>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Teerthanker Aadinath Bright Dental Care
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Your trusted partner for comprehensive dental care
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-7xl mx-auto">
          <PlanSelector
            onPlanSelect={handlePlanSelect}
            selectedPlan={selectedPlan}
          />

          <div className="mt-12 text-center border-t pt-8">
            <p className="text-gray-600 mb-4 text-lg">
              Select a plan above to get started with your dental care journey
            </p>
          </div>

          {/* Features Section */}
          <div className="mt-12 border-t pt-8">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">
              Why Choose Us?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#346870] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#346870]"
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
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Expert Care
                </h4>
                <p className="text-gray-600">
                  Experienced dental professionals providing comprehensive care
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#346870] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#346870]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Convenient Booking
                </h4>
                <p className="text-gray-600">
                  Easy online appointment scheduling with flexible time slots
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#346870] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#346870]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Digital Records
                </h4>
                <p className="text-gray-600">
                  Secure digital health records accessible anytime, anywhere
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streamlined Authentication Modal */}
      <StreamlinedAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        selectedPlan={selectedPlan}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <PaymentForm
                selectedPlan={selectedPlan}
                userDetails={userData}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}  
              />
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <AuthModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
};

export default LandingPage;
