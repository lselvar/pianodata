import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/adminApi'

const CSV_COLUMNS = [
  'TITLE', 'MOVEMENT', 'COMPOSER', 'ORIGINAL SOURCE', 'CATALOG',
  'ERA B, C, R, M', 'KEY', 'TIME SIGNATURE', 'TEMPO', 'TEMPO FAST, MED, SLOW',
  'LEVEL', 'LEVEL SECONDO', 'RATING', 'MOOD', 'TYPE', 'ETUDE', 'SOLO DUET',
  'BOOK', 'INCIPIT', 'INCIPIT SECONDO', 'PERMISSION STATUS',
  'BOOK 1', 'BOOK 2', 'BOOK 3', 'BOOK 4', 'BOOK 5', 'BOOKS BY LEVEL',
]

export default function BulkUploadPage() {
  const navigate = useNavigate()

  const [csvFile, setCsvFile] = useState(null)
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvResult, setCsvResult] = useState(null)
  const [csvError, setCsvError] = useState(null)

  const [zipFile, setZipFile] = useState(null)
  const [zipUploading, setZipUploading] = useState(false)
  const [zipResult, setZipResult] = useState(null)
  const [zipError, setZipError] = useState(null)

  const handleCsvUpload = async () => {
    if (!csvFile) return
    setCsvUploading(true)
    setCsvResult(null)
    setCsvError(null)
    try {
      const res = await adminApi.bulkUploadCsv(csvFile)
      setCsvResult(res.data)
    } catch {
      setCsvError('Upload failed. Please check your file and try again.')
    } finally {
      setCsvUploading(false)
    }
  }

  const handleZipUpload = async () => {
    if (!zipFile) return
    setZipUploading(true)
    setZipResult(null)
    setZipError(null)
    try {
      const res = await adminApi.bulkUploadImages(zipFile)
      setZipResult(res.data)
    } catch {
      setZipError('Upload failed. Please check your ZIP file and try again.')
    } finally {
      setZipUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/admin/catalog')}
        className="text-sm text-piano-600 hover:underline mb-4 block"
      >
        &larr; Back to Admin
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bulk Upload</h1>

      {/* ── CSV Catalog Import ───────────────────────────────────── */}
      <div className="card space-y-4 mb-6">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Catalog CSV Import
        </h2>
        <p className="text-sm text-gray-500">
          Upload a CSV file to bulk import catalog entries. Rows missing <strong>TITLE</strong>,{' '}
          <strong>COMPOSER</strong>, or <strong>CATALOG</strong> are skipped. Duplicate entries
          (same title + movement + composer + catalog) are silently skipped.
        </p>

        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700 font-medium">
            Expected CSV columns ({CSV_COLUMNS.length})
          </summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {CSV_COLUMNS.map(col => (
              <span
                key={col}
                className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono"
              >
                {col}
              </span>
            ))}
          </div>
        </details>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            accept=".csv"
            onChange={e => { setCsvFile(e.target.files[0] || null); setCsvResult(null); setCsvError(null) }}
            className="text-sm text-gray-700"
          />
          <button
            onClick={handleCsvUpload}
            disabled={!csvFile || csvUploading}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {csvUploading ? 'Uploading…' : 'Import CSV'}
          </button>
        </div>

        {csvError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {csvError}
          </div>
        )}

        {csvResult && (
          <div className="p-4 bg-gray-50 rounded border border-gray-200 space-y-3">
            <div className="flex gap-6 text-sm font-medium">
              <span className="text-green-700">{csvResult.created} created</span>
              <span className="text-yellow-700">{csvResult.skipped} skipped</span>
            </div>
            {csvResult.errors?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-1">
                  Row errors ({csvResult.errors.length}):
                </p>
                <ul className="text-xs text-red-600 space-y-0.5 max-h-48 overflow-y-auto">
                  {csvResult.errors.map((e, i) => (
                    <li key={i} className="font-mono">{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Incipit Images ZIP Upload ────────────────────────────── */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Incipit Images ZIP Upload
        </h2>
        <p className="text-sm text-gray-500">
          Upload a ZIP archive containing PNG incipit images. Each filename must match the{' '}
          <strong>INCIPIT</strong> or <strong>INCIPIT SECONDO</strong> code in the catalog
          (e.g., <code className="bg-gray-100 px-1 rounded">D6634.png</code>). Files inside
          sub-folders are supported. Existing images will be overwritten.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            accept=".zip"
            onChange={e => { setZipFile(e.target.files[0] || null); setZipResult(null); setZipError(null) }}
            className="text-sm text-gray-700"
          />
          <button
            onClick={handleZipUpload}
            disabled={!zipFile || zipUploading}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {zipUploading ? 'Uploading…' : 'Upload Images'}
          </button>
        </div>

        {zipError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {zipError}
          </div>
        )}

        {zipResult && (
          <div className="p-4 bg-gray-50 rounded border border-gray-200 space-y-3">
            <p className="text-sm font-medium text-green-700">
              {zipResult.imagesStored} image{zipResult.imagesStored !== 1 ? 's' : ''} stored
            </p>
            {zipResult.errors?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-1">
                  File errors ({zipResult.errors.length}):
                </p>
                <ul className="text-xs text-red-600 space-y-0.5 max-h-48 overflow-y-auto">
                  {zipResult.errors.map((e, i) => (
                    <li key={i} className="font-mono">{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
