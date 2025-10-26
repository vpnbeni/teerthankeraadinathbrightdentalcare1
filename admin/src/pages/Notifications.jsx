import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/common/AdminLayout";
import { useNotifications } from "../contexts/NotificationContext";
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  SparklesIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    if (filter === "unread") filtered = filtered.filter((n) => !n.read);
    else if (filter === "read") filtered = filtered.filter((n) => n.read);
    if (selectedType !== "all") filtered = filtered.filter((n) => n.type === selectedType);
    if (searchQuery) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [notifications, filter, searchQuery, selectedType]);

  const groupedNotifications = useMemo(() => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    filteredNotifications.forEach((notification) => {
      const notifDate = new Date(notification.timestamp);
      notifDate.setHours(0, 0, 0, 0);
      let groupKey;
      if (notifDate.getTime() === today.getTime()) groupKey = "Today";
      else if (notifDate.getTime() === yesterday.getTime()) groupKey = "Yesterday";
      else if (notifDate >= lastWeek) groupKey = "This Week";
      else groupKey = "Older";
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(notification);
    });
    return groups;
  }, [filteredNotifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "appointment_created":
      case "new_appointment":
        return CalendarIcon;
      case "appointment_cancelled":
        return XCircleIcon;
      case "appointment_reminder":
        return ClockIcon;
      default:
        return BellIcon;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === "high") {
      return {
        gradient: "from-rose-500 via-pink-500 to-fuchsia-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
      };
    }
    switch (type) {
      case "appointment_created":
      case "new_appointment":
        return {
          gradient: "from-blue-500 via-cyan-500 to-teal-500",
          bg: "bg-blue-50",
          border: "border-blue-200",
        };
      case "appointment_cancelled":
        return {
          gradient: "from-rose-500 via-red-500 to-pink-600",
          bg: "bg-rose-50",
          border: "border-rose-200",
        };
      case "appointment_reminder":
        return {
          gradient: "from-violet-500 via-purple-500 to-indigo-600",
          bg: "bg-violet-50",
          border: "border-violet-200",
        };
      default:
        return {
          gradient: "from-slate-500 via-gray-500 to-zinc-600",
          bg: "bg-slate-50",
          border: "border-slate-200",
        };
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const notificationTypes = ["all", ...new Set(notifications.map((n) => n.type))];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-2">
                Notifications
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-primary" />
                Manage all system notifications and alerts
              </p>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-3">
                {unreadCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={markAllAsRead}
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow transition-all"
                  >
                    Mark all read
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearAllNotifications}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl text-sm font-semibold text-white hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 transition-all"
                >
                  Clear all
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BellIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Unread</p>
                <p className="text-3xl font-bold text-rose-600">{unreadCount}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Read</p>
                <p className="text-3xl font-bold text-emerald-600">{notifications.length - unreadCount}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex gap-2">
              {["all", "unread", "read"].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    filter === filterOption
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative">
              <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
              >
                {notificationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {filteredNotifications.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-16 shadow-lg text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6"
              >
                <BellIcon className="w-12 h-12 text-gray-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedType !== "all" || filter !== "all"
                  ? "Try adjusting your filters or search query"
                  : "You're all caught up! We'll notify you when something new arrives"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([groupKey, groupNotifications], groupIndex) => (
                <motion.div
                  key={groupKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-bold text-gray-900">{groupKey}</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
                    <span className="text-sm font-medium text-gray-500">{groupNotifications.length}</span>
                  </div>

                  <div className="space-y-3">
                    {groupNotifications.map((notification, index) => {
                      const Icon = getNotificationIcon(notification.type);
                      const colors = getNotificationColor(notification.type, notification.priority);

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => !notification.read && markAsRead(notification.id)}
                          className={`group relative bg-white/80 backdrop-blur-sm border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                            !notification.read ? `${colors.border} ${colors.bg}` : "border-gray-200/50"
                          }`}
                        >
                          <div className="flex gap-4">
                            <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                              <Icon className="w-7 h-7 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <h3 className="text-base font-bold text-gray-900 leading-tight">
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <div className="flex-shrink-0 w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                  <ClockIcon className="w-4 h-4" />
                                  {formatTime(notification.timestamp)}
                                </span>
                                <span className="text-xs font-medium text-gray-500">
                                  {formatDate(notification.timestamp)}
                                </span>
                                {notification.priority === "high" && (
                                  <span className="px-2.5 py-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold rounded-lg shadow-lg">
                                    URGENT
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default Notifications;
