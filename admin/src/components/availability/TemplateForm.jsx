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
    <div className="fixed inset-0 z-[1000] bg-gray-600/50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4">
        <div className="relative mt-6 w-full max-w-2xl p-5 border shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {template ? "Edit Template" : "Create New Template"}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            {template
              ? "Update the availability template settings."
              : "Create a new availability template with custom working hours and break times."}
          </p>

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
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <h4 className="text-lg font-medium text-gray-900">
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
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Break Times
                </h4>
                <button
                  type="button"
                  onClick={addBreakTime}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Break
                </button>
              </div>

              {formData.breakTimes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No break times added. Click "Add Break" to add break periods.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.breakTimes.map((breakTime, index) => (
                    <div
                      key={index}
                      className="flex items-end gap-4 p-3 border rounded-lg bg-gray-50"
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

                      {errors[`break_${index}`] && (
                        <div className="w-full">
                          <p className="text-sm text-red-500">
                            {errors[`break_${index}`]}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <div>
                {template && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting || loading}
                    className="px-4 py-2 border border-red-200 text-red-700 font-medium rounded-md hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete Template"}
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || deleting}
                  className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : template
                    ? "Update Template"
                    : "Create Template"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[1100] bg-gray-900/50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-md bg-white p-5 shadow-lg border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-100 text-amber-700">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Template
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Are you sure you want to delete the template "
                    {template?.templateName || formData.templateName}"? This
                    action cannot be undone and will affect any dates where this
                    template is applied.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
