// services/projectServices/checklistService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/checklists';

export const checklistService = {
  /**
   * Get a paginated, filtered list of checklists.
   * @param {object} options - { page, limit, search, isActive, trackingAreaId }
   * @returns {Promise<{ checklists: Array, pagination: object }>}
   */
  async getChecklists(options = {}) {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      isActive = null,
      trackingAreaId = null,
    } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });

    if (isActive !== null && isActive !== undefined) {
      params.append('isActive', isActive.toString());
    }

    if (trackingAreaId) {
      params.append('trackingAreaId', trackingAreaId);
    }

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get all checklists for a specific tracking area.
   * @param {string} trackingAreaId
   * @returns {Promise<Array>}
   */
  async getChecklistsByTrackingArea(trackingAreaId) {
    const response = await apiClient.get(`${BASE}/tracking-area/${trackingAreaId}`);
    return response.data;
  },

  /**
   * Get a single checklist by its UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getChecklistById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new checklist.
   * @param {object} payload - { trackingAreaId, name, description? }
   * @returns {Promise<object>}
   */
  async createChecklist(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing checklist.
   * @param {string} id
   * @param {object} payload - { trackingAreaId?, name?, description?, isActive? }
   * @returns {Promise<object>}
   */
  async updateChecklist(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Soft-delete a checklist.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteChecklist(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Restore a soft-deleted checklist.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async restoreChecklist(id) {
    const response = await apiClient.post(`${BASE}/${id}/restore`);
    return response.data;
  },
};