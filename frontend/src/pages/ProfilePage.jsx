import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { subscriptionApi } from '../api/subscriptionApi'

const STATUS_STYLES = {
  TRIAL: 'bg-blue-50 text-blue-700',
  ACTIVE: 'bg-green-50 text-green-700',
  EXPIRED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await subscriptionApi.portal()
      window.location.href = res.data.checkoutUrl
    } catch {
      setError('Could not open billing portal. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (!user) return null

  const statusStyle = STATUS_STYLES[user.subscriptionStatus] || 'bg-gray-100 text-gray-700'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="card flex items-center gap-4">
        {user.avatarUrl && (
          <img src={user.avatarUrl} alt={user.displayName} className="w-16 h-16 rounded-full" />
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user.displayName}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Subscription</h2>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle}`}>
            {user.subscriptionStatus}
          </span>
          {user.subscriptionStatus === 'TRIAL' && user.trialDaysRemaining !== null && (
            <span className="text-sm text-gray-500">
              {user.trialDaysRemaining} day{user.trialDaysRemaining !== 1 ? 's' : ''} remaining
            </span>
          )}
          {user.subscriptionStatus === 'ACTIVE' && user.currentPeriodEnd && (
            <span className="text-sm text-gray-500">
              Renews {new Date(user.currentPeriodEnd).toLocaleDateString()}
            </span>
          )}
        </div>

        {user.subscriptionStatus === 'ACTIVE' && (
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="btn-secondary text-sm"
          >
            {portalLoading ? 'Loading...' : 'Manage Billing'}
          </button>
        )}

        {(user.subscriptionStatus === 'TRIAL' ||
          user.subscriptionStatus === 'EXPIRED' ||
          user.subscriptionStatus === 'CANCELLED') && (
          <Link to="/pricing" className="btn-primary text-sm inline-block">
            {user.subscriptionStatus === 'TRIAL' ? 'Subscribe Now' : 'Resubscribe'}
          </Link>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
