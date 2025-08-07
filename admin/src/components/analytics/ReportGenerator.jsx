import React, { useState } from "react";
import { LoadingSpinner } from "../../shared/components";
import analyticsService from "../../services/analytics";
import { formatDate, formatCurrency } from "../../shared/utils/formatters";
import {
  DocumentArrowDownIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const ReportGenerator = ({ onClose, dateRange, analyticsData }) => {
  const [reportConfig, setReportConfig] = useState({
    type: "comprehensive",
    dateRange: dateRange || {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    },
    format: "pdf",
    includeCharts: true,
    includeRawData: false,
    sections: {
      overview: true,
      revenue: true,
      patients: true,
      appointments: true,
      sessions: true,
      trends: true,
    },
    filters: {
      minAmount: "",
      maxAmount: "",
      patientType: "all",
      appointmentStatus: "all",
    },
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const reportTypes = [
    {
      value: "comprehensive",
      label: "Comprehensive Report",
      icon: ChartBarIcon,
      description: "Complete overview of all clinic metrics",
    },
    {
      value: "revenue",
      label: "Financial Report",
      icon: CurrencyDollarIcon,
      description: "Revenue, payments, and financial performance",
    },
    {
      value: "patients",
      label: "Patient Analytics",
      icon: UsersIcon,
      description: "Patient growth, retention, and demographics",
    },
    {
      value: "appointments",
      label: "Appointment Report",
      icon: CalendarIcon,
      description: "Booking patterns, cancellations, and trends",
    },
    {
      value: "sessions",
      label: "Session Report",
      icon: ClockIcon,
      description: "Treatment sessions and completion rates",
    },
  ];

  const formatOptions = [
    {
      value: "pdf",
      label: "PDF Report",
      description: "Professional formatted report",
    },
    {
      value: "excel",
      label: "Excel Spreadsheet",
      description: "Data with charts and tables",
    },
    { value: "csv", label: "CSV Data", description: "Raw data for analysis" },
    {
      value: "json",
      label: "JSON Data",
      description: "Structured data format",
    },
  ];

  const handleConfigChange = (field, value) => {
    setReportConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateRangeChange = (field, value) => {
    setReportConfig((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value,
      },
    }));
  };

  const handleSectionToggle = (section) => {
    setReportConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: !prev.sections[section],
      },
    }));
  };

  const handleFilterChange = (filter, value) => {
    setReportConfig((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filter]: value,
      },
    }));
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      // Simulate API call - in real implementation, this would call the backend
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate mock report data based on config
      const mockReportData = generateMockReportData();
      setReportData(mockReportData);
      setPreviewMode(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const generateMockReportData = () => {
    const startDate = new Date(reportConfig.dateRange.startDate);
    const endDate = new Date(reportConfig.dateRange.endDate);

    return {
      metadata: {
        reportType: reportConfig.type,
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        clinic: "Teerthanker Aadhinath Bright Dental Care",
      },
      summary: {
        totalRevenue: 125000,
        totalPatients: 245,
        totalAppointments: 380,
        completedSessions: 295,
        averageRevenuePerPatient: 510,
        patientRetentionRate: 87.5,
        appointmentShowRate: 92.1,
      },
      trends: {
        revenueGrowth: 15.2,
        patientGrowth: 8.7,
        appointmentGrowth: 12.3,
        sessionCompletionRate: 94.2,
      },
      breakdowns: {
        revenueByService: [
          { service: "Consultation", amount: 35000, percentage: 28 },
          { service: "Cleaning", amount: 28000, percentage: 22.4 },
          { service: "Filling", amount: 25000, percentage: 20 },
          { service: "Root Canal", amount: 22000, percentage: 17.6 },
          { service: "Extraction", amount: 15000, percentage: 12 },
        ],
        patientsByAge: [
          { ageGroup: "18-25", count: 45, percentage: 18.4 },
          { ageGroup: "26-35", count: 78, percentage: 31.8 },
          { ageGroup: "36-45", count: 65, percentage: 26.5 },
          { ageGroup: "46-55", count: 35, percentage: 14.3 },
          { ageGroup: "55+", count: 22, percentage: 9.0 },
        ],
      },
    };
  };

  const exportReport = async () => {
    if (reportConfig.format === "json") {
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportConfig.type}_report_${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        setLoading(true);
        const response = await analyticsService.exportAnalytics(
          reportConfig.type,
          {
            ...reportConfig.dateRange,
            format: reportConfig.format,
          }
        );

        const blob = new Blob([response.data], {
          type: reportConfig.format === "csv" ? "text/csv" : "application/pdf",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${reportConfig.type}_report_${
          new Date().toISOString().split("T")[0]
        }.${reportConfig.format}`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to export report");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <DocumentArrowDownIcon className="h-6 w-6 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Custom Report Generator
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[75vh]">
          {!previewMode ? (
            <div className="p-6 space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Report Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <label
                        key={type.value}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          reportConfig.type === type.value
                            ? "border-[#346870] bg-blue-50"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportType"
                          value={type.value}
                          checked={reportConfig.type === type.value}
                          onChange={(e) =>
                            handleConfigChange("type", e.target.value)
                          }
                          className="mt-1"
                        />
                        <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {type.label}
                          </div>
                          <div className="text-sm text-gray-500">
                            {type.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={reportConfig.dateRange.startDate}
                    onChange={(e) =>
                      handleDateRangeChange("startDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={reportConfig.dateRange.endDate}
                    onChange={(e) =>
                      handleDateRangeChange("endDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Report Sections */}
              {reportConfig.type === "comprehensive" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Include Sections
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(reportConfig.sections).map(
                      ([section, enabled]) => (
                        <label key={section} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => handleSectionToggle(section)}
                            className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {section}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formatOptions.map((format) => (
                    <label
                      key={format.value}
                      className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        reportConfig.format === format.value
                          ? "border-[#346870] bg-blue-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={reportConfig.format === format.value}
                        onChange={(e) =>
                          handleConfigChange("format", e.target.value)
                        }
                        className="sr-only"
                      />
                      <div className="font-medium text-gray-900 text-sm">
                        {format.label}
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-1">
                        {format.description}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Advanced Options
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeCharts}
                      onChange={(e) =>
                        handleConfigChange("includeCharts", e.target.checked)
                      }
                      className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include visual charts and graphs
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeRawData}
                      onChange={(e) =>
                        handleConfigChange("includeRawData", e.target.checked)
                      }
                      className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include raw data tables
                    </span>
                  </label>
                </div>
              </div>

              {/* Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Filters (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Minimum Amount
                    </label>
                    <input
                      type="number"
                      value={reportConfig.filters.minAmount}
                      onChange={(e) =>
                        handleFilterChange("minAmount", e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Maximum Amount
                    </label>
                    <input
                      type="number"
                      value={reportConfig.filters.maxAmount}
                      onChange={(e) =>
                        handleFilterChange("maxAmount", e.target.value)
                      }
                      placeholder="No limit"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ReportPreview reportData={reportData} config={reportConfig} />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          {previewMode ? (
            <>
              <button
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
              >
                Back to Config
              </button>
              <button
                onClick={exportReport}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#346870] hover:bg-[#2a5359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Exporting...</span>
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Export Report
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={generateReport}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#346870] hover:bg-[#2a5359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generating...</span>
                  </>
                ) : (
                  <>
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-6">
            <div className="flex items-start gap-2">
              <div className="text-red-400">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Report Preview Component
const ReportPreview = ({ reportData, config }) => {
  if (!reportData) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Report Header */}
      <div className="text-center border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {reportData.metadata.clinic}
        </h2>
        <h3 className="text-lg text-gray-700 mt-1">
          {config.type.charAt(0).toUpperCase() + config.type.slice(1)} Report
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          Period: {formatDate(reportData.metadata.dateRange.start)} -{" "}
          {formatDate(reportData.metadata.dateRange.end)}
        </p>
        <p className="text-xs text-gray-400">
          Generated on {formatDate(reportData.metadata.generatedAt)}
        </p>
      </div>

      {/* Executive Summary */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Executive Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(reportData.summary.totalRevenue)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {reportData.summary.totalPatients}
            </div>
            <div className="text-sm text-gray-600">Total Patients</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {reportData.summary.totalAppointments}
            </div>
            <div className="text-sm text-gray-600">Appointments</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {reportData.summary.completedSessions}
            </div>
            <div className="text-sm text-gray-600">Sessions</div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Key Performance Indicators
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Avg Revenue per Patient
              </span>
              <span className="font-bold text-gray-900">
                {formatCurrency(reportData.summary.averageRevenuePerPatient)}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Patient Retention Rate
              </span>
              <span className="font-bold text-green-600">
                {reportData.summary.patientRetentionRate}%
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Appointment Show Rate
              </span>
              <span className="font-bold text-blue-600">
                {reportData.summary.appointmentShowRate}%
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue Growth</span>
              <span className="font-bold text-green-600">
                +{reportData.trends.revenueGrowth}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue by Service
        </h4>
        <div className="space-y-3">
          {reportData.breakdowns.revenueByService.map((service, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-900">
                {service.service}
              </span>
              <div className="flex items-center gap-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#346870] h-2 rounded-full"
                    style={{ width: `${service.percentage}%` }}
                  ></div>
                </div>
                <span className="font-bold text-gray-900 w-20 text-right">
                  {formatCurrency(service.amount)}
                </span>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {service.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Demographics */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Patient Demographics
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Age Distribution</h5>
            <div className="space-y-2">
              {reportData.breakdowns.patientsByAge.map((group, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {group.ageGroup}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${group.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">
                      {group.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">📊</div>
              <p className="text-sm text-gray-500">
                Chart visualization would appear here in the exported report
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
        <p>
          This is a preview of your report. The exported version will include
          additional formatting and charts.
        </p>
      </div>
    </div>
  );
};

export default ReportGenerator;
