import { apiClient } from '../../utils/apiClient';

const BASE = '/org-unit-types';

/**
 * Organization Unit Types API Service (Division, Department, Team, ...)
 */
export const orgUnitTypeService = {
  /**
   * Get org unit types ordered by sort_order.
   * @param {object} options - { page, limit, search, status ('all'|'active'|'inactive'), sortBy }
   * @returns {Promise<{ orgUnitTypes: Array, pagination: object }>}
   */
  async getOrgUnitTypes(options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = 'all',
      sortBy = 'sort_order',
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
      sortBy,
    });

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single org unit type by UUID.
   */
  async getOrgUnitTypeById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    const data = response.data;
    return data?.orgUnitType || data;
  },

  /**
   * Create a new org unit type.
   * @param {object} payload - { code, name, nameAmharic?, nameAfaanOromo?, description?, sortOrder?, isActive? }
   */
  async createOrgUnitType(payload) {
    const response = await apiClient.post(BASE, payload);
    const data = response.data;
    return data?.orgUnitType || data;
  },

  /**
   * Update an existing org unit type (partial payload allowed).
   */
  async updateOrgUnitType(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    const data = response.data;
    return data?.orgUnitType || data;
  },

  /**
   * Toggle an org unit type's active status.
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleOrgUnitTypeStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Soft-delete an org unit type (blocked while org units still reference it).
   */
  async deleteOrgUnitType(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};

export default orgUnitTypeService;
