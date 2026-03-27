import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../common/LoadingSpinner'

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner className="min-h-screen" />
  if (!user) return <Navigate to="/login" replace />
  return children
}
