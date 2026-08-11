// services/projectServices/projectReviewersService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/project-proposal-reviewers';

export const projectReviewersService = {
  /**
   * Get paginated, filtered list of proposal reviewers.
   * @param {object} options - { page, limit, search, proposalId, status }
   * @returns {Promise<{ reviewers: Array, pagination: object }>}
   */
  async getReviewers(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      proposalId = '',
      status = 'all',
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
    });

    if (proposalId) params.append('proposalId', proposalId);

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single proposal reviewer by UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getReviewerById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Get all reviewers for a specific proposal.
   * @param {string} proposalId
   * @returns {Promise<Array>}
   */
  async getReviewersByProposalId(proposalId) {
    const response = await apiClient.get(`${BASE}/proposal/${proposalId}`);
    return response.data;
  },

  /**
   * Update review status (approve/reject).
   * @param {string} id - reviewer assignment UUID
   * @param {string} status - 'Approved' or 'Rejected'
   * @param {string} [remarks] - optional remarks
   * @param {string} [decisionId] - decision ID for approval
   * @returns {Promise<object>}
   */
  async updateReviewStatus(id, status, remarks = '', decisionId = null) {
    const body = { status, remarks };
    if (decisionId) body.decisionId = decisionId;
    const response = await apiClient.patch(`${BASE}/${id}/status`, body);
    return response.data;
  },
};