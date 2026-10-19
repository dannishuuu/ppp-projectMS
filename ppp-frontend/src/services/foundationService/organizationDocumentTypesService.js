// services/foundationService/organizationDocumentTypesService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/organization-document-types';

export const organizationDocumentTypesService = {
  /**
   * Get a paginated, filtered list of organization document types.
   * @param {object} options - { page, limit, search, status, required }
   * @returns {Promise<{ organizationDocumentTypes: Array, pagination: object }>}
   */
  async getOrganizationDocumentTypes(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all', required = 'all' } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
      required,
    });
    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single organization document type by UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getOrganizationDocumentTypeById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new organization document type.
   * @param {{ name: string, code: string, description?: string, isRequired?: boolean, requiresExpiry?: boolean }} payload
   * @returns {Promise<object>}
   */
  async createOrganizationDocumentType(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing organization document type.
   * @param {string} id
   * @param {{ name?: string, code?: string, description?: string, isRequired?: boolean, requiresExpiry?: boolean }} payload
   * @returns {Promise<object>}
   */
  async updateOrganizationDocumentType(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active/inactive status of an organization document type.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleOrganizationDocumentType(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete an organization document type.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteOrganizationDocumentType(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};
