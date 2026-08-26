import { apiClient } from '../../utils/apiClient';

const BASE = '/payment-timings';

export const paymentTimingsService = {
  async getPaymentTimings(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search, status });
    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  async getPaymentTimingById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  async createPaymentTiming(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  async updatePaymentTiming(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  async togglePaymentTimingStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  async deletePaymentTiming(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};