import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import paymentService from "../../services/payments";
import { LoadingSpinner } from "../../shared/components";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await paymentService.getPaymentHistory();
        setPayments(response.data);
      } catch (error) {
        console.error("Failed to fetch payment history:", error);
        setError("Failed to load payment history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return (
          <svg
            className="w-4 h-4"
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
      case "pending":
        return (
          <svg
            className="w-4 h-4"
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
        );
      case "failed":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "refunded":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
          {error}
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/50 rounded-3xl p-8 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        <div className="relative text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
            No Payment History
          </h3>
          <p className="text-gray-600 text-base max-w-md mx-auto leading-relaxed">
            You haven't made any payments yet. Your transaction history will appear here once you make your first payment.
          </p>
        </div>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
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
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-6"
        variants={itemVariants}
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Payment History
          </h2>
        </div>
        <p className="text-gray-600 text-sm mt-2 ml-5">
          View all your past transactions and payment details
        </p>
      </motion.div>

      {/* Payment Cards */}
      <div className="space-y-4">
        {payments.map((payment, index) => (
          <motion.div 
            key={payment.id} 
            className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/30 transition-all duration-300"
            variants={itemVariants}
            whileHover={{ y: -4 }}
          >
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-base mb-1">
                    {payment.planName || "Dental Plan"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(payment.transactionDate)}
                  </div>
                  {payment.id && (
                    <div className="text-xs text-gray-500 font-mono">
                      ID: {payment.id}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {formatPrice(payment.amount)}
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm ${getStatusColor(payment.status)}`}>
                  {getStatusIcon(payment.status)}
                  <span className="capitalize">{payment.status}</span>
                </div>
              </div>
            </div>

            {payment.description && (
              <div className="relative mt-4 pt-4 border-t border-gray-200/50">
                <p className="text-sm text-gray-600 leading-relaxed">{payment.description}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PaymentHistory;
