import React, { useState } from "react";
import { LoadingSpinner } from "../../shared/components";
import { formatPhoneNumber } from "../../shared/utils/formatters";
import {
  UserIcon,
  HeartIcon,
  CreditCardIcon,
  CalendarIcon,
  XMarkIcon,
  PencilIcon,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <p className="text-sm text-gray-900">{user.name || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <p className="text-sm text-gray-900">
                  {formatPhoneNumber(user.phone)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <p className="text-sm text-gray-900">{user.email || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <p className="text-sm text-gray-900 capitalize">
                  {user.gender || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alternative Phone
                </label>
                <p className="text-sm text-gray-900">
                  {user.alternativePhone
                    ? formatPhoneNumber(user.alternativePhone)
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Status
                </label>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.isVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.isVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <p className="text-sm text-gray-900">{user.address || "N/A"}</p>
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
                    Sessions Remaining
                  </label>
                  <p className="text-sm text-gray-900">
                    {user.subscription.sessionsRemaining || 0}
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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#346870] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-2xl">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    user.subscription?.status
                  )}`}
                >
                  {user.subscription?.status || "No Plan"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-gray-600">
                <span>{formatPhoneNumber(user.phone)}</span>
                {user.email && <span>{user.email}</span>}
                {user.isVerified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(user)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit User
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex px-6 space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    isActive
                      ? "border-[#346870] text-[#346870]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default UserDetailTabs;
