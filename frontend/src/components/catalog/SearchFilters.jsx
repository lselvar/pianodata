export default function SearchFilters({ filters, options, onChange }) {
  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value })

  const eraOptions = options.eras ? Object.keys(options.eras) : []

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-800">Filters</h2>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
        <input
          className="input"
          placeholder="Title, composer..."
          value={filters.q || ''}
          onChange={handle('q')}
        />
      </div>

      {[
        { key: 'composer', label: 'Composer', opts: options.composers || [] },
        { key: 'era', label: 'Era', opts: eraOptions },
        { key: 'keyName', label: 'Key', opts: options.keys || [] },
        { key: 'tempoSpeed', label: 'Tempo', opts: options.tempoSpeeds || [] },
      ].map(({ key, label, opts }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
          <select className="select" value={filters[key] || ''} onChange={handle(key)}>
            <option value="">All</option>
            {opts.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      ))}

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

      <button
        className="btn-secondary w-full text-sm"
        onClick={() => onChange({})}
      >
        Clear Filters
      </button>
    </div>
  )
}
