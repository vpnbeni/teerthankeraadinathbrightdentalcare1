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
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlusIcon, 
  FunnelIcon, 
  UsersIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  SparklesIcon 
} from "@heroicons/react/24/outline";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <AdminLayout>
      <motion.div
        className="space-y-8 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Premium Header Section - Ribbon Style on Mobile */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-12 shadow-2xl"
        >
          {/* Ambient background effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#346870]/30 to-[#5fa8b5]/30 rounded-full blur-3xl"></div>

          <div className="relative flex flex-row items-center justify-between gap-3 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <UsersIcon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                </div>
              </motion.div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-5xl font-bold text-white tracking-tight truncate">
                  User Management
                </h1>
                <p className="hidden md:block text-slate-300 text-lg leading-relaxed max-w-2xl mt-3">
                  Manage patient accounts, subscriptions, and monitor user activity across your clinic.
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold transition-all shadow-lg ${
                showFilters
                  ? "bg-white text-slate-900 shadow-white/20"
                  : "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 shadow-black/10"
              }`}
            >
              <FunnelIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">{showFilters ? "Hide" : "Show"}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Premium Stats Cards - Horizontal Scroll on Mobile */}
        <div className="flex md:grid overflow-x-auto md:overflow-visible gap-3 md:gap-5 md:grid-cols-2 lg:grid-cols-4 pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          <motion.div
            variants={itemVariants}
            className="flex-shrink-0 w-32 md:w-auto md:flex-1 group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-2 md:gap-0 mb-3 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <UsersIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="px-2 py-0.5 md:px-3 md:py-1 bg-blue-100 text-blue-700 text-[10px] md:text-xs font-semibold rounded-full">
                  All
                </div>
              </div>
              <div className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2 tracking-tight text-center md:text-left">
                {stats.total}
              </div>
              <p className="text-gray-600 font-medium text-[10px] md:text-sm text-center md:text-left">Total Users</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex-shrink-0 w-32 md:w-auto md:flex-1 group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-green-200/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-2 md:gap-0 mb-3 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                  <CheckCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="px-2 py-0.5 md:px-3 md:py-1 bg-green-100 text-green-700 text-[10px] md:text-xs font-semibold rounded-full">
                  Active
                </div>
              </div>
              <div className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2 tracking-tight text-center md:text-left">
                {stats.active}
              </div>
              <p className="text-gray-600 font-medium text-[10px] md:text-sm text-center md:text-left leading-tight">Active</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex-shrink-0 w-32 md:w-auto md:flex-1 group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-amber-200/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-2 md:gap-0 mb-3 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <XCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="px-2 py-0.5 md:px-3 md:py-1 bg-amber-100 text-amber-700 text-[10px] md:text-xs font-semibold rounded-full">
                  Expired
                </div>
              </div>
              <div className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2 tracking-tight text-center md:text-left">
                {stats.expired}
              </div>
              <p className="text-gray-600 font-medium text-[10px] md:text-sm text-center md:text-left leading-tight">Expired</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex-shrink-0 w-32 md:w-auto md:flex-1 group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-purple-200/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-2 md:gap-0 mb-3 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <SparklesIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="px-2 py-0.5 md:px-3 md:py-1 bg-purple-100 text-purple-700 text-[10px] md:text-xs font-semibold rounded-full">
                  Today
                </div>
              </div>
              <div className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2 tracking-tight text-center md:text-left">
                {stats.newToday}
              </div>
              <p className="text-gray-600 font-medium text-[10px] md:text-sm text-center md:text-left leading-tight">New Today</p>
            </div>
          </motion.div>
        </div>

        {/* Filters Section */}
        <AnimatePresence mode="wait">
          {showFilters && (
            <motion.div
              key="filters"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-[#346870] to-[#5fa8b5] rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Filter Users</h2>
                </div>
                <UserFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User List Section */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl md:rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden"
        >
          {error ? (
            <div className="p-6 md:p-12 text-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <XCircleIcon className="w-8 h-8 text-red-600" />
              </motion.div>
              <p className="text-red-600 font-semibold mb-2">Error loading users</p>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#346870] to-[#5fa8b5] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#346870]/25 transition-all"
              >
                Try Again
              </motion.button>
            </div>
          ) : (
            <>
              <div className="p-4 md:p-8">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight">All Users</h2>
                  <div className="ml-auto px-2 md:px-3 py-0.5 md:py-1 bg-gray-100 text-gray-700 text-xs md:text-sm font-semibold rounded-full">
                    {totalUsers} {totalUsers === 1 ? "user" : "users"}
                  </div>
                </div>
                <UserList
                  users={users}
                  loading={loading}
                  onUserSelect={handleUserSelect}
                  onEditUser={handleEditUser}
                />
              </div>
              {totalPages > 1 && (
                <div className="px-4 md:px-8 py-4 md:py-6 border-t border-gray-200/50 bg-gray-50/50">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>

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
