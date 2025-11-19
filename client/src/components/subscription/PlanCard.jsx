import React from "react";

const PlanCard = ({ plan, onSelect, isSelected = false }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Determine if this is the popular plan (Standard Plan with 6 sessions)
  const isPopular = plan.name === "Standard Plan";

  // Ensure features is always an array
  const features = Array.isArray(plan.features) ? plan.features : [];

  // Default features for each plan type
  const getDefaultFeatures = (planName) => {
    switch (planName) {
      case "Basic Plan":
        return [
          "Basic dental examination",
          "Routine cleaning",
          "Digital health records",
          "Email support",
        ];
      case "Standard Plan":
        return [
          "Comprehensive dental examination",
          "Professional cleaning & scaling",
          "Digital X-rays included",
          "Priority booking",
          "Phone & email support",
          "Follow-up consultations",
        ];
      case "Premium Plan":
        return [
          "Complete dental examination",
          "Advanced treatments included",
          "Digital X-rays & 3D imaging",
          "Priority access & booking",
          "24/7 phone support",
          "Unlimited consultations",
          "Emergency dental care",
          "Specialist referrals",
        ];
      default:
        return [];
    }
  };

  const displayFeatures =
    features.length > 0 ? features : getDefaultFeatures(plan.name);

  // Check if this is a kids plan
  const isKidsPlan = plan.category === 'kids';

  // Get plan icon based on plan category and name
  const getPlanIcon = (planName, category) => {
    // Kids plan icons
    if (category === 'kids') {
      return (
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }

    // Adult plan icons
    switch (planName) {
      case "Basic Plan":
      case "Tooth Protector Plan":
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "Standard Plan":
      case "Dental Shield Plan":
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-[#346870] to-[#2a5359] rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      case "Premium Plan":
      case "Smile Saver Plan":
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className={`plan-card relative border-2 transition-all duration-300 rounded-2xl bg-white ${
        isSelected 
          ? isKidsPlan
            ? "border-blue-500 shadow-2xl scale-[1.02] ring-4 ring-blue-200/50"
            : "plan-card-selected border-[#346870] shadow-2xl scale-[1.02]"
          : isPopular 
          ? "plan-card-popular border-[#346870] shadow-xl" 
          : isKidsPlan
          ? "border-blue-200 hover:border-blue-400 shadow-lg hover:shadow-xl"
          : "border-gray-200 hover:border-[#346870]/50 shadow-md hover:shadow-lg"
      } ${isKidsPlan ? 'hover:scale-[1.01]' : ''}`}
      onClick={() => onSelect(plan)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(plan);
        }
      }}
      aria-label={`Select ${plan.name} - ${plan.price} INR per year`}
    >
      {isPopular && !isKidsPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-[#346870] to-[#2a5359] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
            ⭐ Most Popular
          </div>
        </div>
      )}

      {isKidsPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
            👶 Kids Special
          </div>
        </div>
      )}

      {/* Background Pattern */}
      <div className={`absolute inset-0 opacity-50 rounded-2xl ${
        isKidsPlan 
          ? 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50'
          : 'bg-gradient-to-br from-white via-gray-50 to-white'
      }`}></div>
      
      <div className="relative p-8">
        {/* Plan Icon */}
        {getPlanIcon(plan.name, plan.category)}

        {/* Kids Badge */}
        {isKidsPlan && plan.ageRange && (
          <div className="flex justify-center mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
              🧒 {plan.ageRange}
            </span>
          </div>
        )}

        {/* Plan Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {plan.description}
          </p>
        </div>

        {/* Price Section */}
        <div className="text-center mb-6">
          <div className={`relative rounded-2xl p-6 mb-4 border shadow-lg ${
            isKidsPlan
              ? 'bg-gradient-to-br from-blue-50 via-white to-cyan-50 border-blue-200'
              : 'bg-gradient-to-br from-[#346870]/10 via-white to-[#BDCFD1]/10 border-[#346870]/20'
          }`}>
            {/* Decorative elements */}
            <div className={`absolute top-2 right-2 w-8 h-8 rounded-full ${
              isKidsPlan ? 'bg-blue-200/50' : 'bg-[#346870]/10'
            }`}></div>
            <div className={`absolute bottom-2 left-2 w-6 h-6 rounded-full ${
              isKidsPlan ? 'bg-cyan-200/50' : 'bg-[#BDCFD1]/30'
            }`}></div>
            
            <div className="relative">
              <div className="flex items-baseline justify-center mb-3">
                <span className={`text-5xl font-black drop-shadow-sm ${
                  isKidsPlan ? 'text-blue-600' : 'text-[#346870]'
                }`}>
                  {formatPrice(plan.price)}
                </span>
              </div>
              
              {/* Plan details with enhanced styling */}
              <div className="flex items-center justify-center space-x-3 text-sm flex-wrap gap-2">
                <div className={`flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border ${
                  isKidsPlan ? 'border-blue-200' : 'border-[#346870]/20'
                }`}>
                  <svg
                    className={`w-4 h-4 mr-2 ${isKidsPlan ? 'text-blue-500' : 'text-[#346870]'}`}
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
                  <span className="font-semibold text-gray-700">{plan.duration} months</span>
                </div>
                <div className={`flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border ${
                  isKidsPlan ? 'border-blue-200' : 'border-[#346870]/20'
                }`}>
                  <svg
                    className={`w-4 h-4 mr-2 ${isKidsPlan ? 'text-blue-500' : 'text-[#346870]'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span className="font-semibold text-gray-700">{plan.sessions} sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        {displayFeatures.length > 0 && (
          <div className="mb-8">
            <h4 className={`text-sm font-bold mb-4 text-center ${
              isKidsPlan 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-[#346870] to-[#2a5359] bg-clip-text text-transparent'
            }`}>
              ✨ What's Included:
            </h4>
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {displayFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-start text-sm bg-white/60 rounded-lg p-3 border transition-all duration-200 ${
                    isKidsPlan
                      ? 'border-blue-100 hover:border-blue-300 hover:bg-blue-50/50'
                      : 'border-gray-100 hover:border-[#346870]/30 hover:bg-gray-50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                    isKidsPlan
                      ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                      : 'bg-gradient-to-r from-green-400 to-green-500'
                  }`}>
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="leading-relaxed font-medium text-gray-700 flex-1">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Select Button */}
        <button
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${
            isSelected
              ? isKidsPlan
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-2xl ring-4 ring-blue-300/50"
                : "bg-gradient-to-r from-[#346870] to-[#2a5359] text-white shadow-2xl ring-4 ring-[#346870]/30"
              : isPopular
              ? "bg-gradient-to-r from-[#346870] to-[#2a5359] text-white hover:from-[#2a5359] hover:to-[#1e3d42] shadow-xl hover:shadow-2xl"
              : isKidsPlan
              ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-gray-800 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-400 shadow-md hover:shadow-lg"
              : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 hover:from-[#346870]/10 hover:to-[#BDCFD1]/20 border-2 border-gray-200 hover:border-[#346870]/50 shadow-md hover:shadow-lg"
          }`}
        >
          {isSelected ? (
            <span className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
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
              ✓ Selected
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              Choose Plan
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
