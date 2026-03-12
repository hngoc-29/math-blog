import { useCallback, useRef, useState } from 'react'
import type { MediaAttachment, MediaType } from '../../utils/encode'

interface MediaUploaderProps {
  media: MediaAttachment[]
  onChange: (media: MediaAttachment[]) => void
}

const MAX_FILE_MB = 2
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  return 'file'
}

function guessMediaTypeFromUrl(url: string): MediaType {
  const lower = url.toLowerCase().split('?')[0]
  if (/\.(mp3|wav|ogg|flac|aac|m4a|opus|weba)$/.test(lower)) return 'audio'
  if (/\.(mp4|webm|ogv|mov|avi|mkv|m4v)$/.test(lower)) return 'video'
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg|bmp)$/.test(lower)) return 'image'
  // YouTube / common video platforms
  if (/youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/.test(lower)) return 'video'
  // SoundCloud / Spotify
  if (/soundcloud\.com|spotify\.com/.test(lower)) return 'audio'
  return 'video' // default guess for unknown URLs
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function MediaIcon({ type }: { type: MediaType }) {
  if (type === 'image') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  )
  if (type === 'audio') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  )
  if (type === 'video') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function typeLabel(type: MediaType) {
  return { image: 'Image', audio: 'Audio', video: 'Video', file: 'File' }[type]
}

// ── URL Link Tab ──────────────────────────────────────────────────────────

function LinkTab({ media, onChange }: MediaUploaderProps) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<MediaType>('video')
  const [error, setError] = useState('')

  const handleUrlChange = (val: string) => {
    setUrl(val)
    setError('')
    if (val) {
      const guessed = guessMediaTypeFromUrl(val)
      setType(guessed)
      if (!name) {
        try {
          const pathname = new URL(val).pathname
          const parts = pathname.split('/')
          const last = parts[parts.length - 1]
          if (last) setName(decodeURIComponent(last))
        } catch { /* ignore */ }
      }
    }
  }

  const handleAdd = () => {
    if (!url.trim()) { setError('Please enter a URL.'); return }
    try { new URL(url.trim()) } catch { setError('Please enter a valid URL.'); return }
    onChange([...media, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      source: 'url',
      name: name.trim() || url.trim(),
      mimeType: type === 'audio' ? 'audio/*' : type === 'video' ? 'video/*' : type === 'image' ? 'image/*' : 'application/octet-stream',
      dataUrl: url.trim(),
      size: 0,
    }])
    setUrl(''); setName(''); setError('')
  }

  return (
    <div className="space-y-3">
      {/* URL input */}
      <div>
        <label className="block font-ui text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-muted)' }}>
          Media URL
        </label>
        <input
          type="url"
          value={url}
          onChange={e => handleUrlChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="https://example.com/audio.mp3  or  https://youtu.be/..."
          className="w-full px-3 py-2.5 rounded-xl border text-sm font-ui focus:outline-none focus:ring-2 transition-all"
          style={{ background: 'var(--t-input-bg)', borderColor: 'var(--t-border)', color: 'var(--t-text)', '--tw-ring-color': 'var(--t-accent)' } as React.CSSProperties}
        />
      </div>

      {/* Row: type selector + label + Add */}
      <div className="flex gap-2">
        {/* Type */}
        <div className="shrink-0">
          <label className="block font-ui text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-muted)' }}>Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as MediaType)}
            className="px-3 py-2 rounded-xl border text-sm font-ui focus:outline-none"
            style={{ background: 'var(--t-input-bg)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}
          >
            <option value="audio">🎵 Audio</option>
            <option value="video">🎬 Video</option>
            <option value="image">🖼️ Image</option>
          </select>
        </div>

        {/* Label */}
        <div className="flex-1">
          <label className="block font-ui text-xs font-medium mb-1.5" style={{ color: 'var(--t-text-muted)' }}>Label (optional)</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Background music"
            className="w-full px-3 py-2 rounded-xl border text-sm font-ui focus:outline-none"
            style={{ background: 'var(--t-input-bg)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}
          />
        </div>

        {/* Add button */}
        <div className="shrink-0 flex flex-col justify-end">
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 rounded-xl text-sm font-ui font-medium transition-colors"
            style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}
          >
            + Add
          </button>
        </div>
      </div>

      {error && <p className="font-ui text-xs" style={{ color: '#ef4444' }}>⚠️ {error}</p>}

      {/* Hints */}
      <div className="rounded-xl border px-3 py-2.5 space-y-1" style={{ background: 'color-mix(in srgb, var(--t-surface) 40%, transparent)', borderColor: 'var(--t-border)' }}>
        <p className="font-ui text-xs font-medium" style={{ color: 'var(--t-text)' }}>Supported URL types:</p>
        <p className="font-ui text-xs" style={{ color: 'var(--t-text-muted)' }}>🎵 Audio — .mp3, .wav, .ogg, .flac, .aac direct links</p>
        <p className="font-ui text-xs" style={{ color: 'var(--t-text-muted)' }}>🎬 Video — .mp4, .webm direct links · YouTube · Vimeo</p>
        <p className="font-ui text-xs" style={{ color: 'var(--t-text-muted)' }}>🖼️ Image — any direct image URL</p>
        <p className="font-ui text-xs opacity-60" style={{ color: 'var(--t-text-muted)' }}>YouTube/Vimeo will be embedded as iframes. Direct files use native players.</p>
      </div>
    </div>
  )
}

// ── Upload Tab ────────────────────────────────────────────────────────────

function UploadTab({ media, onChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const newErrors: string[] = []
    const newMedia: MediaAttachment[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        newErrors.push(`"${file.name}" exceeds ${MAX_FILE_MB} MB — use a URL link instead.`)
        continue
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      newMedia.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: getMediaType(file.type),
        source: 'upload',
        name: file.name,
        mimeType: file.type,
        dataUrl,
        size: file.size,
      })
    }
    setErrors(newErrors)
    if (newMedia.length) onChange([...media, ...newMedia])
  }, [media, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files)
  }, [processFiles])

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-all text-center"
        style={{
          borderColor: dragging ? 'var(--t-accent)' : 'var(--t-border)',
          background: dragging ? 'color-mix(in srgb, var(--t-accent) 6%, transparent)' : 'transparent',
        }}
      >
        <input ref={inputRef} type="file" multiple accept="image/*,.pdf,.txt,.md,.csv" className="hidden"
          onChange={e => e.target.files && processFiles(e.target.files)} />
        <div className="flex flex-col items-center gap-2" style={{ color: 'var(--t-text-muted)' }}>
          <span className="text-3xl">📁</span>
          <p className="font-ui text-sm font-medium" style={{ color: 'var(--t-text)' }}>
            Drop files here or <span style={{ color: 'var(--t-accent)' }}>browse</span>
          </p>
          <p className="font-ui text-xs">Images, PDF, Text — up to {MAX_FILE_MB} MB each</p>
          <p className="font-ui text-xs opacity-50">For audio/video, use the Link tab to keep URL size small</p>
        </div>
      </div>
      {errors.map((err, i) => (
        <p key={i} className="font-ui text-xs px-3 py-2 rounded-lg border" style={{ color: '#ef4444', background: '#fef2f2', borderColor: '#fecaca' }}>⚠️ {err}</p>
      ))}
    </div>
  )
}

