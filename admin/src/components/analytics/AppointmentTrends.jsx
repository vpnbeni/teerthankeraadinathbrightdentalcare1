import React, { useState } from "react";
import { LoadingSpinner } from "../../shared/components";
import { formatDate, formatPercentage } from "../../shared/utils/formatters";
import {
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const AppointmentTrends = ({ data, loading }) => {
  const [viewMode, setViewMode] = useState("trends"); // "trends", "patterns", "heatmap"

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner
            size="medium"
            ariaLabel="Loading appointment trends"
          />
        </div>
      </div>
    );
  }

  // Mock data for demonstration - in real implementation, this would come from props
  const mockTrendsData = data?.appointmentTrends || [
    {
      date: "2024-01-01",
      appointments: 25,
      completed: 22,
      cancelled: 2,
      noShow: 1,
    },
    {
      date: "2024-01-02",
      appointments: 28,
      completed: 26,
      cancelled: 1,
      noShow: 1,
    },
    {
      date: "2024-01-03",
      appointments: 32,
      completed: 30,
      cancelled: 1,
      noShow: 1,
    },
    {
      date: "2024-01-04",
      appointments: 29,
      completed: 27,
      cancelled: 2,
      noShow: 0,
    },
    {
      date: "2024-01-05",
      appointments: 35,
      completed: 33,
      cancelled: 1,
      noShow: 1,
    },
    {
      date: "2024-01-06",
      appointments: 31,
      completed: 28,
      cancelled: 2,
      noShow: 1,
    },
    {
      date: "2024-01-07",
      appointments: 27,
      completed: 25,
      cancelled: 1,
      noShow: 1,
    },
  ];

  const mockPatternsData = data?.bookingPatterns || [
    {
      timeSlot: "09:00",
      monday: 8,
      tuesday: 7,
      wednesday: 9,
      thursday: 8,
      friday: 6,
      saturday: 4,
    },
    {
      timeSlot: "10:00",
      monday: 9,
      tuesday: 8,
      wednesday: 8,
      thursday: 9,
      friday: 7,
      saturday: 5,
    },
    {
      timeSlot: "11:00",
      monday: 7,
      tuesday: 9,
      wednesday: 8,
      thursday: 7,
      friday: 8,
      saturday: 6,
    },
    {
      timeSlot: "14:00",
      monday: 8,
      tuesday: 6,
      wednesday: 7,
      thursday: 8,
      friday: 9,
      saturday: 7,
    },
    {
      timeSlot: "15:00",
      monday: 9,
      tuesday: 8,
      wednesday: 9,
      thursday: 8,
      friday: 7,
      saturday: 5,
    },
    {
      timeSlot: "16:00",
      monday: 6,
      tuesday: 7,
      wednesday: 6,
      thursday: 7,
      friday: 8,
      saturday: 4,
    },
    {
      timeSlot: "17:00",
      monday: 5,
      tuesday: 6,
      wednesday: 5,
      thursday: 6,
      friday: 7,
      saturday: 3,
    },
  ];

  const calculateTrendMetrics = () => {
    const totalAppointments = mockTrendsData.reduce(
      (sum, day) => sum + day.appointments,
      0
    );
    const totalCompleted = mockTrendsData.reduce(
      (sum, day) => sum + day.completed,
      0
    );
    const totalCancelled = mockTrendsData.reduce(
      (sum, day) => sum + day.cancelled,
      0
    );
    const totalNoShow = mockTrendsData.reduce(
      (sum, day) => sum + day.noShow,
      0
    );

    const completionRate =
      totalAppointments > 0 ? (totalCompleted / totalAppointments) * 100 : 0;
    const cancellationRate =
      totalAppointments > 0 ? (totalCancelled / totalAppointments) * 100 : 0;
    const noShowRate =
      totalAppointments > 0 ? (totalNoShow / totalAppointments) * 100 : 0;

    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(mockTrendsData.length / 2);
    const firstHalf = mockTrendsData.slice(0, midPoint);
    const secondHalf = mockTrendsData.slice(midPoint);

    const firstHalfAvg =
      firstHalf.reduce((sum, day) => sum + day.appointments, 0) /
      firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, day) => sum + day.appointments, 0) /
      secondHalf.length;
    const trendPercentage =
      firstHalfAvg > 0
        ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
        : 0;

    return {
      totalAppointments,
      completionRate,
      cancellationRate,
      noShowRate,
      trendPercentage,
      averageDaily: totalAppointments / mockTrendsData.length,
    };
  };

  const metrics = calculateTrendMetrics();

  const renderTrendsView = () => {
    const maxAppointments = Math.max(
      ...mockTrendsData.map((day) => day.appointments)
    );

    return (
      <div className="space-y-6">
        {/* Trend Chart */}
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between px-2">
            {mockTrendsData.map((day, index) => (
              <div
                key={index}
                className="flex flex-col items-center group relative"
                style={{ width: `${100 / mockTrendsData.length - 1}%` }}
              >
                {/* Stacked Bar */}
                <div className="relative w-full" style={{ height: "200px" }}>
                  {/* Completed */}
                  <div
                    className="absolute bottom-0 w-full bg-green-500 rounded-t-sm"
                    style={{
                      height: `${(day.completed / maxAppointments) * 200}px`,
                    }}
                  ></div>
                  {/* Cancelled */}
                  <div
                    className="absolute w-full bg-yellow-500"
                    style={{
                      bottom: `${(day.completed / maxAppointments) * 200}px`,
                      height: `${(day.cancelled / maxAppointments) * 200}px`,
                    }}
                  ></div>
                  {/* No Show */}
                  <div
                    className="absolute w-full bg-red-500 rounded-t-sm"
                    style={{
                      bottom: `${
                        ((day.completed + day.cancelled) / maxAppointments) *
                        200
                      }px`,
                      height: `${(day.noShow / maxAppointments) * 200}px`,
                    }}
                  ></div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <div>Total: {day.appointments}</div>
                    <div>Completed: {day.completed}</div>
                    <div>Cancelled: {day.cancelled}</div>
                    <div>No Show: {day.noShow}</div>
                  </div>
                </div>

                {/* Date Label */}
                <div className="mt-2 text-xs text-gray-600 text-center">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>No Show</span>
          </div>
        </div>
      </div>
    );
  };

  const renderPatternsView = () => {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const maxBookings = Math.max(
      ...mockPatternsData.flatMap((slot) => days.map((day) => slot[day]))
    );

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-600 p-2">
                  Time
                </th>
                {dayLabels.map((day, index) => (
                  <th
                    key={index}
                    className="text-center text-sm font-medium text-gray-600 p-2"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockPatternsData.map((slot, index) => (
                <tr key={index} className="border-t border-gray-200">
                  <td className="text-sm font-medium text-gray-900 p-2">
                    {slot.timeSlot}
                  </td>
                  {days.map((day, dayIndex) => {
                    const intensity = slot[day] / maxBookings;
                    return (
                      <td key={dayIndex} className="p-2 text-center">
                        <div
                          className="w-8 h-8 rounded mx-auto flex items-center justify-center text-xs font-medium"
                          style={{
                            backgroundColor: `rgba(52, 104, 112, ${intensity})`,
                            color: intensity > 0.5 ? "white" : "black",
                          }}
                        >
                          {slot[day]}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center text-sm text-gray-500">
          Darker colors indicate higher booking volume
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Appointment Trends & Patterns
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("trends")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === "trends"
                ? "bg-[#346870] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setViewMode("patterns")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === "patterns"
                ? "bg-[#346870] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Patterns
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#346870]">
            {Math.round(metrics.averageDaily)}
          </div>
          <div className="text-sm text-gray-600">Daily Average</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-bold text-green-600">
              {formatPercentage(metrics.completionRate)}
            </span>
            {metrics.trendPercentage >= 0 ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {formatPercentage(metrics.cancellationRate)}
          </div>
          <div className="text-sm text-gray-600">Cancellation Rate</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {formatPercentage(metrics.noShowRate)}
          </div>
          <div className="text-sm text-gray-600">No Show Rate</div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "trends" && renderTrendsView()}
      {viewMode === "patterns" && renderPatternsView()}

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Key Insights</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {metrics.completionRate > 85 && (
            <li>• Excellent appointment completion rate</li>
          )}
          {metrics.cancellationRate > 10 && (
            <li>• High cancellation rate - consider reminder system</li>
          )}
          {metrics.noShowRate > 5 && (
            <li>• No-show rate above average - implement confirmation calls</li>
          )}
          {metrics.trendPercentage > 10 && (
            <li>• Strong upward booking trend this period</li>
          )}
          {metrics.trendPercentage < -10 && (
            <li>• Declining booking trend - review marketing efforts</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default AppointmentTrends;
