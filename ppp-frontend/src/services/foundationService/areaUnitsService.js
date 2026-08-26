import { apiClient } from '../../utils/apiClient';

const BASE = '/area-units';

export const areaUnitsService = {
    /**
     * Get a paginated, filtered list of area units.
     * @param {object} options - { page, limit, search, status }
     */
    async getAreaUnits(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all' } = options;
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search, status });
        const response = await apiClient.get(`${BASE}?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single area unit by UUID.
     * @param {string} id
     */
    async getAreaUnitById(id) {
        const response = await apiClient.get(`${BASE}/${id}`);
        return response.data;
    },

    /**
     * Create a new area unit.
     * @param {{ name: string, code: string, nameAmharic?: string, nameAfaanOromo?: string, description?: string }} payload
     */
    async createAreaUnit(payload) {
        const response = await apiClient.post(BASE, payload);
        return response.data;
    },

    /**
     * Update an existing area unit.
     * @param {string} id
     * @param {{ name?: string, code?: string, nameAmharic?: string, nameAfaanOromo?: string, description?: string }} payload
     */
    async updateAreaUnit(id, payload) {
        const response = await apiClient.put(`${BASE}/${id}`, payload);
        return response.data;
    },

    /**
     * Toggle the active status of an area unit.
     * @param {string} id
     */
    async toggleAreaUnitStatus(id) {
        const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
        return response.data;
    },

    /**
     * Soft-delete an area unit.
     * @param {string} id
     */
    async deleteAreaUnit(id) {
        const response = await apiClient.delete(`${BASE}/${id}`);
        return response.data;
    },
};