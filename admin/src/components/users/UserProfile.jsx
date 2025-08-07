import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserById, clearSelectedUser } from "../../store/userSlice";
import UserEditor from "./UserEditor";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import {
  formatDate,
  formatPhoneNumber,
  formatCurrency,
} from "../../shared/utils/formatters";
import { toast } from "react-hot-toast";

const UserProfile = ({ userId, onClose }) => {
  const dispatch = useDispatch();
  const { selectedUser, loading, error } = useSelector((state) => state.users);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserById(userId));
    }
    return () => {
      dispatch(clearSelectedUser());
    };
  }, [userId, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!selectedUser) {
    return null;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "user" },
    { id: "subscription", label: "Subscription", icon: "credit-card" },
    { id: "appointments", label: "Appointments", icon: "calendar" },
    { id: "sessions", label: "Sessions", icon: "clipboard-list" },
    { id: "payments", label: "Payments", icon: "currency-dollar" },
    { id: "documents", label: "Documents", icon: "document" },
  ];

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab user={selectedUser} />;
      case "subscription":
        return <SubscriptionTab user={selectedUser} />;
      case "appointments":
        return <AppointmentsTab userId={selectedUser._id} />;
      case "sessions":
        return <SessionsTab userId={selectedUser._id} />;
      case "payments":
        return <PaymentsTab userId={selectedUser._id} />;
      case "documents":
        return <DocumentsTab user={selectedUser} />;
      default:
        return <OverviewTab user={selectedUser} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-2xl">
                {selectedUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedUser.name}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    selectedUser.subscription?.status
                  )}`}
                >
                  {selectedUser.subscription?.status || "No Plan"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-gray-600">
                <span>{formatPhoneNumber(selectedUser.phone)}</span>
                {selectedUser.email && <span>{selectedUser.email}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary"
            >
              Edit User
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderTabContent()}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <UserEditor
          user={selectedUser}
          onClose={() => setIsEditing(false)}
          onSave={() => {
            setIsEditing(false);
            dispatch(fetchUserById(selectedUser._id));
          }}
        />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ user }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Personal Information */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Personal Information
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-500">Full Name</label>
          <p className="text-gray-900">{user.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Phone</label>
          <p className="text-gray-900">{formatPhoneNumber(user.phone)}</p>
        </div>
        {user.email && (
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
        )}
        {user.address && (
          <div>
            <label className="text-sm font-medium text-gray-500">Address</label>
            <p className="text-gray-900">{user.address}</p>
          </div>
        )}
        {user.gender && (
          <div>
            <label className="text-sm font-medium text-gray-500">Gender</label>
            <p className="text-gray-900 capitalize">{user.gender}</p>
          </div>
        )}
      </div>
    </div>

    {/* Account Information */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Account Information
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-500">
            Registration Date
          </label>
          <p className="text-gray-900">{formatDate(user.createdAt)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Verification Status
          </label>
          <p
            className={`font-medium ${
              user.isVerified ? "text-green-600" : "text-yellow-600"
            }`}
          >
            {user.isVerified ? "Verified" : "Unverified"}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Role</label>
          <p className="text-gray-900 capitalize">{user.role}</p>
        </div>
        {user.lastLoginAt && (
          <div>
            <label className="text-sm font-medium text-gray-500">
              Last Login
            </label>
            <p className="text-gray-900">{formatDate(user.lastLoginAt)}</p>
          </div>
        )}
      </div>
    </div>

    {/* Medical Information */}
    {user.medicalInfo && (
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Medical Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.medicalInfo.systemicDiseases?.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                Systemic Diseases
              </label>
              <ul className="text-gray-900 list-disc list-inside">
                {user.medicalInfo.systemicDiseases.map((disease, index) => (
                  <li key={index}>{disease}</li>
                ))}
              </ul>
            </div>
          )}
          {user.medicalInfo.drugAllergies?.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                Drug Allergies
              </label>
              <ul className="text-gray-900 list-disc list-inside">
                {user.medicalInfo.drugAllergies.map((allergy, index) => (
                  <li key={index}>{allergy}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

// Subscription Tab Component
const SubscriptionTab = ({ user }) => (
  <div className="space-y-6">
    {user.subscription ? (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="admin-card">
            <h4 className="font-medium text-gray-900">Plan Status</h4>
            <p
              className={`text-2xl font-bold mt-2 ${
                user.subscription.status === "active"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {user.subscription.status.toUpperCase()}
            </p>
          </div>
          <div className="admin-card">
            <h4 className="font-medium text-gray-900">Sessions Remaining</h4>
            <p className="text-2xl font-bold text-primary-600 mt-2">
              {user.subscription.sessionsRemaining}/
              {user.subscription.totalSessions}
            </p>
          </div>
          <div className="admin-card">
            <h4 className="font-medium text-gray-900">Plan Expires</h4>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {formatDate(user.subscription.endDate)}
            </p>
          </div>
        </div>

        <div className="admin-card">
          <h4 className="font-medium text-gray-900 mb-4">
            Subscription Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Start Date
              </label>
              <p className="text-gray-900">
                {formatDate(user.subscription.startDate)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                End Date
              </label>
              <p className="text-gray-900">
                {formatDate(user.subscription.endDate)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Total Sessions
              </label>
              <p className="text-gray-900">{user.subscription.totalSessions}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Sessions Used
              </label>
              <p className="text-gray-900">
                {user.subscription.totalSessions -
                  user.subscription.sessionsRemaining}
              </p>
            </div>
          </div>
        </div>
      </>
    ) : (
      <div className="text-center py-8">
        <p className="text-gray-500">No active subscription</p>
      </div>
    )}
  </div>
);

// Placeholder components for other tabs
const AppointmentsTab = ({ userId }) => (
  <div className="text-center py-8">
    <p className="text-gray-500">Appointments will be loaded here</p>
  </div>
);

const SessionsTab = ({ userId }) => (
  <div className="text-center py-8">
    <p className="text-gray-500">Sessions will be loaded here</p>
  </div>
);

const PaymentsTab = ({ userId }) => (
  <div className="text-center py-8">
    <p className="text-gray-500">Payment history will be loaded here</p>
  </div>
);

const DocumentsTab = ({ user }) => (
  <div className="space-y-4">
    {user.documents?.length > 0 ? (
      user.documents.map((doc, index) => (
        <div key={index} className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 capitalize">
                {doc.type.replace("_", " ")}
              </h4>
              <p className="text-sm text-gray-500">
                Uploaded: {formatDate(doc.uploadDate)}
              </p>
            </div>
            <button className="btn-secondary-sm">View Document</button>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-8">
        <p className="text-gray-500">No documents uploaded</p>
      </div>
    )}
  </div>
);

export default UserProfile;
