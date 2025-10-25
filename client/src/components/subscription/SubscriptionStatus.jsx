import React from "react";
import { motion } from "framer-motion";

const SubscriptionStatus = ({ subscription, plan, onUpgrade }) => {
  // Handle case where subscription is not loaded or doesn't exist
  if (!subscription || !plan) {
    return (
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/50 rounded-3xl p-8 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        <div className="relative text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
            No Active Subscription
          </h3>
          <p className="text-gray-600 text-base mb-6 max-w-md mx-auto leading-relaxed">
            You don't have an active subscription. Choose a plan to get started and unlock premium dental care features.
          </p>
          <motion.button 
            onClick={onUpgrade} 
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Choose Plan
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      case "suspended":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return (
          <svg
            className="w-5 h-5"
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
        );
      case "expired":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "suspended":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // Calculate total sessions from plan details or use fallback
  const getTotalSessions = () => {
    return plan?.sessions || 0;
  };

  const calculateProgress = () => {
    const totalSessions = getTotalSessions();
    const sessionsRemaining = subscription.sessionsRemaining || 0;
    const used = totalSessions - sessionsRemaining;
    return totalSessions > 0 ? (used / totalSessions) * 100 : 0;
  };

  const getDaysRemaining = () => {
    if (!subscription.endDate) return 0;
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isExpiringSoon = () => {
    return getDaysRemaining() <= 30 && subscription.status === "active";
  };

  // Get plan name with fallback
  const getPlanName = () => {
    return plan?.name || "Unknown Plan";
  };

  const totalSessions = getTotalSessions();
  const sessionsUsed = totalSessions - (subscription.sessionsRemaining || 0);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {/* Status Header Card */}
      <motion.div 
        className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Subscription Status
            </h2>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border shadow-sm ${getStatusColor(
              subscription.status
            )}`}
          >
            {getStatusIcon(subscription.status)}
            <span className="capitalize">{subscription.status}</span>
          </div>
        </div>

        {/* Plan Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">Plan Details</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                <span className="text-sm text-gray-600">Plan</span>
                <span className="font-semibold text-gray-900">{getPlanName()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                <span className="text-sm text-gray-600">Total Sessions</span>
                <span className="font-semibold text-gray-900">{totalSessions}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                <span className="text-sm text-gray-600">Start Date</span>
                <span className="font-semibold text-gray-900">
                  {subscription.startDate ? formatDate(subscription.startDate) : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                <span className="text-sm text-gray-600">End Date</span>
                <span className="font-semibold text-gray-900">
                  {subscription.endDate ? formatDate(subscription.endDate) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">Usage Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100/50">
                <span className="text-sm text-gray-600">Sessions Remaining</span>
                <span className="font-bold text-green-600 text-lg">
                  {subscription.sessionsRemaining || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                <span className="text-sm text-gray-600">Sessions Used</span>
                <span className="font-semibold text-gray-900">{sessionsUsed}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                <span className="text-sm text-gray-600">Days Remaining</span>
                <span className={`font-semibold ${isExpiringSoon() ? "text-amber-600" : "text-gray-900"}`}>
                  {getDaysRemaining()} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar Card */}
      <motion.div 
        className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Session Usage</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 font-medium">Progress</span>
            <span className="font-semibold text-gray-900">
              {sessionsUsed} of {totalSessions} sessions used
            </span>
          </div>
          <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress()}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
              <span className="text-xs text-gray-500">
                {subscription.sessionsRemaining || 0} sessions remaining
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {Math.round(calculateProgress())}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Alerts */}
      {subscription.status === "expired" && (
        <motion.div 
          className="relative overflow-hidden bg-gradient-to-r from-red-50 via-pink-50 to-red-50 border border-red-200/50 rounded-3xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-red-200/20 to-pink-200/20 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-red-900 text-base mb-1">Subscription Expired</h4>
              <p className="text-red-700 text-sm mb-4 leading-relaxed">
                Your subscription has expired. Renew now to continue accessing our premium dental care services.
              </p>
              <motion.button
                onClick={onUpgrade}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-red-700 hover:to-pink-700 transition-all shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Renew Subscription
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {subscription.status === "suspended" && (
        <motion.div 
          className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200/50 rounded-3xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-200/20 to-yellow-200/20 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-amber-900 text-base mb-1">Subscription Suspended</h4>
              <p className="text-amber-700 text-sm mb-4 leading-relaxed">
                Your subscription is currently suspended. Please complete your payment to reactivate your account.
              </p>
              <motion.button
                onClick={onUpgrade}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete Payment
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {isExpiringSoon() && (
        <motion.div 
          className="relative overflow-hidden bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 border border-yellow-200/50 rounded-3xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-yellow-200/20 to-amber-200/20 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-yellow-900 text-base mb-1">Subscription Expiring Soon</h4>
              <p className="text-yellow-700 text-sm mb-4 leading-relaxed">
                Your subscription expires in {getDaysRemaining()} days. Renew now to avoid service interruption.
              </p>
              <motion.button
                onClick={onUpgrade}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-600 to-amber-600 text-white text-sm font-semibold rounded-xl hover:from-yellow-700 hover:to-amber-700 transition-all shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Renew Now
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upgrade Option */}
      {/* {subscription.status === "active" && !isExpiringSoon() && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Want More Sessions?</h3>
              <p className="text-gray-600 text-sm mt-1">
                Upgrade your plan to get more sessions and additional benefits.
              </p>
            </div>
            <button onClick={onUpgrade} className="btn-primary px-6 py-2">
              Upgrade Plan
            </button>
          </div>
        </div>
      )} */}
    </motion.div>
  );
};

export default SubscriptionStatus;
