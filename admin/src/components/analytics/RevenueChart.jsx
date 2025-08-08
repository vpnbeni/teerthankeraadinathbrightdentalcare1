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
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Revenue
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(overview.totalRevenue)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {overview.revenueGrowth > 0 ? "+" : ""}
            {overview.revenueGrowth || 0}% from last period
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Transactions
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {overview.totalTransactions || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Payment transactions</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Average Transaction
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrency(overview.averageTransaction)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Per transaction</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Peak Transaction
          </h3>
          <p className="text-3xl font-bold text-orange-600">
            {formatCurrency(overview.maxTransaction)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Highest single payment</p>
        </div>
      </div>

      {/* Revenue Trends Chart */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue Trends
        </h3>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue by Plan
          </h3>
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
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Methods
          </h3>
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
        </div>
      </div>

      {/* Detailed Revenue Table */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Plan Revenue Breakdown
        </h3>
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
      </div>

      {/* Payment Method Stats */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Method Statistics
        </h3>
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
      </div>
    </div>
  );
};

export default RevenueChart;
