// services/moduleRolePermissionService/actionService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/actions';

export const actionService = {
  /**
   * Get a paginated, filtered list of actions.
   * @param {object} options - { page, limit, search, status, sortBy }
   */
  async getActions(options = {}) {
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
   * Get an action by ID.
   * @param {string} id
   */
  async getActionById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data || response;
  },

  /**
   * Create a new action.
   * @param {{ name: string, code: string, description?: string, isActive?: boolean }} payload
   */
  async createAction(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data || response;
  },

  /**
   * Update an existing action.
   * @param {string} id
   * @param {object} payload
   */
  async updateAction(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data || response;
  },

  /**
   * Toggle action active status.
   * @param {string} id
   */
  async toggleActionStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data || response;
  },

  /**
   * Soft-delete an action.
   * @param {string} id
   */
  async deleteAction(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data || response;
  },
};
