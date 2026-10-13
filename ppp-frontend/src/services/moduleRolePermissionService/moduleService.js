// services/moduleRolePermissionService/moduleService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/modules';

export const moduleService = {
  /**
   * Get a paginated, filtered list of modules.
   * @param {object} options - { page, limit, search, status, sortBy }
   */
  async getModules(options = {}) {
    const { page = 1, limit = 100, search = '', status = 'all', sortBy = 'name' } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
      sortBy,
    });
    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data || response;
  },

  /**
   * Get a module by ID.
   * @param {string} id
   */
  async getModuleById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data || response;
  },

  /**
   * Create a new module.
   * @param {{ name: string, code: string, description?: string, isActive?: boolean }} payload
   */
  async createModule(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data || response;
  },

  /**
   * Update an existing module.
   * @param {string} id
   * @param {object} payload
   */
  async updateModule(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data || response;
  },

  /**
   * Toggle module active status.
   * @param {string} id
   */
  async toggleModuleStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data || response;
  },

  /**
   * Soft-delete a module.
   * @param {string} id
   */
  async deleteModule(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data || response;
  },
};
