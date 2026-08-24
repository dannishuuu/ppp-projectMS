// services/foundationService/countriesService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/countries';

export const countriesService = {
  /**
   * Get a paginated, filtered list of countries.
   * @param {object} options - { page, limit, search, status }
   * @returns {Promise<{ countries: Array, pagination: object }>}
   */
  async getCountries(options = {}) {
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
   * Get a single country by UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getCountryById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new country.
   * @param {{ name: string, code?: string }} payload
   * @returns {Promise<object>}
   */
  async createCountry(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing country.
   * @param {string} id
   * @param {{ name?: string, code?: string }} payload
   * @returns {Promise<object>}
   */
  async updateCountry(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active status of a country.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleCountryStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete a country.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteCountry(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};