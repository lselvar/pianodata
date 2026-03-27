import api from './axiosInstance'

export const catalogApi = {
  search: (params) => api.get('/api/catalog/search', { params }),
  getById: (id) => api.get(`/api/catalog/${id}`),
  getFilterOptions: () => api.get('/api/catalog/filter-options'),
  incipitUrl: (code) => `${import.meta.env.VITE_API_BASE_URL || ''}/api/catalog/incipit/${code}`,
}
