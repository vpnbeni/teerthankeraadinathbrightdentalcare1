import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import DashboardLayout from "../components/common/DashboardLayout";
import DocumentUpload from "../components/profile/DocumentUpload";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import PasswordChange from "../components/profile/PasswordChange";

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
    { 
      id: "personal", 
      label: "Personal Info", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      id: "medical", 
      label: "Medical Info", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: "documents", 
      label: "Documents", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: "security", 
      label: "Security", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20">
        {/* Premium Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#346870] via-[#2a5359] to-[#346870] rounded-xl md:rounded-2xl shadow-2xl mb-3 md:mb-6 p-4 md:p-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-blue-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden bg-white ring-2 md:ring-4 ring-white/20 shadow-xl">
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#346870] to-[#2a5359] flex items-center justify-center">
                      <span className="text-white text-2xl md:text-3xl font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-white">
                <h1 className="text-xl md:text-2xl font-bold mb-0.5 md:mb-1 tracking-tight">{user?.name || "User"}</h1>
                <p className="text-teal-100 text-xs md:text-sm flex items-center space-x-1.5 md:space-x-2">
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="truncate max-w-[150px] md:max-w-none">{user?.email || "No email provided"}</span>
                </p>
                <p className="text-teal-100 text-xs md:text-sm flex items-center space-x-1.5 md:space-x-2 mt-0.5 md:mt-1">
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>{user?.phone || "No phone provided"}</span>
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right text-white">
                <p className="text-xs text-teal-100 uppercase tracking-wider">Member Since</p>
                <p className="text-lg font-semibold">{new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Tab Navigation */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg mb-3 md:mb-4 p-1 md:p-1.5 backdrop-blur-sm bg-white/80">
          <div className="flex space-x-1 md:space-x-1.5 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 md:space-x-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#346870] to-[#2a5359] text-white shadow-md md:shadow-lg shadow-[#346870]/30"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#346870]"
                }`}
              >
                <span className="w-4 h-4 md:w-5 md:h-5">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Premium Tab Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden">
          <div className="p-4 md:p-6">
            {activeTab === "personal" && (
              <div className="animate-fade-in">
                <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
                  <div className="h-8 md:h-10 w-1 bg-gradient-to-b from-[#346870] to-teal-400 rounded-full"></div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800">
                    Personal Information
                  </h3>
                </div>
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
              <div className="animate-fade-in">
                <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
                  <div className="h-8 md:h-10 w-1 bg-gradient-to-b from-[#346870] to-teal-400 rounded-full"></div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800">
                    Medical Information
                  </h3>
                </div>
                <ProfileEditForm profile={user} type="medical" />
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-4 md:space-y-6 animate-fade-in">
                <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
                  <div className="h-8 md:h-10 w-1 bg-gradient-to-b from-[#346870] to-teal-400 rounded-full"></div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800">
                    Documents
                  </h3>
                </div>
                <DocumentUpload
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={(message) =>
                    console.error("Upload error:", message)
                  }
                />

                {loading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">Uploaded Documents</h4>
                      <span className="px-4 py-1.5 bg-gradient-to-r from-[#346870] to-teal-600 text-white text-sm font-medium rounded-full shadow-sm">
                        {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
                      </span>
                    </div>

                    {documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => (
                          <div
                            key={doc._id}
                            className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-[#346870]/30 transition-all duration-300"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <svg className="w-5 h-5 text-[#346870]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                  <h4 className="font-semibold text-gray-800 capitalize">
                                    {doc.type.replace(/_/g, " ")}
                                  </h4>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">
                                  {new Date(doc.uploadDate).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                                {doc.fileName && (
                                  <p className="text-xs text-gray-600 truncate">
                                    {doc.fileName}
                                  </p>
                                )}
                                {doc.fileSize && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col space-y-2">
                                <a
                                  href={
                                    doc.fileUrl?.startsWith("http")
                                      ? doc.fileUrl
                                      : `http://localhost:5000/${doc.fileUrl}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-[#346870] text-white text-xs font-medium rounded-lg hover:bg-[#2a5359] transition-colors shadow-sm"
                                >
                                  View
                                </a>
                                <button
                                  onClick={() => handleDeleteDocument(doc._id)}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border-2 border-dashed border-gray-300">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No documents uploaded yet</p>
                        <p className="text-sm text-gray-400 mt-1">Upload your first document to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="animate-fade-in">
                <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
                  <div className="h-8 md:h-10 w-1 bg-gradient-to-b from-[#346870] to-teal-400 rounded-full"></div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800">
                    Security Settings
                  </h3>
                </div>
                <PasswordChange />
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
