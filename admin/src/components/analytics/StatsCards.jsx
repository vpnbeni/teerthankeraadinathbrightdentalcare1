import React from "react";
import { LoadingSpinner } from "../../shared/components";

const StatsCards = ({ stats, loading }) => {
  // If stats is an array (from dashboard), use it directly
  // If stats is an object (from analytics), convert it
  const statsData = Array.isArray(stats)
    ? stats
    : [
        {
          title: "Total Users",
          value: stats?.totalUsers || 0,
          icon: "👥",
          color: "bg-blue-500",
          change: stats?.userGrowth || 0,
        },
        {
          title: "Active Subscriptions",
          value: stats?.activeSubscriptions || 0,
          icon: "📋",
          color: "bg-green-500",
          change: stats?.subscriptionGrowth || 0,
        },
        {
          title: "Total Appointments",
          value: stats?.totalAppointments || 0,
          icon: "📅",
          color: "bg-purple-500",
          change: stats?.appointmentGrowth || 0,
        },
        {
          title: "Completed Sessions",
          value: stats?.completedSessions || 0,
          icon: "🦷",
          color: "bg-indigo-500",
          change: stats?.sessionGrowth || 0,
        },
        {
          title: "Total Revenue",
          value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
          icon: "💰",
          color: "bg-yellow-500",
          change: stats?.revenueGrowth || 0,
        },
        {
          title: "Monthly Revenue",
          value: `₹${(stats?.monthlyRevenue || 0).toLocaleString()}`,
          icon: "📈",
          color: "bg-red-500",
          change: stats?.monthlyRevenueGrowth || 0,
        },
      ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="admin-card">
            <div className="flex justify-center items-center h-24">
              <LoadingSpinner />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`${stat.color} rounded-lg p-3 mr-4`}>
              {stat.icon ? (
                React.createElement(stat.icon, {
                  className: "h-6 w-6 text-white",
                })
              ) : (
                <span className="text-2xl">{stat.icon || "📊"}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.change !== undefined && (
                <p
                  className={`text-sm ${
                    stat.change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change >= 0 ? "+" : ""}
                  {stat.change}% from last period
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
