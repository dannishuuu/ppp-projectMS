import { apiClient } from '../../utils/apiClient';

const BASE = '/company-org-units';

/**
 * Company Organization Units API Service
 * Single-table hierarchy per company (root = COMP unit, children = DIV/DEPT/SEC/TEAM/BR).
 */
export const companyOrgUnitService = {
  /**
   * Flat list of units for a company.
   * @param {object} options - {
   *   companyId (required),
   *   parentId ('root' for root nodes only, a uuid for its direct children, omit for all),
   *   unitTypeId?, level?, status ('all'|'active'|'inactive'), search?, page?, limit?
   * }
   * @returns {Promise<{ units: Array, pagination: object }>}
   */
  async getUnits(options = {}) {
    const {
      companyId,
      parentId,
      unitTypeId,
      level,
      status = 'all',
      search = '',
      page = 1,
      limit = 500,
    } = options;

    const params = new URLSearchParams({
      companyId,
      status,
      search,
      page: page.toString(),
      limit: limit.toString(),
    });
    if (parentId !== undefined && parentId !== null && parentId !== '') params.append('parentId', parentId);
    if (unitTypeId) params.append('unitTypeId', unitTypeId);
    if (level !== undefined && level !== null && level !== '') params.append('level', String(level));

    const response = await apiClient.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Nested org tree for a company: { company, roots: [{ ...unit, children: [...] }] }
   */
  async getCompanyTree(companyId) {
    const response = await apiClient.get(`${BASE}/tree/company/${companyId}`);
    return response.data;
  },

  /**
   * Get a single unit by UUID (with company/type/parent names and children_count).
   */
  async getUnitById(id) {
    const response = await apiClient.get(`${BASE}/${id}`);
    const data = response.data;
    return data?.unit || data;
  },

  /**
   * Breadcrumb path (root → unit) for a unit: { unit, breadcrumb: [...] }
   */
  async getUnitPath(id) {
    const response = await apiClient.get(`${BASE}/${id}/path`);
    return response.data;
  },

  /**
   * All descendants of a unit: { unit, descendants: [...], total }
   */
  async getUnitDescendants(id) {
    const response = await apiClient.get(`${BASE}/${id}/descendants`);
    return response.data;
  },

  /**
   * Create a unit under a parent (or as the COMP root when parentId is omitted).
   * @param {object} payload - {
   *   companyId, unitTypeId, code, name, parentId?, nameAmharic?, nameAfaanOromo?,
   *   description?, sortOrder?, managerUserId?, isActive?
   * }
   */
  async createUnit(payload) {
    const response = await apiClient.post(BASE, payload);
    const data = response.data;
    return data?.unit || data;
  },

  /**
   * Update unit metadata (code/name/type/description/sort_order/manager/isActive).
   * Reparenting is done via moveUnit, not here.
   */
  async updateUnit(id, payload) {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    const data = response.data;
    return data?.unit || data;
  },

  /**
   * Re-parent a unit within the same company.
   * @param {string} id - unit UUID
   * @param {string|null} parentId - new parent UUID, or null to make it the root
   * @returns {Promise<object>} the moved unit with updated level/path
   */
  async moveUnit(id, parentId) {
    const response = await apiClient.patch(`${BASE}/${id}/move`, { parentId });
    const data = response.data;
    return data?.unit || data;
  },

  /**
   * Toggle a unit's active status.
   * @returns {Promise<{ message: string, is_active: boolean }>}
   */
  async toggleUnitStatus(id) {
    const response = await apiClient.patch(`${BASE}/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Soft-delete a unit (blocked while it still has child units).
   */
  async deleteUnit(id) {
    const response = await apiClient.delete(`${BASE}/${id}`);
    return response.data;
  },
};

export default companyOrgUnitService;
