import api from './axiosInstance'

export const authApi = {
  googleLogin: (idToken) => api.post('/api/auth/google', { idToken }),
  getMe: () => api.get('/api/auth/me'),
}
