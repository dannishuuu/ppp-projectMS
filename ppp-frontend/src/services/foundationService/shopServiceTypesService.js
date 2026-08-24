import { apiClient } from '../../utils/apiClient';

const BASE = '/shop-service-types';

export const shopServiceTypesService = {
  /**
   * Get a paginated, filtered list of shop service types.
   * @param {object} options - { page, limit, search, status }
   */
  async getShopServiceTypes(options = {}) {
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
   * Get a single shop service type by UUID.
   * @param {string} id
   */
  async getShopServiceTypeById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new shop service type.
   * @param {{ name: string, amharicName?: string, afaanOromoName?: string, description?: string }} payload
   */
  async createShopServiceType(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing shop service type.
   * @param {string} id
   * @param {{ name?: string, amharicName?: string, afaanOromoName?: string, description?: string }} payload
   */
  async updateShopServiceType(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active status of a shop service type.
   * @param {string} id
   */
  async toggleShopServiceTypeStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete a shop service type.
   * @param {string} id
   */
  async deleteShopServiceType(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};