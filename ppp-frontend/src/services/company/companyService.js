import { apiClient } from '../../utils/apiClient';

const BASE = '/companies';

/**
 * Companies API Service
 */
export const companyService = {
  /**
   * Get a paginated, filtered list of companies.
   * @param {object} options - { page, limit, search, status ('all'|'active'|'inactive'), sortBy, sortOrder }
   * @returns {Promise<{ companies: Array, pagination: object }>}
   */
  async getCompanies(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      sortBy = 'name',
      sortOrder = 'ASC',
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
      sortBy,
      sortOrder,
    });

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single company by UUID (includes org_units_count).
   */
  async getCompanyById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    const data = response.data;
    return data?.company || data;
  },

  /**
   * Create a new company.
   * @param {object} payload - { code, name, nameAmharic?, nameAfaanOromo?, tin?, registrationNumber?,
   *                             registrationDate?, phone?, email?, website?, address?, logoUrl?,
   *                             description?, isActive? }
   */
  async createCompany(payload) {
    const response = await apiClient.post(BASE, payload);
    const data = response.data;
    return data?.company || data;
  },

  /**
   * Update an existing company (partial payload allowed).
   */
  async updateCompany(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    const data = response.data;
    return data?.company || data;
  },

  /**
   * Toggle a company's active status.
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleCompanyStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Soft-delete a company (blocked while it still has organization units).
   */
  async deleteCompany(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};

export default companyService;
