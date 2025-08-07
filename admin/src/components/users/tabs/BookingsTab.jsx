import React, { useState, useEffect } from "react";
import { LoadingSpinner } from "../../../shared/components";
import { formatDate, formatTime } from "../../../shared/utils/formatters";
import userService from "../../../services/users";
import { toast } from "react-hot-toast";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const BookingsTab = ({ user, loading: userLoading }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    dateRange: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalAppointments: 0,
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchAppointments();
    }
  }, [user?._id, filters]);

  const fetchAppointments = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getUserAppointments(user._id, {
        page,
        limit: 10,
        ...filters,
      });

      if (response.data.success) {
        setAppointments(response.data.data.appointments || []);
        setPagination({
          currentPage: response.data.data.pagination?.currentPage || 1,
          totalPages: response.data.data.pagination?.totalPages || 1,
          totalAppointments:
            response.data.data.pagination?.totalAppointments || 0,
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch appointments");
      toast.error("Failed to load appointment history");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      dateRange: "",
      search: "",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "pending":
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case "rescheduled":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rescheduled":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateStats = () => {
    const total = appointments.length;
    const completed = appointments.filter(
      (a) => a.status === "completed"
    ).length;
    const upcoming = appointments.filter(
      (a) =>
        a.status === "confirmed" && new Date(a.appointmentDate) > new Date()
    ).length;
    const cancelled = appointments.filter(
      (a) => a.status === "cancelled"
    ).length;

    return { total, completed, upcoming, cancelled };
  };

  const { total, completed, upcoming, cancelled } = calculateStats();

  const handleQuickAction = (appointment, action) => {
    setSelectedAppointment(appointment);
    // Handle quick actions like reschedule, cancel, etc.
    toast.info(`${action} functionality will be implemented`);
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" ariaLabel="Loading appointment history" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Appointment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-blue-600">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-yellow-600">{upcoming}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Quick Actions
        </h4>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <PlusIcon className="h-4 w-4 mr-2" />
            Book Appointment
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <CalendarIcon className="h-4 w-4 mr-2" />
            View Calendar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">
            Filter Appointments
          </h4>
          <button
            onClick={clearFilters}
            className="text-sm text-[#346870] hover:text-[#2a5359]"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
            >
              <option value="">All Time</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search appointments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Appointment History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">
            Appointment History ({pagination.totalAppointments})
          </h4>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="medium" ariaLabel="Loading appointments" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => fetchAppointments()}
              className="mt-2 text-[#346870] hover:text-[#2a5359] font-medium"
            >
              Try again
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-6 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No appointments found</p>
            <button className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#346870] hover:bg-[#2a5359]">
              <PlusIcon className="h-4 w-4 mr-2" />
              Book First Appointment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(appointment.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="text-sm font-medium text-gray-900">
                          {formatDate(appointment.appointmentDate)}
                        </h5>
                        <span className="text-sm text-gray-500">
                          {formatTime(appointment.appointmentTime)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        {appointment.appointmentType && (
                          <p>Type: {appointment.appointmentType}</p>
                        )}
                        {appointment.sessionNumber && (
                          <p>Session: {appointment.sessionNumber}</p>
                        )}
                        {appointment.notes && <p>Notes: {appointment.notes}</p>}
                        {appointment.rescheduleHistory?.length > 0 && (
                          <p className="text-blue-600">
                            Rescheduled {appointment.rescheduleHistory.length}{" "}
                            time(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {appointment.status === "confirmed" && (
                      <>
                        <button
                          onClick={() =>
                            handleQuickAction(appointment, "reschedule")
                          }
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Reschedule"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleQuickAction(appointment, "cancel")
                          }
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Cancel"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {appointment.status === "completed" && (
                      <button
                        onClick={() =>
                          handleQuickAction(appointment, "view-details")
                        }
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                        title="View Details"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchAppointments(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchAppointments(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsTab;
