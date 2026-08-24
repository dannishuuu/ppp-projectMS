// services/foundationService/regionsService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/regions';

export const regionsService = {
  /**
   * Get a paginated, filtered list of regions.
   * @param {object} options - { page, limit, search, status, countryId }
   * @returns {Promise<{ regions: Array, pagination: object }>}
   */
  async getRegions(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all', countryId = '' } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
    });
    
    if (countryId) {
      params.append('countryId', countryId);
    }

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single region by UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getRegionById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new region.
   * @param {{ name: string, code?: string, countryId: string }} payload
   * @returns {Promise<object>}
   */
  async createRegion(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing region.
   * @param {string} id
   * @param {{ name?: string, code?: string, countryId?: string }} payload
   * @returns {Promise<object>}
   */
  async updateRegion(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active status of a region.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleRegionStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete a region.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteRegion(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};