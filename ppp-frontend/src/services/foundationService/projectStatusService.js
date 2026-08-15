// services/foundationService/projectStatusService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/project-statuses';

export const projectStatusService = {
  /**
   * Get a paginated, filtered list of project statuses.
   * @param {object} options - { page, limit, search, status }
   * @returns {Promise<{ projectStatuses: Array, pagination: object }>}
   */
  async getProjectStatuses(options = {}) {
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
   * Get a single project status by UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getProjectStatusById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new project status.
   * @param {{ name: string, description?: string }} payload
   * @returns {Promise<object>}
   */
  async createProjectStatus(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing project status.
   * @param {string} id
   * @param {{ name?: string, description?: string }} payload
   * @returns {Promise<object>}
   */
  async updateProjectStatus(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active/inactive status of a project status.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleProjectStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete a project status.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteProjectStatus(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};
