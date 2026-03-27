import api from './axiosInstance'

export const subscriptionApi = {
  getStatus: () => api.get('/api/subscription/status'),
  checkout: () => api.post('/api/subscription/checkout'),
  portal: () => api.post('/api/subscription/portal'),
}
