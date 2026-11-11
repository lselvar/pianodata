import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { catalogApi } from '../api/catalogApi'
import SearchFilters from '../components/catalog/SearchFilters'
import PieceCard from '../components/catalog/PieceCard'
import Pagination from '../components/common/Pagination'
import LoadingSpinner from '../components/common/LoadingSpinner'

const STATE_KEY = 'pianorep.catalog.searchState'

// Restore the last search (filters + page) so Back from a piece returns to the same results.
function loadSavedState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null')
    if (saved && typeof saved.filters === 'object' && saved.filters !== null) {
      return { filters: saved.filters, page: Number.isInteger(saved.page) ? saved.page : 0 }
    }
  } catch { /* ignore corrupt or unavailable storage */ }
  return { filters: {}, page: 0 }
}

export default function CatalogPage() {
  const [initial] = useState(loadSavedState)
  const [filters, setFilters] = useState(initial.filters)
  const [page, setPage] = useState(initial.page)
  const [results, setResults] = useState(null)
  const [filterOptions, setFilterOptions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    catalogApi.getFilterOptions()
      .then(res => setFilterOptions(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify({ filters, page })) } catch { /* ignore */ }
  }, [filters, page])

  const search = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = { ...filters, page, size: 24 }
    catalogApi.search(params)
      .then(res => setResults(res.data))
      .catch(err => {
        if (err.response?.status === 403) setError('subscription_required')
        else setError('search_failed')
      })
      .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => {
    search()
  }, [search])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(0)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <aside className="w-64 flex-shrink-0">
          <SearchFilters filters={filters} options={filterOptions} onChange={handleFilterChange} />
        </aside>
        <main className="flex-1 min-w-0">
          {loading ? (
            <LoadingSpinner className="min-h-64" />
          ) : error === 'subscription_required' ? (
            <SubscriptionRequired />
          ) : error ? (
            <p className="text-red-600 text-sm">Search failed. Please try again.</p>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-500">
                {results?.totalElements ?? 0} pieces found
              </div>
              {results?.content?.length === 0 ? (
                <p className="text-gray-500 text-sm">No results. Try different filters.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results?.content?.map(piece => (
                    <PieceCard key={piece.id} piece={piece} />
                  ))}
                </div>
              )}
              <Pagination
                page={page}
                totalPages={results?.totalPages ?? 0}
                onPageChange={setPage}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function SubscriptionRequired() {
  return (
    <div className="card text-center py-12">
      <h3 className="text-lg font-semibold text-gray-800">Subscription Required</h3>
      <p className="text-gray-500 text-sm mt-2 mb-4">
        Your trial has ended. Subscribe to continue browsing the catalog.
      </p>
      <Link to="/pricing" className="btn-primary">View Plans</Link>
    </div>
  )
}
