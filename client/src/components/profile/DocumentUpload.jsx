import React, { useState, useRef } from "react";
import userService from "../../services/user";
import { LoadingSpinner } from "../../shared/components";

const DocumentUpload = ({ onUploadSuccess, onUploadError }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const fileInputRef = useRef(null);

  const documentTypes = [
    { value: "id_proof", label: "ID Proof", icon: "🆔" },
    { value: "medical_record", label: "Medical Record", icon: "🏥" },
    { value: "insurance", label: "Insurance Document", icon: "🛡️" },
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (!selectedDocumentType) {
        onUploadError("Please select a document type first");
        return;
      }
      handleFileUpload(e.dataTransfer.files[0], selectedDocumentType);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      if (!selectedDocumentType) {
        onUploadError("Please select a document type first");
        return;
      }
      handleFileUpload(e.target.files[0], selectedDocumentType);
    }
  };

  const handleFileUpload = async (file, documentType) => {
    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      onUploadError("Please upload only JPG, PNG, or PDF files");
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onUploadError("File size must be less than 5MB");
      return;
    }

    if (!documentType) {
      onUploadError("Please select a document type");
      return;
    }

    try {
      setUploading(true);
      console.log("Uploading document:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        documentType: documentType,
      });

      const response = await userService.uploadDocument(
        {
          file,
          type: documentType,
        },
        { skipErrorMessage: true }
      ); // Skip error message from axios interceptor

      console.log("Upload successful:", response);
      onUploadSuccess();

      // Reset form
      setSelectedDocumentType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      onUploadError(
        error.response?.data?.message || "Failed to upload document"
      );
    } finally {
      setUploading(false);
    }
  };

  const DocumentTypeCard = ({ type, onSelect }) => (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#346870] hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => {
        fileInputRef.current?.click();
        fileInputRef.current.onchange = (e) => {
          if (e.target.files[0]) {
            handleFileUpload(e.target.files[0], type.value);
          }
        };
      }}
    >
      <div className="text-4xl mb-2">{type.icon}</div>
      <h3 className="font-medium text-gray-800 mb-1">{type.label}</h3>
      <p className="text-sm text-gray-500">Click to upload</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
        <p className="text-gray-600 mb-6">
          Upload your documents for verification. Accepted formats: JPG, PNG,
          PDF (max 5MB)
        </p>
      </div>

      {/* Document Type Selection */}
      <div className="grid md:grid-cols-3 gap-4">
        {documentTypes.map((type) => (
          <DocumentTypeCard key={type.value} type={type} />
        ))}
      </div>

      {/* Document Type Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Document Type for Upload
        </label>
        <select
          value={selectedDocumentType}
          onChange={(e) => setSelectedDocumentType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
        >
          <option value="">Choose document type...</option>
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-[#346870] bg-blue-50"
            : selectedDocumentType
            ? "border-gray-300 hover:border-gray-400"
            : "border-gray-200 bg-gray-50"
        } ${!selectedDocumentType ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragEnter={selectedDocumentType ? handleDrag : undefined}
        onDragLeave={selectedDocumentType ? handleDrag : undefined}
        onDragOver={selectedDocumentType ? handleDrag : undefined}
        onDrop={selectedDocumentType ? handleDrop : undefined}
      >
        {uploading ? (
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner />
            <p className="text-gray-600">Uploading document...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl text-gray-400">📁</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drag and drop files here
              </p>
              <p className="text-gray-500">or</p>
              <button
                type="button"
                onClick={() => {
                  if (!selectedDocumentType) {
                    onUploadError("Please select a document type first");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className={`font-medium ${
                  selectedDocumentType
                    ? "text-[#346870] hover:text-[#2a5359]"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                Browse files
              </button>
            </div>
            <p className="text-sm text-gray-500">JPG, PNG, PDF up to 5MB</p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleFileSelect}
      />

      {/* Upload Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Upload Guidelines:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Ensure documents are clear and readable</li>
          <li>• All text should be visible and not cut off</li>
          <li>• File size should not exceed 5MB</li>
          <li>• Supported formats: JPG, PNG, PDF</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentUpload;
