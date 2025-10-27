import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../components/common/AdminLayout";
import { LoadingSpinner } from "../shared/components";
import { fetchSystemSettings, setActiveTab } from "../store/settingsSlice";
import EmailTemplateEditor from "../components/settings/EmailTemplateEditor";
import BusinessRulesConfig from "../components/settings/BusinessRulesConfig";
import TimeSlotDefaults from "../components/settings/TimeSlotDefaults";
import AdminNotificationConfig from "../components/settings/AdminNotificationConfig";
import PasswordChange from "../components/settings/PasswordChange";
import {
  EnvelopeIcon,
  Cog6ToothIcon,
  ClockIcon,
  DocumentTextIcon,
  BellIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const SystemSettings = () => {
  const dispatch = useDispatch();
  const { loading, activeTab, lastUpdated, error } = useSelector(
    (state) => state.settings
  );

  useEffect(() => {
    dispatch(fetchSystemSettings());
  }, [dispatch]);

  const tabs = [
    {
      id: "email-templates",
      name: "Email Templates",
      icon: EnvelopeIcon,
      component: EmailTemplateEditor,
      description: "Customize email notification templates",
    },
    {
      id: "business-rules",
      name: "Business Rules",
      icon: Cog6ToothIcon,
      component: BusinessRulesConfig,
      description: "Configure booking and operational policies",
    },
    {
      id: "time-slots",
      name: "Time Slot Defaults",
      icon: ClockIcon,
      component: TimeSlotDefaults,
      description: "Set default availability time slots",
    },
    {
      id: "admin-notifications",
      name: "Admin Notifications",
      icon: BellIcon,
      component: AdminNotificationConfig,
      description: "Configure admin notification email for appointment alerts",
    },
    {
      id: "security",
      name: "Security",
      icon: ShieldCheckIcon,
      component: PasswordChange,
      description: "Change your password and manage security settings",
    },
  ];

  const handleTabChange = (tabId) => {
    dispatch(setActiveTab(tabId));
  };

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  if (loading && !lastUpdated) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" ariaLabel="Loading system settings" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                System Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Configure system-wide settings and preferences
              </p>
            </div>
            {lastUpdated && (
              <div className="text-sm text-gray-500">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading settings
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tabs */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? "border-[#346870] text-[#346870]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <tab.icon
                      className={`-ml-0.5 mr-2 h-5 w-5 ${
                        isActive
                          ? "text-[#346870]"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                      aria-hidden="true"
                    />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab Description */}
            <div className="mb-6">
              <p className="text-gray-600">
                {tabs.find((tab) => tab.id === activeTab)?.description}
              </p>
            </div>

            {/* Active Tab Component */}
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Settings Help
              </h3>
              <div className="text-sm text-blue-700 mt-1">
                <p>
                  Changes to system settings are applied immediately and affect
                  all users. Use caution when modifying these configurations.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    <strong>Email Templates:</strong> Customize notification
                    emails sent to patients
                  </li>
                  <li>
                    <strong>Business Rules:</strong> Set booking limits,
                    cancellation policies, and operational constraints
                  </li>
                  <li>
                    <strong>Time Slot Defaults:</strong> Configure default
                    availability patterns for appointment scheduling
                  </li>
                  <li>
                    <strong>Admin Notifications:</strong> Set up email notifications
                    for appointment bookings and other admin alerts
                  </li>
                  <li>
                    <strong>Security:</strong> Change your password and manage
                    account security settings
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemSettings;
