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
import { motion } from "framer-motion";
import { SparklesIcon } from "@heroicons/react/24/outline";

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
    <div className="space-y-6 md:space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-teal-50 to-teal-100/50 backdrop-blur-xl border border-teal-200/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-xs md:text-sm font-semibold text-teal-700 mb-2">
            Total Appointments
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-[#346870] tracking-tight">
            {overview.totalAppointments || 0}
          </p>
          <p className="text-[10px] md:text-xs text-teal-600 mt-1">In selected period</p>
        </motion.div>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-xl border border-green-200/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-xs md:text-sm font-semibold text-green-700 mb-2">
            Completion Rate
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-green-600 tracking-tight">
            {overview.completionRate || 0}%
          </p>
          <p className="text-[10px] md:text-xs text-green-600 mt-1">Appointments completed</p>
        </motion.div>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-red-50 to-red-100/50 backdrop-blur-xl border border-red-200/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-xs md:text-sm font-semibold text-red-700 mb-2">
            Cancellation Rate
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-red-600 tracking-tight">
            {overview.cancellationRate || 0}%
          </p>
          <p className="text-[10px] md:text-xs text-red-600 mt-1">Appointments cancelled</p>
        </motion.div>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-xl border border-blue-200/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-xs md:text-sm font-semibold text-blue-700 mb-2">
            Avg Per Day
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-blue-600 tracking-tight">
            {overview.avgAppointmentsPerDay || 0}
          </p>
          <p className="text-[10px] md:text-xs text-blue-600 mt-1">Daily average</p>
        </motion.div>
      </div>

      {/* Daily Trends Chart */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-[#346870] to-[#5fa8b5] rounded-full"></div>
          <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
            Daily Appointment Trends
          </h3>
          <SparklesIcon className="h-4 w-4 md:h-5 md:w-5 text-[#346870] ml-auto" />
        </div>
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
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Status Distribution Pie Chart */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
              Status Distribution
            </h3>
          </div>
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
        </motion.div>

        {/* Time Slot Popularity Bar Chart */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
              Popular Time Slots
            </h3>
          </div>
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
        </motion.div>
      </div>

      {/* Detailed Stats Table */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
          <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
            Appointment Status Breakdown
          </h3>
        </div>
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
      </motion.div>
    </div>
  );
};

export default BookingChart;
