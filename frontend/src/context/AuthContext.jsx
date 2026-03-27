import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('pianorep_token')
    if (token) {
      authApi.getMe()
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('pianorep_token'))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (idToken) => {
    const res = await authApi.googleLogin(idToken)
    localStorage.setItem('pianorep_token', res.data.accessToken)
    setUser(res.data.user)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('pianorep_token')
    setUser(null)
  }

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