// ── Main MediaUploader ────────────────────────────────────────────────────

export function MediaUploader({ media, onChange }: MediaUploaderProps) {
  const [tab, setTab] = useState<'link' | 'upload'>('link')

  const removeMedia = (id: string) => onChange(media.filter(m => m.id !== id))

  const tabs = [
    { id: 'link' as const, label: '🔗 Link URL', desc: 'Audio, Video, Image' },
    { id: 'upload' as const, label: '📁 Upload File', desc: 'Images, PDF, Text' },
  ]

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--t-border)', background: 'var(--t-surface)' }}>
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--t-border)', background: 'var(--t-toolbar-bg)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="flex-1 px-4 py-3 text-left transition-all"
            style={{
              background: tab === t.id ? 'var(--t-surface)' : 'transparent',
              borderBottom: tab === t.id ? `2px solid var(--t-accent)` : '2px solid transparent',
            }}
          >
            <p className="font-ui text-sm font-medium" style={{ color: tab === t.id ? 'var(--t-accent)' : 'var(--t-text-muted)' }}>{t.label}</p>
            <p className="font-ui text-xs opacity-60" style={{ color: 'var(--t-text-muted)' }}>{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tab === 'link'
          ? <LinkTab media={media} onChange={onChange} />
          : <UploadTab media={media} onChange={onChange} />
        }
      </div>

      {/* Attached items list */}
      {media.length > 0 && (
        <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: 'var(--t-border)' }}>
          <p className="font-ui text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--t-text-muted)' }}>
            Attached ({media.length})
          </p>
          {media.map(m => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 border"
              style={{ background: 'color-mix(in srgb, var(--t-toolbar-bg) 60%, transparent)', borderColor: 'var(--t-border)' }}>
              {/* Preview / icon */}
              <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ background: 'var(--t-toolbar-bg)' }}>
                {m.type === 'image' && m.source === 'upload'
                  ? <img src={m.dataUrl} alt={m.name} className="w-full h-full object-cover" />
                  : <span style={{ color: 'var(--t-accent)' }}><MediaIcon type={m.type} /></span>
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-ui text-sm font-medium truncate" style={{ color: 'var(--t-text)' }}>{m.name}</p>
                <p className="font-ui text-xs" style={{ color: 'var(--t-text-muted)' }}>
                  {typeLabel(m.type)} · {m.source === 'url' ? '🔗 URL embed' : `📁 ${formatBytes(m.size)}`}
                </p>
              </div>
              {/* Remove */}
              <button type="button" onClick={() => removeMedia(m.id)}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text-muted)' }} title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
