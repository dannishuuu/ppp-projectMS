// services/organizationService/organizationTypeService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/organization-types';

export const organizationTypeService = {
  /**
   * Get a paginated, filtered list of organization types.
   * @param {object} options - { page, limit, search, status }
   * @returns {{ organizationTypes: Array, pagination: object }}
   */
  async getOrganizationTypes(options = {}) {
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
   * Get a single organization type by its UUID.
   * @param {string} id
   */
  async getOrganizationTypeById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new organization type.
   * @param {{ name: string, description?: string }} payload
   */
  async createOrganizationType(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing organization type.
   * @param {string} id
   * @param {{ name?: string, description?: string }} payload
   */
  async updateOrganizationType(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the is_active status of an organization type.
   * @param {string} id
   * @returns {{ message: string, is_active: boolean }}
   */
  async toggleOrganizationTypeStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete an organization type.
   * @param {string} id
   * @returns {{ message: string }}
   */
  async deleteOrganizationType(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};
