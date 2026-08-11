// services/projectServices/projectCategoryService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/project-categories';

export const projectCategoryService = {
  /**
   * Get a paginated, filtered list of project categories.
   * @param {object} options - { page, limit, search, status }
   * @returns {Promise<{ projectCategories: Array, pagination: object }>}
   */
  async getProjectCategories(options = {}) {
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
   * Get a single project category by its UUID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getProjectCategoryById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new project category.
   * @param {{ name: string, description?: string }} payload
   * @returns {Promise<object>}
   */
  async createProjectCategory(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing project category.
   * @param {string} id
   * @param {{ name?: string, description?: string }} payload
   * @returns {Promise<object>}
   */
  async updateProjectCategory(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the is_active status of a project category.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleProjectCategoryStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete a project category.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteProjectCategory(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};
