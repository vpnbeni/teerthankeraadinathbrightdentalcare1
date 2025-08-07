import React from "react";
import {
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner } from "../../shared/components";
import { formatDate, formatTime } from "../../shared/utils/formatters";

const AuditLogStats = ({ stats, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const {
    totalLogs = 0,
    actionStats = [],
    resourceStats = [],
    adminStats = [],
    recentActivity = [],
  } = stats;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Audit Log Statistics
        </h3>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Logs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalLogs.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Admins</p>
              <p className="text-2xl font-semibold text-gray-900">
                {adminStats.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Action Types</p>
              <p className="text-2xl font-semibold text-gray-900">
                {actionStats.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Resource Types
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {resourceStats.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Statistics */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Actions Breakdown
          </h4>
          {actionStats.length > 0 ? (
            <div className="space-y-3">
              {actionStats.slice(0, 10).map((stat) => {
                const percentage =
                  totalLogs > 0 ? (stat.count / totalLogs) * 100 : 0;
                return (
                  <div
                    key={stat._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center flex-1">
                      <span className="text-sm font-medium text-gray-900 w-24">
                        {stat._id.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 w-16 text-right">
                      {stat.count.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No action data available
            </p>
          )}
        </div>

        {/* Resource Statistics */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Resources Breakdown
          </h4>
          {resourceStats.length > 0 ? (
            <div className="space-y-3">
              {resourceStats.slice(0, 10).map((stat) => {
                const percentage =
                  totalLogs > 0 ? (stat.count / totalLogs) * 100 : 0;
                return (
                  <div
                    key={stat._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center flex-1">
                      <span className="text-sm font-medium text-gray-900 w-24 capitalize">
                        {stat._id}
                      </span>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 w-16 text-right">
                      {stat.count.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No resource data available
            </p>
          )}
        </div>
      </div>

      {/* Admin Activity and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Admin Users */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Most Active Admins
          </h4>
          {adminStats.length > 0 ? (
            <div className="space-y-4">
              {adminStats.slice(0, 5).map((stat) => (
                <div
                  key={stat._id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {stat.admin?.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {stat.admin?.name || "Unknown Admin"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stat.admin?.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {stat.count.toLocaleString()} actions
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No admin activity data available
            </p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Recent Activity (24h)
          </h4>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((log) => (
                <div key={log._id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {log.adminId?.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">
                        {log.adminId?.name || "Unknown"}
                      </span>{" "}
                      performed{" "}
                      <span className="font-medium text-blue-600">
                        {log.action.replace(/_/g, " ")}
                      </span>{" "}
                      on <span className="font-medium">{log.resource}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(log.createdAt)} at {formatTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogStats;
