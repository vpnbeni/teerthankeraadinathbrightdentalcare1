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
  Area,
  AreaChart,
} from "recharts";
import { LoadingSpinner } from "../../shared/components";
import { motion } from "framer-motion";
import { SparklesIcon } from "@heroicons/react/24/outline";

const RevenueChart = ({ data, dateRange, loading }) => {
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
  const trends = data?.trends || [];
  const revenueByPlan = data?.revenueByPlan || [];
  const paymentMethodDistribution = data?.paymentMethodDistribution || [];
  const overview = data?.overview || {};

  // Colors for different chart elements
  const COLORS = ["#346870", "#4F9A94", "#6BB6B0", "#87D2CC", "#A3EEE8"];

  // Format currency
  const formatCurrency = (value) => `₹${value?.toLocaleString() || 0}`;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-green-50 to-emerald-100/50 backdrop-blur-xl border border-green-200/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-xs md:text-sm font-semibold text-green-700 mb-2">
            Total Revenue
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-green-600 tracking-tight">
            {formatCurrency(overview.totalRevenue)}
          </p>
          <p className="text-[10px] md:text-xs text-green-600 mt-1">
            {overview.revenueGrowth > 0 ? "+" : ""}
            {overview.revenueGrowth || 0}% from last period
          </p>
        </motion.div>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-xl border border-blue-200/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-xs md:text-sm font-semibold text-blue-700 mb-2">
            Total Transactions
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-blue-600 tracking-tight">
            {overview.totalTransactions || 0}
          </p>
          <p className="text-[10px] md:text-xs text-blue-600 mt-1">Payment transactions</p>
        </motion.div>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-xl border border-purple-200/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-xs md:text-sm font-semibold text-purple-700 mb-2">
            Average Transaction
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-purple-600 tracking-tight">
            {formatCurrency(overview.averageTransaction)}
          </p>
          <p className="text-[10px] md:text-xs text-purple-600 mt-1">Per transaction</p>
        </motion.div>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-xl border border-orange-200/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-xs md:text-sm font-semibold text-orange-700 mb-2">
            Peak Transaction
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-orange-600 tracking-tight">
            {formatCurrency(overview.maxTransaction)}
          </p>
          <p className="text-[10px] md:text-xs text-orange-600 mt-1">Highest single payment</p>
        </motion.div>
      </div>

      {/* Revenue Trends Chart */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-[#346870] to-[#5fa8b5] rounded-full"></div>
          <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
            Revenue Trends
          </h3>
          <SparklesIcon className="h-4 w-4 md:h-5 md:w-5 text-[#346870] ml-auto" />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id"
                tickFormatter={(value) => {
                  if (value && value.month) {
                    return `${value.month}/${value.year}`;
                  }
                  return "";
                }}
              />
              <YAxis
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value), "Revenue"]}
                labelFormatter={(value) => {
                  if (value && value.month) {
                    return `${value.month}/${value.year}`;
                  }
                  return "Period";
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#346870"
                fill="#346870"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue by Plan */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
              Revenue by Plan
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByPlan}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, totalRevenue, percent }) =>
                    `${_id.planName}: ${formatCurrency(totalRevenue)} (${(
                      percent * 100
                    ).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalRevenue"
                >
                  {revenueByPlan.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Payment Method Distribution */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
              Payment Methods
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "totalAmount")
                      return [formatCurrency(value), "Total Amount"];
                    return [value, "Count"];
                  }}
                />
                <Bar dataKey="count" fill="#346870" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Detailed Revenue Table */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
          <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
            Plan Revenue Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Transaction
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueByPlan.map((plan, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900">
                        {plan._id.planName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(plan.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {plan.totalTransactions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(plan.averageTransaction)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Payment Method Stats */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
          <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
            Payment Method Statistics
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethodDistribution.map((method, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                {method._id || "Unknown"}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transactions:</span>
                  <span className="text-sm font-medium">{method.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(method.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Amount:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(method.avgAmount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default RevenueChart;
