import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearError } from "../../store/authSlice";
import { showToast } from "../../shared/utils/toast";
import AdminLoginForm from "../../components/auth/AdminLoginForm";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, isAuthenticated } = useSelector((state) => state.auth);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Show error toast
  useEffect(() => {
    if (error) {
      showToast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return (
    <div className="h-screen flex relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Ambient Background Elements - Hidden on mobile */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/3 to-secondary/5 rounded-full blur-3xl"></div>
      </div>

      {/* Left Side - Premium Login Form - Full width on mobile */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 lg:py-12 relative z-10 overflow-y-auto scrollbar-hide">
        <div className="w-full max-w-md relative z-10">
          {/* Logo on Mobile - Top */}
          <div className="lg:hidden text-center mb-4 animate-fade-in-up">
            <div className="relative inline-block h-40">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl blur-xl"></div>
              <img
                src="https://res.cloudinary.com/dvqvxu0b1/image/upload/v1753662373/2_uuolcb.webp"
                alt="Teerthanker Aadinath Bright Dental Care"
                className="h-48 w-auto mx-auto object-contain relative z-10 drop-shadow-lg"
              />
            </div>
          </div>

          {/* Premium Typography Header */}
          <div className="text-center mb-6 lg:mb-8 animate-fade-in-up">
            <div className="space-y-2 lg:space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-primary-600 to-primary-700 bg-clip-text text-transparent tracking-tight">
                Admin Portal
              </h1>
              <p className="text-sm lg:text-base text-gray-600 font-medium tracking-wide">
                Sign in to manage your dental practice
              </p>
            </div>
          </div>

          {/* Premium Form Container with Glass Effect */}
          <div className="relative group">
            {/* Glow Effect on Hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

            {/* Form Card */}
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-2xl border border-gray-200/50 p-4 sm:p-6 lg:p-8 transition-all duration-500 hover:shadow-primary/10 overflow-hidden">
              {/* Background Logo - Watermark in Form */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <img
                  src="https://res.cloudinary.com/dvqvxu0b1/image/upload/v1753662373/2_uuolcb.webp"
                  alt="Teerthanker Aadinath Bright Dental Care Background"
                  className="w-[90%] h-auto object-contain opacity-[.06] select-none grayscale"
                />
              </div>

              {/* Subtle Top Border Accent */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full z-10"></div>

              <div className="relative z-10">
                <AdminLoginForm />
              </div>
            </div>
          </div>

          {/* Footer with Refined Styling */}
          <div className="mt-4 lg:mt-8 text-center space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-xs text-gray-500">
              Teerthanker Aadinath Bright Dental Care - Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Immersive Visual Experience - Hidden on mobile */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        {/* Video Background with Enhanced Overlay */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
          onCanPlay={() => setIsVideoReady(true)}
          onError={(e) => {
            console.log("Video failed to load, using gradient fallback");
            e.target.style.display = 'none';
            setIsVideoReady(false);
          }}
        >
          <source src="/assets/videos/bg-video.mp4" type="video/mp4" />
        </video>

        {/* Premium Gradient Fallback */}
        <div className={`absolute inset-0 bg-gradient-to-br from-[#2a5359] via-[#346870] to-[#4a7c85] ${isVideoReady ? 'hidden' : ''}`}>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(189,207,209,0.3)_0%,transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(189,207,209,0.2)_0%,transparent_50%)]"></div>
          </div>
        </div>

        {/* Sophisticated Multi-Layer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a40]/95 via-[#346870]/90 to-[#2a5359]/95"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

        {/* Premium Content Section */}
        <div className="absolute inset-0 flex items-center justify-center px-16">
          <div className="text-center text-white max-w-xl space-y-8">
            {/* Hero Heading with Refined Animation */}
            <div className="space-y-6 animate-fade-in-up">
              <div className="inline-block">
                <div className="relative">
                  <h2 className="text-6xl font-bold leading-tight tracking-tight">
                    Manage Your
                    <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#BDCFD1] via-white to-[#BDCFD1] animate-shimmer">
                      Practice
                    </span>
                  </h2>
                  {/* Subtle Underline Accent */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#BDCFD1] to-transparent rounded-full"></div>
                </div>
              </div>

              <p className="text-lg text-white/90 leading-relaxed font-light max-w-lg mx-auto">
                Streamline your dental practice management with powerful tools
                designed for efficiency and excellence.
              </p>
            </div>

            {/* Premium Feature Cards */}
            <div className="grid gap-4 mt-12">
              {[
                { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", text: "Comprehensive appointment management" },
                { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", text: "Patient records & analytics" },
                { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", text: "Real-time insights & reporting" }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 hover:bg-white/15 transition-all duration-300 group animate-fade-in-up"
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#BDCFD1]/30 to-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-[#BDCFD1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </div>
                  <span className="text-white/90 font-medium text-left">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Elegant CTA */}
            <div className="pt-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="inline-block px-8 py-3 bg-gradient-to-r from-[#BDCFD1]/20 to-white/10 backdrop-blur-sm rounded-full border border-[#BDCFD1]/30">
                <p className="text-[#BDCFD1] font-medium text-sm tracking-wide">
                  Empowering dental professionals with modern solutions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Decorative Elements */}
        <div className="absolute top-12 right-12 w-40 h-40 bg-gradient-to-br from-white/10 to-[#BDCFD1]/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-12 w-32 h-32 bg-gradient-to-br from-[#BDCFD1]/15 to-white/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-16 w-20 h-20 bg-white/5 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>

        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>
    </div>
  );
};

export default LoginPage;
