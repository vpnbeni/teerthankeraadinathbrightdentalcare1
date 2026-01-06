import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../components/common/DashboardLayout";
import PaymentHistory from "../components/payments/PaymentHistory";
import SubscriptionStatus from "../components/subscription/SubscriptionStatus";
import PlanUpgrade from "../components/subscription/PlanUpgrade";
import { checkAuthStatus } from "../store/authSlice";
import plansService from "../services/plans";

const Payments = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("subscription");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (user?.subscription?.planId) {
      plansService
        .getPlan(user.subscription.planId)
        .then((response) => {
          setPlan(response.data.data);
        })
        .catch((error) => {
          console.error("Failed to fetch plan details", error);
        });
    }
  }, [user]);

  const handleUpgradeSuccess = (paymentData) => {
    setShowUpgrade(false);
    dispatch(checkAuthStatus());
    console.log("Upgrade successful:", paymentData);
  };

  const tabs = [
    {
      id: "subscription",
      label: "Subscription",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: "history",
      label: "Payment History",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
  ];

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

  const renderContent = () => {
    if (showUpgrade) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={() => setShowUpgrade(false)}
            className="group mb-6 inline-flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl text-gray-700 text-sm font-medium hover:bg-white hover:border-gray-300/50 transition-all shadow-sm hover:shadow-md"
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Subscription
          </motion.button>
          <PlanUpgrade
            currentPlan={plan}
            subscription={user?.subscription}
            onUpgradeSuccess={handleUpgradeSuccess}
          />
        </motion.div>
      );
    }

    switch (activeTab) {
      case "subscription":
        return (
          <SubscriptionStatus
            subscription={user?.subscription}
            plan={plan}
            onUpgrade={() => setShowUpgrade(true)}
          />
        );
      case "history":
        return <PaymentHistory />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-8 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Premium Hero Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

          {/* Ambient Blur Effects */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#5fa8b5]/20 to-[#346870]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/10 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  Billing & Subscriptions
                </motion.div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                  Payments & Subscription
                </h1>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                  Manage your subscription, view payment history, and upgrade your plan to unlock premium features
                </p>
              </div>

              {/* Quick Stats */}
              <motion.div
                className="flex gap-3 sm:gap-4 w-full lg:w-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex-1 lg:flex-none lg:min-w-[120px]">
                  <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {user?.subscription?.sessionsRemaining || 0}
                  </div>
                  <div className="text-xs text-slate-300">Sessions Left</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex-1 lg:flex-none lg:min-w-[120px]">
                  <div className="text-xl sm:text-2xl font-bold text-white mb-1 capitalize">
                    {user?.subscription?.status || "N/A"}
                  </div>
                  <div className="text-xs text-slate-300">Status</div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Premium Tabs */}
        {!showUpgrade && (
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl sm:rounded-3xl shadow-lg shadow-gray-200/50 p-2"
          >
            <nav className="flex flex-col sm:flex-row gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm transition-all duration-300 ${activeTab === tab.id
                      ? "text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                    }`}
                  whileHover={{ scale: activeTab === tab.id ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#346870] to-[#5fa8b5] rounded-xl sm:rounded-2xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.icon}</span>
                  <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                </motion.button>
              ))}
            </nav>
          </motion.div>
        )}

        {/* Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + showUpgrade}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
};

export default Payments;
