import { Link } from 'react-router-dom'
import { catalogApi } from '../../api/catalogApi'
import AuthenticatedImage from '../common/AuthenticatedImage'

export default function PieceCard({ piece }) {
  return (
    <Link to={`/catalog/${piece.id}`} className="card hover:shadow-md transition-shadow block">
      {piece.incipit && (
        <AuthenticatedImage
          src={catalogApi.incipitUrl(piece.incipit)}
          alt="Incipit"
          className="w-full h-28 object-contain bg-gray-50 rounded mb-3"
        />
      )}
      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{piece.title}</h3>
      {piece.movement && <p className="text-xs text-gray-500 mt-0.5">{piece.movement}</p>}
      <p className="text-xs text-piano-600 mt-1">{piece.composer}</p>
      {piece.compArrangedFrom && (
        <p className="text-xs text-gray-400 mt-0.5">arr. {piece.compArrangedFrom}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {piece.era && <Badge>{piece.eraLabel || piece.era}</Badge>}
        {piece.level && <Badge>{piece.level}</Badge>}
        {piece.tempoSpeed && <Badge>{piece.tempoSpeedLabel || piece.tempoSpeed}</Badge>}
      </div>
    </Link>
  )
}

function Badge({ children }) {
  return (
    <span className="inline-block bg-piano-50 text-piano-700 text-xs px-2 py-0.5 rounded-full">
      {children}
    </span>
  )
}
