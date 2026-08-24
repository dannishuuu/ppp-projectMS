// services/foundationService/zonesService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/zones';

export const zonesService = {
  /**
   * Get a paginated, filtered list of zones.
   * @param {object} options - { page, limit, search, status, regionId }
   * @returns {Promise<{ zones: Array, pagination: object }>}
   */
  async getZones(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all', regionId = '' } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
    });

    if (regionId) {
      params.append('regionId', regionId);
    }

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single zone by UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getZoneById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new zone.
   * @param {{ name: string, regionId: string }} payload
   * @returns {Promise<object>}
   */
  async createZone(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing zone.
   * @param {string} id
   * @param {{ name?: string, regionId?: string }} payload
   * @returns {Promise<object>}
   */
  async updateZone(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active status of a zone.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleZoneStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete a zone.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteZone(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};