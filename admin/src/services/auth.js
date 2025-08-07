import api from "./api";

const authService = {
  // Admin login
  login: async (credentials) => {
    console.log(
      "Auth service: Making login request with credentials:",
      credentials
    );
    const response = await api.post("/auth/admin/login", credentials);
    console.log("Auth service: Login response:", response);

    // Store token if provided (admin login returns token directly in response.data.token)
    if (response.data.token) {
      localStorage.setItem("adminToken", response.data.token);
      console.log("Auth service: Token stored in localStorage");
    }

    return response;
  },

  // Admin logout
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("adminToken");
    }
  },

  // Get current admin user
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await api.post("/auth/refresh");

    if (response.data.token) {
      localStorage.setItem("adminToken", response.data.token);
    }

    return response;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put("/auth/change-password", passwordData);
    return response;
  },
};

export default authService;
