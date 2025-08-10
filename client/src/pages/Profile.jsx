import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import DashboardLayout from "../components/common/DashboardLayout";
import DocumentUpload from "../components/profile/DocumentUpload";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import SubscriptionInfo from "../components/profile/SubscriptionInfo";
import PhoneVerification from "../components/profile/PhoneVerification";
import { LoadingSpinner } from "../shared/components";
import userService from "../services/user";
import { updateUser } from "../store/authSlice";

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("personal");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "documents") {
      fetchDocuments();
    }
  }, [activeTab]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await userService.getDocuments();
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await userService.deleteDocument(documentId);
      fetchDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handlePhoneVerified = (updatedUser) => {
    dispatch(updateUser(updatedUser));
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: "👤" },
    { id: "medical", label: "Medical Info", icon: "🏥" },
    { id: "security", label: "Account Security", icon: "🔒" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "subscription", label: "Subscription", icon: "💳" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#346870] text-[#346870]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === "personal" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">
                Personal Information
              </h3>
              <ProfileEditForm profile={user} type="personal" />
            </div>
          )}

          {activeTab === "medical" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">
                Medical Information
              </h3>
              <ProfileEditForm profile={user} type="medical" />
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-6">Account Security</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">
                    Login Methods
                  </h4>

                  {/* Email Status */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-gray-500 mr-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-800">Email</p>
                          <p className="text-sm text-gray-600">
                            {user?.email || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {user?.emailVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phone Verification */}
                  <PhoneVerification
                    user={user}
                    onPhoneVerified={handlePhoneVerified}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6">
              <DocumentUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(message) =>
                  console.error("Upload error:", message)
                }
              />

              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Uploaded Documents</h3>
                  {documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc) => (
                        <div
                          key={doc._id}
                          className="border rounded-lg p-4 flex items-start justify-between"
                        >
                          <div>
                            <h4 className="font-medium">{doc.type}</h4>
                            <p className="text-sm text-gray-500">
                              Uploaded on{" "}
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No documents uploaded yet.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "subscription" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">
                Subscription Details
              </h3>
              <SubscriptionInfo subscription={user.subscription} />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
