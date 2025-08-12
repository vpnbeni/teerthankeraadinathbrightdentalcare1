import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../components/common/AdminLayout";
import StatsCards from "../components/analytics/StatsCards";
import { LoadingSpinner } from "../shared/components";
import { fetchDashboardStats } from "../store/analyticsSlice";
import { fetchRecentUsers } from "../store/userSlice";
import { fetchRecentAppointments } from "../store/appointmentSlice";
import {
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
} from "@heroicons/react/24/outline";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats = {}, loading = {} } = useSelector(
    (state) => state.analytics || {}
  );
  const analyticsLoading = loading.dashboard || false;
  const { recentUsers = [], loading: usersLoading = false } = useSelector(
    (state) => state.users || {}
  );
  const { recentAppointments = [], loading: appointmentsLoading = false } =
    useSelector((state) => state.appointments || {});

  const dashboardFetchedRef = useRef(false);

  useEffect(() => {
    if (!dashboardFetchedRef.current) {
      console.log("AdminDashboard: Fetching dashboard data");
      dashboardFetchedRef.current = true;
      dispatch(fetchDashboardStats());
      dispatch(fetchRecentUsers({ limit: 5 }));
      dispatch(fetchRecentAppointments({ limit: 5 }));
    }
  }, [dispatch]);

  const isLoading = analyticsLoading || usersLoading || appointmentsLoading;

  // Debug logging
  // console.log("Dashboard loading states:", {
  //   analyticsLoading,
  //   usersLoading,
  //   appointmentsLoading,
  //   isLoading,
  //   dashboardStats,
  //   recentUsers,
  //   recentAppointments,
  // });

  const statsData = [
    {
      title: "Total Users",
      value: dashboardStats?.totalUsers || 0,
      icon: UsersIcon,
      color: "bg-blue-500",
      change: dashboardStats?.userGrowth || 0,
    },
    {
      title: "Today's Appointments",
      value: dashboardStats?.todayAppointments || 0,
      icon: CalendarIcon,
      color: "bg-green-500",
      change: dashboardStats?.appointmentChange || 0,
    },
    {
      title: "Completed Sessions",
      value: dashboardStats?.completedSessions || 0,
      icon: DocumentTextIcon,
      color: "bg-purple-500",
      change: dashboardStats?.sessionChange || 0,
    },
    {
      title: "Monthly Revenue",
      value: `₹${dashboardStats?.monthlyRevenue || 0}`,
      icon: CurrencyRupeeIcon,
      color: "bg-yellow-500",
      change: dashboardStats?.revenueChange || 0,
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" ariaLabel="Loading dashboard" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600">
            Monitor your clinic's performance and key metrics
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={statsData} />

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Users
              </h2>
              <a
                href="/users"
                className="text-sm text-[#346870] hover:text-[#2a5359] font-medium"
              >
                View all
              </a>
            </div>
            <div className="space-y-3">
              {recentUsers?.length > 0 ? (
                recentUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-[#346870] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {user.subscription?.plan?.name || "No Plan"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent users found
                </p>
              )}
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Appointments
              </h2>
              <a
                href="/appointments"
                className="text-sm text-[#346870] hover:text-[#2a5359] font-medium"
              >
                View all
              </a>
            </div>
            <div className="space-y-3">
              {recentAppointments?.length > 0 ? (
                recentAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.userId?.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.timeSlot}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-900">
                        {new Date(appointment.date).toLocaleDateString()}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : appointment.status === "completed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent appointments found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/users"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-900">Manage Users</p>
                <p className="text-sm text-blue-600">View and edit users</p>
              </div>
            </a>
            <a
              href="/appointments"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <CalendarIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-900">Appointments</p>
                <p className="text-sm text-green-600">Schedule & manage</p>
              </div>
            </a>
            <a
              href="/sessions"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <DocumentTextIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-purple-900">Sessions</p>
                <p className="text-sm text-purple-600">Record examinations</p>
              </div>
            </a>
            <a
              href="/analytics"
              className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <CurrencyRupeeIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-yellow-900">Analytics</p>
                <p className="text-sm text-yellow-600">View reports</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
