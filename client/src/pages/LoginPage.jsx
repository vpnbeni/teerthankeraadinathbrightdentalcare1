import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [mode, setMode] = useState("login"); // 'login', 'forgot-password'

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSwitchToLogin = () => {
    setMode("login");
  };

  const handleForgotPassword = () => {
    setMode("forgot-password");
  };

  const renderForm = () => {
    switch (mode) {
      case "login":
        return (
          <LoginForm
            onForgotPassword={handleForgotPassword}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordForm
            onBack={handleSwitchToLogin}
            onSuccess={handleSwitchToLogin}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form (50% width) */}
      <div className="w-1/2 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-4">
            <div className="my-[-40px]">
              <img 
                src="https://res.cloudinary.com/dvqvxu0b1/image/upload/v1753662373/2_uuolcb.webp"
                alt="Teerthanker Aadinath Bright Dental Care"
                className="h-52 w-auto mx-auto object-contain"
              />    
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-lg text-[#346870] font-medium">
              Sign in to your account
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white">
            {renderForm()}
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <Link 
              to="/" 
              className="text-sm text-gray-500 hover:text-[#346870] transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Video Background with Overlay (50% width) */}
      <div className="w-1/2 relative overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            console.log("Video failed to load, hiding video element");
            e.target.style.display = 'none';
          }}
        >
          <source src="/assets/videos/dental-background.mp4" type="video/mp4" />
          {/* Fallback gradient background when video fails */}
        </video>
        
        {/* Fallback Background (always visible as base layer) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#346870] via-[#4a7c85] to-[#BDCFD1]"></div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#346870]/90 via-[#346870]/70 to-[#4a7c85]/80"></div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-12">
          <div className="text-center text-white max-w-lg">
            {/* Animated Welcome Text */}
            <div className="animate-fade-in-up">
              <h2 className="text-5xl font-bold mb-6 leading-tight">
                Your Smile is Our
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#BDCFD1] to-white">
                  Priority
                </span>
              </h2>
              
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Experience world-class dental care with modern technology and 
                compassionate service that puts you first.
              </p>

              {/* Feature Points */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center text-white/80">
                  <svg className="w-5 h-5 mr-3 text-[#BDCFD1]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Expert dental professionals
                </div>
                <div className="flex items-center justify-center text-white/80">
                  <svg className="w-5 h-5 mr-3 text-[#BDCFD1]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  State-of-the-art equipment
                </div>
                <div className="flex items-center justify-center text-white/80">
                  <svg className="w-5 h-5 mr-3 text-[#BDCFD1]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Comfortable & safe environment
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-[#BDCFD1] font-medium">
                Book your appointment today and discover the difference
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-16 left-8 w-24 h-24 bg-[#BDCFD1]/20 rounded-full blur-lg"></div>
        <div className="absolute top-1/3 left-12 w-16 h-16 bg-white/5 rounded-full blur-md"></div>
      </div>

      {/* Mobile Responsive Overlay for smaller screens */}
      <div className="lg:hidden fixed inset-0 bg-[#346870] z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
          <div className="text-center mb-6">
            <div className="my-[-40px]">
              <img 
                src="https://res.cloudinary.com/dvqvxu0b1/image/upload/v1753662373/2_uuolcb.webp"
                alt="Teerthanker Aadinath Bright Dental Care"
                className="h-48 w-auto mx-auto object-contain"
              />
            </div>
            <h1 className="text-lg font-bold text-gray-900">
              Welcome Back
            </h1>
          </div>
          {renderForm()}
          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="text-sm text-gray-500 hover:text-[#346870] transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
