import { apiClient } from '../../utils/apiClient';

const BASE = '/business-sectors';

export const businessSectorService = {
    /**
     * Get a paginated, filtered list of business sectors.
     * @param {object} [options={}]
     * @param {number} [options.page]
     * @param {number} [options.limit]
     * @param {string} [options.search]
     * @param {string} [options.status]
     */
    async getBusinessSectors(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all' } = options;
        const params = new URLSearchParams({ 
            page: page.toString(), 
            limit: limit.toString(), 
            search, 
            status 
        });
        const response = await apiClient.get(`${BASE}?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single business sector by UUID.
     * @param {string} id
     */
    async getBusinessSectorById(id) {
        const response = await apiClient.get(`${BASE}/${id}`);
        return response.data;
    },

    /**
     * Create a new business sector.
     * @param {object} payload
     * @param {string} payload.engName
     * @param {string} [payload.amhName]
     * @param {string} [payload.oroName]
     * @param {string} [payload.description]
     */
    async createBusinessSector(payload) {
        const response = await apiClient.post(BASE, payload);
        return response.data;
    },

    /**
     * Update an existing business sector.
     * @param {string} id
     * @param {object} payload
     * @param {string} [payload.engName]
     * @param {string} [payload.amhName]
     * @param {string} [payload.oroName]
     * @param {string} [payload.description]
     */
    async updateBusinessSector(id, payload) {
        const response = await apiClient.put(`${BASE}/${id}`, payload);
        return response.data;
    },

    /**
     * Toggle the active status of a business sector.
     * @param {string} id
     */
    async toggleBusinessSectorStatus(id) {
        const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
        return response.data;
    },

    /**
     * Soft-delete a business sector.
     * @param {string} id
     */
    async deleteBusinessSector(id) {
        const response = await apiClient.delete(`${BASE}/${id}`);
        return response.data;
    },
};