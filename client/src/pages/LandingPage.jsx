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
    <div className="min-h-screen bg-gradient-to-br from-[#346870] via-[#2a5359] to-[#BDCFD1] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-white/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-1/3 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative">
        {/* Enhanced Header */}
        <div className="text-center text-white mb-16 relative">
          {/* Floating elements */}
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-white/10 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s' }}></div>
          
          <div className="relative">
            {/* Badge */}
            <div className="inline-block mb-6">
              <span className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-semibold border border-white/30 shadow-lg">
                🦷 Premium Dental Care Since 2017
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
                Teerthanker Aadinath
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Bright Dental Care
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl mb-8 font-light text-white/90 max-w-4xl mx-auto leading-relaxed">
              Your trusted partner for comprehensive dental care with 
              <span className="font-semibold text-yellow-200"> cutting-edge technology</span> and 
              <span className="font-semibold text-yellow-200"> personalized treatment</span>
            </p>
            
            {/* Trust indicators */}
            <div className="flex items-center justify-center space-x-8 text-white/80 text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                15000+ Happy Patients
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Expert Dentists
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Modern Equipment
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Main Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-7xl mx-auto relative border border-white/20">
          {/* Enhanced Login Button - Mobile Responsive */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-10">
            <button
              onClick={handleLoginClick}
              className="group relative bg-gradient-to-r from-[#346870] to-[#2a5359] text-white px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold hover:from-[#2a5359] hover:to-[#1e3d42] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="hidden xs:inline">Login</span>
                <span className="xs:hidden">Login</span>
              </span>
              <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 left-4 w-8 h-8 bg-[#346870]/10 rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 bg-[#BDCFD1]/20 rounded-full"></div>
          
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
