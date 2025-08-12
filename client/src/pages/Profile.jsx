import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import DashboardLayout from "../components/common/DashboardLayout";
import DocumentUpload from "../components/profile/DocumentUpload";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import SubscriptionInfo from "../components/profile/SubscriptionInfo";

import { LoadingSpinner } from "../shared/components";
import userService from "../services/user";
import { updateUser } from "../store/authSlice";

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("personal");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch latest user profile when component mounts
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const response = await userService.getProfile();
        if (response.data.success && response.data.data) {
          dispatch(updateUser(response.data.data));
        }
      } catch (error) {
        console.error("Failed to fetch latest profile:", error);
      }
    };

    fetchLatestProfile();
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === "documents") {
      fetchDocuments();
    }
  }, [activeTab]);

  useEffect(() => {
    console.log("Documents state changed:", documents);
  }, [documents]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await userService.getDocuments();
      console.log("Documents response:", response);
      console.log("Documents data:", response.data);
      const docs = response.data.documents || [];
      console.log("Setting documents:", docs);
      setDocuments(docs);
      console.log("Documents state after setting:", docs.length);
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
              <ProfileEditForm
                profile={user}
                type="personal"
                onUserUpdate={(updatedUser) =>
                  dispatch(updateUser(updatedUser))
                }
              />
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
                  <p className="text-sm text-gray-500">
                    Found {documents.length} documents
                  </p>
                  <div className="text-xs text-gray-400 mb-2">
                    Debug:{" "}
                    {JSON.stringify(
                      documents.map((d) => ({ id: d._id, type: d.type }))
                    )}
                  </div>
                  {documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc) => (
                        <div
                          key={doc._id}
                          className="border rounded-lg p-4 flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium capitalize">
                              {doc.type.replace(/_/g, " ")}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Uploaded on{" "}
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                            {doc.fileName && (
                              <p className="text-sm text-gray-600 mt-1">
                                File: {doc.fileName}
                              </p>
                            )}
                            {doc.fileSize && (
                              <p className="text-sm text-gray-500">
                                Size: {(doc.fileSize / 1024 / 1024).toFixed(2)}{" "}
                                MB
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <a
                              href={
                                doc.fileUrl?.startsWith("http")
                                  ? doc.fileUrl
                                  : `http://localhost:5000/${doc.fileUrl}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </a>
                            <button
                              onClick={() => handleDeleteDocument(doc._id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
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
