// services/projectServices/trackingAreaService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/tracking-areas';

export const trackingAreaService = {
  /**
   * Get a paginated, filtered list of tracking areas.
   * @param {object} options - { page, limit, search, isActive, trackingItemTypeId, parentId }
   * @returns {Promise<{ trackingAreas: Array, pagination: object }>}
   */
  async getTrackingAreas(options = {}) {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      isActive = null,
      trackingItemTypeId = null,
      parentId = null
    } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });

    if (isActive !== null && isActive !== undefined) {
      params.append('isActive', isActive.toString());
    }

    if (trackingItemTypeId) {
      params.append('trackingItemTypeId', trackingItemTypeId);
    }

    if (parentId !== null && parentId !== undefined) {
      params.append('parentId', parentId === null ? 'null' : parentId);
    }

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get all pillars (top-level areas with no parent).
   * @param {string|null} trackingItemTypeId - Optional filter by tracking item type
   * @returns {Promise<Array>}
   */
  async getPillars(trackingItemTypeId = null) {
    const params = new URLSearchParams();
    if (trackingItemTypeId) {
      params.append('trackingItemTypeId', trackingItemTypeId);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`${BASE}/pillars${query}`);
    return response.data;
  },

  /**
   * Get all phases (child areas with a parent).
   * @param {string|null} parentId - Optional filter by parent ID
   * @returns {Promise<Array>}
   */
  async getPhases(parentId = null) {
    const params = new URLSearchParams();
    if (parentId) {
      params.append('parentId', parentId);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`${BASE}/phases${query}`);
    return response.data;
  },

  /**
   * Get full hierarchy (pillars with their phases).
   * @param {string|null} trackingItemTypeId - Optional filter by tracking item type
   * @returns {Promise<Array>}
   */
  async getHierarchy(trackingItemTypeId = null) {
    const params = new URLSearchParams();
    if (trackingItemTypeId) {
      params.append('trackingItemTypeId', trackingItemTypeId);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`${BASE}/hierarchy${query}`);
    return response.data;
  },

  /**
   * Get a single tracking area by its UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getTrackingAreaById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Get children of a tracking area.
   * @param {string} parentId
   * @returns {Promise<Array>}
   */
  async getChildren(parentId) {
    const response = await apiClient.get(`${BASE}/${parentId}/children`);
    return response.data;
  },

  /**
   * Check if a tracking area has children.
   * @param {string} id
   * @returns {Promise<{ id: string, hasChildren: boolean }>}
   */
  async hasChildren(id) {
    const response = await apiClient.get(`${BASE}/${id}/has-children`);
    return response.data;
  },

  /**
   * Check if a tracking area has checklists.
   * @param {string} id
   * @returns {Promise<{ id: string, hasChecklists: boolean }>}
   */
  async hasChecklists(id) {
    const response = await apiClient.get(`${BASE}/${id}/has-checklists`);
    return response.data;
  },

  /**
   * Create a new tracking area.
   * @param {object} payload - { trackingItemTypeId, parentId?, name, description? }
   * @returns {Promise<object>}
   */
  async createTrackingArea(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing tracking area.
   * @param {string} id
   * @param {object} payload - { trackingItemTypeId?, parentId?, name?, description?, isActive? }
   * @returns {Promise<object>}
   */
  async updateTrackingArea(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Soft-delete a tracking area.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteTrackingArea(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Restore a soft-deleted tracking area.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async restoreTrackingArea(id) {
    const response = await apiClient.post(`${BASE}/${id}/restore`);
    return response.data;
  },
};
