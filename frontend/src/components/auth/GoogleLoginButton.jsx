import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function GoogleLoginButton() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  const handleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential)
      navigate('/catalog')
    } catch {
      setError('Login failed. Please try again.')
    }
  }

  return (
    <div>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => setError('Google sign-in failed.')}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
