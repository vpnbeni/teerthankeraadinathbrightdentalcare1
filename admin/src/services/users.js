import api from "./api";

const userService = {
  // Get all users with basic pagination and search
  getUsers: async (params = {}) => {
    try {
      const response = await api.get("/admin/users", { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch users");
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch user");
    }
  },

  // Update user basic info
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update user");
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete user");
    }
  },

  // Update user subscription
  updateUserSubscription: async (userId, subscriptionData) => {
    try {
      const response = await api.put(
        `/admin/users/${userId}/subscription`,
        subscriptionData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update subscription"
      );
    }
  },

  // Get recent users for dashboard
  getRecentUsers: async (params = {}) => {
    try {
      const response = await api.get("/admin/users/recent", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch recent users"
      );
    }
  },
};

export default userService;
