import React from "react";
import {
  XMarkIcon,
  UserIcon,
  ClockIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { formatDate, formatTime } from "../../shared/utils/formatters";

const AuditLogDetailModal = ({ log, isOpen, onClose }) => {
  if (!isOpen || !log) return null;

  // Format changes for display
  const formatChanges = (changes) => {
    if (!changes || (!changes.before && !changes.after)) {
      return null;
    }

    return (
      <div className="space-y-4">
        {changes.before && (
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">Before:</h5>
            <pre className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-gray-800 overflow-x-auto">
              {JSON.stringify(changes.before, null, 2)}
            </pre>
          </div>
        )}
        {changes.after && (
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">After:</h5>
            <pre className="bg-green-50 border border-green-200 rounded-md p-3 text-xs text-gray-800 overflow-x-auto">
              {JSON.stringify(changes.after, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  // Format metadata for display
  const formatMetadata = (metadata) => {
    if (!metadata) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metadata.ipAddress && (
          <div className="flex items-center space-x-2">
            <GlobeAltIcon className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">IP Address</p>
              <p className="text-sm text-gray-600">{metadata.ipAddress}</p>
            </div>
          </div>
        )}
        {metadata.userAgent && (
          <div className="flex items-center space-x-2">
            <ComputerDesktopIcon className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">User Agent</p>
              <p
                className="text-sm text-gray-600 truncate"
                title={metadata.userAgent}
              >
                {metadata.userAgent}
              </p>
            </div>
          </div>
        )}
        {metadata.sessionId && (
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Session ID</p>
              <p className="text-sm text-gray-600 font-mono">
                {metadata.sessionId}
              </p>
            </div>
          </div>
        )}
        {metadata.endpoint && (
          <div className="flex items-center space-x-2">
            <GlobeAltIcon className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Endpoint</p>
              <p className="text-sm text-gray-600">
                <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                  {metadata.method}
                </span>{" "}
                {metadata.endpoint}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full ${
                  log.success ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {log.success ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Audit Log Details
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(log.createdAt)} at {formatTime(log.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#346870]"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Action</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {log.action.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Resource</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {log.resource}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Resource ID
                  </p>
                  <p className="text-sm text-gray-600 font-mono">
                    {log.resourceId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <div className="flex items-center">
                    {log.success ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm ${
                        log.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {log.success ? "Success" : "Failed"}
                    </span>
                  </div>
                </div>
                {log.errorMessage && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-900">
                      Error Message
                    </p>
                    <p className="text-sm text-red-600">{log.errorMessage}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Admin User
              </h4>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {log.adminId?.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {log.adminId?.name || "Unknown Admin"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {log.adminId?.email || "No email"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Role: {log.adminId?.role || "Unknown"}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {log.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Description
                </h4>
                <p className="text-sm text-gray-600">{log.description}</p>
              </div>
            )}

            {/* Changes */}
            {log.changes && (log.changes.before || log.changes.after) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Changes
                </h4>
                {formatChanges(log.changes)}
              </div>
            )}

            {/* Metadata */}
            {log.metadata && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Request Metadata
                </h4>
                {formatMetadata(log.metadata)}
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Timestamps
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Created At
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(log.createdAt)} at {formatTime(log.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Updated At
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(log.updatedAt)} at {formatTime(log.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetailModal;
