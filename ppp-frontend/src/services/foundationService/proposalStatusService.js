// services/foundationService/proposalStatusService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/proposal-statuses';

export const proposalStatusService = {
  /**
   * Get a paginated, filtered list of proposal statuses.
   * @param {object} options - { page, limit, search, status }
   * @returns {Promise<{ proposalStatuses: Array, pagination: object }>}
   */
  async getProposalStatuses(options = {}) {
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
   * Get a single proposal status by UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getProposalStatusById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new proposal status.
   * @param {{ name: string, description?: string }} payload
   * @returns {Promise<object>}
   */
  async createProposalStatus(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing proposal status.
   * @param {string} id
   * @param {{ name?: string, description?: string }} payload
   * @returns {Promise<object>}
   */
  async updateProposalStatus(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active/inactive status of a proposal status.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleProposalStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete a proposal status.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteProposalStatus(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};
