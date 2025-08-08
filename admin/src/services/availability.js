import api from './api.js';

export const availabilityService = {
  // Template Management
  async getTemplates(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/availability/templates?${params}`);
    return response.data;
  },

  async getTemplate(templateId) {
    const response = await api.get(`/availability/templates/${templateId}`);
    return response.data;
  },

  async createTemplate(templateData) {
    const response = await api.post('/availability/templates', templateData);
    return response.data;
  },

  async updateTemplate(templateId, updateData) {
    const response = await api.put(`/availability/templates/${templateId}`, updateData);
    return response.data;
  },

  async deleteTemplate(templateId) {
    const response = await api.delete(`/availability/templates/${templateId}`);
    return response.data;
  },

  async applyTemplateToDate(templateId, dates) {
    const response = await api.post(`/availability/templates/${templateId}/apply-dates`, { dates });
    return response.data;
  },

  async removeTemplateFromDates(templateId, dates) {
    const response = await api.post(`/availability/templates/${templateId}/remove-dates`, { dates });
    return response.data;
  },

  // Holiday Management
  async getHolidays(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/availability/holidays?${params}`);
    return response.data;
  },

  async getHoliday(holidayId) {
    const response = await api.get(`/availability/holidays/${holidayId}`);
    return response.data;
  },

  async createHoliday(holidayData) {
    const response = await api.post('/availability/holidays', holidayData);
    return response.data;
  },

  async updateHoliday(holidayId, updateData) {
    const response = await api.put(`/availability/holidays/${holidayId}`, updateData);
    return response.data;
  },

  async deleteHoliday(holidayId) {
    const response = await api.delete(`/availability/holidays/${holidayId}`);
    return response.data;
  },

  // Availability Queries
  async getAvailabilityForDate(date, onlyAvailable = false) {
    const params = new URLSearchParams({ onlyAvailable });
    const response = await api.get(`/availability/availability/date/${date}?${params}`);
    return response.data;
  },

  async getAvailabilityForDateRange(startDate, endDate, onlyAvailable = false) {
    const params = new URLSearchParams({ startDate, endDate, onlyAvailable });
    const response = await api.get(`/availability/availability/range?${params}`);
    return response.data;
  },

  async checkTimeSlotAvailability(date, timeSlot, excludeAppointmentId = null) {
    const params = excludeAppointmentId ? { excludeAppointmentId } : {};
    const response = await api.post(`/availability/availability/check-slot?${new URLSearchParams(params)}`, {
      date,
      timeSlot
    });
    return response.data;
  },

  async getAvailableDates(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get(`/availability/availability/dates?${params}`);
    return response.data;
  }
};

export default availabilityService;