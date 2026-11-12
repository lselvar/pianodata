import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { catalogApi } from '../../api/catalogApi'
import { adminApi } from '../../api/adminApi'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'

const STATE_KEY = 'pianorep.admin.catalog.searchState'

// Restore the last admin search (query + page) so Back from an edit returns to the same results.
function loadSavedState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null')
    if (saved && typeof saved.q === 'string') {
      return { q: saved.q, page: Number.isInteger(saved.page) && saved.page >= 0 ? saved.page : 0 }
    }
  } catch { /* ignore corrupt or unavailable storage */ }
  return { q: '', page: 0 }
}

const LINK_KEYS = ['bookLink1', 'bookLink2', 'bookLink3', 'bookLink4', 'bookLink5']

function BulkLinksModal({ selectedIds, selectedPieces, onClose, onSaved }) {
  const [links, setLinks] = useState({ bookLink1: '', bookLink2: '', bookLink3: '', bookLink4: '', bookLink5: '' })
  const [enabled, setEnabled] = useState({ bookLink1: false, bookLink2: false, bookLink3: false, bookLink4: false, bookLink5: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(null)

  const toggleEnabled = (key) => setEnabled(e => ({ ...e, [key]: !e[key] }))
  const setLink = (key) => (e) => setLinks(l => ({ ...l, [key]: e.target.value }))

  const handleSave = async () => {
    const patch = {}
    LINK_KEYS.forEach(k => { if (enabled[k]) patch[k] = links[k] })
    if (Object.keys(patch).length === 0) {
      setError('Enable at least one link field to update.')
      return
    }
    setSaving(true)
    setError(null)
    let done = 0
    try {
      for (const id of selectedIds) {
        await adminApi.update(id, patch)
        done++
        setProgress(`Saving… ${done}/${selectedIds.length}`)
      }
      onSaved()
    } catch {
      setError('One or more entries failed to save. Please try again.')
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit Resource Links</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Applying to <span className="font-medium text-gray-700">{selectedIds.length}</span> selected {selectedIds.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-xs text-gray-500 mb-1">Toggle the checkbox next to each link you want to overwrite. Unchecked fields will not be changed.</p>
          {LINK_KEYS.map((key, i) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`enable-${key}`}
                checked={enabled[key]}
                onChange={() => toggleEnabled(key)}
                className="h-4 w-4 rounded border-gray-300 text-piano-600 focus:ring-piano-500 shrink-0"
              />
              <div className="flex-1">
                <label htmlFor={`enable-${key}`} className="text-xs text-gray-500 font-medium mb-1 block">
                  Link {i + 1}
                </label>
                <input
                  type="url"
                  value={links[key]}
                  onChange={setLink(key)}
                  onFocus={() => setEnabled(e => ({ ...e, [key]: true }))}
                  placeholder="https://…"
                  className={`input w-full text-sm transition-opacity ${!enabled[key] ? 'opacity-40' : ''}`}
                />
              </div>
            </div>
          ))}

          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          {progress && <p className="text-xs text-gray-500 mt-2">{progress}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm" disabled={saving}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
            {saving ? (progress || 'Saving…') : `Save to ${selectedIds.length} ${selectedIds.length === 1 ? 'entry' : 'entries'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCatalogPage() {
  const navigate = useNavigate()
  const [results, setResults] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [initial] = useState(loadSavedState)
  const [page, setPage] = useState(initial.page)
  const [q, setQ] = useState(initial.q)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showLinksModal, setShowLinksModal] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    catalogApi.search({ q, page, size: 25, sort: 'composer', direction: 'asc' })
      .then(res => setResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [q, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify({ q, page })) } catch { /* ignore */ }
  }, [q, page])

  // Clear selection when page/query changes
  useEffect(() => { setSelectedIds(new Set()) }, [q, page])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await adminApi.delete(id)
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
      load()
    } catch {
      alert('Failed to delete entry.')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allOnPageSelected = results.content.length > 0 && results.content.every(p => selectedIds.has(p.id))
  const someOnPageSelected = results.content.some(p => selectedIds.has(p.id))

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        results.content.forEach(p => next.delete(p.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        results.content.forEach(p => next.add(p.id))
        return next
      })
    }
  }

  const selectedPieces = results.content.filter(p => selectedIds.has(p.id))
  const selectedCount = selectedIds.size

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin — Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">{results.totalElements} entries</p>
        </div>
        <Link to="/admin/catalog/new" className="btn-primary text-sm">
          + New Entry
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by Composer, Catalog, Title"
          value={q}
          onChange={e => { setQ(e.target.value); setPage(0) }}
          className="input w-full max-w-sm"
        />

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 ml-auto bg-piano-50 border border-piano-200 rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-piano-700">
              {selectedCount} {selectedCount === 1 ? 'entry' : 'entries'} selected
            </span>
            <button
              onClick={() => setShowLinksModal(true)}
              className="btn-primary text-xs py-1 px-3"
            >
              Edit Resource Links
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600 ml-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      ref={el => { if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-piano-600 focus:ring-piano-500"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Composer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Catalog</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Era</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Level</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Incipit</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.content.map(piece => (
                  <tr
                    key={piece.id}
                    className={`hover:bg-gray-50 ${selectedIds.has(piece.id) ? 'bg-piano-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(piece.id)}
                        onChange={() => toggleSelect(piece.id)}
                        className="h-4 w-4 rounded border-gray-300 text-piano-600 focus:ring-piano-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{piece.title}</div>
                      {piece.movement && <div className="text-xs text-gray-400">{piece.movement}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{piece.composer}</div>
                      {piece.originalSource && (
                        <div className="text-xs text-gray-400">arr. {piece.originalSource}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{piece.catalogName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{piece.eraLabel || piece.era || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{piece.level || '—'}</td>
                    <td className="px-4 py-3">
                      {piece.incipit
                        ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{piece.incipit}</span>
                        : <span className="text-xs text-gray-400">none</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/admin/catalog/${piece.id}/edit`)}
                        className="text-piano-600 hover:underline text-xs mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(piece.id, piece.title)}
                        disabled={deletingId === piece.id}
                        className="text-red-500 hover:underline text-xs disabled:opacity-50"
                      >
                        {deletingId === piece.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.content.length === 0 && (
              <p className="text-center text-gray-500 py-8">No entries found.</p>
            )}
          </div>

          <div className="mt-4">
            <Pagination
              page={page}
              totalPages={results.totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {showLinksModal && (
        <BulkLinksModal
          selectedIds={[...selectedIds]}
          selectedPieces={selectedPieces}
          onClose={() => setShowLinksModal(false)}
          onSaved={() => {
            setShowLinksModal(false)
            setSelectedIds(new Set())
            load()
          }}
        />
      )}
    </div>
  )
}
