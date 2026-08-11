import { apiClient } from '../../utils/apiClient';

const BASE = '/review-decisions';

export const reviewDecisionService = {
  async getDecisions(options = {}) {
    const response = await apiClient.get(`${BASE}?isActive=true`);
    // Handle both direct response and wrapped response
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  
  async getDecisionById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
};