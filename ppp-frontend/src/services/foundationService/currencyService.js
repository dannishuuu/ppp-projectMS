// services/foundationService/currencyService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/currencies';

export const currencyService = {
  /**
   * Get a paginated, filtered list of currencies.
   * @param {object} options - { page, limit, search, status }
   * @returns {Promise<{ currencies: Array, pagination: object }>}
   */
  async getCurrencies(options = {}) {
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
   * Get a single currency by UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getCurrencyById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new currency.
   * @param {{ code: string, name: string, symbol?: string }} payload
   * @returns {Promise<object>}
   */
  async createCurrency(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing currency.
   * @param {string} id
   * @param {{ code?: string, name?: string, symbol?: string }} payload
   * @returns {Promise<object>}
   */
  async updateCurrency(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the active status of a currency.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleCurrencyStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete a currency.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteCurrency(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};
