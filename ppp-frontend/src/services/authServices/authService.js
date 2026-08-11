// services/authService.js
import { apiClient } from '../../utils/apiClient';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const authService = {
  async login(email, password) {
    const response = await apiClient.post('/login', { email, password });
    // Handle response: could be { data: {...} } or directly {...}
    const payload = response.data || response;
    const { accessToken, refreshToken, user } = payload;
    if (!accessToken || !refreshToken || !user) {
      throw new Error('Invalid response from server');
    }
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    return user;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    // Optionally redirect to login
    window.location.href = '/login';
  },

  getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },
};