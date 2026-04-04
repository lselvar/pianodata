import { useState } from 'react'

const TEMPO_LABELS = { S: 'Slow', M: 'Medium', F: 'Fast' }

const SOLO_DUET_OPTIONS = [
  { value: 'S', label: 'Solo' },
  { value: 'D', label: 'Duet' },
]

export default function SearchFilters({ filters, options, onChange }) {
  const [showComposerSuggestions, setShowComposerSuggestions] = useState(false)

  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value || undefined })

  const toggleArray = (key, value) => {
    const current = filters[key] || []
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: next.length ? next : undefined })
  }

  const composerSuggestions = filters.composer
    ? (options.composers || [])
        .filter(c => c.toLowerCase().includes(filters.composer.toLowerCase()))
        .slice(0, 10)
    : []

  const selectedSoloDuets = filters.soloDuets || []

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-800">Filters</h2>

      {/* Composer — typeahead */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-600 mb-1">Composer</label>
        <input
          className="input"
          placeholder="Composer…"
          value={filters.composer || ''}
          onChange={handle('composer')}
          onFocus={() => setShowComposerSuggestions(true)}
          onBlur={() => setShowComposerSuggestions(false)}
          autoComplete="off"
        />
        {showComposerSuggestions && composerSuggestions.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-48 overflow-y-auto">
            {composerSuggestions.map(c => (
              <li
                key={c}
                className="px-3 py-1.5 text-xs text-gray-700 cursor-pointer hover:bg-piano-50 hover:text-piano-800"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange({ ...filters, composer: c })
                  setShowComposerSuggestions(false)
                }}
              >
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Solo / Duet — multi-select */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Solo / Duet</label>
        <div className="flex gap-5">
          {SOLO_DUET_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                className="rounded"
                checked={selectedSoloDuets.includes(opt.value)}
                onChange={() => toggleArray('soloDuets', opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Piece Movement — grouped label with two text inputs */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Piece Movement</label>
        <div className="space-y-1.5">
          <input
            className="input"
            placeholder="Title…"
            value={filters.q || ''}
            onChange={handle('q')}
          />
          <input
            className="input"
            placeholder="Movement…"
            value={filters.movement || ''}
            onChange={handle('movement')}
          />
        </div>
      </div>

      {/* Catalog */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Catalog</label>
        <input
          className="input"
          placeholder="Catalog…"
          value={filters.catalogName || ''}
          onChange={handle('catalogName')}
        />
      </div>

      {/* Era */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Era</label>
        <select className="select" value={filters.era || ''} onChange={handle('era')}>
          <option value="">All</option>
          {(options.eras || []).map(o => (
            <option key={o} value={o}>{options.eraLabels?.[o] || o}</option>
          ))}
        </select>
      </div>

      {/* Level — multi-select dropdown */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Level</label>
          {(filters.levels || []).length > 0 && (
            <button
              className="text-xs text-piano-600 hover:underline"
              onClick={() => onChange({ ...filters, levels: undefined })}
            >
              Clear ({filters.levels.length})
            </button>
          )}
        </div>
        <select
          multiple
          className="w-full rounded border border-gray-300 text-sm text-gray-700 p-1 focus:outline-none focus:ring-1 focus:ring-piano-500"
          value={filters.levels || []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, o => o.value)
            onChange({ ...filters, levels: selected.length ? selected : undefined })
          }}
        >
          {[...(options.levels || [])].sort((a, b) => {
            if (a === '10+') return 1
            if (b === '10+') return -1
            const nA = parseFloat(a), nB = parseFloat(b)
            if (!isNaN(nA) && !isNaN(nB)) return nA - nB
            return a.localeCompare(b)
          }).map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Hold ⌘ / Ctrl to select multiple</p>
      </div>

      {/* Level Secundo — multi-select dropdown */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Level Secondo</label>
          {(filters.levelSecundos || []).length > 0 && (
            <button
              className="text-xs text-piano-600 hover:underline"
              onClick={() => onChange({ ...filters, levelSecundos: undefined })}
            >
              Clear ({filters.levelSecundos.length})
            </button>
          )}
        </div>
        <select
          multiple
          className="w-full rounded border border-gray-300 text-sm text-gray-700 p-1 focus:outline-none focus:ring-1 focus:ring-piano-500"
          value={filters.levelSecundos || []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, o => o.value)
            onChange({ ...filters, levelSecundos: selected.length ? selected : undefined })
          }}
        >
          {[...(options.levelSecundos || [])].sort((a, b) => {
            if (a === '10+') return 1
            if (b === '10+') return -1
            const nA = parseFloat(a), nB = parseFloat(b)
            if (!isNaN(nA) && !isNaN(nB)) return nA - nB
            return a.localeCompare(b)
          }).map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Hold ⌘ / Ctrl to select multiple</p>
      </div>

      {/* Rating — multi-select dropdown */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Rating</label>
          {(filters.ratings || []).length > 0 && (
            <button
              className="text-xs text-piano-600 hover:underline"
              onClick={() => onChange({ ...filters, ratings: undefined })}
            >
              Clear ({filters.ratings.length})
            </button>
          )}
        </div>
        <select
          multiple
          className="w-full rounded border border-gray-300 text-sm text-gray-700 p-1 focus:outline-none focus:ring-1 focus:ring-piano-500"
          value={(filters.ratings || []).map(String)}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, o => Number(o.value))
            onChange({ ...filters, ratings: selected.length ? selected : undefined })
          }}
        >
          {[...(options.ratings || [])].sort((a, b) => a - b).map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Hold ⌘ / Ctrl to select multiple</p>
      </div>

      {/* Speed (Tempo Speed) */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Speed</label>
        <select className="select" value={filters.tempoSpeed || ''} onChange={handle('tempoSpeed')}>
          <option value="">All</option>
          {(options.tempoSpeeds || []).map(o => (
            <option key={o} value={o}>{TEMPO_LABELS[o] || o}</option>
          ))}
        </select>
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

      {/* Type */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
        <input
          className="input"
          placeholder="Type…"
          value={filters.type || ''}
          onChange={handle('type')}
        />
      </div>

      {/* Etude */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Etude</label>
        <input
          className="input"
          placeholder="Etude…"
          value={filters.etude || ''}
          onChange={handle('etude')}
        />
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
