import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { LoadingSpinner } from "../../shared/components";

const BookingChart = ({ data, dateRange, loading }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  // Transform data for charts
  const dailyTrends = data?.dailyTrends || [];
  const statusDistribution = data?.statusDistribution || [];
  const timeSlotPopularity = data?.timeSlotPopularity || [];
  const overview = data?.overview || {};

  // Colors for different chart elements
  const COLORS = ["#346870", "#4F9A94", "#6BB6B0", "#87D2CC", "#A3EEE8"];
  const STATUS_COLORS = {
    scheduled: "#3B82F6",
    confirmed: "#10B981",
    completed: "#8B5CF6",
    cancelled: "#EF4444",
    rescheduled: "#F59E0B",
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Appointments
          </h3>
          <p className="text-3xl font-bold text-[#346870]">
            {overview.totalAppointments || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">In selected period</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Completion Rate
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {overview.completionRate || 0}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Appointments completed</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cancellation Rate
          </h3>
          <p className="text-3xl font-bold text-red-600">
            {overview.cancellationRate || 0}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Appointments cancelled</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Avg Per Day
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {overview.avgAppointmentsPerDay || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Daily average</p>
        </div>
      </div>

      {/* Daily Trends Chart */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Appointment Trends
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id"
                tickFormatter={(value) => {
                  if (value && value.day) {
                    return `${value.day}/${value.month}`;
                  }
                  return "";
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => {
                  if (value && value.day) {
                    return `${value.day}/${value.month}/${value.year}`;
                  }
                  return "Date";
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#346870"
                strokeWidth={2}
                name="Total Appointments"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10B981"
                strokeWidth={2}
                name="Completed"
              />
              <Line
                type="monotone"
                dataKey="cancelled"
                stroke="#EF4444"
                strokeWidth={2}
                name="Cancelled"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Appointment Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, count, percent }) =>
                    `${_id}: ${count} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        STATUS_COLORS[entry._id] ||
                        COLORS[index % COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Slot Popularity Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Time Slots
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSlotPopularity.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#346870" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Appointment Status Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statusDistribution.map((status, index) => {
                const total = statusDistribution.reduce(
                  (sum, item) => sum + item.count,
                  0
                );
                const percentage =
                  total > 0 ? ((status.count / total) * 100).toFixed(1) : 0;

                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{
                            backgroundColor:
                              STATUS_COLORS[status._id] ||
                              COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {status._id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {status.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingChart;
