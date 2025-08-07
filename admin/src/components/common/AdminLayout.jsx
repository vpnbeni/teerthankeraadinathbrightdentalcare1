import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { logoutAdmin } from "../../store/authSlice";
import { getTimeBasedGreeting, getTimeBasedMessage } from "../../shared/utils";
import {
  useAccessibility,
  useResponsive,
  useFocusManagement,
} from "../../shared/hooks";
import {
  focusManagement,
  keyboardNavigation,
} from "../../shared/utils/accessibility";
import SkipLinks from "../../shared/components/SkipLinks";
import Breadcrumb from "../../shared/components/Breadcrumb";
import KeyboardShortcuts from "../../shared/components/KeyboardShortcuts";
import toast from "react-hot-toast";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Accessibility hooks
  const { announce, isMobile, isTouch } = useAccessibility();
  const { isMobile: responsiveIsMobile, isBreakpoint } = useResponsive();
  const { saveFocus, restoreFocus } = useFocusManagement();

  // Refs for focus management
  const sidebarRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Update greeting every minute to keep it current
  useEffect(() => {
    const updateGreeting = () => {
      setCurrentGreeting(getTimeBasedGreeting(user?.name || "Admin"));
      setCurrentMessage(getTimeBasedMessage());
    };

    // Initial update
    updateGreeting();

    // Update every minute
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, [user?.name]);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Users", href: "/users", icon: UsersIcon },
    { name: "Appointments", href: "/appointments", icon: CalendarIcon },
    { name: "Sessions", href: "/sessions", icon: DocumentTextIcon },
    { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
    { name: "Audit Logs", href: "/audit-logs", icon: ShieldCheckIcon },
    { name: "Settings", href: "/settings", icon: CogIcon },
  ];

  // Enhanced sidebar management with accessibility
  const openSidebar = () => {
    previousFocusRef.current = document.activeElement;
    setSidebarOpen(true);
    announce("Navigation menu opened");

    // Focus first navigation item after sidebar opens
    setTimeout(() => {
      const firstNavItem = sidebarRef.current?.querySelector("a");
      if (firstNavItem) {
        firstNavItem.focus();
      }
    }, 100);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    announce("Navigation menu closed");

    // Restore focus to menu button
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  };

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && sidebarOpen) {
        closeSidebar();
      }
    };

    if (sidebarOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [sidebarOpen]);

  // Focus trap for mobile sidebar
  useEffect(() => {
    if (sidebarOpen && sidebarRef.current) {
      const cleanup = focusManagement.trapFocus(sidebarRef.current);
      return cleanup;
    }
  }, [sidebarOpen]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutAdmin()).unwrap();
      toast.success("Logged out successfully");
      announce("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed");
      announce("Logout failed");
    }
  };

  // Handle keyboard navigation in sidebar
  const handleSidebarKeyDown = (event) => {
    const navItems = sidebarRef.current?.querySelectorAll("a, button");
    if (!navItems) return;

    const currentIndex = Array.from(navItems).indexOf(event.target);

    keyboardNavigation.handleKeyDown(event, {
      [keyboardNavigation.keys.ARROW_DOWN]: () => {
        const nextIndex = (currentIndex + 1) % navItems.length;
        navItems[nextIndex].focus();
      },
      [keyboardNavigation.keys.ARROW_UP]: () => {
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : navItems.length - 1;
        navItems[prevIndex].focus();
      },
      [keyboardNavigation.keys.HOME]: () => {
        navItems[0].focus();
      },
      [keyboardNavigation.keys.END]: () => {
        navItems[navItems.length - 1].focus();
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Links */}
      <SkipLinks />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts enabled={true} />

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl transform transition-transform"
          onKeyDown={handleSidebarKeyDown}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <h2 className="text-lg font-semibold text-[#346870]">
              Admin Dashboard
            </h2>
            <button
              onClick={closeSidebar}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-md p-1"
              aria-label="Close navigation menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 px-4 py-4 space-y-2 overflow-y-auto"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 mobile-tap-target ${
                    isActive
                      ? "bg-[#346870] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon
                    className="h-5 w-5 mr-3 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-[#346870] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user?.role || "Administrator"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 mobile-tap-target"
              aria-label="Sign out of admin panel"
            >
              <ArrowRightOnRectangleIcon
                className="h-5 w-5 mr-3 flex-shrink-0"
                aria-hidden="true"
              />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r shadow-sm">
          {/* Logo/Header */}
          <div className="flex h-16 items-center px-4 border-b">
            <h2 className="text-lg font-semibold text-[#346870] truncate">
              Admin Dashboard
            </h2>
          </div>

          {/* Navigation */}
          <nav
            id="sidebar"
            className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar"
            role="navigation"
            aria-label="Main navigation"
            onKeyDown={handleSidebarKeyDown}
          >
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    isActive
                      ? "bg-[#346870] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon
                    className="h-5 w-5 mr-3 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div
                  className="h-8 w-8 bg-[#346870] rounded-full flex items-center justify-center"
                  role="img"
                  aria-label={`${user?.name || "Admin"} avatar`}
                >
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user?.role || "Administrator"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Sign out of admin panel"
            >
              <ArrowRightOnRectangleIcon
                className="h-5 w-5 mr-3 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8">
            {/* Mobile menu button */}
            <button
              ref={mobileMenuButtonRef}
              onClick={openSidebar}
              className="text-gray-400 hover:text-gray-600 lg:hidden focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-md p-1 mobile-tap-target"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Mobile title */}
            <h1 className="text-lg font-semibold text-[#346870] lg:hidden truncate">
              Admin Dashboard
            </h1>

            {/* Desktop header content */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4 lg:flex-1">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-800 responsive-heading">
                  {currentGreeting}
                </h1>
                <p className="text-sm text-gray-600 responsive-text truncate">
                  Manage your dental clinic operations • {currentMessage}
                </p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              <Link
                to="/settings"
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-md p-1 mobile-tap-target"
                aria-label="System Settings"
              >
                <CogIcon className="h-6 w-6" />
              </Link>

              {/* Mobile user avatar */}
              <div className="lg:hidden">
                <div
                  className="h-8 w-8 bg-[#346870] rounded-full flex items-center justify-center"
                  role="img"
                  aria-label={`${user?.name || "Admin"} avatar`}
                >
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main
          id="main-content"
          className="p-4 lg:p-8 min-h-screen"
          role="main"
          tabIndex="-1"
        >
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <div className="mb-6">
              <Breadcrumb />
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
