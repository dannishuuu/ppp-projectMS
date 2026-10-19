// services/organizationService/organizationService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/organizations';

export const organizationService = {
  /**
   * Get a paginated, filtered list of organizations (with profile details and organization types).
   * @param {object} options - { page, limit, search, status, typeId }
   * @returns {Promise<{ organizations: Array, pagination: object }>}
   */
  async getOrganizations(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all', typeId = '' } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
    });
    if (typeId) {
      params.append('typeId', typeId);
    }
    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single organization by UUID (including its profile and organization types).
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getOrganizationById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new organization with its profile and organization types.
    * @param {object} payload - { name, organizationTypeIds, phone, email, address, profileExperience, businessSector, yearsOfExperience, registrationDate, licenseNumber, licenseExpiryDate, bio, pastProjectsSummary }
   * @returns {Promise<object>}
   */
  async createOrganization(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data;
  },

  /**
   * Update an existing organization, its profile, and organization types.
   * @param {string} id
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async updateOrganization(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle the is_active status of an organization.
   * @param {string} id
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleOrganizationStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft-delete an organization and its profile.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteOrganization(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },

  // ─── Organization Documents ───────────────────────────────────────────────

  /**
   * Get all documents attached to an organization.
   * @param {string} id - Organization UUID
   * @param {object} options - { documentTypeId?, verified?: 'all'|'verified'|'unverified' }
   * @returns {Promise<{ organizationDocuments: Array }>}
   */
  async getOrganizationDocuments(id, options = {}) {
    const params = new URLSearchParams();
    if (options.documentTypeId) params.append('documentTypeId', options.documentTypeId);
    if (options.verified) params.append('verified', options.verified);
    const qs = params.toString();
    const response = await apiClient.get(`${BASE}/${id}/documents${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  /**
   * Get a single organization document by UUID.
   * @param {string} id - Organization UUID
   * @param {string} documentId
   * @returns {Promise<object>}
   */
  async getOrganizationDocumentById(id, documentId) {
    const response = await apiClient.get(`${BASE}/${id}/documents/${documentId}`);
    return response.data;
  },

  /**
   * Attach a new document to an organization (metadata for an already-uploaded file).
   * @param {string} id - Organization UUID
   * @param {object} payload - { documentTypeId, documentNumber?, title, description?, filePath, originalFilename, fileSize?, mimeType?, fileHash?, issuedDate?, expiryDate? }
   * @returns {Promise<object>}
   */
  async addOrganizationDocument(id, payload) {
    const response = await apiClient.post(`${BASE}/${id}/documents`, payload);
    return response.data;
  },

  /**
   * Update an organization document's metadata.
   * @param {string} id - Organization UUID
   * @param {string} documentId
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async updateOrganizationDocument(id, documentId, payload) {
    const response = await apiClient.put(`${BASE}/${id}/documents/${documentId}`, payload);
    return response.data;
  },

  /**
   * Mark an organization document as verified.
   * @param {string} id - Organization UUID
   * @param {string} documentId
   * @param {object} payload - { notes? }
   * @returns {Promise<object>}
   */
  async verifyOrganizationDocument(id, documentId, payload = {}) {
    const response = await apiClient.patch(`${BASE}/${id}/documents/${documentId}/verify`, payload);
    return response.data;
  },

  /**
   * Soft-delete an organization document.
   * @param {string} id - Organization UUID
   * @param {string} documentId
   * @returns {Promise<{ message: string }>}
   */
  async deleteOrganizationDocument(id, documentId) {
    const response = await apiClient.delete(`${BASE}/${id}/documents/${documentId}`);
    return response.data;
  },
};
