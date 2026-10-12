import api from './api';

export const jobService = {
  async getJobs(params = {}) {
    const response = await api.get('/jobs/', { params });
    return response.data;
  },

  async getJobById(id) {
    const response = await api.get(`/jobs/${id}/`);
    return response.data;
  },

  async getJob(id) {
    const response = await api.get(`/jobs/${id}/`);
    return response.data;
  },

  async getRecruiterJobs(params = {}) {
    const response = await api.get('/jobs/my-jobs/', { params });
    return response.data;
  },

  async createJob(jobData) {
    const response = await api.post('/jobs/', jobData);
    return response.data;
  },

  async updateJob(id, jobData) {
    const response = await api.patch(`/jobs/${id}/`, jobData);
    return response.data;
  },

  async closeJob(id) {
    const response = await api.patch(`/jobs/${id}/close/`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/jobs/categories/');
    return response.data;
  },

  async getChoices() {
    const response = await api.get('/jobs/choices/');
    return response.data;
  },
};
