import { motion } from "framer-motion";
import {
  formatDate,
  formatPhoneNumber,
} from "../../shared/utils/formatters";
import {
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

const UserCard = ({ user, onSelect, onEdit }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "active":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          gradient: "from-green-500 to-emerald-600",
          label: "Active",
        };
      case "expired":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          gradient: "from-red-500 to-pink-600",
          label: "Expired",
        };
      case "suspended":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          gradient: "from-amber-500 to-orange-600",
          label: "Suspended",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          gradient: "from-gray-500 to-gray-600",
          label: "No Plan",
        };
    }
  };

  const getPlanName = (planId) => {
    if (typeof planId === "object" && planId?.name) {
      return planId.name;
    }
    const planNames = {
      "6-sessions": "6 Sessions Plan",
      "8-sessions": "8 Sessions Plan",
      "12-sessions": "12 Sessions Plan",
    };
    return planNames[planId] || "Unknown Plan";
  };

  const statusConfig = getStatusConfig(user.subscription?.status);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group relative bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-300/50 transition-all duration-300"
    >
      {/* Mobile Layout */}
      <div className="flex flex-col sm:hidden gap-3">
        {/* Mobile Header */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 bg-gradient-to-br ${statusConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {user.isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <CheckBadgeIcon className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Name and Status */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate mb-1">
              {user.name}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Mobile Contact Info */}
        <div className="space-y-1.5 text-xs">
          {user.phone && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <PhoneIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium">{formatPhoneNumber(user.phone)}</span>
            </div>
          )}
          {user.email && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
        </div>

        {/* Mobile Subscription Info */}
        {user.subscription && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-2.5 border border-gray-200/50">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] font-medium text-gray-500 mb-0.5">Plan</p>
                <p className="text-xs font-bold text-gray-900 truncate">
                  {getPlanName(user.subscription.planId).split(' ')[0]}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-500 mb-0.5">Sessions</p>
                <p className="text-xs font-bold text-gray-900">
                  <span className="text-[#346870]">{user.subscription.sessionsRemaining}</span>
                  <span className="text-gray-400">/{user.subscription.totalSessions || "N/A"}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-500 mb-0.5">Expires</p>
                <p className="text-xs font-bold text-gray-900">
                  {new Date(user.subscription.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Footer */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-200/50">
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            <span>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" })}</span>
          </div>
          {!user.isVerified && (
            <div className="flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              <ExclamationTriangleIcon className="w-2.5 h-2.5" />
              <span className="font-semibold">Unverified</span>
            </div>
          )}
        </div>

        {/* Mobile Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#346870] bg-white border border-[#346870]/30 rounded-lg hover:bg-[#346870]/5 transition-all shadow-sm"
          >
            <EyeIcon className="w-3.5 h-3.5" />
            View
          </motion.button>
          {onEdit && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#346870] to-[#5fa8b5] rounded-lg hover:shadow-lg transition-all"
            >
              <PencilIcon className="w-3.5 h-3.5" />
              Edit
            </motion.button>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-start gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-16 h-16 bg-gradient-to-br ${statusConfig.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
            <span className="text-white font-bold text-2xl">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {user.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              <CheckBadgeIcon className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900 truncate">
                  {user.name}
                </h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                  {statusConfig.label}
                </span>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {user.phone && (
                  <div className="flex items-center gap-1.5">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{formatPhoneNumber(user.phone)}</span>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center gap-1.5">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                    <span className="truncate max-w-xs">{user.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#346870] bg-white border border-[#346870]/30 rounded-xl hover:bg-[#346870]/5 hover:border-[#346870] transition-all shadow-sm"
              >
                <EyeIcon className="w-4 h-4" />
                View
              </motion.button>
              {onEdit && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#346870] to-[#5fa8b5] rounded-xl hover:shadow-lg hover:shadow-[#346870]/25 transition-all"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </motion.button>
              )}
            </div>
          </div>

          {/* Subscription Info Card */}
          {user.subscription && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 mb-3 border border-gray-200/50">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Plan</p>
                  <p className="text-sm font-bold text-gray-900">
                    {getPlanName(user.subscription.planId)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Sessions</p>
                  <p className="text-sm font-bold text-gray-900">
                    <span className="text-[#346870]">{user.subscription.sessionsRemaining}</span>
                    <span className="text-gray-400"> / {user.subscription.totalSessions || user.subscription.planId?.sessions || "N/A"}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Expires</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatDate(user.subscription.endDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
              {user.lastLogin && (
                <span>Last login {formatDate(user.lastLogin)}</span>
              )}
            </div>

            {!user.isVerified && (
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                <span className="font-semibold">Unverified</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;
