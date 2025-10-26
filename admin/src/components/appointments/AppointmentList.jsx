import React from "react";
import AppointmentCard from "./AppointmentCard";
import { LoadingSpinner } from "../../shared/components";

const AppointmentList = ({
  appointments,
  loading,
  onAppointmentSelect,
  onRescheduleAppointment,
}) => {
  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="text-gray-500 mt-4">Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-4m4-4h8m-4-4v8m-4 4h8"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No appointments found
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          There are no appointments matching your current filters. Try adjusting
          your search criteria or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment._id}
          appointment={appointment}
          onSelect={() => onAppointmentSelect(appointment)}
          isSelected={false}
          onToggleSelect={() => {}}
          showSelection={false}
        />
      ))}

      {/* Loading overlay for when refreshing */}
      {loading && appointments.length > 0 && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="text-gray-600 mt-2 font-medium">
              Refreshing appointments...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
