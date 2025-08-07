import React, { useState, useRef } from "react";
import { LoadingSpinner } from "../../../shared/components";
import { formatDate } from "../../../shared/utils/formatters";
import { toast } from "react-hot-toast";
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PlusIcon,
  FolderIcon,
  PhotoIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

const DocumentsTab = ({ user, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const fileInputRef = useRef(null);

  const documents = user.documents || [];

  const documentTypes = [
    {
      value: "medical_report",
      label: "Medical Report",
      icon: DocumentTextIcon,
    },
    { value: "prescription", label: "Prescription", icon: DocumentTextIcon },
    { value: "x_ray", label: "X-Ray", icon: PhotoIcon },
    { value: "treatment_plan", label: "Treatment Plan", icon: DocumentIcon },
    { value: "consent_form", label: "Consent Form", icon: DocumentTextIcon },
    { value: "insurance", label: "Insurance Document", icon: DocumentIcon },
    { value: "identification", label: "ID Document", icon: DocumentIcon },
    { value: "other", label: "Other", icon: FolderIcon },
  ];

  const getDocumentIcon = (type) => {
    const docType = documentTypes.find((dt) => dt.value === type);
    return docType ? docType.icon : DocumentIcon;
  };

  const getDocumentTypeLabel = (type) => {
    const docType = documentTypes.find((dt) => dt.value === type);
    return docType ? docType.label : "Unknown";
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
      return PhotoIcon;
    }
    return DocumentIcon;
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // In a real implementation, this would upload to a file storage service
      const newDocuments = files.map((file) => ({
        _id: Date.now() + Math.random(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        type: "other", // Default type, user can change later
        uploadDate: new Date().toISOString(),
        uploadedBy: "admin", // Current admin user
        url: URL.createObjectURL(file), // Temporary URL for preview
      }));

      // Update user documents
      const updatedDocuments = [...documents, ...newDocuments];

      // This would typically call an API to update the user
      toast.success(`${files.length} document(s) uploaded successfully`);
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      toast.error("Failed to upload documents");
    } finally {
      setLoading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDocumentView = (document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const handleDocumentDownload = (document) => {
    // In a real implementation, this would download from the server
    const link = document.createElement("a");
    link.href = document.url;
    link.download = document.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Document download started");
  };

  const handleDocumentDelete = async (documentId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setLoading(true);
    try {
      // In a real implementation, this would call an API to delete the document
      toast.success("Document deleted successfully");
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      toast.error("Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const groupDocumentsByType = () => {
    const grouped = {};
    documents.forEach((doc) => {
      const type = doc.type || "other";
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(doc);
    });
    return grouped;
  };

  const groupedDocuments = groupDocumentsByType();

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Document Upload</h4>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#346870] hover:bg-[#2a5359] disabled:opacity-50"
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            Upload Documents
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
          onChange={handleFileUpload}
          className="hidden"
        />

        {loading && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Uploading documents...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#346870] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-sm text-gray-500">
            Supports PDF, DOC, DOCX, JPG, PNG, GIF (Max 10MB per file)
          </p>
        </div>
      </div>

      {/* Document Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Documents
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {documents.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <PhotoIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Images</p>
              <p className="text-2xl font-bold text-green-600">
                {
                  documents.filter((d) =>
                    ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(
                      d.fileName?.split(".").pop().toLowerCase()
                    )
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DocumentIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Documents</p>
              <p className="text-2xl font-bold text-purple-600">
                {
                  documents.filter((d) =>
                    ["pdf", "doc", "docx"].includes(
                      d.fileName?.split(".").pop().toLowerCase()
                    )
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FolderIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-yellow-600">
                {Object.keys(groupedDocuments).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents by Category */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No Documents Uploaded
          </h4>
          <p className="text-gray-500 mb-4">
            Upload documents to keep track of patient records and files.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#346870] hover:bg-[#2a5359]"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([type, docs]) => {
            const DocumentTypeIcon = getDocumentIcon(type);
            return (
              <div
                key={type}
                className="bg-white rounded-lg border border-gray-200"
              >
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <DocumentTypeIcon className="h-5 w-5 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-900">
                      {getDocumentTypeLabel(type)} ({docs.length})
                    </h4>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {docs.map((document) => {
                    const FileIcon = getFileIcon(document.fileName);
                    return (
                      <div key={document._id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <FileIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium text-gray-900 truncate">
                                {document.fileName}
                              </h5>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                <span>{formatFileSize(document.fileSize)}</span>
                                <span>
                                  Uploaded {formatDate(document.uploadDate)}
                                </span>
                                {document.uploadedBy && (
                                  <span>by {document.uploadedBy}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDocumentView(document)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="View Document"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDocumentDownload(document)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Download Document"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDocumentDelete(document._id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete Document"
                              disabled={loading}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Viewer Modal */}
      {showViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => {
            setShowViewer(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
};

// Document Viewer Modal Component
const DocumentViewer = ({ document, onClose }) => {
  const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(
    document.fileName?.split(".").pop().toLowerCase()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {document.fileName}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(document.uploadDate)}
            </p>
          </div>
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

        <div className="flex-1 overflow-auto p-4">
          {isImage ? (
            <img
              src={document.url}
              alt={document.fileName}
              className="max-w-full h-auto mx-auto"
            />
          ) : (
            <div className="text-center py-8">
              <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Preview not available for this file type.
              </p>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = document.url;
                  link.download = document.fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#346870] hover:bg-[#2a5359]"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;
