import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import DashboardLayout from "../components/common/DashboardLayout";
import DocumentUpload from "../components/profile/DocumentUpload";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import SubscriptionInfo from "../components/profile/SubscriptionInfo";
import { LoadingSpinner } from "../shared/components";
import userService from "../services/user";

const Profile = () => {
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

  const tabs = [
    { id: "personal", label: "Personal Info", icon: "👤" },
    { id: "medical", label: "Medical Info", icon: "🏥" },
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
