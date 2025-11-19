import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import appointmentService from "../../services/appointments";

const AppointmentReminders = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingAppointments();
  }, []);

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await appointmentService.getAppointments();
      const appointments = response.data.appointments || [];

      // Filter for appointments in the next 7 days
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcoming = appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        return (
          aptDate >= now &&
          aptDate <= nextWeek &&
          (apt.status === "scheduled" || apt.status === "confirmed")
        );
      });

      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntilAppointment = (appointmentDate) => {
    const now = new Date();
    const aptDate = new Date(appointmentDate);
    const diffTime = aptDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else {
      return `In ${diffDays} days`;
    }
  };

  const getReminderColor = (appointmentDate) => {
    const now = new Date();
    const aptDate = new Date(appointmentDate);
    const diffTime = aptDate - now;
    const diffHours = diffTime / (1000 * 60 * 60);

    if (diffHours <= 24) {
      return "bg-red-50 border-red-200 text-red-800";
    } else if (diffHours <= 48) {
      return "bg-yellow-50 border-yellow-200 text-yellow-800";
    } else {
      return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  if (loading || upcomingAppointments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {upcomingAppointments.map((appointment) => (
        <div
          key={appointment._id}
          className={`border rounded-lg p-4 ${getReminderColor(
            appointment.date
          )}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">
                {getTimeUntilAppointment(appointment.date) === "Today"
                  ? "🚨"
                  : "📅"}
              </div>
              <div>
                <h4 className="font-medium">Consultation Reminder</h4>
                <p className="text-sm mt-1">
                  {getTimeUntilAppointment(appointment.date)} at{" "}
                  {appointment.timeSlot}
                </p>
                <p className="text-sm">
                  {new Date(appointment.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {appointment.notes && (
                  <p className="text-sm mt-1 opacity-90">
                    Note: {appointment.notes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Link
                to="/appointments"
                className="text-sm font-medium underline hover:no-underline"
              >
                View Details
              </Link>
              {getTimeUntilAppointment(appointment.date) === "Today" && (
                <span className="text-xs font-medium px-2 py-1 bg-white bg-opacity-50 rounded">
                  Don't forget!
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppointmentReminders;
