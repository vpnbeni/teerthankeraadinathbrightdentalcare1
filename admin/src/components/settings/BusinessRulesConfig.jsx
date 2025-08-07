import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateBusinessRules,
  setEditMode,
  updateBusinessRuleForm,
  addBusinessRule,
  removeBusinessRule,
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
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const BusinessRulesConfig = () => {
  const dispatch = useDispatch();
  const { businessRules, editMode, saving, validationErrors } = useSelector(
    (state) => state.settings
  );

  const [newRuleName, setNewRuleName] = useState("");
  const [showAddRule, setShowAddRule] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const isEditing = editMode.businessRules;
  const ruleNames = Object.keys(businessRules || {});

  const categories = [
    { id: "all", name: "All Rules", color: "gray" },
    { id: "booking", name: "Booking", color: "blue" },
    { id: "cancellation", name: "Cancellation", color: "yellow" },
    { id: "payment", name: "Payment", color: "green" },
    { id: "notification", name: "Notification", color: "purple" },
    { id: "general", name: "General", color: "gray" },
  ];

  const filteredRules =
    selectedCategory === "all"
      ? ruleNames
      : ruleNames.filter(
          (ruleName) => businessRules[ruleName]?.category === selectedCategory
        );

  const handleEditToggle = () => {
    if (isEditing) {
      dispatch(resetForm("businessRules"));
    } else {
      dispatch(setEditMode({ category: "businessRules", enabled: true }));
      dispatch(clearValidationErrors("businessRules"));
    }
  };

  const handleSave = async () => {
    const errors = {};
    let hasErrors = false;

    for (const [ruleName, rule] of Object.entries(businessRules)) {
      const validation = await settingsService.validateBusinessRule(
        ruleName,
        rule
      );
      if (!validation.isValid) {
        errors[ruleName] = validation.errors;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      dispatch(setValidationErrors({ category: "businessRules", errors }));
      return;
    }

    dispatch(clearValidationErrors("businessRules"));
    dispatch(updateBusinessRules(businessRules));
  };

  const handleRuleChange = (ruleName, field, value) => {
    dispatch(updateBusinessRuleForm({ ruleName, field, value }));
  };

  const handleAddRule = () => {
    if (newRuleName.trim()) {
      const ruleName = newRuleName.trim().toLowerCase().replace(/\s+/g, "-");
      dispatch(addBusinessRule(ruleName));
      setNewRuleName("");
      setShowAddRule(false);
    }
  };

  const handleRemoveRule = (ruleName) => {
    if (
      window.confirm(`Are you sure you want to delete the rule "${ruleName}"?`)
    ) {
      dispatch(removeBusinessRule(ruleName));
    }
  };

  const getCategoryColor = (category) => {
    const categoryInfo = categories.find((cat) => cat.id === category);
    return categoryInfo ? categoryInfo.color : "gray";
  };

  const getCategoryBadgeClasses = (category) => {
    const color = getCategoryColor(category);
    const colorClasses = {
      blue: "bg-blue-100 text-blue-800",
      yellow: "bg-yellow-100 text-yellow-800",
      green: "bg-green-100 text-green-800",
      purple: "bg-purple-100 text-purple-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Business Rules</h3>
          {ruleNames.length > 0 && (
            <span className="text-sm text-gray-500">
              {ruleNames.length} rule{ruleNames.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {isEditing && (
            <>
              <button
                onClick={() => setShowAddRule(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Rule
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
                Edit Rules
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Business Rule
              </h3>
              <input
                type="text"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="Rule name (e.g., Max Appointments Per Day)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870]"
                onKeyPress={(e) => e.key === "Enter" && handleAddRule()}
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddRule(false);
                    setNewRuleName("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRule}
                  disabled={!newRuleName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#346870] rounded-md hover:bg-[#2a5359] disabled:opacity-50"
                >
                  Add Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? "bg-[#346870] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category.name}
            {category.id !== "all" && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gray-600 rounded-full">
                {
                  ruleNames.filter(
                    (ruleName) =>
                      businessRules[ruleName]?.category === category.id
                  ).length
                }
              </span>
            )}
          </button>
        ))}
      </div>

      {ruleNames.length === 0 ? (
        <div className="text-center py-12">
          <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No business rules configured
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first business rule.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddRule(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#346870] hover:bg-[#2a5359]"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Rule
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRules.map((ruleName) => {
            const rule = businessRules[ruleName];
            const errors = validationErrors.businessRules[ruleName] || [];

            return (
              <div
                key={ruleName}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                {/* Rule Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">
                      {ruleName}
                    </h4>
                    <span
                      className={getCategoryBadgeClasses(
                        rule?.category || "general"
                      )}
                    >
                      {rule?.category || "general"}
                    </span>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveRule(ruleName)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Validation Errors */}
                {errors.length > 0 && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-red-800 mb-1">
                      Validation Errors
                    </h5>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rule Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={rule?.name || ""}
                      onChange={(e) =>
                        handleRuleChange(ruleName, "name", e.target.value)
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Human-readable rule name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={rule?.category || "general"}
                      onChange={(e) =>
                        handleRuleChange(ruleName, "category", e.target.value)
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="booking">Booking</option>
                      <option value="cancellation">Cancellation</option>
                      <option value="payment">Payment</option>
                      <option value="notification">Notification</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Value
                    </label>
                    <input
                      type={typeof rule?.value === "number" ? "number" : "text"}
                      value={rule?.value || ""}
                      onChange={(e) => {
                        const value =
                          e.target.type === "number"
                            ? e.target.value === ""
                              ? ""
                              : Number(e.target.value)
                            : e.target.value;
                        handleRuleChange(ruleName, "value", value);
                      }}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Rule value"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={rule?.description || ""}
                      onChange={(e) =>
                        handleRuleChange(
                          ruleName,
                          "description",
                          e.target.value
                        )
                      }
                      disabled={!isEditing}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Describe what this rule controls"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRules.length === 0 && selectedCategory !== "all" && (
            <div className="text-center py-8">
              <Cog6ToothIcon className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No rules in this category
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No business rules found for the{" "}
                {categories
                  .find((cat) => cat.id === selectedCategory)
                  ?.name.toLowerCase()}{" "}
                category.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Rule Examples */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          Common Business Rules Examples
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            <strong>Booking:</strong> advance-booking-days (30),
            max-appointments-per-day (20)
          </p>
          <p>
            <strong>Cancellation:</strong> cancellation-hours (24),
            no-show-penalty (true)
          </p>
          <p>
            <strong>Payment:</strong> payment-due-days (7), late-fee-amount (50)
          </p>
          <p>
            <strong>Notification:</strong> reminder-hours (24),
            confirmation-required (true)
          </p>
          <p>
            <strong>General:</strong> session-expiry-days (365), clinic-timezone
            (Asia/Kolkata)
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessRulesConfig;
