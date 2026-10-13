// services/moduleRolePermissionService/roleService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/roles';

export const roleService = {
  /**
   * Get a paginated, filtered list of roles.
   * @param {object} options - { page, limit, search, status, sortBy }
   */
  async getRoles(options = {}) {
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
   * Get a single role by ID with its list of permissions.
   * @param {string} id
   */
  async getRoleById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data || response;
  },

  /**
   * Create a new custom role.
   * @param {{ name: string, code: string, description?: string, isSystem?: boolean, permissionIds?: string[] }} payload
   */
  async createRole(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data || response;
  },

  /**
   * Update an existing role and optionally sync its permissions.
   * @param {string} id
   * @param {{ name?: string, description?: string, isActive?: boolean, permissionIds?: string[] }} payload
   */
  async updateRole(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data || response;
  },

  /**
   * Toggle role active status.
   * @param {string} id
   */
  async toggleRoleStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data || response;
  },

  /**
   * Soft-delete a custom role (fails for system roles).
   * @param {string} id
   */
  async deleteRole(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data || response;
  },

  /**
   * Get assigned permissions for a role.
   * @param {string} roleId
   */
  async getRolePermissions(roleId) {
    const response = await apiClient.get(`${BASE}/${roleId}/permissions`);
    return response.data || response;
  },

  /**
   * Sync/assign permissions for a role.
   * @param {string} roleId
   * @param {string[]} permissionIds
   */
  async assignPermissions(roleId, permissionIds = []) {
    const response = await apiClient.post(`${BASE}/${roleId}/permissions`, { permissionIds });
    return response.data || response;
  },
};
