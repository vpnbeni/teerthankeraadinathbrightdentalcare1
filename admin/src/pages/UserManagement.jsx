import React, { useState, useEffect } from "react";
import AdminLayout from "../components/common/AdminLayout";
import UserList from "../components/users/UserList";
import UserFilters from "../components/users/UserFilters";
import UserDetailTabs from "../components/users/UserDetailTabs";
import UserEditor from "../components/users/UserEditor";
import Pagination from "../components/common/Pagination";
import { LoadingSpinner } from "../shared/components";
import userService from "../services/users";
import { toast } from "react-hot-toast";
import { PlusIcon, FunnelIcon } from "@heroicons/react/24/outline";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserEditor, setShowUserEditor] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Fetch users
  const fetchUsers = async (page = 1, currentFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 10,
        ...currentFilters,
      };

      const response = await userService.getUsers(params);

      if (response.success) {
        setUsers(response.data.users || []);
        setTotalUsers(response.data.pagination?.totalUsers || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setCurrentPage(response.data.pagination?.currentPage || 1);
      } else {
        throw new Error(response.message || "Failed to fetch users");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers(1, filters);
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchUsers(1, newFilters);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
    fetchUsers(1, {});
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUsers(page, filters);
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserEditor(true);
  };

  // Handle create user
  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserEditor(true);
  };

  // Handle close modals
  const handleCloseModals = () => {
    setSelectedUser(null);
    setShowUserEditor(false);
    setShowUserProfile(false);
  };

  // Handle user updated
  const handleUserUpdated = () => {
    handleCloseModals();
    fetchUsers(currentPage, filters);
    toast.success("User updated successfully");
  };

  // Handle retry
  const handleRetry = () => {
    fetchUsers(currentPage, filters);
  };

  // Calculate stats from current users
  const stats = {
    total: totalUsers,
    active: users.filter((u) => u.subscription?.status === "active").length,
    expired: users.filter((u) => u.subscription?.status === "expired").length,
    newToday: users.filter(
      (u) => new Date(u.createdAt).toDateString() === new Date().toDateString()
    ).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-600">
              Manage patient accounts and subscriptions
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
              onClick={handleCreateUser}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#346870] hover:bg-[#2a5359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {stats.total}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  Active Users
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">E</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  Expired Plans
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.expired}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">N</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">New Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.newToday}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow">
            <UserFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}

        {/* User List */}
        <div className="bg-white rounded-lg shadow">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">Error loading users: {error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-[#346870] hover:text-[#2a5359] font-medium"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className="p-6">
                <UserList
                  users={users}
                  loading={loading}
                  onUserSelect={handleUserSelect}
                  onEditUser={handleEditUser}
                />
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

      {/* User Detail Tabs Modal */}
      {showUserProfile && selectedUser && (
        <UserDetailTabs
          user={selectedUser}
          onClose={handleCloseModals}
          onEdit={() => {
            setShowUserProfile(false);
            setShowUserEditor(true);
          }}
        />
      )}

      {/* User Editor Modal */}
      {showUserEditor && (
        <UserEditor
          user={selectedUser}
          onClose={handleCloseModals}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </AdminLayout>
  );
};

export default UserManagement;
