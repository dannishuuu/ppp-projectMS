// services/moduleRolePermissionService/permissionService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/permissions';

export const permissionService = {
  /**
   * Get a paginated, filtered list of permissions.
   * @param {object} options - { page, limit, search, moduleId, status }
   */
  async getPermissions(options = {}) {
    const { page = 1, limit = 200, search = '', moduleId = null, status = 'all' } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
    });
    if (moduleId) params.append('moduleId', moduleId);

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data || response;
  },

  /**
   * Get all active permissions grouped by module.
   * Used directly by the Role Permission Matrix grid component.
   * @returns {Promise<Array>} Array of modules with nested permissions.
   */
  async getPermissionMatrix() {
    const response = await apiClient.get(`${BASE}/matrix`);
    return response.data || response;
  },

  /**
   * Get a permission by ID.
   * @param {string} id
   */
  async getPermissionById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data || response;
  },

  /**
   * Create a new permission.
   * @param {{ moduleId: string, actionId: string, code?: string, name?: string, description?: string }} payload
   */
  async createPermission(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data || response;
  },

  /**
   * Batch auto-generate permissions for a module across selected action IDs.
   * @param {{ moduleId: string, actionIds: string[] }} payload
   */
  async batchGeneratePermissions(payload) {
    const response = await apiClient.post(`${BASE}/batch-generate`, payload);
    return response.data || response;
  },

  /**
   * Update an existing permission.
   * @param {string} id
   * @param {object} payload
   */
  async updatePermission(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data || response;
  },

  /**
   * Toggle permission active status.
   * @param {string} id
   */
  async togglePermissionStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data || response;
  },

  /**
   * Soft-delete a permission.
   * @param {string} id
   */
  async deletePermission(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data || response;
  },
};
