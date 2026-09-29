import api from './api';

export const applicationService = {
  async applyJob(formData) {
    const response = await api.post('/applications/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getMyApplications(params = {}) {
    const response = await api.get('/applications/my-applications/', { params });
    return response.data;
  },

  async getRecruiterApplications(params = {}) {
    const response = await api.get('/applications/recruiter/', { params });
    return response.data;
  },

  async getApplicationById(id) {
    const response = await api.get(`/applications/${id}/`);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.patch(`/applications/${id}/status/`, { status });
    return response.data;
  },
};
