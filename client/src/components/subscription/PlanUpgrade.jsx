import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { LoadingSpinner } from "../../shared/components";
import plansService from "../../services/plans";

const PlanUpgrade = ({ currentPlan, onUpgradeSuccess }) => {
  const { user: authUser, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const { profile } = useSelector((state) => state.user);

  // Use profile data if available, otherwise fall back to auth user data
  const user = profile || authUser;
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug logging for user data
  useEffect(() => {
    console.log("PlanUpgrade user data debug:", {
      authUser: authUser
        ? { id: authUser._id, name: authUser.name, phone: authUser.phone }
        : null,
      profile: profile
        ? { id: profile._id, name: profile.name, phone: profile.phone }
        : null,
      finalUser: user
        ? { id: user._id, name: user.name, phone: user.phone }
        : null,
      isAuthenticated,
    });
  }, [authUser, profile, user, isAuthenticated]);

  // Simple user data check - let ProtectedRoute handle authentication
  useEffect(() => {
    if (!user && isAuthenticated) {
      console.log(
        "Authenticated but no user data available. This should be handled by ProtectedRoute."
      );
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await plansService.getPlans();
        const plans = response.data.data || [];

        if (currentPlan) {
          // Filter out current plan and lower plans for upgrades
          const upgradePlans = plans.filter(
            (plan) => plan.sessions > currentPlan.sessions
          );
          setAvailablePlans(upgradePlans);
        } else {
          // Show all plans if no current plan (new subscription)
          setAvailablePlans(plans);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        setError("Failed to load plans. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [currentPlan]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateUpgradePrice = (newPlan) => {
    if (!currentPlan) {
      // New subscription - full price
      return newPlan.price;
    }
    // Upgrade - price difference
    const priceDifference = newPlan.price - currentPlan.price;
    return Math.max(0, priceDifference);
  };

  const handlePlanSelect = (plan) => {
    console.log(
      "Selected Plan:",
      plan ? JSON.stringify(plan, null, 2) : "plan is null"
    );
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    setShowPayment(false);
    onUpgradeSuccess(paymentData);
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    const errorMessage =
      typeof error === "string"
        ? error
        : error?.message || "An unexpected error occurred during payment.";
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  // Show loading if user data is still being fetched
  if (!user && isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner size="medium" />
        <p className="text-gray-600 mt-2">Loading user information...</p>
      </div>
    );
  }

  // If not authenticated, show message
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-red-600">Please log in to continue.</p>
      </div>
    );
  }

  if (error) {
    // Safely extract error message from error object or string
    const errorMessage =
      typeof error === "string"
        ? error
        : error?.message ||
          error?.title ||
          "An error occurred. Please try again.";

    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (showPayment && selectedPlan) {
    return (
      <div>
        <button
          onClick={() => setShowPayment(false)}
          className="mb-4 text-[#346870] hover:text-[#2a5359] font-medium flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Plans
        </button>
      </div>
    );
  }

  if (availablePlans.length === 0) {
    if (currentPlan) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
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
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            You're on the Best Plan!
          </h3>
          <p className="text-gray-600">
            You're already on our highest tier plan with {currentPlan.sessions}{" "}
            sessions.
          </p>
        </div>
      );
    } else {
      return (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
            No plans available at the moment. Please try again later.
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {currentPlan ? "Upgrade Your Plan" : "Choose Your Plan"}
        </h2>
        <p className="text-gray-600">
          {currentPlan
            ? "Get more sessions and additional benefits with our upgraded plans"
            : "Select a subscription plan that best fits your dental care needs"}
        </p>
      </div>

      {/* Current Plan - only show if user has one */}
      {currentPlan && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Current Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{currentPlan.name}</div>
              <div className="text-sm text-gray-600">
                {currentPlan.sessions} sessions • {currentPlan.duration} months
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {formatPrice(currentPlan.price)}
            </div>
          </div>
        </div>
      )}

      {/* Available Plans/Upgrades */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">
          {currentPlan ? "Available Upgrades" : "Available Plans"}
        </h3>

        {Array.isArray(availablePlans) &&
          availablePlans.map((plan) => {
            const upgradePrice = calculateUpgradePrice(plan);

            return (
              <div
                key={plan._id}
                className="card border-2 border-transparent hover:border-[#346870] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-semibold text-gray-800">
                        {plan.name}
                      </h4>
                      {plan.sessions === 8 && (
                        <span className="ml-2 bg-[#346870] text-white px-2 py-1 rounded-full text-xs">
                          Popular
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      {plan.sessions} sessions • {plan.duration} months
                    </div>

                    <div className="space-y-1 text-sm">
                      {currentPlan && (
                        <div className="flex items-center text-green-600">
                          <svg
                            className="w-4 h-4 mr-1"
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
                          +{plan.sessions - currentPlan.sessions} additional
                          sessions
                        </div>
                      )}

                      {plan.features?.slice(0, 2).map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center text-gray-600"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
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
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <div className="text-sm text-gray-600 mb-1">
                      {currentPlan ? "Upgrade Price" : "Price"}
                    </div>
                    <div className="text-2xl font-bold text-[#346870] mb-3">
                      {formatPrice(upgradePrice)}
                    </div>

                    <button
                      onClick={() => handlePlanSelect(plan)}
                      className="btn-primary px-6 py-2"
                    >
                      {currentPlan ? "Upgrade Now" : "Select Plan"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Upgrade Benefits */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Why Upgrade?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• More sessions for comprehensive dental care</li>
          <li>• Better value per session</li>
          <li>• Priority booking and support</li>
          <li>• Additional premium features</li>
        </ul>
      </div>
    </div>
  );
};

export default PlanUpgrade;
