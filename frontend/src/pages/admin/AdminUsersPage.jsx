import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../../api/adminApi'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'

const STATUS_STYLES = {
  TRIAL:     'bg-blue-50 text-blue-700',
  ACTIVE:    'bg-green-50 text-green-700',
  EXPIRED:   'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

const ALL_STATUSES = ['TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED']

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatDateTime(iso) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function TrialDaysLabel({ user }) {
  if (user.admin) return <p className="text-xs text-gray-400 mt-0.5">Unlimited</p>
  if (user.subscriptionStatus === 'TRIAL') {
    return <p className="text-xs text-gray-400 mt-0.5">{user.trialDaysRemaining}d left</p>
  }
  return null
}

function EditRow({ user, onSave, onCancel }) {
  const [status, setStatus] = useState(user.subscriptionStatus)
  const [isAdmin, setIsAdmin] = useState(user.admin)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(user.id, { subscriptionStatus: status, admin: isAdmin })
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="bg-blue-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {user.avatarUrl && (
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
          )}
          <div>
            <p className="font-medium text-gray-900">{user.displayName || '—'}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={e => setIsAdmin(e.target.checked)}
            className="w-4 h-4 accent-piano-600"
          />
          <span className="text-sm text-gray-700">Admin</span>
        </label>
      </td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="input text-sm py-1"
        >
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500" colSpan={2}>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-xs py-1 px-3"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-gray-700 px-2"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function AdminUsersPage() {
  const [results, setResults] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getUsers({ q: q || undefined, page, size: 25 })
      .then(res => setResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [q, page])

  useEffect(() => { load() }, [load])

  const handleSave = async (id, data) => {
    await adminApi.updateUser(id, data)
    setEditingId(null)
    load()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin — Users</h1>
          <p className="text-sm text-gray-500 mt-1">{results.totalElements} total users</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={q}
          onChange={e => { setQ(e.target.value); setPage(0) }}
          className="input w-full max-w-sm"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Subscription</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Trial / Period End</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.content.map(user => (
                  editingId === user.id ? (
                    <EditRow
                      key={user.id}
                      user={user}
                      onSave={handleSave}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl && (
                            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{user.displayName || '—'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.admin ? (
                          <span className="inline-flex items-center gap-1 bg-piano-50 text-piano-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            Admin
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">User</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[user.subscriptionStatus] || ''}`}>
                          {user.subscriptionStatus}
                        </span>
                        <TrialDaysLabel user={user} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {user.subscriptionStatus === 'ACTIVE' && user.currentPeriodEnd
                          ? <>Renews {formatDate(user.currentPeriodEnd)}</>
                          : user.trialStartDate
                            ? <>Started {formatDate(user.trialStartDate)}</>
                            : '—'
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div className="flex items-center justify-between gap-2">
                          <span>{formatDateTime(user.lastLoginAt)}</span>
                          <button
                            onClick={() => setEditingId(user.id)}
                            className="text-xs text-piano-600 hover:text-piano-800 font-medium shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
            {results.content.length === 0 && (
              <p className="text-center text-gray-500 py-8">No users found.</p>
            )}
          </div>

          <div className="mt-4">
            <Pagination page={page} totalPages={results.totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
