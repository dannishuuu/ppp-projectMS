// services/projectServices/documentSequenceService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/document-sequences';

export const documentSequenceService = {
  /**
   * Get a paginated, filterable list of document sequences.
   * @param {object} options - { page, limit, search }
   * @returns {Promise<{ sequences: Array, pagination: object }>}
   */
  async getSequences(options = {}) {
    const { page = 1, limit = 50, search = '' } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single document sequence by its UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getSequenceById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new document sequence configuration.
   * @param {object} payload - { entityType, prefix, suffix?, paddingLength, currentYear?, resetYearly, nextSequence? }
   * @returns {Promise<object>}
   */
  async createSequence(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing document sequence configuration.
   * @param {string} id
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async updateSequence(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Soft-delete a document sequence.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteSequence(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Reset a sequence counter back to 1 for a given year.
   * @param {string} id
   * @param {number} [year] - Defaults to current year
   * @returns {Promise<object>}
   */
  async resetSequence(id, year) {
    const response = await apiClient.post(`${BASE}/${id}/reset`, { year: year ?? new Date().getFullYear() });
    return response.data;
  },
};
