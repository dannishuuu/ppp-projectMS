// services/moduleRolePermissionService/userRoleService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/user-roles';

export const userRoleService = {
  /**
   * Get all active roles assigned to a user.
   * @param {string} userId
   */
  async getUserRoles(userId) {
    const response = await apiClient.get(`${BASE}/users/${userId}/roles`);
    return response.data || response;
  },

  /**
   * Assign or replace roles for a user.
   * @param {string} userId
   * @param {string[]} roleIds - Array of role UUIDs
   */
  async assignRolesToUser(userId, roleIds = []) {
    const response = await apiClient.post(`${BASE}/users/${userId}/roles`, { roleIds });
    return response.data || response;
  },

  /**
   * Remove a single role from a user.
   * @param {string} userId
   * @param {string} roleId
   */
  async removeRoleFromUser(userId, roleId) {
    const response = await apiClient.delete(`${BASE}/users/${userId}/roles/${roleId}`);
    return response.data || response;
  },

  /**
   * Get resolved permissions and roles for a specific user.
   * @param {string} userId
   */
  async getUserPermissions(userId) {
    const response = await apiClient.get(`${BASE}/users/${userId}/permissions`);
    return response.data || response;
  },

  /**
   * Get resolved permissions and roles for the currently logged-in user.
   */
  async getMyPermissions() {
    const response = await apiClient.get(`${BASE}/my-permissions`);
    return response.data || response;
  },
};
