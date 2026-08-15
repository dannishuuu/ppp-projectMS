// services/authService.js
import { apiClient } from '../../utils/apiClient';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const authService = {
  async login(email, password) {
    const response = await apiClient.post('/login', { email, password }, { skipAuthRefresh: true });
    const payload = response.data || response;
    const { accessToken, refreshToken, user } = payload;
    if (!accessToken || !refreshToken || !user) {
      throw new Error('Invalid response from server');
    }
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    return user;
  },

  async refreshToken() {
    const storedRefreshToken = this.getRefreshToken();
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await apiClient.post('/refresh-token', { refreshToken: storedRefreshToken }, { skipAuthRefresh: true });
    const payload = response.data || response;
    const { accessToken, refreshToken } = payload;
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
    return payload;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    window.location.href = '/login';
  },

  getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },
};