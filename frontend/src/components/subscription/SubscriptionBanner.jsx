import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function SubscriptionBanner() {
  const { user } = useAuth()
  if (!user) return null

  if (user.subscriptionStatus === 'TRIAL' && user.trialDaysRemaining !== null) {
    return (
      <div className="bg-piano-50 border-b border-piano-200 px-4 py-2 text-sm text-center">
        <span className="text-piano-800">
          Trial: {user.trialDaysRemaining} day{user.trialDaysRemaining !== 1 ? 's' : ''} remaining.{' '}
          <Link to="/pricing" className="font-medium text-piano-600 hover:underline">
            Upgrade now
          </Link>
        </span>
      </div>
    )
  }

  if (user.subscriptionStatus === 'EXPIRED' || user.subscriptionStatus === 'CANCELLED') {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-center">
        <span className="text-red-800">
          Your access has expired.{' '}
          <Link to="/pricing" className="font-medium text-red-700 hover:underline">
            Subscribe to continue
          </Link>
        </span>
      </div>
    )
  }

  return null
}
