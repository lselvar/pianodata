import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { catalogApi } from '../../api/catalogApi'
import { adminApi } from '../../api/adminApi'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'

export default function AdminCatalogPage() {
  const navigate = useNavigate()
  const [results, setResults] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    catalogApi.search({ q, page, size: 25, sort: 'composer', direction: 'asc' })
      .then(res => setResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [q, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await adminApi.delete(id)
      load()
    } catch {
      alert('Failed to delete entry.')
    } finally {
      setDeletingId(null)
    }
  }

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

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by title, composer…"
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Composer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Era</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Level</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Incipit</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.content.map(piece => (
                  <tr key={piece.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{piece.title}</div>
                      {piece.movement && <div className="text-xs text-gray-400">{piece.movement}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{piece.composer}</div>
                      {piece.compArrangedFrom && (
                        <div className="text-xs text-gray-400">arr. {piece.compArrangedFrom}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{piece.era || '—'}</td>
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
    </div>
  )
}
