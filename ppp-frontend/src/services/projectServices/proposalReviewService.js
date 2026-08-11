// services/projectServices/proposalReviewService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/proposal-reviews';

export const proposalReviewService = {
  /**
   * Submit a review decision.
   * @param {string} assignmentId - reviewer assignment UUID
   * @param {object} data - { decisionId, comments }
   * @returns {Promise<object>}
   */
  async submitReview(assignmentId, data) {
    const response = await apiClient.post(`${BASE}/${assignmentId}/submit`, data);
    return response.data;
  },

  /**
   * Get all reviews for a specific proposal.
   * @param {string} proposalId
   * @returns {Promise<Array>}
   */
  async getReviewsByProposalId(proposalId) {
    const response = await apiClient.get(`${BASE}/proposal/${proposalId}`);
    return response.data;
  },

  /**
   * Get review by assignment ID.
   * @param {string} assignmentId
   * @returns {Promise<object>}
   */
  async getReviewByAssignmentId(assignmentId) {
    const response = await apiClient.get(`${BASE}/${assignmentId}`);
    return response.data;
  },
};
