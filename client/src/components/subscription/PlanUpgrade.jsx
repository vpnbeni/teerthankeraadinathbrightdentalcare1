import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../../shared/components";
import plansService from "../../services/plans";

const PlanUpgrade = ({ currentPlan, subscription, onUpgradeSuccess }) => {
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

  // Check if subscription is suspended or expired (needs reactivation, not upgrade)
  const needsReactivation = subscription?.status === "suspended" || subscription?.status === "expired";

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
      subscription: subscription,
      needsReactivation,
    });
  }, [authUser, profile, user, isAuthenticated, subscription, needsReactivation]);

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
          // If subscription needs reactivation, show current plan for renewal
          if (needsReactivation) {
            // Find the current plan in the list to show it for renewal
            const currentPlanFromList = plans.find(p => p._id === currentPlan._id || p.sessions === currentPlan.sessions);
            if (currentPlanFromList) {
              setAvailablePlans([currentPlanFromList]);
            } else {
              // If current plan not found, show the plan with same sessions or all plans
              setAvailablePlans(plans.filter(p => p.sessions >= currentPlan.sessions));
            }
          } else {
            // Normal upgrade flow - filter out current plan and lower plans
            const upgradePlans = plans.filter(
              (plan) => plan.sessions > currentPlan.sessions
            );
            setAvailablePlans(upgradePlans);
          }
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
  }, [currentPlan, needsReactivation]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateUpgradePrice = (newPlan) => {
    // Always show full price for both new subscriptions and upgrades
    // Sessions will be added to existing subscription
    return newPlan.price;
  };

  const handlePlanSelect = async (plan) => {
    console.log(
      "Selected Plan:",
      plan ? JSON.stringify(plan, null, 2) : "plan is null"
    );
    setSelectedPlan(plan);
    setShowPayment(true);

    // Immediately initiate payment
    try {
      setLoading(true);
      const paymentService = (await import("../../services/payments")).default;

      const isUpgrade = !!currentPlan;
      const result = await paymentService.initializePayment(
        plan._id,
        {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        isUpgrade
      );

      // Payment successful
      setShowPayment(false);
      onUpgradeSuccess(result);
    } catch (error) {
      console.error("Payment error:", error);
      setShowPayment(false);

      if (error.message === "PAYMENT_CANCELLED") {
        setError("Payment was cancelled. Please try again when ready.");
      } else {
        const errorMessage =
          typeof error === "string"
            ? error
            : error?.message || "An unexpected error occurred during payment.";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
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
        <motion.div
          className="relative overflow-hidden bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border border-green-100/50 rounded-3xl p-8 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-3xl -mr-32 -mt-32"></div>

          <div className="relative text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
              You're on the Best Plan!
            </h3>
            <p className="text-gray-600 text-base max-w-md mx-auto leading-relaxed">
              You're already on our highest tier plan with {currentPlan.sessions} sessions. Enjoy all premium features!
            </p>
          </div>
        </motion.div>
      );
    } else {
      return (
        <motion.div
          className="relative overflow-hidden bg-gradient-to-r from-red-50 via-pink-50 to-red-50 border border-red-200/50 rounded-3xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center py-4">
            <p className="text-red-700 font-medium">
              No plans available at the moment. Please try again later.
            </p>
          </div>
        </motion.div>
      );
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="text-center"
        variants={itemVariants}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          {needsReactivation
            ? "Reactivate Your Plan"
            : currentPlan
              ? "Upgrade Your Plan"
              : "Choose Your Plan"}
        </h2>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {needsReactivation
            ? "Complete your payment to reactivate your subscription and continue enjoying our dental care services"
            : currentPlan
              ? "Get more sessions and additional benefits with our upgraded plans"
              : "Select a subscription plan that best fits your dental care needs"}
        </p>
      </motion.div>

      {/* Current Plan - only show if user has one */}
      {currentPlan && (
        <motion.div
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden"
          variants={itemVariants}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/10 mb-4">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Current Plan
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-white mb-1">{currentPlan.name}</div>
                <div className="text-sm text-slate-300">
                  {currentPlan.sessions} sessions • {currentPlan.duration} months
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatPrice(currentPlan.price)}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Available Plans/Upgrades */}
      <motion.div
        className="space-y-6"
        variants={itemVariants}
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
            {needsReactivation
              ? "Renew Your Plan"
              : currentPlan
                ? "Available Upgrades"
                : "Available Plans"}
          </h3>
        </div>

        <div className="grid gap-6">
          {Array.isArray(availablePlans) &&
            availablePlans.map((plan, index) => {
              const upgradePrice = calculateUpgradePrice(plan);
              const isPopular = plan.sessions === 8;

              return (
                <motion.div
                  key={plan._id}
                  className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-purple-200/30 transition-all duration-300"
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                >
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {isPopular && (
                    <div className="absolute -top-3 -right-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-purple-500/30">
                        ⭐ Popular
                      </div>
                    </div>
                  )}

                  <div className="relative flex items-start justify-between flex-wrap gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">
                            {plan.name}
                          </h4>
                          <div className="text-sm text-gray-600 mt-0.5">
                            {plan.sessions} sessions • {plan.duration} months
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {currentPlan && !needsReactivation && (
                          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                            <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            +{plan.sessions - currentPlan.sessions} additional sessions
                          </div>
                        )}
                        {needsReactivation && (
                          <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                            <div className="w-5 h-5 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </div>
                            Reactivates your subscription
                          </div>
                        )}

                        {plan.features?.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
                        {needsReactivation ? "Renewal Price" : currentPlan ? "Upgrade Price" : "Price"}
                      </div>
                      <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                        {formatPrice(upgradePrice)}
                      </div>

                      <motion.button
                        onClick={() => handlePlanSelect(plan)}
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {needsReactivation ? "Renew Plan" : currentPlan ? "Upgrade Now" : "Select Plan"}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </motion.div>

      {/* Upgrade Benefits */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/50 rounded-3xl p-6 shadow-sm"
        variants={itemVariants}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -mr-24 -mt-24"></div>

        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-blue-900 text-base mb-3">Why Upgrade?</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-blue-700">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                More sessions for comprehensive dental care
              </li>
              <li className="flex items-start gap-2 text-sm text-blue-700">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Better value per session
              </li>
              <li className="flex items-start gap-2 text-sm text-blue-700">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Priority booking and support
              </li>
              <li className="flex items-start gap-2 text-sm text-blue-700">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Additional premium features
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PlanUpgrade;
