import { apiClient } from '../../utils/apiClient';

const BASE = '/buildings';

export const buildingsService = {
    async getBuildings(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all', buildingTypeId, regionId, zoneId, woredaId } = options;
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search, status });
        if (buildingTypeId) params.append('buildingTypeId', buildingTypeId);
        if (regionId) params.append('regionId', regionId);
        if (zoneId) params.append('zoneId', zoneId);
        if (woredaId) params.append('woredaId', woredaId);

        const response = await apiClient.get(`${BASE}?${params.toString()}`);
        return response.data;
    },

    async getBuildingById(id) {
        const response = await apiClient.get(`${BASE}/${id}`);
        return response.data;
    },

    async createBuilding(payload) {
        const response = await apiClient.post(BASE, payload);
        return response.data;
    },

    async updateBuilding(id, payload) {
        const response = await apiClient.put(`${BASE}/${id}`, payload);
        return response.data;
    },

    async toggleBuildingStatus(id) {
        const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
        return response.data;
    },

    async deleteBuilding(id) {
        const response = await apiClient.delete(`${BASE}/${id}`);
        return response.data;
    },
};