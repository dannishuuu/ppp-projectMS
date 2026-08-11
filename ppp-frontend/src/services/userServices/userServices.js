// services/userServices.js
import { apiClient } from '../../utils/apiClient';

export const userService = {
  async getProfile(userId = null) {
    const endpoint = userId ? `/users/profile?userId=${userId}` : '/users/profile';
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  async register(userData) {
    const response = await apiClient.post('/users/register', userData);
    return response.data;
  },

  async createUser(userData) {
    return this.register(userData);
  },

  async getUsers(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
    });
    const response = await apiClient.get(`/users/list?${params.toString()}`);
    return response.data;
  },

  async getUserById(userId) {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  async updateUser(userId, userData) {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  },

  async toggleUserStatus(userId) {
    const response = await apiClient.patch(`/users/${userId}/toggle-status`, {});
    return response.data;
  },

  async deleteUser(userId) {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },
};