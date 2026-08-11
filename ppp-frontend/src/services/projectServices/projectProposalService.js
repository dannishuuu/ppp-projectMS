// services/projectServices/projectProposalService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/project-proposals';

export const projectProposalService = {
  /**
   * Get a paginated, filtered list of project proposals.
   * @param {object} options - { page, limit, search, statusId, organizationId, categoryId }
   * @returns {Promise<{ proposals: Array, pagination: object }>}
   */
  async getProposals(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      statusId = '',
      organizationId = '',
      categoryId = '',
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });

    if (statusId) params.append('statusId', statusId);
    if (organizationId) params.append('organizationId', organizationId);
    if (categoryId) params.append('categoryId', categoryId);

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single project proposal by its UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getProposalById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new project proposal.
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async createProposal(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing project proposal.
   * @param {string} id
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async updateProposal(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Change only the status of a proposal.
   * @param {string} id
   * @param {string} statusId
   * @returns {Promise<object>}
   */
  async changeStatus(id, statusId) {
    const response = await apiClient.patch(`${BASE}/${id}/change-status`, { statusId });
    return response.data;
  },

  /**
   * Submit a project proposal — assigns reviewers and advances status to step 1.
   * @param {string}   id          - proposal UUID
   * @param {string[]} reviewerIds - user UUIDs to assign as reviewers
   * @param {string}   [dueDate]   - optional reviewer due date (ISO string)
   * @returns {Promise<object>}
   */
  async submitProposal(id, reviewerIds, dueDate) {
    const response = await apiClient.patch(`${BASE}/${id}/submit`, { reviewerIds, dueDate });
    return response.data;
  },

  /**
   * Get reviewers assigned to a proposal.
   * @param {string} id - proposal UUID
   * @returns {Promise<Array>}
   */
  async getProposalReviewers(id) {
    const response = await apiClient.get(`${BASE}/${id}/reviewers`);
    return response.data;
  },

  /**
   * Soft-delete a project proposal.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteProposal(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};
