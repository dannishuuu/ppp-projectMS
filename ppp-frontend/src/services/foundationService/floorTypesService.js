import { apiClient } from '../../utils/apiClient';

const BASE = '/floor-types';

export const floorTypesService = {
    /**
     * Get a paginated, filtered list of floor types.
     * @param {object} options - { page, limit, search, status }
     */
    async getFloorTypes(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all' } = options;
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search, status });
        const response = await apiClient.get(`${BASE}?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single floor type by UUID.
     * @param {string} id
     */
    async getFloorTypeById(id) {
        const response = await apiClient.get(`${BASE}/${id}`);
        return response.data;
    },

    /**
     * Create a new floor type.
     * @param {{ name: string, code: string, description?: string }} payload
     */
    async createFloorType(payload) {
        const response = await apiClient.post(BASE, payload);
        return response.data;
    },

    /**
     * Update an existing floor type.
     * @param {string} id
     * @param {{ name?: string, code?: string, description?: string }} payload
     */
    async updateFloorType(id, payload) {
        const response = await apiClient.put(`${BASE}/${id}`, payload);
        return response.data;
    },

    /**
     * Toggle the active status of a floor type.
     * @param {string} id
     */
    async toggleFloorTypeStatus(id) {
        const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
        return response.data;
    },

    /**
     * Soft-delete a floor type.
     * @param {string} id
     */
    async deleteFloorType(id) {
        const response = await apiClient.delete(`${BASE}/${id}`);
        return response.data;
    },
};