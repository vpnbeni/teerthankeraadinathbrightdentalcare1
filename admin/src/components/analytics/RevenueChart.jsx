import React from "react";
import { LoadingSpinner } from "../../shared/components";

const RevenueChart = ({ data, loading, detailed = false, className = "" }) => {
  if (loading) {
    return (
      <div className={`admin-card ${className}`}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...(data?.map((item) => item.amount) || [0]));
  const chartHeight = detailed ? 300 : 200;

  return (
    <div className={`admin-card ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Revenue Analytics
        </h3>
        {detailed && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded"></div>
              <span>Revenue</span>
            </div>
          </div>
        )}
      </div>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <span className="text-4xl mb-2">📊</span>
          <p>No revenue data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart */}
          <div className="relative" style={{ height: `${chartHeight}px` }}>
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {data.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center group relative"
                  style={{ width: `${100 / data.length - 2}%` }}
                >
                  {/* Bar */}
                  <div
                    className="bg-primary rounded-t-md w-full transition-all duration-300 hover:bg-primary-dark relative"
                    style={{
                      height: `${
                        (item.amount / maxValue) * (chartHeight - 40)
                      }px`,
                      minHeight: "4px",
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₹{item.amount.toLocaleString()}
                    </div>
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-xs text-gray-600 text-center">
                    {item.month || item.period}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          {detailed && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  ₹
                  {data
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ₹
                  {Math.round(
                    data.reduce((sum, item) => sum + item.amount, 0) /
                      data.length
                  ).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Average Monthly</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {data.length > 1 ? (
                    <>
                      {data[data.length - 1].amount >
                      data[data.length - 2].amount
                        ? "+"
                        : ""}
                      {Math.round(
                        ((data[data.length - 1].amount -
                          data[data.length - 2].amount) /
                          data[data.length - 2].amount) *
                          100
                      )}
                      %
                    </>
                  ) : (
                    "N/A"
                  )}
                </p>
                <p className="text-sm text-gray-600">Growth Rate</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RevenueChart;
