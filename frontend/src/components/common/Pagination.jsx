export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="btn-secondary text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="btn-secondary text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}
