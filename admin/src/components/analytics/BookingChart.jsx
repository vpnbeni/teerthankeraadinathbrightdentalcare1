import React from "react";
import { LoadingSpinner } from "../../shared/components";

const BookingChart = ({ data, loading, detailed = false, className = "" }) => {
  if (loading) {
    return (
      <div className={`admin-card ${className}`}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...(data?.map((item) => item.appointments) || [0]));
  const chartHeight = detailed ? 300 : 200;

  return (
    <div className={`admin-card ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Booking Analytics
        </h3>
        {detailed && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Appointments</span>
            </div>
          </div>
        )}
      </div>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <span className="text-4xl mb-2">📅</span>
          <p>No booking data available</p>
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
                    className="bg-purple-500 rounded-t-md w-full transition-all duration-300 hover:bg-purple-600 relative"
                    style={{
                      height: `${
                        (item.appointments / maxValue) * (chartHeight - 40)
                      }px`,
                      minHeight: "4px",
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.appointments} appointments
                    </div>
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-xs text-gray-600 text-center">
                    {item.month || item.period || item.day}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          {detailed && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {data.reduce((sum, item) => sum + item.appointments, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    data.reduce((sum, item) => sum + item.appointments, 0) /
                      data.length
                  )}
                </p>
                <p className="text-sm text-gray-600">Average Daily</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {data.length > 0
                    ? Math.max(...data.map((item) => item.appointments))
                    : 0}
                </p>
                <p className="text-sm text-gray-600">Peak Day</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {data.length > 1 ? (
                    <>
                      {data[data.length - 1].appointments >
                      data[data.length - 2].appointments
                        ? "+"
                        : ""}
                      {Math.round(
                        ((data[data.length - 1].appointments -
                          data[data.length - 2].appointments) /
                          data[data.length - 2].appointments) *
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

          {/* Booking Status Breakdown */}
          {detailed && data[0]?.statusBreakdown && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">
                Appointment Status
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(data[data.length - 1].statusBreakdown).map(
                  ([status, count]) => {
                    const statusColors = {
                      scheduled: "bg-blue-50 text-blue-800",
                      confirmed: "bg-green-50 text-green-800",
                      completed: "bg-purple-50 text-purple-800",
                      cancelled: "bg-red-50 text-red-800",
                      rescheduled: "bg-yellow-50 text-yellow-800",
                    };

                    return (
                      <div
                        key={status}
                        className={`text-center p-3 rounded-lg ${
                          statusColors[status] || "bg-gray-50 text-gray-800"
                        }`}
                      >
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-xs capitalize">{status}</p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Popular Time Slots */}
          {detailed && data[0]?.popularTimeSlots && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">
                Popular Time Slots
              </h4>
              <div className="space-y-2">
                {data[data.length - 1].popularTimeSlots
                  .slice(0, 5)
                  .map((slot, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-600">{slot.timeSlot}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{
                              width: `${
                                (slot.bookings /
                                  Math.max(
                                    ...data[
                                      data.length - 1
                                    ].popularTimeSlots.map((s) => s.bookings)
                                  )) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {slot.bookings}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingChart;
