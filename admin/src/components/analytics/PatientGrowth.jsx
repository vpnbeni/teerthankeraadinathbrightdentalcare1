import React, { useState } from "react";
import { LoadingSpinner } from "../../shared/components";
import { formatDate, formatPercentage } from "../../shared/utils/formatters";
import {
  UsersIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  UserPlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const PatientGrowth = ({ data, loading }) => {
  const [timeframe, setTimeframe] = useState("monthly"); // "weekly", "monthly", "quarterly"

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner
            size="medium"
            ariaLabel="Loading patient growth data"
          />
        </div>
      </div>
    );
  }

  // Mock data for demonstration - in real implementation, this would come from props
  const mockGrowthData = {
    monthly: [
      {
        period: "Jan 2024",
        newPatients: 45,
        returningPatients: 120,
        totalActive: 165,
        churnRate: 5.2,
      },
      {
        period: "Feb 2024",
        newPatients: 52,
        returningPatients: 135,
        totalActive: 187,
        churnRate: 4.8,
      },
      {
        period: "Mar 2024",
        newPatients: 38,
        returningPatients: 142,
        totalActive: 180,
        churnRate: 6.1,
      },
      {
        period: "Apr 2024",
        newPatients: 61,
        returningPatients: 155,
        totalActive: 216,
        churnRate: 3.9,
      },
      {
        period: "May 2024",
        newPatients: 47,
        returningPatients: 168,
        totalActive: 215,
        churnRate: 4.2,
      },
      {
        period: "Jun 2024",
        newPatients: 55,
        returningPatients: 175,
        totalActive: 230,
        churnRate: 3.5,
      },
    ],
    weekly: [
      {
        period: "Week 1",
        newPatients: 12,
        returningPatients: 38,
        totalActive: 50,
        churnRate: 2.1,
      },
      {
        period: "Week 2",
        newPatients: 15,
        returningPatients: 42,
        totalActive: 57,
        churnRate: 1.8,
      },
      {
        period: "Week 3",
        newPatients: 9,
        returningPatients: 45,
        totalActive: 54,
        churnRate: 2.5,
      },
      {
        period: "Week 4",
        newPatients: 18,
        returningPatients: 48,
        totalActive: 66,
        churnRate: 1.2,
      },
    ],
    quarterly: [
      {
        period: "Q1 2024",
        newPatients: 135,
        returningPatients: 397,
        totalActive: 532,
        churnRate: 5.4,
      },
      {
        period: "Q2 2024",
        newPatients: 163,
        returningPatients: 498,
        totalActive: 661,
        churnRate: 3.9,
      },
    ],
  };

  const currentData = mockGrowthData[timeframe] || mockGrowthData.monthly;

  const calculateMetrics = () => {
    const latest = currentData[currentData.length - 1];
    const previous = currentData[currentData.length - 2];

    if (!latest || !previous) {
      return {
        totalPatients: latest?.totalActive || 0,
        newPatientGrowth: 0,
        retentionRate: 100 - (latest?.churnRate || 0),
        acquisitionTrend: 0,
        averageChurnRate:
          currentData.reduce((sum, item) => sum + item.churnRate, 0) /
          currentData.length,
      };
    }

    const newPatientGrowth =
      previous.newPatients > 0
        ? ((latest.newPatients - previous.newPatients) / previous.newPatients) *
          100
        : 0;

    const acquisitionTrend =
      ((latest.totalActive - previous.totalActive) / previous.totalActive) *
      100;
    const averageChurnRate =
      currentData.reduce((sum, item) => sum + item.churnRate, 0) /
      currentData.length;

    return {
      totalPatients: latest.totalActive,
      newPatientGrowth,
      retentionRate: 100 - latest.churnRate,
      acquisitionTrend,
      averageChurnRate,
      totalNewPatients: currentData.reduce(
        (sum, item) => sum + item.newPatients,
        0
      ),
    };
  };

  const metrics = calculateMetrics();

  const renderGrowthChart = () => {
    const maxValue = Math.max(...currentData.map((item) => item.totalActive));

    return (
      <div className="relative h-48 mt-4">
        <div className="absolute inset-0 flex items-end justify-between px-2">
          {currentData.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center group relative"
              style={{ width: `${100 / currentData.length - 2}%` }}
            >
              {/* Stacked Bar for New vs Returning */}
              <div className="relative w-full">
                {/* Returning Patients (bottom) */}
                <div
                  className="w-full bg-[#346870] rounded-b-sm"
                  style={{
                    height: `${(item.returningPatients / maxValue) * 160}px`,
                    minHeight: "2px",
                  }}
                ></div>
                {/* New Patients (top) */}
                <div
                  className="w-full bg-green-500 rounded-t-sm"
                  style={{
                    height: `${(item.newPatients / maxValue) * 160}px`,
                    minHeight: "2px",
                  }}
                ></div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  <div>Total: {item.totalActive}</div>
                  <div>New: {item.newPatients}</div>
                  <div>Returning: {item.returningPatients}</div>
                  <div>Churn: {item.churnRate}%</div>
                </div>
              </div>

              {/* Period Label */}
              <div className="mt-2 text-xs text-gray-600 text-center">
                {item.period}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAcquisitionFunnel = () => {
    const latest = currentData[currentData.length - 1];
    if (!latest) return null;

    const stages = [
      {
        name: "Inquiries",
        value: Math.round(latest.newPatients * 2.5),
        color: "bg-blue-500",
      },
      {
        name: "Consultations",
        value: Math.round(latest.newPatients * 1.8),
        color: "bg-yellow-500",
      },
      {
        name: "New Patients",
        value: latest.newPatients,
        color: "bg-green-500",
      },
      {
        name: "Active Patients",
        value: Math.round(latest.newPatients * 0.85),
        color: "bg-[#346870]",
      },
    ];

    const maxValue = stages[0].value;

    return (
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-sm font-medium text-gray-700">
              {stage.name}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
              <div
                className={`${stage.color} h-6 rounded-full flex items-center justify-end pr-2 text-white text-sm font-medium transition-all duration-500`}
                style={{ width: `${(stage.value / maxValue) * 100}%` }}
              >
                {stage.value}
              </div>
            </div>
            <div className="w-12 text-sm text-gray-500">
              {index > 0
                ? `${Math.round(
                    (stage.value / stages[index - 1].value) * 100
                  )}%`
                : "100%"}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Patient Growth & Retention
          </h3>
        </div>

        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#346870]">
            {metrics.totalPatients}
          </div>
          <div className="text-sm text-gray-600">Total Active</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-bold text-green-600">
              {metrics.totalNewPatients}
            </span>
            {metrics.newPatientGrowth >= 0 ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="text-sm text-gray-600">New Patients</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatPercentage(metrics.retentionRate)}
          </div>
          <div className="text-sm text-gray-600">Retention Rate</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-bold text-purple-600">
              {metrics.acquisitionTrend >= 0 ? "+" : ""}
              {formatPercentage(metrics.acquisitionTrend)}
            </span>
            {metrics.acquisitionTrend >= 0 ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="text-sm text-gray-600">Growth Rate</div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Patient Growth Trend
        </h4>
        {renderGrowthChart()}

        {/* Legend */}
        <div className="flex justify-center gap-6 text-sm mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>New Patients</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#346870] rounded"></div>
            <span>Returning Patients</span>
          </div>
        </div>
      </div>

      {/* Acquisition Funnel */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Patient Acquisition Funnel
        </h4>
        {renderAcquisitionFunnel()}
      </div>

      {/* Retention Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Retention Insights
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Average Churn Rate</span>
              </div>
              <span className="font-medium text-red-600">
                {formatPercentage(metrics.averageChurnRate)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <UserPlusIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm">New Patient Growth</span>
              </div>
              <span
                className={`font-medium ${
                  metrics.newPatientGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {metrics.newPatientGrowth >= 0 ? "+" : ""}
                {formatPercentage(metrics.newPatientGrowth)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Growth Insights
          </h4>
          <div className="space-y-2 text-sm">
            {metrics.retentionRate > 90 && (
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Excellent patient retention rate</span>
              </div>
            )}
            {metrics.newPatientGrowth > 15 && (
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Strong new patient acquisition</span>
              </div>
            )}
            {metrics.averageChurnRate > 8 && (
              <div className="flex items-center gap-2 text-red-700">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>High churn rate - review patient satisfaction</span>
              </div>
            )}
            {metrics.acquisitionTrend < -5 && (
              <div className="flex items-center gap-2 text-yellow-700">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Declining growth - consider marketing boost</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientGrowth;
