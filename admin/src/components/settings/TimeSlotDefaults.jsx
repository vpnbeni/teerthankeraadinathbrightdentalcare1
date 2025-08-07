import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateTimeSlotDefaults,
  setEditMode,
  updateTimeSlotForm,
  addTimeSlot,
  removeTimeSlot,
  addBreakTime,
  removeBreakTime,
  updateBreakTime,
  resetForm,
  setValidationErrors,
  clearValidationErrors,
} from "../../store/settingsSlice";
import settingsService from "../../services/settings";
import { LoadingSpinner } from "../../shared/components";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const TimeSlotDefaults = () => {
  const dispatch = useDispatch();
  const { timeSlotDefaults, editMode, saving, validationErrors } = useSelector(
    (state) => state.settings
  );

  const isEditing = editMode.timeSlotDefaults;
  const errors = validationErrors.timeSlotDefaults || [];

  const daysOfWeek = [
    { value: 0, label: "Sunday", short: "Sun" },
    { value: 1, label: "Monday", short: "Mon" },
    { value: 2, label: "Tuesday", short: "Tue" },
    { value: 3, label: "Wednesday", short: "Wed" },
    { value: 4, label: "Thursday", short: "Thu" },
    { value: 5, label: "Friday", short: "Fri" },
    { value: 6, label: "Saturday", short: "Sat" },
  ];

  const handleEditToggle = () => {
    if (isEditing) {
      dispatch(resetForm("timeSlotDefaults"));
    } else {
      dispatch(setEditMode({ category: "timeSlotDefaults", enabled: true }));
      dispatch(clearValidationErrors("timeSlotDefaults"));
    }
  };

  const handleSave = async () => {
    const validation = await settingsService.validateTimeSlotDefaults(
      timeSlotDefaults
    );

    if (!validation.isValid) {
      dispatch(
        setValidationErrors({
          category: "timeSlotDefaults",
          errors: validation.errors,
        })
      );
      return;
    }

    dispatch(clearValidationErrors("timeSlotDefaults"));
    dispatch(updateTimeSlotDefaults(timeSlotDefaults));
  };

  const handleSlotChange = (index, field, value) => {
    dispatch(updateTimeSlotForm({ index, field, value }));
  };

  const handleAddSlot = () => {
    dispatch(addTimeSlot());
  };

  const handleRemoveSlot = (index) => {
    if (window.confirm("Are you sure you want to delete this time slot?")) {
      dispatch(removeTimeSlot(index));
    }
  };

  const handleAddBreak = (slotIndex) => {
    dispatch(addBreakTime({ slotIndex }));
  };

  const handleRemoveBreak = (slotIndex, breakIndex) => {
    dispatch(removeBreakTime({ slotIndex, breakIndex }));
  };

  const handleBreakChange = (slotIndex, breakIndex, field, value) => {
    dispatch(updateBreakTime({ slotIndex, breakIndex, field, value }));
  };

  const getDayLabel = (dayOfWeek) => {
    const day = daysOfWeek.find((d) => d.value === dayOfWeek);
    return day ? day.label : `Day ${dayOfWeek}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">
            Time Slot Defaults
          </h3>
          {timeSlotDefaults.length > 0 && (
            <span className="text-sm text-gray-500">
              {timeSlotDefaults.length} slot
              {timeSlotDefaults.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {isEditing && (
            <>
              <button
                onClick={handleAddSlot}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Time Slot
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#346870] hover:bg-[#2a5359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50"
              >
                {saving ? (
                  <LoadingSpinner size="small" className="mr-2" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </button>
            </>
          )}
          <button
            onClick={handleEditToggle}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] ${
              isEditing
                ? "text-gray-700 bg-gray-200 hover:bg-gray-300"
                : "text-white bg-[#346870] hover:bg-[#2a5359]"
            }`}
          >
            {isEditing ? (
              <>
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Time Slots
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Validation Errors
          </h4>
          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {timeSlotDefaults.length === 0 ? (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No time slots configured
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first default time slot.
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddSlot}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#346870] hover:bg-[#2a5359]"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Time Slot
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {timeSlotDefaults.map((slot, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h4 className="text-lg font-medium text-gray-900">
                    {getDayLabel(slot.dayOfWeek)}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      slot.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {slot.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleRemoveSlot(index)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Slot Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) =>
                      handleSlotChange(
                        index,
                        "dayOfWeek",
                        Number(e.target.value)
                      )
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={slot.startTime || ""}
                    onChange={(e) =>
                      handleSlotChange(index, "startTime", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={slot.endTime || ""}
                    onChange={(e) =>
                      handleSlotChange(index, "endTime", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slot Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={slot.slotDuration || 60}
                    onChange={(e) =>
                      handleSlotChange(
                        index,
                        "slotDuration",
                        Number(e.target.value)
                      )
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Bookings per Slot
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={slot.maxBookingsPerSlot || 1}
                    onChange={(e) =>
                      handleSlotChange(
                        index,
                        "maxBookingsPerSlot",
                        Number(e.target.value)
                      )
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={slot.isActive !== false}
                      onChange={(e) =>
                        handleSlotChange(index, "isActive", e.target.checked)
                      }
                      disabled={!isEditing}
                      className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300 rounded disabled:opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Break Times */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-900">
                    Break Times
                  </h5>
                  {isEditing && (
                    <button
                      onClick={() => handleAddBreak(index)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add Break
                    </button>
                  )}
                </div>

                {slot.breakTimes && slot.breakTimes.length > 0 ? (
                  <div className="space-y-3">
                    {slot.breakTimes.map((breakTime, breakIndex) => (
                      <div
                        key={breakIndex}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md"
                      >
                        <input
                          type="time"
                          value={breakTime.startTime || ""}
                          onChange={(e) =>
                            handleBreakChange(
                              index,
                              breakIndex,
                              "startTime",
                              e.target.value
                            )
                          }
                          disabled={!isEditing}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#346870] disabled:bg-gray-100"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={breakTime.endTime || ""}
                          onChange={(e) =>
                            handleBreakChange(
                              index,
                              breakIndex,
                              "endTime",
                              e.target.value
                            )
                          }
                          disabled={!isEditing}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#346870] disabled:bg-gray-100"
                        />
                        <input
                          type="text"
                          value={breakTime.description || ""}
                          onChange={(e) =>
                            handleBreakChange(
                              index,
                              breakIndex,
                              "description",
                              e.target.value
                            )
                          }
                          disabled={!isEditing}
                          placeholder="Break description"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#346870] disabled:bg-gray-100"
                        />
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveBreak(index, breakIndex)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No break times configured for this slot
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          Time Slot Configuration Help
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            <strong>Day of Week:</strong> 0 = Sunday, 1 = Monday, ..., 6 =
            Saturday
          </p>
          <p>
            <strong>Slot Duration:</strong> How long each appointment slot
            should be (15-480 minutes)
          </p>
          <p>
            <strong>Max Bookings:</strong> How many appointments can be booked
            in the same time slot
          </p>
          <p>
            <strong>Break Times:</strong> Periods within the working hours when
            appointments cannot be booked
          </p>
          <p>
            <strong>Active:</strong> Whether this time slot configuration is
            currently in use
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotDefaults;
