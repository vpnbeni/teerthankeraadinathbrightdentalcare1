import api from "./api";

const plansService = {
  // Get all active plans
  getPlans: async () => {
    const response = await api.get("/plans");
    return response;
  },

  // Get single plan by ID
  getPlan: async (planId) => {
    const response = await api.get(`/plans/${planId}`);
    return response;
  },
};

export default plansService;
