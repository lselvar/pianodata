import { useState } from 'react'
import { subscriptionApi } from '../../api/subscriptionApi'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function PricingCard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await subscriptionApi.checkout()
      window.location.href = res.data.checkoutUrl
    } catch {
      setError('Could not start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isActive = user?.subscriptionStatus === 'ACTIVE'

  return (
    <div className="card max-w-sm mx-auto text-center">
      <h3 className="text-xl font-bold text-gray-900">Full Access</h3>
      <div className="mt-4 mb-6">
        <span className="text-4xl font-bold text-piano-600">$9</span>
        <span className="text-gray-500 text-sm">/month</span>
      </div>
      <ul className="text-sm text-gray-600 space-y-2 text-left mb-6">
        {[
          'Unlimited catalog search',
          'Advanced filtering by era, key, tempo',
          'Incipit sheet music previews',
          'Printable links and resources',
        ].map(f => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-piano-500 mt-0.5">&#10003;</span>
            {f}
          </li>
        ))}
      </ul>
      {isActive ? (
        <p className="text-sm font-medium text-green-700 bg-green-50 rounded-lg py-2">
          You have an active subscription
        </p>
      ) : (
        <button onClick={handleSubscribe} disabled={loading} className="btn-primary w-full">
          {loading ? 'Redirecting...' : 'Subscribe Now'}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
