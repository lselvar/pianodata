import api from './axiosInstance'

export const adminApi = {
  getUsers: (params) => api.get('/api/admin/users', { params }),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  create: (data) => api.post('/api/admin/catalog', data),
  update: (id, data) => api.put(`/api/admin/catalog/${id}`, data),
  delete: (id) => api.delete(`/api/admin/catalog/${id}`),
  uploadIncipit: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/api/admin/catalog/${id}/incipit`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadIncipitSecundo: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/api/admin/catalog/${id}/incipit-secondo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  bulkUploadCsv: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/admin/catalog/bulk/csv', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
  },
  bulkUploadImages: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/admin/catalog/bulk/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
  },
}
