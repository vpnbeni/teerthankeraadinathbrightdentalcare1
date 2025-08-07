import React, { useState, useEffect } from "react";
import { LoadingSpinner } from "../../shared/components";
import {
  formatDate,
  formatCurrency,
  formatPercentage,
} from "../../shared/utils/formatters";
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

const SubscriptionAnalytics = ({ subscription, user }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [subscription, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Simulate API call - in real implementation, this would fetch from backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock analytics data
      const mockAnalytics = {
        utilizationMetrics: {
          sessionsUsed:
            (subscription.totalSessions || 0) -
            (subscription.sessionsRemaining || 0),
          totalSessions: subscription.totalSessions || 0,
          utilizationRate: subscription.totalSessions
            ? ((subscription.totalSessions - subscription.sessionsRemaining) /
                subscription.totalSessions) *
              100
            : 0,
          averageSessionsPerWeek: 2.3,
          projectedCompletionDate: calculateProjectedCompletion(),
        },
        timeMetrics: {
          daysActive: calculateDaysActive(),
          daysRemaining: calculateDaysRemaining(),
          timeUtilization: calculateTimeUtilization(),
          averageDaysBetweenSessions: 4.2,
        },
        valueMetrics: {
          totalValue: subscription.amount || 0,
          valuePerSession:
            subscription.amount && subscription.totalSessions
              ? subscription.amount / subscription.totalSessions
              : 0,
          remainingValue: calculateRemainingValue(),
          utilizationEfficiency: 85.2,
        },
        trends: {
          sessionFrequency: generateSessionFrequencyData(),
          monthlyUtilization: generateMonthlyUtilizationData(),
          comparisonMetrics: {
            avgUtilizationRate: 78.5,
            avgSessionsPerWeek: 2.1,
            avgTimeToCompletion: 45,
          },
        },
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysActive = () => {
    if (!subscription.startDate) return 0;
    const startDate = new Date(subscription.startDate);
    const today = new Date();
    const diffTime = today - startDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateDaysRemaining = () => {
    if (!subscription.endDate) return 0;
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const calculateTimeUtilization = () => {
    const daysActive = calculateDaysActive();
    const totalDuration =
      subscription.endDate && subscription.startDate
        ? Math.floor(
            (new Date(subscription.endDate) -
              new Date(subscription.startDate)) /
              (1000 * 60 * 60 * 24)
          )
        : 0;
    return totalDuration > 0 ? (daysActive / totalDuration) * 100 : 0;
  };

  const calculateRemainingValue = () => {
    if (!subscription.amount || !subscription.totalSessions) return 0;
    const valuePerSession = subscription.amount / subscription.totalSessions;
    return valuePerSession * (subscription.sessionsRemaining || 0);
  };

  const calculateProjectedCompletion = () => {
    if (!subscription.sessionsRemaining || subscription.sessionsRemaining === 0)
      return null;
    const avgSessionsPerWeek = 2.3; // This would come from actual data
    const weeksRemaining = subscription.sessionsRemaining / avgSessionsPerWeek;
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + weeksRemaining * 7);
    return projectedDate;
  };

  const generateSessionFrequencyData = () => {
    // Mock data for session frequency over time
    return [
      { week: "Week 1", sessions: 3 },
      { week: "Week 2", sessions: 2 },
      { week: "Week 3", sessions: 2 },
      { week: "Week 4", sessions: 1 },
      { week: "Week 5", sessions: 3 },
      { week: "Week 6", sessions: 2 },
    ];
  };

  const generateMonthlyUtilizationData = () => {
    // Mock data for monthly utilization
    return [
      { month: "Jan", utilization: 85 },
      { month: "Feb", utilization: 92 },
      { month: "Mar", utilization: 78 },
      { month: "Apr", utilization: 88 },
    ];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="medium" ariaLabel="Loading analytics" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Analytics data not available</p>
      </div>
    );
  }

  const { utilizationMetrics, timeMetrics, valueMetrics, trends } = analytics;

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Subscription Analytics
          </h4>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Session Utilization
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatPercentage(utilizationMetrics.utilizationRate)}
            </div>
            <div className="text-xs text-blue-700">
              {utilizationMetrics.sessionsUsed} of{" "}
              {utilizationMetrics.totalSessions} used
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Time Utilization
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(timeMetrics.timeUtilization)}
            </div>
            <div className="text-xs text-green-700">
              {timeMetrics.daysActive} of{" "}
              {timeMetrics.daysActive + timeMetrics.daysRemaining} days
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyDollarIcon className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                Value Remaining
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(valueMetrics.remainingValue)}
            </div>
            <div className="text-xs text-purple-700">
              {formatCurrency(valueMetrics.valuePerSession)} per session
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUpIcon className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">
                Efficiency Score
              </span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {formatPercentage(valueMetrics.utilizationEfficiency)}
            </div>
            <div className="text-xs text-yellow-700">
              Above average performance
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Patterns */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h5 className="font-medium text-gray-900 mb-4">Usage Patterns</h5>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Average sessions per week
              </span>
              <span className="font-medium">
                {utilizationMetrics.averageSessionsPerWeek}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Average days between sessions
              </span>
              <span className="font-medium">
                {timeMetrics.averageDaysBetweenSessions}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Projected completion
              </span>
              <span className="font-medium">
                {utilizationMetrics.projectedCompletionDate
                  ? formatDate(utilizationMetrics.projectedCompletionDate)
                  : "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Days remaining</span>
              <span className="font-medium">
                {timeMetrics.daysRemaining} days
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-sm text-gray-500">
                {formatPercentage(utilizationMetrics.utilizationRate)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#346870] h-2 rounded-full transition-all duration-300"
                style={{ width: `${utilizationMetrics.utilizationRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Comparison Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h5 className="font-medium text-gray-900 mb-4">
            Performance Comparison
          </h5>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Your utilization rate
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatPercentage(utilizationMetrics.utilizationRate)}
                </span>
                {utilizationMetrics.utilizationRate >
                trends.comparisonMetrics.avgUtilizationRate ? (
                  <TrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Average utilization rate
              </span>
              <span className="font-medium text-gray-500">
                {formatPercentage(trends.comparisonMetrics.avgUtilizationRate)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Your sessions per week
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {utilizationMetrics.averageSessionsPerWeek}
                </span>
                {utilizationMetrics.averageSessionsPerWeek >
                trends.comparisonMetrics.avgSessionsPerWeek ? (
                  <TrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Average sessions per week
              </span>
              <span className="font-medium text-gray-500">
                {trends.comparisonMetrics.avgSessionsPerWeek}
              </span>
            </div>
          </div>

          {/* Insights */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h6 className="font-medium text-blue-900 mb-2">Insights</h6>
            <ul className="text-sm text-blue-800 space-y-1">
              {utilizationMetrics.utilizationRate > 80 && (
                <li>• Excellent subscription utilization</li>
              )}
              {utilizationMetrics.averageSessionsPerWeek >
                trends.comparisonMetrics.avgSessionsPerWeek && (
                <li>• Above average session frequency</li>
              )}
              {timeMetrics.daysRemaining < 30 &&
                subscription.sessionsRemaining > 5 && (
                  <li>• Consider extending subscription period</li>
                )}
              {utilizationMetrics.utilizationRate < 50 &&
                timeMetrics.daysRemaining < 14 && (
                  <li>• Low utilization - may need engagement support</li>
                )}
            </ul>
          </div>
        </div>
      </div>

      {/* Session Frequency Chart Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h5 className="font-medium text-gray-900 mb-4">
          Session Frequency Trend
        </h5>
        <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <ChartBarIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">
              Chart visualization would be implemented here
            </p>
            <p className="text-xs">
              Showing session frequency over the last {timeRange}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionAnalytics;
