import { useState, useEffect } from 'react'

export default function AuthenticatedImage({ src, alt, className }) {
  const [objectUrl, setObjectUrl] = useState(null)

  useEffect(() => {
    if (!src) return

    const token = localStorage.getItem('pianorep_token')
    let blobUrl = null

    fetch(src, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => (res.ok ? res.blob() : null))
      .then(blob => {
        if (blob) {
          blobUrl = URL.createObjectURL(blob)
          setObjectUrl(blobUrl)
        }
      })
      .catch(() => {})

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [src])

  if (!objectUrl) return null
  return <img src={objectUrl} alt={alt} className={className} />
}
