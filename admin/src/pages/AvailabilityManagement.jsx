import React, { useState, useEffect } from "react";
import AdminLayout from "../components/common/AdminLayout";
import {
  CalendarIcon,
  ClockIcon,
  CogIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner } from "../shared/components";
import { toast } from "react-hot-toast";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-xl">
                    <ClockIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                      Availability Management
                    </h1>
                    <p className="text-gray-600 mt-1 text-lg">
                      Manage appointment availability templates, holidays, and
                      schedule configuration
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("templates")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === "templates"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <CogIcon className="h-5 w-5" />
                  Templates
                </button>
                <button
                  onClick={() => setActiveTab("holidays")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === "holidays"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <CalendarIcon className="h-5 w-5" />
                  Holidays
                </button>
                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === "calendar"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <ClockIcon className="h-5 w-5" />
                  Calendar View
                </button>
              </nav>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <LoadingSpinner
                  size="large"
                  ariaLabel="Loading availability data"
                />
                <p className="text-gray-500 mt-4">
                  Loading availability data...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Templates Tab */}
              {activeTab === "templates" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Availability Templates
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Create and manage time slot templates for different
                          scenarios
                        </p>
                      </div>
                      <button
                        onClick={handleCreateTemplate}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors duration-200"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        New Template
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <TemplateList
                      templates={templates}
                      onEdit={handleEditTemplate}
                      onDelete={handleDeleteTemplate}
                      onRefresh={handleRefresh}
                    />
                  </div>
                </div>
              )}

              {/* Holidays Tab */}
              {activeTab === "holidays" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Holidays & Unavailable Dates
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Manage dates when appointments are not available
                        </p>
                      </div>
                      <button
                        onClick={handleCreateHoliday}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors duration-200"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Holiday
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <HolidayList
                      holidays={holidays}
                      onEdit={handleEditHoliday}
                      onDelete={handleDeleteHoliday}
                      onRefresh={handleRefresh}
                    />
                  </div>
                </div>
              )}

              {/* Calendar Tab */}
              {activeTab === "calendar" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Availability Calendar
                      </h2>
                      <p className="text-gray-600 mt-1">
                        View and manage availability across dates with template
                        applications
                      </p>
                    </div>
                  </div>
                  <div className="p-6">
                    <OptimizedAvailabilityCalendar
                      templates={templates}
                      holidays={holidays}
                    />
                  </div>
                </div>
              )}
            </>
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default AvailabilityManagement;
