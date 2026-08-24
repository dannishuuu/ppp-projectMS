import { apiClient } from '../../utils/apiClient';

const BASE = '/building-types';

export const buildingTypesService = {
  /**
   * Get a paginated, filtered list of building types.
   * @param {object} options - { page, limit, search, status }
   * @returns {Promise<{ buildingTypes: Array, pagination: object }>}
   */
  async getBuildingTypes(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
    });
    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single building type by UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getBuildingTypeById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new building type.
   * @param {{ name: string, description?: string }} payload
   * @returns {Promise<object>}
   */
  async createBuildingType(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing building type.
   * @param {string} id
   * @param {{ name?: string, description?: string }} payload
   * @returns {Promise<object>}
   */
  async updateBuildingType(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active status of a building type.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleBuildingTypeStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete a building type.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteBuildingType(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};