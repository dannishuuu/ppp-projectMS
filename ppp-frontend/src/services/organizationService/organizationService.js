// services/organizationService/organizationService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/organizations';

export const organizationService = {
  /**
   * Get a paginated, filtered list of organizations (with profile details and organization types).
   * @param {object} options - { page, limit, search, status, typeId }
   * @returns {Promise<{ organizations: Array, pagination: object }>}
   */
  async getOrganizations(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all', typeId = '' } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
    });
    if (typeId) {
      params.append('typeId', typeId);
    }
    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single organization by UUID (including its profile and organization types).
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getOrganizationById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new organization with its profile and organization types.
   * @param {object} payload - { name, organizationTypeIds, phone, email, address, profileExperience, businessSector, yearsOfExperience, registrationDate, licenseNumber, bio, pastProjectsSummary }
   * @returns {Promise<object>}
   */
  async createOrganization(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing organization, its profile, and organization types.
   * @param {string} id
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async updateOrganization(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the is_active status of an organization.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleOrganizationStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete an organization and its profile.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteOrganization(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};
