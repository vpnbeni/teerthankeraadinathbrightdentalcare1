import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../components/common/AdminLayout";
import { LoadingSpinner } from "../shared/components";
import { fetchSessions, setFilters, clearFilters } from "../store/sessionSlice";
import { fetchRecentUsers } from "../store/userSlice";
import Pagination from "../components/common/Pagination";
import {
  DocumentTextIcon,
  PlusIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const SessionManagement = () => {
  const dispatch = useDispatch();
  const {
    sessions,
    loading,
    error,
    totalSessions,
    currentPage,
    totalPages,
    filters,
  } = useSelector((state) => state.sessions || {});
  const { users = [] } = useSelector((state) => state.users || {});

  const [showFilters, setShowFilters] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  useEffect(() => {
    dispatch(fetchSessions({ page: currentPage, ...filters }));
    dispatch(fetchRecentUsers({ limit: 1000 })); // Get all users for dropdown
  }, [dispatch, currentPage, filters]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const handlePageChange = (page) => {
    dispatch(fetchSessions({ page, ...filters }));
  };

  const handleCreateSession = () => {
    setSelectedSession(null);
    setShowSessionForm(true);
  };

  const handleEditSession = (session) => {
    setSelectedSession(session);
    setShowSessionForm(true);
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  const handleCloseModals = () => {
    setSelectedSession(null);
    setShowSessionForm(false);
    setShowSessionDetails(false);
  };

  const handleSessionUpdated = () => {
    dispatch(fetchSessions({ page: currentPage, ...filters }));
    handleCloseModals();
    toast.success("Session updated successfully");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Session Management
            </h1>
            <p className="text-gray-600">
              Record and manage dental examination sessions
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={handleCreateSession}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#346870] hover:bg-[#2a5359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Session
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  Total Sessions
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {totalSessions || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {sessions?.filter((s) => s.status === "completed")?.length ||
                    0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">T</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {sessions?.filter(
                    (s) =>
                      new Date(s.completedAt).toDateString() ===
                      new Date().toDateString()
                  )?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">W</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">This Week</p>
                <p className="text-lg font-semibold text-gray-900">
                  {sessions?.filter((s) => {
                    const sessionDate = new Date(s.completedAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return sessionDate >= weekAgo;
                  })?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient
                </label>
                <select
                  value={filters.userId || ""}
                  onChange={(e) =>
                    handleFilterChange({ ...filters, userId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                >
                  <option value="">All Patients</option>
                  {users?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} - {user.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={filters.dateRange || ""}
                  onChange={(e) =>
                    handleFilterChange({
                      ...filters,
                      dateRange: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="large" ariaLabel="Loading sessions" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">Error loading sessions: {error}</p>
              <button
                onClick={() =>
                  dispatch(fetchSessions({ page: currentPage, ...filters }))
                }
                className="mt-2 text-[#346870] hover:text-[#2a5359] font-medium"
              >
                Try again
              </button>
            </div>
          ) : sessions?.length === 0 ? (
            <div className="p-6 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No sessions found</p>
              <button
                onClick={handleCreateSession}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#346870] hover:bg-[#2a5359]"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create First Session
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Examination Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessions.map((session) => (
                      <tr key={session._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-[#346870] rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {session.user?.name?.charAt(0)?.toUpperCase() ||
                                  "U"}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {session.user?.name || "Unknown User"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {session.user?.phone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(session.completedAt).toLocaleDateString()}
                          <br />
                          <span className="text-gray-500">
                            {new Date(session.completedAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <p>
                              <strong>Teeth Present:</strong>{" "}
                              {session.examination?.teethPresent || "N/A"}
                            </p>
                            <p>
                              <strong>Caries:</strong>{" "}
                              {session.examination?.cariesStatus || "N/A"}
                            </p>
                            {session.examination?.customFields?.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                +{session.examination.customFields.length}{" "}
                                custom fields
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.completedBy?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewSession(session)}
                              className="text-[#346870] hover:text-[#2a5359]"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditSession(session)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Session"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Session Form Modal - Placeholder for now */}
      {showSessionForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedSession ? "Edit Session" : "New Session"}
                </h3>
                <p className="text-gray-600">
                  Session form implementation coming soon...
                </p>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleCloseModals}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal - Placeholder for now */}
      {showSessionDetails && selectedSession && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Session Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <strong>Patient:</strong> {selectedSession.user?.name}
                  </div>
                  <div>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedSession.completedAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>Teeth Present:</strong>{" "}
                    {selectedSession.examination?.teethPresent || "N/A"}
                  </div>
                  <div>
                    <strong>Caries Status:</strong>{" "}
                    {selectedSession.examination?.cariesStatus || "N/A"}
                  </div>
                  <div>
                    <strong>Notes:</strong>{" "}
                    {selectedSession.notes || "No notes"}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleCloseModals}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SessionManagement;
