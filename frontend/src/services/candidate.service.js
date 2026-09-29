import api from './api';

export const candidateService = {
  async getCandidateProfile() {
    const response = await api.get('/users/profile/candidate/');
    return response.data;
  },

  async updateCandidateProfile(formData) {
    const isFormData = formData instanceof FormData;
    const response = await api.put('/users/profile/candidate/', formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  async getRecruiterProfile() {
    const response = await api.get('/users/profile/recruiter/');
    return response.data;
  },

  async updateRecruiterProfile(formData) {
    const isFormData = formData instanceof FormData;
    const response = await api.put('/users/profile/recruiter/', formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  async getCandidates(params = {}) {
    const response = await api.get('/users/candidates/', { params });
    return response.data;
  },

  async getCandidateById(id) {
    const response = await api.get(`/users/candidates/${id}/`);
    return response.data;
  },

  async getUsers(params = {}) {
    const response = await api.get('/users/', { params });
    return response.data;
  },

  async getRecruiters(params = {}) {
    const response = await api.get('/users/recruiters/', { params });
    return response.data;
  },

  async createRecruiter(data) {
    const response = await api.post('/users/recruiters/', data);
    return response.data;
  },

  async updateUserStatus(userId, is_active) {
    const response = await api.patch(`/users/${userId}/`, { is_active });
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/users/${userId}/`);
    return response.data;
  },

  async updateUserRole(userId, role, is_active) {
    const response = await api.patch(`/users/${userId}/`, { role, is_active });
    return response.data;
  },
};
