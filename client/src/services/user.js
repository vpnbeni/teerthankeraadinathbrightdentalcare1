import api from "./api";
import authService from "./auth";

const userService = {
  // Get user profile from auth endpoint
  getProfile: async () => {
    return await authService.getProfile();
  },

  // Check authentication status and get basic user info
  checkAuth: async () => {
    return await authService.checkAuth();
  },

  // Update personal information
  updatePersonalInfo: async (personalData) => {
    const response = await api.put(
      "/users/profile/personal",
      personalData,
      {
        // Avoid global interceptor toasts; component will handle toasts
        skipSuccessMessage: true,
        skipErrorMessage: true,
      }
    );
    return response;
  },

  // Update medical information
  updateMedicalInfo: async (medicalData) => {
    const response = await api.put(
      "/users/profile/medical",
      medicalData,
      {
        // Avoid global interceptor toasts; component will handle toasts
        skipSuccessMessage: true,
        skipErrorMessage: true,
      }
    );
    return response;
  },

  // Get user details by ID (admin or self access)
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response;
  },

  // Get current user dashboard stats
  getDashboardStats: async () => {
    const response = await api.get("/users/dashboard/stats");
    return response;
  },

  // Upload document
  uploadDocument: async (documentData, options = {}) => {
    const formData = new FormData();
    formData.append("file", documentData.file);
    formData.append("type", documentData.type);

    const response = await api.post("/users/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      skipErrorMessage: options.skipErrorMessage,
    });
    return response;
  },

  // Get documents
  getDocuments: async (options = {}) => {
    const response = await api.get("/users/documents", {
      skipErrorMessage: options.skipErrorMessage,
    });
    return response;
  },

  // Delete document
  deleteDocument: async (documentId, options = {}) => {
    const response = await api.delete(`/users/documents/${documentId}`, {
      skipErrorMessage: options.skipErrorMessage,
    });
    return response;
  },

  // Get subscription details
  getSubscription: async () => {
    const response = await api.get("/users/subscription");
    return response;
  },

  // Update subscription
  updateSubscription: async (subscriptionData) => {
    const response = await api.put("/users/subscription", subscriptionData);
    return response;
  },
};

export default userService;
