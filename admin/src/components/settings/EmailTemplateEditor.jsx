import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateEmailTemplates,
  setEditMode,
  updateEmailTemplateForm,
  addEmailTemplate,
  removeEmailTemplate,
  resetForm,
  setValidationErrors,
  clearValidationErrors,
} from "../../store/settingsSlice";
import settingsService from "../../services/settings";
import { LoadingSpinner } from "../../shared/components";
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const EmailTemplateEditor = () => {
  const dispatch = useDispatch();
  const { emailTemplates, editMode, saving, validationErrors } = useSelector(
    (state) => state.settings
  );

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  const isEditing = editMode.emailTemplates;
  const templateNames = Object.keys(emailTemplates || {});

  useEffect(() => {
    if (templateNames.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templateNames[0]);
    }
  }, [templateNames, selectedTemplate]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      dispatch(resetForm("emailTemplates"));
    } else {
      // Start editing
      dispatch(setEditMode({ category: "emailTemplates", enabled: true }));
      dispatch(clearValidationErrors("emailTemplates"));
    }
  };

  const handleSave = async () => {
    // Validate all templates
    const errors = {};
    let hasErrors = false;

    for (const [templateName, template] of Object.entries(emailTemplates)) {
      const validation = await settingsService.validateEmailTemplate(
        templateName,
        template
      );
      if (!validation.isValid) {
        errors[templateName] = validation.errors;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      dispatch(setValidationErrors({ category: "emailTemplates", errors }));
      return;
    }

    dispatch(clearValidationErrors("emailTemplates"));
    dispatch(updateEmailTemplates(emailTemplates));
  };

  const handleTemplateChange = (field, value) => {
    if (selectedTemplate) {
      dispatch(
        updateEmailTemplateForm({
          templateName: selectedTemplate,
          field,
          value,
        })
      );
    }
  };

  const handleAddTemplate = () => {
    if (newTemplateName.trim()) {
      dispatch(addEmailTemplate(newTemplateName.trim()));
      setSelectedTemplate(newTemplateName.trim());
      setNewTemplateName("");
      setShowAddTemplate(false);
    }
  };

  const handleRemoveTemplate = (templateName) => {
    if (
      window.confirm(
        `Are you sure you want to delete the template "${templateName}"?`
      )
    ) {
      dispatch(removeEmailTemplate(templateName));
      if (selectedTemplate === templateName) {
        const remainingTemplates = templateNames.filter(
          (name) => name !== templateName
        );
        setSelectedTemplate(
          remainingTemplates.length > 0 ? remainingTemplates[0] : null
        );
      }
    }
  };

  const handleVariableAdd = () => {
    if (selectedTemplate) {
      const currentTemplate = emailTemplates[selectedTemplate];
      const newVariables = [
        ...(currentTemplate.variables || []),
        { name: "", description: "", required: false },
      ];
      handleTemplateChange("variables", newVariables);
    }
  };

  const handleVariableChange = (index, field, value) => {
    if (selectedTemplate) {
      const currentTemplate = emailTemplates[selectedTemplate];
      const updatedVariables = [...(currentTemplate.variables || [])];
      updatedVariables[index] = { ...updatedVariables[index], [field]: value };
      handleTemplateChange("variables", updatedVariables);
    }
  };

  const handleVariableRemove = (index) => {
    if (selectedTemplate) {
      const currentTemplate = emailTemplates[selectedTemplate];
      const updatedVariables = [...(currentTemplate.variables || [])];
      updatedVariables.splice(index, 1);
      handleTemplateChange("variables", updatedVariables);
    }
  };

  const currentTemplate = selectedTemplate
    ? emailTemplates[selectedTemplate]
    : null;
  const currentErrors = selectedTemplate
    ? validationErrors.emailTemplates[selectedTemplate]
    : [];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
          {templateNames.length > 0 && (
            <span className="text-sm text-gray-500">
              {templateNames.length} template
              {templateNames.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {isEditing && (
            <>
              <button
                onClick={() => setShowAddTemplate(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Template
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
                Edit Templates
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Template Modal */}
      {showAddTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Template
              </h3>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name (e.g., welcome-email)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870]"
                onKeyPress={(e) => e.key === "Enter" && handleAddTemplate()}
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddTemplate(false);
                    setNewTemplateName("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTemplate}
                  disabled={!newTemplateName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#346870] rounded-md hover:bg-[#2a5359] disabled:opacity-50"
                >
                  Add Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {templateNames.length === 0 ? (
        <div className="text-center py-12">
          <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No email templates
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first email template.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddTemplate(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#346870] hover:bg-[#2a5359]"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Templates
              </h4>
              <div className="space-y-2">
                {templateNames.map((templateName) => (
                  <div
                    key={templateName}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                      selectedTemplate === templateName
                        ? "bg-[#346870] text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedTemplate(templateName)}
                  >
                    <span className="text-sm font-medium truncate">
                      {templateName}
                    </span>
                    {isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTemplate(templateName);
                        }}
                        className={`ml-2 p-1 rounded hover:bg-red-100 ${
                          selectedTemplate === templateName
                            ? "text-red-200 hover:text-red-600"
                            : "text-red-400 hover:text-red-600"
                        }`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-3">
            {currentTemplate && (
              <div className="space-y-6">
                {/* Validation Errors */}
                {currentErrors && currentErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-800 mb-2">
                      Validation Errors
                    </h4>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      {currentErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Template Form */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      {selectedTemplate}
                    </h4>
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      {previewMode ? "Edit" : "Preview"}
                    </button>
                  </div>

                  {previewMode ? (
                    // Preview Mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject Preview
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md border">
                          {currentTemplate.subject || "No subject"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          HTML Content Preview
                        </label>
                        <div
                          className="p-4 bg-white border rounded-md min-h-32"
                          dangerouslySetInnerHTML={{
                            __html:
                              currentTemplate.htmlContent || "No HTML content",
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Text Content Preview
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md border whitespace-pre-wrap">
                          {currentTemplate.textContent || "No text content"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-6">
                      {/* Subject */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={currentTemplate.subject || ""}
                          onChange={(e) =>
                            handleTemplateChange("subject", e.target.value)
                          }
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Email subject line"
                        />
                      </div>

                      {/* HTML Content */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          HTML Content
                        </label>
                        <textarea
                          value={currentTemplate.htmlContent || ""}
                          onChange={(e) =>
                            handleTemplateChange("htmlContent", e.target.value)
                          }
                          disabled={!isEditing}
                          rows={8}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="HTML email content with variables like {{patientName}}"
                        />
                      </div>

                      {/* Text Content */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Text Content
                        </label>
                        <textarea
                          value={currentTemplate.textContent || ""}
                          onChange={(e) =>
                            handleTemplateChange("textContent", e.target.value)
                          }
                          disabled={!isEditing}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#346870] focus:border-[#346870] disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Plain text email content with variables like {{patientName}}"
                        />
                      </div>

                      {/* Variables */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Template Variables
                          </label>
                          {isEditing && (
                            <button
                              onClick={handleVariableAdd}
                              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <PlusIcon className="h-3 w-3 mr-1" />
                              Add Variable
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {(currentTemplate.variables || []).map(
                            (variable, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md"
                              >
                                <input
                                  type="text"
                                  value={variable.name || ""}
                                  onChange={(e) =>
                                    handleVariableChange(
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  disabled={!isEditing}
                                  placeholder="Variable name"
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#346870] disabled:bg-gray-100"
                                />
                                <input
                                  type="text"
                                  value={variable.description || ""}
                                  onChange={(e) =>
                                    handleVariableChange(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  disabled={!isEditing}
                                  placeholder="Description"
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#346870] disabled:bg-gray-100"
                                />
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={variable.required || false}
                                    onChange={(e) =>
                                      handleVariableChange(
                                        index,
                                        "required",
                                        e.target.checked
                                      )
                                    }
                                    disabled={!isEditing}
                                    className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300 rounded disabled:opacity-50"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Required
                                  </span>
                                </label>
                                {isEditing && (
                                  <button
                                    onClick={() => handleVariableRemove(index)}
                                    className="p-1 text-red-400 hover:text-red-600"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            )
                          )}
                          {(!currentTemplate.variables ||
                            currentTemplate.variables.length === 0) && (
                            <p className="text-sm text-gray-500 italic">
                              No variables defined for this template
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateEditor;
