import React, { useState, useEffect } from "react";
import AdminLayout from "../components/common/AdminLayout";
import StatCard from "../components/common/StatCard";
import AppointmentCalendar from "../components/appointments/AppointmentCalendar";
import AppointmentList from "../components/appointments/AppointmentList";
import AppointmentFilters from "../components/appointments/AppointmentFilters";
import AppointmentDetails from "../components/appointments/AppointmentDetails";
import RescheduleModal from "../components/appointments/RescheduleModal";
import Pagination from "../components/common/Pagination";
import { LoadingSpinner } from "../shared/components";
import appointmentService from "../services/appointments";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  ListBulletIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    userId: "",
  });
  const [viewMode, setViewMode] = useState("list");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // Fetch appointments
  const fetchAppointments = async (page = 1, currentFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: viewMode === "calendar" ? 1000 : 20, // Fetch more appointments for calendar view
        ...currentFilters,
      };

      const response = await appointmentService.getAllAppointments(params);
      if (response.success) {
        setAppointments(response.data.appointments || []);
        setTotalAppointments(response.data.pagination?.totalAppointments || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setCurrentPage(response.data.pagination?.currentPage || 1);
      } else {
        throw new Error(response.message || "Failed to fetch appointments");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await appointmentService.getAppointmentStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch statistics:", err.message);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAppointments(1, filters);
    fetchStatistics();
  }, []);

  // Refetch appointments when view mode changes
  useEffect(() => {
    if (viewMode === "calendar") {
      fetchAppointments(1, filters);
    }
  }, [viewMode]);

  // Refetch appointments when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchAppointments(currentPage, filters);
      fetchStatistics();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentPage, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchAppointments(1, newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: "",
      startDate: "",
      endDate: "",
      userId: "",
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    fetchAppointments(1, clearedFilters);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAppointments(page, filters);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    // Refetch appointments when switching to calendar view to get more data
    if (mode === "calendar") {
      fetchAppointments(1, filters);
    }
  };

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const handleRescheduleAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleCloseModals = () => {
    setSelectedAppointment(null);
    setShowAppointmentDetails(false);
    setShowRescheduleModal(false);
  };

  const handleAppointmentUpdated = () => {
    handleCloseModals();
    fetchAppointments(currentPage, filters);
    fetchStatistics();
  };

  const handleReschedule = async (rescheduleData) => {
    try {
      await appointmentService.rescheduleAppointment(
        selectedAppointment._id,
        rescheduleData
      );
      handleAppointmentUpdated();
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };


  const handleRetry = () => {
    fetchAppointments(currentPage, filters);
  };

  // Calculate statistics from the fetched data
  const todayAppointments =
    appointments?.filter(
      (apt) => new Date(apt.date).toDateString() === new Date().toDateString()
    ) || [];

  const upcomingAppointments =
    appointments?.filter(
      (apt) => new Date(apt.date) > new Date() && apt.status !== "cancelled"
    ) || [];

  const completedAppointments =
    appointments?.filter((apt) => apt.status === "completed") || [];

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
        {/* Premium Header Section - Matching Dashboard Style */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl md:rounded-3xl p-3 md:p-12 shadow-2xl"
        >
          {/* Ambient background effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#346870]/30 to-[#5fa8b5]/30 rounded-full blur-3xl"></div>

          <div className="relative flex flex-row items-center justify-between gap-2 md:gap-6">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="w-9 h-9 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg md:rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/30">
                  <CalendarIcon className="w-4 h-4 md:w-7 md:h-7 text-white" />
                </div>
              </motion.div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base md:text-5xl font-bold text-white tracking-tight truncate">
                  Consultation
                </h1>
                <p className="hidden md:block text-slate-300 text-lg leading-relaxed max-w-2xl mt-3">
                  Schedule and manage patient consultations efficiently across your clinic.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-1.5 md:gap-3 flex-shrink-0">
              {/* View Mode Toggle */}
              <div className="relative inline-flex rounded-lg md:rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-0.5 md:p-1 gap-0.5 md:gap-1">
                <motion.div
                  className="absolute top-0.5 bottom-0.5 md:top-1 md:bottom-1 bg-white rounded-md md:rounded-lg shadow-lg"
                  initial={false}
                  animate={{
                    left: viewMode === "calendar" ? "0.125rem" : "calc(50% + 0.0625rem)",
                    right: viewMode === "calendar" ? "calc(50% + 0.0625rem)" : "0.125rem",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button
                  onClick={() => handleViewModeChange("calendar")}
                  className={`relative z-10 inline-flex items-center justify-center px-2 md:px-5 py-1.5 md:py-2 text-xs md:text-sm font-semibold rounded-md md:rounded-lg transition-colors duration-200 ${viewMode === "calendar" ? "text-slate-900" : "text-white"
                    }`}
                >
                  <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                  <span className="hidden md:inline">Calendar</span>
                </button>
                <button
                  onClick={() => handleViewModeChange("list")}
                  className={`relative z-10 inline-flex items-center justify-center px-2 md:px-5 py-1.5 md:py-2 text-xs md:text-sm font-semibold rounded-md md:rounded-lg transition-colors duration-200 ${viewMode === "list" ? "text-slate-900" : "text-white"
                    }`}
                >
                  <ListBulletIcon className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                  <span className="hidden md:inline">List</span>
                </button>
              </div>
              {/* Filters Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center justify-center gap-1 md:gap-2 px-2 md:px-5 py-1.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold transition-all shadow-lg ${showFilters
                  ? "bg-white text-slate-900 shadow-white/20"
                  : "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 shadow-black/10"
                  }`}
              >
                <FunnelIcon className="h-3.5 w-3.5 md:h-5 md:w-5" />
                <span className="hidden sm:inline text-xs md:text-sm">{showFilters ? "Hide" : "Show"}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards - Premium Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <StatCard
            value={statistics?.totalAppointments || totalAppointments || 0}
            label="Total"
            icon={CalendarIcon}
            iconColor="from-blue-500 to-cyan-500"
            hoverColor="blue-200"
            bgGradient="from-blue-50/50 to-cyan-50/50"
            badge="All"
            badgeColor="bg-blue-100 text-blue-700"
            variants={itemVariants}
          />
          <StatCard
            value={statistics?.todayAppointments || todayAppointments.length}
            label={new Date().toLocaleDateString("en-US", { weekday: "short" })}
            icon={ClockIcon}
            iconColor="from-green-500 to-emerald-500"
            hoverColor="green-200"
            bgGradient="from-green-50/50 to-emerald-50/50"
            badge="Today"
            badgeColor="bg-green-100 text-green-700"
            variants={itemVariants}
          />
          <StatCard
            value={statistics?.upcomingAppointments || upcomingAppointments.length}
            label="Upcoming"
            icon={ChartBarIcon}
            iconColor="from-amber-500 to-orange-500"
            hoverColor="amber-200"
            bgGradient="from-amber-50/50 to-orange-50/50"
            badge="7d"
            badgeColor="bg-amber-100 text-amber-700"
            variants={itemVariants}
          />
          <StatCard
            value={completedAppointments.length}
            label="Complete"
            icon={CheckCircleIcon}
            iconColor="from-purple-500 to-pink-500"
            hoverColor="purple-200"
            bgGradient="from-purple-50/50 to-pink-50/50"
            badge="Done"
            badgeColor="bg-purple-100 text-purple-700"
            variants={itemVariants}
          />
        </div>

        {/* Filters Section - Matching Dashboard Style */}
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
                  <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Filter Consultations</h2>
                </div>
                <AppointmentFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Section - Matching Dashboard Style */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden"
        >
          {error ? (
            <div className="p-4 md:p-12 text-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </motion.div>
              <p className="text-red-600 font-semibold mb-2">Error loading consultations</p>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Try Again
              </motion.button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <LoadingSpinner size="large" ariaLabel="Loading consultations" />
                <p className="text-gray-600 font-medium mt-4">Loading consultations...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 md:p-8">
                <div className="flex items-center gap-1.5 md:gap-3 mb-3 md:mb-6">
                  <div className="w-1 md:w-1.5 h-5 md:h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  <h2 className="text-sm md:text-2xl font-bold text-gray-900 tracking-tight">
                    {viewMode === "calendar" ? "Calendar" : "All Consultations"}
                  </h2>
                  <div className="ml-auto px-2 md:px-3 py-0.5 md:py-1 bg-gray-100 text-gray-700 text-[10px] md:text-sm font-semibold rounded-full">
                    {totalAppointments}
                  </div>
                </div>
                {viewMode === "calendar" ? (
                  <AppointmentCalendar
                    appointments={appointments}
                    loading={loading}
                    onAppointmentSelect={handleAppointmentSelect}
                    onRescheduleAppointment={handleRescheduleAppointment}
                  />
                ) : (
                  <AppointmentList
                    appointments={appointments}
                    loading={loading}
                    onAppointmentSelect={handleAppointmentSelect}
                    onRescheduleAppointment={handleRescheduleAppointment}
                  />
                )}
              </div>
              {totalPages > 1 && viewMode === "list" && (
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

      {/* Consultation Details Modal */}
      {showAppointmentDetails && selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={handleCloseModals}
          onAppointmentUpdated={handleAppointmentUpdated}
          onReschedule={() => {
            setShowAppointmentDetails(false);
            setShowRescheduleModal(true);
          }}
        />
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <RescheduleModal
          appointment={selectedAppointment}
          onClose={handleCloseModals}
          onReschedule={handleReschedule}
        />
      )}
    </AdminLayout>
  );
};

export default AppointmentManagement;
