import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { catalogApi } from '../api/catalogApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import AuthenticatedImage from '../components/common/AuthenticatedImage'

export default function PieceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [piece, setPiece] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    catalogApi.getById(id)
      .then(res => setPiece(res.data))
      .catch(err => {
        if (err.response?.status === 403) setError('subscription_required')
        else if (err.response?.status === 404) setError('not_found')
        else setError('error')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner className="min-h-screen" />

  if (error === 'not_found') return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <p className="text-gray-600">Piece not found.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4 text-sm">Go back</button>
    </div>
  )

  if (error === 'subscription_required') return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <p className="text-gray-600">Subscribe to view piece details.</p>
      <Link to="/pricing" className="btn-primary mt-4 inline-block">View Plans</Link>
    </div>
  )

  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <p className="text-red-600">Failed to load piece. Please try again.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4 text-sm">Go back</button>
    </div>
  )

  const fields = [
    { label: 'Era', value: piece.eraLabel || piece.era },
    { label: 'Key', value: piece.keyName },
    { label: 'Time Signature', value: piece.timeSignature },
    { label: 'Tempo', value: piece.tempo },
    { label: 'Tempo Speed', value: piece.tempoSpeedLabel || piece.tempoSpeed },
    { label: 'Level', value: piece.level },
    { label: 'Level Secondo', value: piece.levelSecundo },
    { label: 'Rating', value: piece.rating },
    { label: 'Mood', value: piece.mood },
    { label: 'Type', value: piece.type },
    { label: 'Catalog', value: piece.catalogName },
    { label: 'Book', value: piece.book },
    { label: 'Etude', value: piece.etude },
    { label: 'Solo / Duet', value: piece.soloDuet },
  ].filter(f => f.value)

  const bookLinks = [piece.bookLink1, piece.bookLink2, piece.bookLink3, piece.bookLink4, piece.bookLink5]
    .filter(Boolean)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-piano-600 hover:underline mb-4 block"
      >
        &larr; Back to catalog
      </button>
      <div className="card space-y-6">
        {piece.incipit && piece.permissionStatus !== 'NEED' && (
          <AuthenticatedImage
            src={catalogApi.incipitUrl(piece.incipit)}
            alt="Incipit"
            className="w-full max-h-48 object-contain bg-gray-50 rounded"
          />
        )}
        {piece.incipitSecundo && piece.permissionStatus !== 'NEED' && (
          <AuthenticatedImage
            src={catalogApi.incipitUrl(piece.incipitSecundo)}
            alt="Incipit Secondo"
            className="w-full max-h-48 object-contain bg-gray-50 rounded"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{piece.title}</h1>
          {piece.movement != null && String(piece.movement).trim() !== '' && String(piece.movement).trim() !== '0' && (
            <p className="text-gray-500 mt-0.5">{piece.movement}</p>
          )}
          <p className="text-piano-600 font-medium mt-1">{piece.composer}</p>
          {piece.originalSource && (
            <p className="text-sm text-gray-500 mt-0.5">arr. {piece.originalSource}</p>
          )}
        </div>

        {fields.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border-t border-gray-100 pt-4">
            {fields.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        )}

        {bookLinks.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Resources</p>
            <div className="flex flex-wrap gap-2">
              {bookLinks.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm"
                >
                  Resource {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
