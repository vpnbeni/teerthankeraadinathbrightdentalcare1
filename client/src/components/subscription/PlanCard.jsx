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

  return (
    <div
      className={`plan-card relative border border-gray-200 ${
        isSelected ? "plan-card-selected" : ""
      } ${isPopular ? "plan-card-popular" : ""}`}
      onClick={() => onSelect(plan)}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-[#346870] to-[#2a5359] text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
            ⭐ Most Popular
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Plan Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {plan.description}
          </p>
        </div>

        {/* Price Section */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-[#346870]/5 to-[#BDCFD1]/10 rounded-xl p-4 mb-4">
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-4xl font-bold text-[#346870]">
                {formatPrice(plan.price)}
              </span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                <svg
                  className="w-4 h-4 mr-1 text-[#346870]"
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
                {plan.duration} months
              </div>
              <div className="flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
                <svg
                  className="w-4 h-4 mr-1 text-[#346870]"
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
                {plan.sessions} sessions
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        {displayFeatures.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 text-center">
              What's Included:
            </h4>
            <div className="space-y-3">
              {displayFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start text-sm text-gray-700"
                >
                  <svg
                    className="plan-feature-check"
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
                  <span className="leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Select Button */}
        <button
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
            isSelected
              ? "bg-[#346870] text-white shadow-lg"
              : isPopular
              ? "bg-gradient-to-r from-[#346870] to-[#2a5359] text-white hover:from-[#2a5359] hover:to-[#1e3d42] shadow-lg"
              : "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200"
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
              Selected
            </span>
          ) : (
            "Choose Plan"
          )}
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
