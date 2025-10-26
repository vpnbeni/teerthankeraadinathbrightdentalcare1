import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  PlusIcon,
  TrashIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { availabilityService } from "../../services/availability";
import { motion, AnimatePresence } from "framer-motion";

export default function TemplateForm({ template, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    templateName: "",
    isDefault: false,
    workingHours: {
      start: "09:00",
      end: "17:00",
    },
    slotDuration: 30,
    breakTimes: [],
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        templateName: template.templateName || "",
        isDefault: template.isDefault || false,
        workingHours: {
          start: template.workingHours?.start || "09:00",
          end: template.workingHours?.end || "17:00",
        },
        slotDuration: template.slotDuration || 30,
        breakTimes: template.breakTimes || [],
        isActive: template.isActive !== undefined ? template.isActive : true,
      });
    }
  }, [template]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.templateName.trim()) {
      newErrors.templateName = "Template name is required";
    }

    if (!formData.workingHours.start) {
      newErrors.workingStart = "Start time is required";
    }

    if (!formData.workingHours.end) {
      newErrors.workingEnd = "End time is required";
    }

    if (formData.workingHours.start && formData.workingHours.end) {
      const startTime = new Date(`2000-01-01T${formData.workingHours.start}`);
      const endTime = new Date(`2000-01-01T${formData.workingHours.end}`);

      if (startTime >= endTime) {
        newErrors.workingEnd = "End time must be after start time";
      }
    }

    if (
      !formData.slotDuration ||
      formData.slotDuration < 15 ||
      formData.slotDuration > 180
    ) {
      newErrors.slotDuration =
        "Slot duration must be between 15 and 180 minutes";
    }

    // Validate break times
    formData.breakTimes.forEach((breakTime, index) => {
      if (!breakTime.start || !breakTime.end) {
        newErrors[`break_${index}`] = "Break start and end times are required";
      } else {
        const breakStart = new Date(`2000-01-01T${breakTime.start}`);
        const breakEnd = new Date(`2000-01-01T${breakTime.end}`);

        if (breakStart >= breakEnd) {
          newErrors[`break_${index}`] =
            "Break end time must be after start time";
        }

        // Check if break is within working hours
        const workStart = new Date(`2000-01-01T${formData.workingHours.start}`);
        const workEnd = new Date(`2000-01-01T${formData.workingHours.end}`);

        if (breakStart < workStart || breakEnd > workEnd) {
          newErrors[`break_${index}`] = "Break must be within working hours";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving template:", error);
      // Error is already handled in parent, just keep loading state
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!template) return;
    setDeleting(true);
    try {
      await availabilityService.deleteTemplate(template._id);
      toast.success("Template deleted successfully");
      onSave();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(error.response?.data?.message || "Failed to delete template");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleWorkingHoursChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value,
      },
    }));

    // Clear errors
    if (errors[`working${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors((prev) => ({
        ...prev,
        [`working${field.charAt(0).toUpperCase() + field.slice(1)}`]: undefined,
      }));
    }
  };

  const addBreakTime = () => {
    setFormData((prev) => ({
      ...prev,
      breakTimes: [
        ...prev.breakTimes,
        { start: "12:00", end: "13:00", reason: "Lunch Break" },
      ],
    }));
  };

  const updateBreakTime = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      breakTimes: prev.breakTimes.map((breakTime, i) =>
        i === index ? { ...breakTime, [field]: value } : breakTime
      ),
    }));

    // Clear break time errors
    if (errors[`break_${index}`]) {
      setErrors((prev) => ({
        ...prev,
        [`break_${index}`]: undefined,
      }));
    }
  };

  const removeBreakTime = (index) => {
    setFormData((prev) => ({
      ...prev,
      breakTimes: prev.breakTimes.filter((_, i) => i !== index),
    }));
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Avoid rendering in non-DOM environments
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-gray-900/50 backdrop-blur-sm overflow-y-auto"
    >
      <div className="min-h-full flex items-start justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative mt-6 w-full max-w-2xl p-6 md:p-8 border border-gray-200 shadow-2xl rounded-3xl bg-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {template ? "Edit Template" : "Create New Template"}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {template
                    ? "Update the availability template settings."
                    : "Create a new availability template with custom working hours and break times."}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.templateName}
                    onChange={(e) =>
                      handleInputChange("templateName", e.target.value)
                    }
                    placeholder="e.g., Default Schedule, Extended Hours"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                      errors.templateName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.templateName && (
                    <p className="text-sm text-red-500">
                      {errors.templateName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Slot Duration (minutes) *
                  </label>
                  <select
                    value={formData.slotDuration.toString()}
                    onChange={(e) =>
                      handleInputChange(
                        "slotDuration",
                        parseInt(e.target.value)
                      )
                    }
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                      errors.slotDuration ? "border-red-500" : ""
                    }`}
                  >
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                  {errors.slotDuration && (
                    <p className="text-sm text-red-500">
                      {errors.slotDuration}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    handleInputChange("isDefault", e.target.checked)
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isDefault"
                  className="text-sm font-medium text-gray-700"
                >
                  Set as default template
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    handleInputChange("isActive", e.target.checked)
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700"
                >
                  Active
                </label>
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Working Hours
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Time *
                  </label>
                  <select
                    value={formData.workingHours.start}
                    onChange={(e) =>
                      handleWorkingHoursChange("start", e.target.value)
                    }
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                      errors.workingStart ? "border-red-500" : ""
                    }`}
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {errors.workingStart && (
                    <p className="text-sm text-red-500">
                      {errors.workingStart}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    End Time *
                  </label>
                  <select
                    value={formData.workingHours.end}
                    onChange={(e) =>
                      handleWorkingHoursChange("end", e.target.value)
                    }
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                      errors.workingEnd ? "border-red-500" : ""
                    }`}
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {errors.workingEnd && (
                    <p className="text-sm text-red-500">{errors.workingEnd}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Break Times */}
            <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Break Times
                  </h4>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={addBreakTime}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-amber-200 text-sm font-semibold rounded-xl text-amber-700 hover:bg-amber-50 transition-colors shadow-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Break
                </motion.button>
              </div>

              {formData.breakTimes.length === 0 ? (
                <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-amber-200">
                  <ClockIcon className="h-10 w-10 text-amber-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    No break times added. Click "Add Break" to add break periods.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.breakTimes.map((breakTime, index) => (
                    <div key={index}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-end gap-3 p-4 border border-amber-200 rounded-xl bg-white/80 backdrop-blur-sm"
                      >
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <select
                          value={breakTime.start}
                          onChange={(e) =>
                            updateBreakTime(index, "start", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <select
                          value={breakTime.end}
                          onChange={(e) =>
                            updateBreakTime(index, "end", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason
                        </label>
                        <input
                          type="text"
                          value={breakTime.reason}
                          onChange={(e) =>
                            updateBreakTime(index, "reason", e.target.value)
                          }
                          placeholder="e.g., Lunch, Break"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                        <button
                          type="button"
                          onClick={() => removeBreakTime(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </motion.div>
                      {errors[`break_${index}`] && (
                        <p className="text-sm text-red-500 mt-1 px-4">
                          {errors[`break_${index}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div>
                {template && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting || loading}
                    className="px-5 py-2.5 bg-red-50 border border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? "Deleting..." : "Delete Template"}
                  </motion.button>
                )}
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || deleting}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 transition-all"
                >
                  {loading
                    ? "Saving..."
                    : template
                    ? "Update Template"
                    : "Create Template"}
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-gray-900/50 backdrop-blur-sm overflow-y-auto"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Delete Template
                    </h3>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete the template "
                      {template?.templateName || formData.templateName}"? This
                      action cannot be undone and will affect any dates where this
                      template is applied.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 transition-all"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}
