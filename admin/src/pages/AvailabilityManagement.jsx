import React, { useState } from "react";
import AdminLayout from "../components/common/AdminLayout";
import StatCard from "../components/common/StatCard";
import {
  CalendarIcon,
  ClockIcon,
  CogIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner } from "../shared/components";
import { motion, AnimatePresence } from "framer-motion";

import TemplateList from "../components/availability/TemplateList";
import TemplateForm from "../components/availability/TemplateForm";
import HolidayList from "../components/availability/HolidayList";
import HolidayForm from "../components/availability/HolidayForm";
import OptimizedAvailabilityCalendar from "../components/availability/OptimizedAvailabilityCalendar";
import {
  useTemplates,
  useHolidays,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
  useInvalidateAvailability,
  useCalendarAvailabilitySimple,
} from "../hooks/useAvailability";

const AvailabilityManagement = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingHoliday, setEditingHoliday] = useState(null);
  // React Query hooks
  const {
    data: templatesData,
    isLoading: templatesLoading,
    error: templatesError,
  } = useTemplates();
  const {
    data: holidaysData,
    isLoading: holidaysLoading,
    error: holidaysError,
  } = useHolidays();

  // Preload current month calendar data when page loads (without prefetching to avoid multiple calls)
  const currentDate = new Date();
  const { data: calendarData } = useCalendarAvailabilitySimple(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    { enabled: true } // Always enabled to preload data
  );

  // Mutation hooks
  const createTemplateMutation = useCreateTemplate();
  const updateTemplateMutation = useUpdateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();
  const createHolidayMutation = useCreateHoliday();
  const updateHolidayMutation = useUpdateHoliday();
  const deleteHolidayMutation = useDeleteHoliday();
  const invalidateAvailability = useInvalidateAvailability();

  // Extract data from React Query responses
  const templates = templatesData?.data || [];
  const holidays = holidaysData?.data || [];
  const loading = templatesLoading || holidaysLoading;

  const handleRefresh = () => {
    invalidateAvailability();
  };

  // Template handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleCloseTemplateForm = () => {
    setShowTemplateForm(false);
    setEditingTemplate(null);
  };

  const handleTemplateSaved = async (templateData) => {
    try {
      if (editingTemplate) {
        await updateTemplateMutation.mutateAsync({
          templateId: editingTemplate._id,
          updateData: templateData,
        });
      } else {
        await createTemplateMutation.mutateAsync(templateData);
      }
      handleCloseTemplateForm();
    } catch (error) {
      // Error handling is done in the mutation hooks
      throw error;
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  // Holiday handlers
  const handleCreateHoliday = () => {
    setEditingHoliday(null);
    setShowHolidayForm(true);
  };

  const handleEditHoliday = (holiday) => {
    setEditingHoliday(holiday);
    setShowHolidayForm(true);
  };

  const handleCloseHolidayForm = () => {
    setShowHolidayForm(false);
    setEditingHoliday(null);
  };

  const handleHolidaySaved = async (holidayData) => {
    try {
      if (editingHoliday) {
        await updateHolidayMutation.mutateAsync({
          holidayId: editingHoliday._id,
          updateData: holidayData,
        });
      } else {
        await createHolidayMutation.mutateAsync(holidayData);
      }
      handleCloseHolidayForm();
    } catch (error) {
      // Error handling is done in the mutation hooks
      throw error;
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    try {
      await deleteHolidayMutation.mutateAsync(holidayId);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" ariaLabel="Loading availability data" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div
        className="space-y-4 md:space-y-8 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Premium Header Section - Matching Dashboard Style */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-8 lg:p-12 shadow-2xl"
        >
          {/* Ambient background effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#346870]/30 to-[#5fa8b5]/30 rounded-full blur-3xl"></div>

          <div className="relative flex flex-row items-center justify-between gap-2 md:gap-6">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg md:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
                  <ClockIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 text-white" />
                </div>
              </motion.div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base md:text-2xl lg:text-5xl font-bold text-white tracking-tight truncate">
                  Availability Management
                </h1>
                <p className="hidden md:block text-slate-300 text-sm lg:text-lg leading-relaxed max-w-2xl mt-1 lg:mt-3">
                  Configure appointment slots, manage templates, holidays, and schedule settings for optimal clinic operations.
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-1 md:gap-2 px-2 md:px-3 lg:px-5 py-1.5 md:py-2 lg:py-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 font-semibold rounded-lg md:rounded-xl hover:bg-white/20 transition-all shadow-lg shadow-black/10 flex-shrink-0"
            >
              <ArrowPathIcon className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
              <span className="hidden sm:inline text-xs md:text-sm">Refresh</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards - Premium Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
          <StatCard
            value={templates.length}
            label="Templates"
            icon={CogIcon}
            iconColor="from-indigo-500 to-purple-600"
            hoverColor="purple-200"
            bgGradient="from-indigo-50/50 to-purple-50/50"
            badge="Active"
            badgeColor="bg-indigo-100 text-indigo-700"
            variants={itemVariants}
          />
          <StatCard
            value={holidays.length}
            label="Holidays"
            icon={CalendarIcon}
            iconColor="from-amber-500 to-orange-500"
            hoverColor="amber-200"
            bgGradient="from-amber-50/50 to-orange-50/50"
            badge="Blocked"
            badgeColor="bg-amber-100 text-amber-700"
            variants={itemVariants}
          />
          <StatCard
            value={templates.reduce((sum, t) => sum + (t.timeSlots?.length || 0), 0)}
            label="Time Slots"
            icon={ClockIcon}
            iconColor="from-cyan-500 to-blue-500"
            hoverColor="cyan-200"
            bgGradient="from-cyan-50/50 to-blue-50/50"
            badge="Total"
            badgeColor="bg-cyan-100 text-cyan-700"
            variants={itemVariants}
          />
        </div>

        {/* Premium Tab Navigation */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-2"
        >
          <nav className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("templates")}
              className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all ${activeTab === "templates"
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                : "text-gray-600 hover:bg-gray-100/80"
                }`}
            >
              <CogIcon className="h-5 w-5" />
              Templates
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("holidays")}
              className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all ${activeTab === "holidays"
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                : "text-gray-600 hover:bg-gray-100/80"
                }`}
            >
              <CalendarIcon className="h-5 w-5" />
              Holidays
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("calendar")}
              className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all ${activeTab === "calendar"
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                : "text-gray-600 hover:bg-gray-100/80"
                }`}
            >
              <ClockIcon className="h-5 w-5" />
              Calendar View
            </motion.button>
          </nav>
        </motion.div>

        {loading ? (
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-12"
          >
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <LoadingSpinner
                  size="large"
                  ariaLabel="Loading availability data"
                />
                <p className="text-gray-600 font-medium mt-4">
                  Loading availability data...
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Templates Tab */}
            {activeTab === "templates" && (
              <motion.div
                key="templates"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden"
              >
                <div className="p-8 border-b border-gray-200/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                          Availability Templates
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Create and manage time slot templates for different scenarios
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateTemplate}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                    >
                      <PlusIcon className="h-5 w-5" />
                      New Template
                    </motion.button>
                  </div>
                </div>
                <div className="p-8">
                  <TemplateList
                    templates={templates}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                    onRefresh={handleRefresh}
                  />
                </div>
              </motion.div>
            )}

            {/* Holidays Tab */}
            {activeTab === "holidays" && (
              <motion.div
                key="holidays"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden"
              >
                <div className="p-8 border-b border-gray-200/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                          Holidays & Unavailable Dates
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Manage dates when appointments are not available
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateHoliday}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add Holiday
                    </motion.button>
                  </div>
                </div>
                <div className="p-8">
                  <HolidayList
                    holidays={holidays}
                    onEdit={handleEditHoliday}
                    onDelete={handleDeleteHoliday}
                    onRefresh={handleRefresh}
                  />
                </div>
              </motion.div>
            )}

            {/* Calendar Tab */}
            {activeTab === "calendar" && (
              <motion.div
                key="calendar"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden"
              >
                <div className="p-8 border-b border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Availability Calendar
                      </h2>
                      <p className="text-gray-600 mt-1">
                        View and manage availability across dates with template applications
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <OptimizedAvailabilityCalendar
                    templates={templates}
                    holidays={holidays}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Template Form Modal */}
        {showTemplateForm && (
          <TemplateForm
            template={editingTemplate}
            onSave={handleTemplateSaved}
            onCancel={handleCloseTemplateForm}
          />
        )}

        {/* Holiday Form Modal */}
        {showHolidayForm && (
          <HolidayForm
            holiday={editingHoliday}
            onSave={handleHolidaySaved}
            onCancel={handleCloseHolidayForm}
          />
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default AvailabilityManagement;
