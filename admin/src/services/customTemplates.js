import api from "./api";

/**
 * Custom Templates Service
 * API calls for custom template management
 */

const customTemplatesService = {
  // Get all custom templates
  getCustomTemplates: async (params = {}) => {
    try {
      const response = await api.get("/admin/custom-templates", { params });
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch custom templates"
      );
    }
  },

  // Get a specific custom template
  getCustomTemplate: async (id) => {
    try {
      const response = await api.get(`/admin/custom-templates/${id}`);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch custom template"
      );
    }
  },

  // Create a new custom template
  createCustomTemplate: async (templateData) => {
    try {
      const response = await api.post("/admin/custom-templates", templateData);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create custom template"
      );
    }
  },

  // Update a custom template
  updateCustomTemplate: async (id, templateData) => {
    try {
      const response = await api.put(`/admin/custom-templates/${id}`, templateData);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update custom template"
      );
    }
  },

  // Delete a custom template
  deleteCustomTemplate: async (id) => {
    try {
      const response = await api.delete(`/admin/custom-templates/${id}`);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete custom template"
      );
    }
  },

  // Copy a custom template
  copyCustomTemplate: async (id, copyData = {}) => {
    try {
      const response = await api.post(`/admin/custom-templates/${id}/copy`, copyData);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to copy custom template"
      );
    }
  },

  // Get templates applicable for a specific date
  getApplicableTemplates: async (date) => {
    try {
      const response = await api.get(`/admin/custom-templates/applicable/${date}`);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch applicable templates"
      );
    }
  },

  // Preview template slots for a date range
  previewTemplateSlots: async (previewData) => {
    try {
      const response = await api.post("/admin/custom-templates/preview", previewData);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to preview template slots"
      );
    }
  },

  // Bulk operations on custom templates
  bulkUpdateCustomTemplates: async (operationData) => {
    try {
      const response = await api.post("/admin/custom-templates/bulk", operationData);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to perform bulk operation"
      );
    }
  },
};

export default customTemplatesService;
