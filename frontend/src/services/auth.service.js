import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login/', { email, password });
    const { tokens, user } = response.data;
    if (tokens?.access) {
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register/', userData);
    if (response.data.tokens?.access) {
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me/');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      api.post('/auth/logout/', { refresh: refreshToken }).catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  async requestPasswordReset(email) {
    const response = await api.post('/auth/password-reset/', { email });
    return response.data;
  },

  async confirmPasswordReset(data, legacyPassword) {
    let payload;
    if (typeof data === 'object' && data !== null) {
      payload = {
        uid: data.uid,
        token: data.token,
        new_password: data.new_password || data.password,
        new_password_confirm: data.new_password_confirm || data.confirm_password || data.new_password || data.password,
      };
    } else {
      payload = {
        token: data,
        new_password: legacyPassword,
        new_password_confirm: legacyPassword,
      };
    }
    const response = await api.post('/auth/password-reset-confirm/', payload);
    return response.data;
  },
};
