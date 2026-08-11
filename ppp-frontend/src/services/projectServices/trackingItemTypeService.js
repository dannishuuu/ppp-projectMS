// services/projectServices/trackingItemTypeService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/tracking-item-types';

export const trackingItemTypeService = {
  /**
   * Get a paginated, filtered list of tracking item types.
   * @param {object} options - { page, limit, search, isActive, isWbs, isLeaf }
   * @returns {Promise<{ trackingItemTypes: Array, pagination: object }>}
   */
  async getTrackingItemTypes(options = {}) {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      isActive = true,
      isWbs = null,
      isLeaf = null
    } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });

    if (isActive !== null && isActive !== undefined) {
      params.append('isActive', isActive.toString());
    }

    if (isWbs !== null) {
      params.append('isWbs', isWbs.toString());
    }
    if (isLeaf !== null) {
      params.append('isLeaf', isLeaf.toString());
    }

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get all active tracking item types (for dropdowns/UI).
   * @returns {Promise<Array>}
   */
  async getActiveTrackingItemTypes() {
    const response = await apiClient.get(`${BASE}/active`);
    return response.data;
  },

  /**
   * Get WBS-capable tracking item types (parent types).
   * @returns {Promise<Array>}
   */
  async getWbsCapableTypes() {
    const response = await apiClient.get(`${BASE}/wbs-capable`);
    return response.data;
  },

  /**
   * Get leaf tracking item types (final types that cannot have children).
   * @returns {Promise<Array>}
   */
  async getLeafTypes() {
    const response = await apiClient.get(`${BASE}/leaf`);
    return response.data;
  },

  /**
   * Get a single tracking item type by its UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getTrackingItemTypeById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Check if a tracking item type can have children (WBS-capable).
   * @param {string} id
   * @returns {Promise<{ id: string, canHaveChildren: boolean }>}
   */
  async canHaveChildren(id) {
    const response = await apiClient.get(`${BASE}/${id}/can-have-children`);
    return response.data;
  },

  /**
   * Check if a tracking item type is a leaf node (final, cannot have children).
   * @param {string} id
   * @returns {Promise<{ id: string, isLeaf: boolean }>}
   */
  async isLeafNode(id) {
    const response = await apiClient.get(`${BASE}/${id}/is-leaf`);
    return response.data;
  },

  /**
   * Get default weight for a tracking item type.
   * @param {string} id
   * @returns {Promise<{ id: string, defaultWeight: number }>}
   */
  async getDefaultWeight(id) {
    const response = await apiClient.get(`${BASE}/${id}/default-weight`);
    return response.data;
  },

  /**
   * Create a new tracking item type.
   * @param {object} payload - { code, name, description?, isWbs, isLeaf, sortOrder?, defaultWeight? }
   * @returns {Promise<object>}
   */
  async createTrackingItemType(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing tracking item type.
   * @param {string} id
   * @param {object} payload - { code?, name?, description?, isWbs?, isLeaf?, sortOrder?, defaultWeight?, isActive? }
   * @returns {Promise<object>}
   */
  async updateTrackingItemType(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Soft-delete a tracking item type.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteTrackingItemType(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Restore a soft-deleted tracking item type.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async restoreTrackingItemType(id) {
    const response = await apiClient.post(`${BASE}/${id}/restore`);
    return response.data;
  },
};
