import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

export default function AdminRoute({ children }) {
  const { user, isLoading, isAdmin } = useAuth()
  if (isLoading) return <LoadingSpinner className="min-h-screen" />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/catalog" replace />
  return children
}
