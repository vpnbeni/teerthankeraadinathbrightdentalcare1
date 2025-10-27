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
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { logoutAdmin } from "../../store/authSlice";
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
import NotificationBell from "./NotificationBell";
import { useNotifications } from "../../contexts/NotificationContext";
import toast from "react-hot-toast";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useNotifications();

  // Accessibility hooks
  const { announce, isMobile, isTouch } = useAccessibility();
  const { isMobile: responsiveIsMobile, isBreakpoint } = useResponsive();
  const { saveFocus, restoreFocus } = useFocusManagement();

  // Refs for focus management
  const sidebarRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Removed time-based greeting and message

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Users", href: "/users", icon: UsersIcon },
    { name: "Appointments", href: "/appointments", icon: CalendarIcon },
    { name: "Availability", href: "/availability", icon: ClockIcon },
    { name: "Notifications", href: "/notifications", icon: BellIcon },
    { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
    // { name: "Settings", href: "/settings", icon: CogIcon },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Skip Links */}
      <SkipLinks />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts enabled={true} />

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={closeSidebar}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className={`fixed inset-y-0 left-0 flex w-72 flex-col bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          onKeyDown={handleSidebarKeyDown}
        >
          {/* Mobile Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200/50">
            <img
              src="https://res.cloudinary.com/dvqvxu0b1/image/upload/v1753662373/2_uuolcb.webp"
              alt="Teerthanker Aadinath Bright Dental Care"
              className="h-24 w-auto object-cover my-[40px]"
            />
            <button
              onClick={closeSidebar}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all"
              aria-label="Close navigation menu"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav
            className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const showBadge = item.name === "Notifications" && unreadCount > 0;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 mobile-tap-target ${isActive
                    ? "bg-gradient-to-r from-[#2E676F] via-[#346870] to-[#4a8a95] text-white shadow-lg shadow-[#346870]/25"
                    : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                    }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isActive
                    ? "bg-white/10"
                    : "bg-gray-100 group-hover:bg-gray-200"
                    }`}>
                    <item.icon
                      className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"}`}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {showBadge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile User Section */}
          <div className="border-t border-gray-200/50 p-4 bg-gradient-to-t from-gray-50/50 to-transparent">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex justify-between items-center w-full  p-3 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                <div className="">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-600 truncate capitalize">{user?.role || "Administrator"}</p>
                </div>
                <Link
                  to="/settings"
                  className="flex w-[45.78px] h-[45.78px] items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md hover:bg-white/80 text-gray-600 hover:text-gray-900 transition-all duration-200"
                  aria-label="System Settings"
                  onClick={closeSidebar}
                >
                  <CogIcon className="h-[24px] w-[24px]" />
                </Link>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100/80 hover:bg-gray-200 rounded-xl transition-all"
              aria-label="Sign out of admin panel"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar - Premium Glass Design */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl">
          {/* Logo Section */}
          <div className="flex h-32 justify-center items-center px-4 border-b bg-white">
            <img
              src="https://res.cloudinary.com/dvqvxu0b1/image/upload/v1753662373/2_uuolcb.webp"
              alt="Teerthanker Aadinath Bright Dental Care"
              className="h-54 pt-6 w-auto object-cover object-center"
            />
          </div>

          {/* Navigation */}
          <nav
            id="sidebar"
            className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto"
            role="navigation"
            aria-label="Main navigation"
            onKeyDown={handleSidebarKeyDown}
          >
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const showBadge = item.name === "Notifications" && unreadCount > 0;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${isActive
                    ? "bg-gradient-to-r from-[#2E676F] via-[#346870] to-[#4a8a95] text-white shadow-lg shadow-[#346870]/25"
                    : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                    }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isActive
                    ? "bg-white/10"
                    : "bg-gray-100 group-hover:bg-gray-200"
                    }`}>
                    <item.icon
                      className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"}`}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {showBadge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  {isActive && !showBadge && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-200/50 p-4 bg-gradient-to-t from-gray-50/50 to-transparent">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex w-full items-start justify-between p-3 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white/80 hover:shadow-md transition-all duration-200 ">
                <div className="">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-600 truncate capitalize">{user?.role || "Administrator"}</p>
                </div>
                <Link
                  to="/settings"
                  className="flex w-[45.78px] h-[45.78px] items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md hover:bg-white/80 text-gray-600 hover:text-gray-900 transition-all duration-200"
                  aria-label="System Settings"
                >
                  <CogIcon className="h-[24px] w-[24px]" />
                </Link>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100/80 hover:bg-gray-200 rounded-xl transition-all"
              aria-label="Sign out of admin panel"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar - Premium Glass Navbar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="flex h-20 items-center justify-between px-4 lg:px-8">
            {/* Mobile Menu Button */}
            <button
              ref={mobileMenuButtonRef}
              onClick={openSidebar}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Mobile Logo */}
            <button
              onClick={() => navigate("/dashboard")}
              className="lg:hidden cursor-pointer"
            >
              <img
                src="https://res.cloudinary.com/dvqvxu0b1/image/upload/v1753662373/2_uuolcb.webp"
                alt="Teerthanker Aadinath Bright Dental Care"
                className="h-32 w-auto object-contain"
              />
            </button>

            {/* Desktop - Empty space to push content right */}
            <div className="hidden lg:block lg:flex-1"></div>

            {/* Right side content */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Desktop User Info Card */}
              <button
                onClick={() => navigate("/dashboard")}
                className="hidden lg:flex lg:items-center lg:gap-4 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-4 py-2.5 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-200 cursor-pointer"
              >
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || "Admin"}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-xs text-gray-600 capitalize">
                      {user?.role || "Administrator"}
                    </p>
                  </div>
                </div>
                <div className="h-11 w-11 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-[#346870]/20">
                  <ShieldCheckIcon className="h-6 w-6 text-white" />
                </div>
              </button>

              {/* Mobile user avatar */}
              <button
                onClick={() => navigate("/dashboard")}
                className="lg:hidden cursor-pointer"
              >
                <div className="h-10 w-10 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-[#346870]/20">
                  <span className="text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main
          id="main-content"
          className="p-3 md:p-4 lg:p-8"
          role="main"
          tabIndex="-1"
        >
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <div className="mb-3 md:mb-6">
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
