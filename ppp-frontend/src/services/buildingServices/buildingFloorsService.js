import { apiClient } from '../../utils/apiClient';

const BASE = '/building-floors';

export const buildingFloorsService = {
    async getFloors(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all', buildingId } = options;
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search, status });
        if (buildingId) params.append('buildingId', buildingId);

        const response = await apiClient.get(`${BASE}?${params.toString()}`);
        return response.data;
    },

    async getFloorById(id) {
        const response = await apiClient.get(`${BASE}/${id}`);
        return response.data;
    },

    async createFloor(payload) {
        const response = await apiClient.post(BASE, payload);
        return response.data;
    },

    async updateFloor(id, payload) {
        const response = await apiClient.put(`${BASE}/${id}`, payload);
        return response.data;
    },

    async toggleFloorStatus(id) {
        const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
        return response.data;
    },

    async deleteFloor(id) {
        const response = await apiClient.delete(`${BASE}/${id}`);
        return response.data;
    },
};