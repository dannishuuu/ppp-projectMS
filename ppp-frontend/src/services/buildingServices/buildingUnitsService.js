import { apiClient } from '../../utils/apiClient';

const BASE = '/building-units';

export const buildingUnitsService = {
    async getUnits(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all', isRented, isForRent, buildingId, floorId } = options;
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search, status });
        if (buildingId) params.append('buildingId', buildingId);
        if (floorId) params.append('floorId', floorId);
        if (isRented !== undefined && isRented !== null && isRented !== '') params.append('isRented', isRented.toString());
        if (isForRent !== undefined && isForRent !== null && isForRent !== '') params.append('isForRent', isForRent.toString());

        const response = await apiClient.get(`${BASE}?${params.toString()}`);
        return response.data;
    },

    async getUnitById(id) {
        const response = await apiClient.get(`${BASE}/${id}`);
        return response.data;
    },

    async createUnit(payload) {
        const response = await apiClient.post(BASE, payload);
        return response.data;
    },

    async updateUnit(id, payload) {
        const response = await apiClient.put(`${BASE}/${id}`, payload);
        return response.data;
    },

    async toggleUnitStatus(id) {
        const response = await apiClient.patch(`${BASE}/${id}/toggle-status`, {});
        return response.data;
    },

    async toggleUnitRented(id) {
        const response = await apiClient.patch(`${BASE}/${id}/toggle-rented`, {});
        return response.data;
    },

    async toggleUnitForRent(id) {
        const response = await apiClient.patch(`${BASE}/${id}/toggle-for-rent`, {});
        return response.data;
    },

    async deleteUnit(id) {
        const response = await apiClient.delete(`${BASE}/${id}`);
        return response.data;
    },
};