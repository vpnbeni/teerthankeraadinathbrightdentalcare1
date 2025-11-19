import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { logoutUser } from "../../store/authSlice";
import toast from "react-hot-toast";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "../../contexts/NotificationContext";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Get user directly from Redux store instead of using useAuth hook
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useNotifications();


  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Consultation", href: "/appointments", icon: CalendarIcon },
    { name: "Notifications", href: "/notifications", icon: BellIcon },
    { name: "Profile", href: "/profile", icon: UserIcon },
    { name: "Payments", href: "/payments", icon: CreditCardIcon },
  ];

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      >
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className={`fixed inset-y-0 left-0 flex w-72 flex-col bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
          {/* Mobile Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200/50">
            <img
              src="https://res.cloudinary.com/dvqvxu0b1/image/upload/v1753662373/2_uuolcb.webp"
              alt="Teerthanker Aadinath Bright Dental Care"
              className="h-24 w-auto object-cover my-[40px]"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const showBadge = item.name === "Notifications" && unreadCount > 0;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-gradient-to-r from-[#2E676F] via-[#346870] to-[#4a8a95] text-white shadow-lg shadow-[#346870]/25"
                    : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                    }`}
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isActive
                    ? "bg-white/10"
                    : "bg-gray-100 group-hover:bg-gray-200"
                    }`}>
                    <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"}`} />
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
            <div className="p-3 mb-3 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-600 truncate">{user?.phone}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100/80 hover:bg-gray-200 rounded-xl transition-all"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar - Premium Glass Design */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl">
          {/* Logo Section */}
          <div class="flex h-32 justify-center items-center px-4 border-b bg-white">
            <img src="https://res.cloudinary.com/dvqvxu0b1/image/upload/v1753662373/2_uuolcb.webp" alt="Teerthanker Aadinath Bright Dental Care" class="h-54 pt-6 w-auto object-cover object-center" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const showBadge = item.name === "Notifications" && unreadCount > 0;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-gradient-to-r from-[#2E676F] via-[#346870] to-[#4a8a95] text-white shadow-lg shadow-[#346870]/25"
                    : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                    }`}
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isActive
                    ? "bg-white/10"
                    : "bg-gray-100 group-hover:bg-gray-200"
                    }`}>
                    <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"}`} />
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
            <div className="p-3 mb-3 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white/80 hover:shadow-md transition-all duration-200">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-600 truncate">{user?.phone}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100/80 hover:bg-gray-200 rounded-xl transition-all"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
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
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all"
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
                onClick={() => navigate("/profile")}
                className="hidden lg:flex lg:items-center lg:gap-4 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-4 py-2.5 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-200 cursor-pointer"
              >
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || "User"}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    {user?.subscription?.status === "active" ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-xs text-gray-600">
                          {user.subscription.sessionsRemaining} sessions left
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        <p className="text-xs text-gray-500">Inactive</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-11 w-11 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-[#346870]/20">
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-white" />
                  )}
                </div>
              </button>

              {/* Mobile user avatar */}
              <button
                onClick={() => navigate("/profile")}
                className="lg:hidden cursor-pointer"
              >
                <div className="h-12 w-12 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-[#346870]/20">
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
