// services/foundationService/woredasService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/woredas';

export const woredasService = {
  /**
   * Get a paginated, filtered list of woredas.
   * @param {object} options - { page, limit, search, status, zoneId }
   * @returns {Promise<{ woredas: Array, pagination: object }>}
   */
  async getWoredas(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all', zoneId = '' } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
    });

    if (zoneId) {
      params.append('zoneId', zoneId);
    }

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single woreda by UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getWoredaById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new woreda.
   * @param {{ name: string, zoneId: string }} payload
   * @returns {Promise<object>}
   */
  async createWoreda(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing woreda.
   * @param {string} id
   * @param {{ name?: string, zoneId?: string }} payload
   * @returns {Promise<object>}
   */
  async updateWoreda(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active status of a woreda.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleWoredaStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete a woreda.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteWoreda(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};