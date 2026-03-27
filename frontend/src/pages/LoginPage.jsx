import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import GoogleLoginButton from '../components/auth/GoogleLoginButton'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function LoginPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner className="min-h-screen" />
  if (user) return <Navigate to="/catalog" replace />

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="card w-full max-w-sm text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-piano-700">PianoRep</h1>
          <p className="text-gray-500 text-sm mt-2">Discover and explore piano repertoire</p>
        </div>
        <div className="border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600 mb-4">Sign in with Google to get started</p>
          <div className="flex justify-center">
            <GoogleLoginButton />
          </div>
        </div>
        <p className="text-xs text-gray-400">7-day free trial &middot; No credit card required</p>
      </div>
    </div>
  )
}
