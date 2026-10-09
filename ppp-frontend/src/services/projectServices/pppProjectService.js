// services/projectServices/pppProjectService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/projects';

export const pppProjectService = {
  /**
   * Get a paginated, filtered list of PPP projects.
   * @param {object} options - { page, limit, search, statusId, categoryId, organizationId, isActive }
   */
  async getProjects(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      statusId = '',
      categoryId = '',
      organizationId = '',
      isActive = '',
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });

    if (statusId) params.append('statusId', statusId);
    if (categoryId) params.append('categoryId', categoryId);
    if (organizationId) params.append('organizationId', organizationId);
    if (isActive !== '') params.append('isActive', isActive.toString());

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single PPP project by UUID.
   * @param {string} id
   */
  async getProjectById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new official PPP project (standalone, not from proposal).
   * @param {object} payload
   */
  async createProject(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing PPP project.
   * @param {string} id
   * @param {object} payload
   */
  async updateProject(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Change only the lifecycle status of a project.
   * @param {string} id
   * @param {string} statusId
   */
  async changeStatus(id, statusId) {
    const response = await apiClient.patch(`${BASE}/${id}/change-status`, { statusId });
    return response.data;
  },

  /**
   * Soft-delete a project.
   * @param {string} id
   */
  async deleteProject(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Convert an approved proposal into an official PPP project.
   * @param {string} proposalId  - UUID of the approved proposal
   * @param {object} payload     - optional overrides (name, statusId, organizations, managerUserIds, …)
   */
  async convertProposal(proposalId, payload = {}) {
    const response = await apiClient.post(`${BASE}/convert-proposal/${proposalId}`, payload);
    return response.data;
  },
};
