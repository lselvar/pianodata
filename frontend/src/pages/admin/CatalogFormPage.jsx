import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { catalogApi } from '../../api/catalogApi'
import { adminApi } from '../../api/adminApi'
import AuthenticatedImage from '../../components/common/AuthenticatedImage'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const ERAS = [
  { value: 'B', label: 'Baroque' },
  { value: 'C', label: 'Classical' },
  { value: 'R', label: 'Romantic' },
  { value: 'M', label: 'Modern' },
  { value: 'CO', label: 'Contemporary' },
]

const TEMPO_SPEEDS = [
  { value: 'S', label: 'Slow' },
  { value: 'M', label: 'Medium' },
  { value: 'F', label: 'Fast' },
]

const empty = {
  title: '', composer: '', compArrangedFrom: '', catalogName: '', movement: '',
  era: '', keyName: '', timeSignature: '', tempo: '', tempoSpeed: '',
  level: '', rating: '', mood: '', type: '', etude: '', book: '',
  permissionStatus: '', bookLink1: '', bookLink2: '', bookLink3: '',
  bookLink4: '', bookLink5: '', booksByLevel: '',
}

export default function CatalogFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(empty)
  const [incipitFile, setIncipitFile] = useState(null)
  const [incipitPreview, setIncipitPreview] = useState(null)
  const [existingIncipit, setExistingIncipit] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    catalogApi.getById(id)
      .then(res => {
        const p = res.data
        setForm({
          title: p.title || '', composer: p.composer || '',
          compArrangedFrom: p.compArrangedFrom || '',
          catalogName: p.catalogName || '', movement: p.movement || '',
          era: p.era || '', keyName: p.keyName || '',
          timeSignature: p.timeSignature || '', tempo: p.tempo || '',
          tempoSpeed: p.tempoSpeed || '', level: p.level || '',
          rating: p.rating ?? '', mood: p.mood || '', type: p.type || '',
          etude: p.etude || '', book: p.book || '',
          permissionStatus: p.permissionStatus || '',
          bookLink1: p.bookLink1 || '', bookLink2: p.bookLink2 || '',
          bookLink3: p.bookLink3 || '', bookLink4: p.bookLink4 || '',
          bookLink5: p.bookLink5 || '', booksByLevel: p.booksByLevel || '',
        })
        setExistingIncipit(p.incipit || null)
      })
      .catch(() => setError('Failed to load entry.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIncipitFile(file)
    setIncipitPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.composer || !form.catalogName) {
      setError('Title, Composer, and Catalog Name are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form, rating: form.rating ? Number(form.rating) : null }
      let savedId = id ? Number(id) : null

      if (isEdit) {
        await adminApi.update(savedId, payload)
      } else {
        const res = await adminApi.create(payload)
        savedId = res.data.id
      }

      if (incipitFile && savedId) {
        await adminApi.uploadIncipit(savedId, incipitFile)
      }

      navigate('/admin/catalog')
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/admin/catalog')}
        className="text-sm text-piano-600 hover:underline mb-4 block"
      >
        &larr; Back to Admin
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Entry' : 'New Entry'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core fields */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Required</h2>
          <Field label="Title *"><input className="input" value={form.title} onChange={set('title')} /></Field>
          <Field label="Composer *"><input className="input" value={form.composer} onChange={set('composer')} /></Field>
          <Field label="Arranged From"><input className="input" value={form.compArrangedFrom} onChange={set('compArrangedFrom')} placeholder="e.g. Folk - German" /></Field>
          <Field label="Catalog Name *"><input className="input" value={form.catalogName} onChange={set('catalogName')} /></Field>
          <Field label="Movement"><input className="input" value={form.movement} onChange={set('movement')} /></Field>
        </div>

        {/* Musical details */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Musical Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Era">
              <select className="input" value={form.era} onChange={set('era')}>
                <option value="">— select —</option>
                {ERAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </Field>
            <Field label="Key"><input className="input" value={form.keyName} onChange={set('keyName')} placeholder="e.g. C major" /></Field>
            <Field label="Time Signature"><input className="input" value={form.timeSignature} onChange={set('timeSignature')} placeholder="e.g. 4/4" /></Field>
            <Field label="Tempo"><input className="input" value={form.tempo} onChange={set('tempo')} placeholder="e.g. Allegro" /></Field>
            <Field label="Tempo Speed">
              <select className="input" value={form.tempoSpeed} onChange={set('tempoSpeed')}>
                <option value="">— select —</option>
                {TEMPO_SPEEDS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Level"><input className="input" value={form.level} onChange={set('level')} placeholder="e.g. Intermediate" /></Field>
            <Field label="Rating"><input className="input" type="number" min="1" max="10" value={form.rating} onChange={set('rating')} /></Field>
          </div>
          <Field label="Mood"><input className="input" value={form.mood} onChange={set('mood')} /></Field>
          <Field label="Type"><input className="input" value={form.type} onChange={set('type')} /></Field>
          <Field label="Etude"><input className="input" value={form.etude} onChange={set('etude')} /></Field>
          <Field label="Book"><input className="input" value={form.book} onChange={set('book')} /></Field>
          <Field label="Books by Level"><input className="input" value={form.booksByLevel} onChange={set('booksByLevel')} /></Field>
          <Field label="Permission Status"><input className="input" value={form.permissionStatus} onChange={set('permissionStatus')} /></Field>
        </div>

        {/* Book links */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Resource Links</h2>
          {['bookLink1','bookLink2','bookLink3','bookLink4','bookLink5'].map((k, i) => (
            <Field key={k} label={`Link ${i + 1}`}>
              <input className="input" type="url" value={form[k]} onChange={set(k)} placeholder="https://…" />
            </Field>
          ))}
        </div>

        {/* Incipit image */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Incipit Image</h2>
          {existingIncipit && !incipitPreview && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Current image ({existingIncipit}):</p>
              <AuthenticatedImage
                src={catalogApi.incipitUrl(existingIncipit)}
                alt="Current incipit"
                className="max-h-32 object-contain bg-gray-50 rounded border border-gray-200"
              />
            </div>
          )}
          {incipitPreview && (
            <div>
              <p className="text-xs text-gray-500 mb-2">New image preview:</p>
              <img src={incipitPreview} alt="Preview" className="max-h-32 object-contain bg-gray-50 rounded border border-gray-200" />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              {existingIncipit ? 'Replace incipit image (PNG only):' : 'Upload incipit image (PNG only):'}
            </label>
            <input
              type="file"
              accept="image/png"
              onChange={handleFileChange}
              className="text-sm text-gray-700"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Entry'}
          </button>
          <button type="button" onClick={() => navigate('/admin/catalog')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 font-medium mb-1">{label}</label>
      {children}
    </div>
  )
}
