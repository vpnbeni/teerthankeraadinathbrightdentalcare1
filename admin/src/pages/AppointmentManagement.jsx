import React, { useState, useEffect } from "react";
import AdminLayout from "../components/common/AdminLayout";
import AppointmentCalendar from "../components/appointments/AppointmentCalendar";
import AppointmentList from "../components/appointments/AppointmentList";
import AppointmentFilters from "../components/appointments/AppointmentFilters";
import AppointmentDetails from "../components/appointments/AppointmentDetails";
import RescheduleModal from "../components/appointments/RescheduleModal";
import Pagination from "../components/common/Pagination";
import { LoadingSpinner } from "../shared/components";
import appointmentService from "../services/appointments";
import { toast } from "react-hot-toast";
import {
  CalendarIcon,
  ListBulletIcon,
  FunnelIcon,
  ArrowPathIcon,
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

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
          {/* Modern Page Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-xl">
                    <CalendarIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                      Appointment Management
                    </h1>
                    <p className="text-gray-600 mt-1 text-lg">
                      Schedule and manage patient appointments efficiently
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* View Mode Toggle */}
                <div className="inline-flex rounded-xl bg-gray-100 p-1">
                  <button
                    onClick={() => handleViewModeChange("calendar")}
                    className={`inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${viewMode === "calendar"
                        ? "bg-white text-primary-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Calendar
                  </button>
                  <button
                    onClick={() => handleViewModeChange("list")}
                    className={`inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${viewMode === "list"
                        ? "bg-white text-primary-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    <ListBulletIcon className="h-4 w-4 mr-2" />
                    List
                  </button>
                </div>

                {/* Filters Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 ${showFilters
                      ? "bg-primary-50 border-primary-200 text-primary-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filters
                  {showFilters && (
                    <span className="ml-2 inline-flex items-center justify-center w-2 h-2 bg-primary-500 rounded-full"></span>
                  )}
                </button>

              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-in-right">
            <div className="card-modern p-6 hover-lift hover-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Appointments
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics?.totalAppointments || totalAppointments || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All time</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Today's Appointments
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics?.todayAppointments || todayAppointments.length}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <svg
                    className="h-6 w-6 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Upcoming
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics?.upcomingAppointments ||
                      upcomingAppointments.length}
                  </p>
                  <p className="text-xs text-amber-600 mt-1 font-medium">
                    Next 7 days
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl">
                  <svg
                    className="h-6 w-6 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Completed
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {completedAppointments.length}
                  </p>
                  <p className="text-xs text-purple-600 mt-1 font-medium">
                    This month
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filters */}
          {showFilters && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Filter Appointments
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
              <AppointmentFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          )}

          {/* Enhanced Main Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {error ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="h-8 w-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unable to load appointments
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors duration-200"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again
                </button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <LoadingSpinner
                    size="large"
                    ariaLabel="Loading appointments"
                  />
                  <p className="text-gray-500 mt-4">Loading appointments...</p>
                </div>
              </div>
            ) : viewMode === "calendar" ? (
              <div className="p-6">
                <AppointmentCalendar
                  appointments={appointments}
                  loading={loading}
                  onAppointmentSelect={handleAppointmentSelect}
                  onRescheduleAppointment={handleRescheduleAppointment}
                />
              </div>
            ) : (
              <>
                <div className="p-6">
                  <AppointmentList
                    appointments={appointments}
                    loading={loading}
                    onAppointmentSelect={handleAppointmentSelect}
                    onRescheduleAppointment={handleRescheduleAppointment}
                  />
                </div>
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
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
      </div>

      {/* Appointment Details Modal */}
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
