import api from './api';

export const dashboardService = {
  async getRecruiterDashboard() {
    const response = await api.get('/dashboard/recruiter/');
    return response.data;
  },

  async getAdminDashboard() {
    const response = await api.get('/dashboard/admin/');
    return response.data;
  },

  async getAdminHiringPipeline(params = {}) {
    const response = await api.get('/dashboard/admin/hiring-pipeline/', { params });
    return response.data;
  },

  async getCandidateDashboard() {
    const response = await api.get('/dashboard/candidate/');
    return response.data;
  },
};

