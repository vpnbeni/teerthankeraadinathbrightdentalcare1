import api from "./api";

const sessionService = {
  // Get all sessions with pagination and filters
  getSessions: async (params = {}) => {
    const response = await api.get("/admin/sessions", { params });
    return response;
  },

  // Get session by ID
  getSessionById: async (sessionId) => {
    const response = await api.get(`/admin/sessions/${sessionId}`);
    return response;
  },

  // Create new session
  createSession: async (sessionData) => {
    const response = await api.post("/admin/sessions", sessionData);
    return response;
  },

  // Update session
  updateSession: async (sessionId, sessionData) => {
    const response = await api.put(`/admin/sessions/${sessionId}`, sessionData);
    return response;
  },

  // Delete session
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/admin/sessions/${sessionId}`);
    return response;
  },

  // Get sessions for a specific user
  getUserSessions: async (userId, params = {}) => {
    const response = await api.get(`/admin/sessions/user/${userId}`, {
      params,
    });
    return response;
  },

  // Get sessions for a specific appointment
  getAppointmentSessions: async (appointmentId) => {
    const response = await api.get(
      `/admin/sessions/appointment/${appointmentId}`
    );
    return response;
  },

  // Add custom field to session
  addCustomField: async (sessionId, fieldData) => {
    const response = await api.post(
      `/admin/sessions/${sessionId}/custom-fields`,
      fieldData
    );
    return response;
  },

  // Update custom field
  updateCustomField: async (sessionId, fieldId, fieldData) => {
    const response = await api.put(
      `/admin/sessions/${sessionId}/custom-fields/${fieldId}`,
      fieldData
    );
    return response;
  },

  // Delete custom field
  deleteCustomField: async (sessionId, fieldId) => {
    const response = await api.delete(
      `/admin/sessions/${sessionId}/custom-fields/${fieldId}`
    );
    return response;
  },

  // Get session templates
  getSessionTemplates: async () => {
    const response = await api.get("/admin/sessions/templates");
    return response;
  },

  // Create session template
  createSessionTemplate: async (templateData) => {
    const response = await api.post("/admin/sessions/templates", templateData);
    return response;
  },

  // Export sessions data
  exportSessions: async (params = {}) => {
    const response = await api.get("/admin/sessions/export", {
      params,
      responseType: "blob",
    });
    return response;
  },

  // Get session statistics
  getSessionStats: async (params = {}) => {
    const response = await api.get("/admin/sessions/stats", { params });
    return response;
  },
};

export default sessionService;
