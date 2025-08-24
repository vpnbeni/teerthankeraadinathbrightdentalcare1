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
    navigate('/login');
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
          
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Teerthanker Aadinath Bright Dental Care
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Your trusted partner for comprehensive dental care
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-7xl mx-auto relative">
          {/* Login Button - Top Right */}
          <div className="absolute top-10 right-10">
            <button
              onClick={handleLoginClick}
              className="text-white bg-[#346870] px-6 py-2 rounded-lg font-medium hover:bg-opacity-80 transition-colors shadow-lg"
            >
              Login
            </button>
          </div>
          <PlanSelector
            onPlanSelect={handlePlanSelect}
            selectedPlan={selectedPlan}
          />

         

          
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
