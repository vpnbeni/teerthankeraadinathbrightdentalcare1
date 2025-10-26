import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPhoneNumber } from "../../shared/utils/formatters";
import {
  UserIcon,
  HeartIcon,
  CreditCardIcon,
  CalendarIcon,
  XMarkIcon,
  PencilIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const UserDetailTabs = ({ user, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState("personal");

  if (!user) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: UserIcon },
    { id: "medical", label: "Medical Info", icon: HeartIcon },
    { id: "subscription", label: "Subscription", icon: CreditCardIcon },
    { id: "appointments", label: "Appointments", icon: CalendarIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Full Name
                </label>
                <p className="text-base font-semibold text-gray-900">{user.name || "N/A"}</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Phone Number
                </label>
                <p className="text-base font-semibold text-gray-900">
                  {formatPhoneNumber(user.phone)}
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <p className="text-base font-semibold text-gray-900 truncate">{user.email || "N/A"}</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Gender
                </label>
                <p className="text-base font-semibold text-gray-900 capitalize">
                  {user.gender || "N/A"}
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Alternative Phone
                </label>
                <p className="text-base font-semibold text-gray-900">
                  {user.alternativePhone
                    ? formatPhoneNumber(user.alternativePhone)
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Verification Status
                </label>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${
                    user.isVerified
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {user.isVerified ? (
                    <>
                      <CheckBadgeIcon className="w-4 h-4" />
                      Verified
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Unverified
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                <MapPinIcon className="w-4 h-4" />
                Address
              </label>
              <p className="text-base font-medium text-gray-900 leading-relaxed">{user.address || "N/A"}</p>
            </div>
          </div>
        );

      case "medical":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Systemic Diseases
              </label>
              {user.medicalInfo?.systemicDiseases?.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {user.medicalInfo.systemicDiseases.map((disease, index) => (
                    <li key={index} className="text-sm text-gray-900">
                      {disease}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">None reported</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drug Allergies
              </label>
              {user.medicalInfo?.drugAllergies?.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {user.medicalInfo.drugAllergies.map((allergy, index) => (
                    <li key={index} className="text-sm text-gray-900">
                      {allergy}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">None reported</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pregnancy Status
              </label>
              <p className="text-sm text-gray-900">
                {user.medicalInfo?.isPregnant
                  ? "Currently pregnant"
                  : "Not pregnant"}
              </p>
            </div>
          </div>
        );

      case "subscription":
        return (
          <div className="space-y-6">
            {user.subscription ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name
                  </label>
                  <p className="text-sm text-gray-900">
                    {user.subscription.planId?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Status
                  </label>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      user.subscription.status
                    )}`}
                  >
                    {user.subscription.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Price
                  </label>
                  <p className="text-sm text-gray-900">
                    ₹{user.subscription.planId?.price || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Sessions
                  </label>
                  <p className="text-sm text-gray-900">
                    {user.subscription.planId?.sessions || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sessions Remaining
                  </label>
                  <p className="text-sm text-gray-900">
                    {user.subscription.sessionsRemaining || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Duration
                  </label>
                  <p className="text-sm text-gray-900">
                    {user.subscription.planId?.duration || 0} months
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {user.subscription.startDate
                      ? new Date(
                          user.subscription.startDate
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {user.subscription.endDate
                      ? new Date(user.subscription.endDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No active subscription</p>
              </div>
            )}
          </div>
        );

      case "appointments":
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                Appointment history will be displayed here
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const statusConfig = getStatusColor(user.subscription?.status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-8">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#5fa8b5]/20 to-[#346870]/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6 flex-1 w-full">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#5fa8b5] to-[#346870] rounded-2xl flex items-center justify-center shadow-xl shadow-[#346870]/30">
                  <span className="text-white font-bold text-2xl sm:text-3xl">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                {user.isVerified && (
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center border-2 sm:border-4 border-slate-900 shadow-lg">
                    <CheckBadgeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">
                    {user.name}
                  </h2>
                  <span className={`inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold ${statusConfig} w-fit`}>
                    {user.subscription?.status || "No Plan"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-slate-300">
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{formatPhoneNumber(user.phone)}</span>
                  </div>
                  {user.email && (
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{user.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
              {onEdit && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onEdit(user)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:shadow-xl transition-all"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span className="sm:inline">Edit</span>
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all flex-shrink-0"
              >
                <XMarkIcon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Premium Tabs Navigation */}
        <div className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm overflow-x-auto">
          <nav className="flex px-4 sm:px-8 gap-1 sm:gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-3 sm:py-4 px-4 sm:px-6 font-semibold text-xs sm:text-sm flex items-center gap-2 sm:gap-2.5 transition-all whitespace-nowrap ${
                    isActive
                      ? "text-[#346870]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#346870] to-[#5fa8b5]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gradient-to-br from-gray-50/50 to-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserDetailTabs;
