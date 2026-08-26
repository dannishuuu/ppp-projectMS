import { apiClient } from '../../utils/apiClient';

const BASE = '/rental-payment-types';

export const rentalPaymentTypesService = {
  async getRentalPaymentTypes(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search, status });
    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  async getRentalPaymentTypeById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  async createRentalPaymentType(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  async updateRentalPaymentType(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  async toggleRentalPaymentTypeStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  async deleteRentalPaymentType(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};