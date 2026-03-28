const TEMPO_LABELS = { S: 'Slow', M: 'Medium', F: 'Fast' }

export default function SearchFilters({ filters, options, onChange }) {
  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value || undefined })

  const eraOptions = options.eras || []

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-800">Filters</h2>

      {/* Composer */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Composer</label>
        <select className="select" value={filters.composer || ''} onChange={handle('composer')}>
          <option value="">All</option>
          {(options.composers || []).map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Catalog */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Catalog</label>
        <input
          className="input"
          placeholder="Catalog name…"
          value={filters.catalogName || ''}
          onChange={handle('catalogName')}
        />
      </div>

      {/* Piece */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Piece</label>
        <input
          className="input"
          placeholder="Title…"
          value={filters.q || ''}
          onChange={handle('q')}
        />
      </div>

      {/* Movement */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Movement</label>
        <input
          className="input"
          placeholder="Movement…"
          value={filters.movement || ''}
          onChange={handle('movement')}
        />
      </div>

      {/* Era */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Era</label>
        <select className="select" value={filters.era || ''} onChange={handle('era')}>
          <option value="">All</option>
          {eraOptions.map(o => (
            <option key={o} value={o}>{options.eraLabels?.[o] || o}</option>
          ))}
        </select>
      </div>

      {/* Level */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
        <select
          className="select"
          value={filters.levels || ''}
          onChange={(e) => onChange({ ...filters, levels: e.target.value || undefined })}
        >
          <option value="">All</option>
          {(options.levels || []).map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Rating</label>
        <input
          className="input"
          type="number"
          min="1"
          max="5"
          placeholder="1–5"
          value={filters.rating || ''}
          onChange={(e) => onChange({ ...filters, rating: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>

      {/* Key */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Key</label>
        <select className="select" value={filters.keyName || ''} onChange={handle('keyName')}>
          <option value="">All</option>
          {(options.keys || []).map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Meter */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Meter</label>
        <input
          className="input"
          placeholder="e.g. 4/4"
          value={filters.timeSignature || ''}
          onChange={handle('timeSignature')}
        />
      </div>

      {/* Mood */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Mood</label>
        <input
          className="input"
          placeholder="Mood…"
          value={filters.mood || ''}
          onChange={handle('mood')}
        />
      </div>

      {/* Tempo Speed */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tempo Speed</label>
        <select className="select" value={filters.tempoSpeed || ''} onChange={handle('tempoSpeed')}>
          <option value="">All</option>
          {(options.tempoSpeeds || []).map(o => (
            <option key={o} value={o}>{TEMPO_LABELS[o] || o}</option>
          ))}
        </select>
      </div>

      <button
        className="btn-secondary w-full text-sm"
        onClick={() => onChange({})}
      >
        Clear Filters
      </button>
    </div>
  )
}
