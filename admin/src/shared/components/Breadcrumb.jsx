/**
 * Breadcrumb Navigation Component
 * Provides hierarchical navigation with accessibility support
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { useAccessibility } from "../hooks";

const Breadcrumb = ({ items = [], className = "" }) => {
  const location = useLocation();
  const { announce } = useAccessibility();

  // Auto-generate breadcrumbs from route if no items provided
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ label: "Dashboard", href: "/dashboard" }];

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip the first segment if it's already covered by Dashboard
      if (segment === "dashboard") return;

      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: index === pathSegments.length - 1,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = items.length > 0 ? items : generateBreadcrumbs();

  const handleBreadcrumbClick = (label, isLast) => {
    if (!isLast) {
      announce(`Navigating to ${label}`);
    }
  };

  return (
    <nav
      className={`breadcrumb ${className}`}
      aria-label="Breadcrumb navigation"
      role="navigation"
    >
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon
                  className="breadcrumb-separator h-4 w-4 mx-2"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {isFirst && (
                    <HomeIcon
                      className="h-4 w-4 inline mr-1"
                      aria-hidden="true"
                    />
                  )}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-[#346870] hover:text-[#2a5359] transition-colors admin-focus mobile-tap-target"
                  onClick={() => handleBreadcrumbClick(item.label, isLast)}
                  aria-label={`Navigate to ${item.label}`}
                >
                  {isFirst && (
                    <HomeIcon
                      className="h-4 w-4 inline mr-1"
                      aria-hidden="true"
                    />
                  )}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Specialized breadcrumb components
export const UserBreadcrumb = ({ userId, userName }) => {
  const items = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Users", href: "/users" },
    {
      label: userName || `User ${userId}`,
      href: `/users/${userId}`,
      isLast: true,
    },
  ];

  return <Breadcrumb items={items} />;
};

export const AppointmentBreadcrumb = ({ appointmentId, patientName }) => {
  const items = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Appointments", href: "/appointments" },
    {
      label: patientName
        ? `${patientName}'s Appointment`
        : `Appointment ${appointmentId}`,
      href: `/appointments/${appointmentId}`,
      isLast: true,
    },
  ];

  return <Breadcrumb items={items} />;
};

export const SettingsBreadcrumb = ({ section }) => {
  const items = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
  ];

  if (section) {
    items.push({
      label: section.charAt(0).toUpperCase() + section.slice(1),
      href: `/settings/${section}`,
      isLast: true,
    });
  }

  return <Breadcrumb items={items} />;
};

export default Breadcrumb;
