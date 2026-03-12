import { useState, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/react'

interface MediaInsertModalProps {
  editor: Editor
  onClose: () => void
}

type Tab = 'link' | 'upload'
type MediaKind = 'audio' | 'video' | 'image' | 'file'

const MAX_FILE_MB = 2
const MAX_BYTES = MAX_FILE_MB * 1024 * 1024

function guessKind(url: string): MediaKind {
  const lower = url.toLowerCase().split('?')[0]
  if (/\.(mp3|wav|ogg|flac|aac|m4a|opus)$/.test(lower)) return 'audio'
  if (/\.(mp4|webm|ogv|mov|mkv|m4v)$/.test(lower)) return 'video'
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/.test(lower)) return 'image'
  if (/youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/.test(lower)) return 'video'
  if (/soundcloud\.com/.test(lower)) return 'audio'
  return 'video'
}

function guessKindFromMime(mime: string): MediaKind {
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'
  return 'file'
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function insertMedia(editor: Editor, kind: MediaKind, src: string, label: string, extra: { mimeType?: string; fileSize?: number } = {}) {
  if (kind === 'image') {
    editor.chain().focus().setImage({ src, alt: label, title: label }).run()
    return
  }
  if (kind === 'audio') {
    editor.chain().focus().insertContent({
      type: 'audioBlock',
      attrs: { src, label, sourcetype: extra.mimeType || '' },
    }).run()
    return
  }
  if (kind === 'video') {
    editor.chain().focus().insertContent({
      type: 'videoBlock',
      attrs: { src, label, sourcetype: extra.mimeType || '' },
    }).run()
    return
  }
  if (kind === 'file') {
    editor.chain().focus().insertContent({
      type: 'fileBlock',
      attrs: {
        src,
        label,
        mimetype: extra.mimeType || '',
        filesize: extra.fileSize ? formatBytes(extra.fileSize) : '',
      },
    }).run()
  }
}

// ── Link tab ──────────────────────────────────────────────────────────────

function LinkTab({ onInsert }: { onInsert: (kind: MediaKind, src: string, label: string) => void }) {
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [kind, setKind] = useState<MediaKind>('video')
  const [error, setError] = useState('')

  const handleUrlChange = (v: string) => {
    setUrl(v); setError('')
    if (v) {
      setKind(guessKind(v))
      if (!label) {
        try {
          const p = new URL(v).pathname.split('/').filter(Boolean).pop()
          if (p) setLabel(decodeURIComponent(p))
        } catch {}
      }
    }
  }

  const handle = () => {
    if (!url.trim()) { setError('Enter a URL'); return }
    try { new URL(url.trim()) } catch { setError('Invalid URL'); return }
    onInsert(kind, url.trim(), label.trim() || url.trim())
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block font-ui text-xs font-medium mb-1" style={{ color: 'var(--t-text-muted)' }}>URL</label>
        <input type="url" value={url} onChange={e => handleUrlChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="https://… (mp3, mp4, YouTube, Vimeo, image…)"
          autoFocus
          className="w-full px-3 py-2 rounded-lg border text-sm font-ui focus:outline-none transition-all"
          style={{ background: 'var(--t-input-bg)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }} />
      </div>
      <div className="flex gap-2">
        <div className="shrink-0">
          <label className="block font-ui text-xs font-medium mb-1" style={{ color: 'var(--t-text-muted)' }}>Type</label>
          <select value={kind} onChange={e => setKind(e.target.value as MediaKind)}
            className="px-2 py-2 rounded-lg border text-sm font-ui focus:outline-none"
            style={{ background: 'var(--t-input-bg)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}>
            <option value="audio">🎵 Audio</option>
            <option value="video">🎬 Video</option>
            <option value="image">🖼️ Image</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block font-ui text-xs font-medium mb-1" style={{ color: 'var(--t-text-muted)' }}>Caption (optional)</label>
          <input type="text" value={label} onChange={e => setLabel(e.target.value)}
            placeholder="Label or description"
            className="w-full px-3 py-2 rounded-lg border text-sm font-ui focus:outline-none"
            style={{ background: 'var(--t-input-bg)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }} />
        </div>
      </div>
      {error && <p className="text-xs font-ui" style={{ color: '#ef4444' }}>⚠️ {error}</p>}
      <div className="rounded-lg border px-3 py-2 text-xs font-ui space-y-0.5"
        style={{ background: 'color-mix(in srgb, var(--t-surface) 50%, transparent)', borderColor: 'var(--t-border)', color: 'var(--t-text-muted)' }}>
        <p>🎵 .mp3 .wav .ogg .aac — native audio player</p>
        <p>🎬 .mp4 .webm · YouTube · Vimeo — embedded player</p>
        <p>🖼️ Any direct image URL</p>
      </div>
      <button type="button" onClick={handle}
        className="w-full py-2.5 rounded-xl text-sm font-ui font-medium transition-colors"
        style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}>
        Insert at cursor
      </button>
    </div>
  )
}

// ── Upload tab ─────────────────────────────────────────────────────────────

function UploadTab({ onInsert }: { onInsert: (kind: MediaKind, src: string, label: string, extra?: { mimeType?: string; fileSize?: number }) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const processFile = useCallback(async (file: File) => {
    setError('')
    if (file.size > MAX_BYTES) {
      setError(`File exceeds ${MAX_FILE_MB} MB. Use a URL link for large media.`)
      return
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result as string)
      r.onerror = rej
      r.readAsDataURL(file)
    })
    const kind = guessKindFromMime(file.type)
    onInsert(kind, dataUrl, file.name, { mimeType: file.type, fileSize: file.size })
  }, [onInsert])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-xl px-6 py-10 cursor-pointer text-center transition-all"
        style={{
          borderColor: dragging ? 'var(--t-accent)' : 'var(--t-border)',
          background: dragging ? 'color-mix(in srgb, var(--t-accent) 8%, transparent)' : 'transparent',
        }}>
        <input ref={inputRef} type="file"
          accept="image/*,audio/*,video/*,.pdf,.txt,.md,.csv"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
        <div className="flex flex-col items-center gap-2" style={{ color: 'var(--t-text-muted)' }}>
          <span className="text-3xl">📁</span>
          <p className="font-ui text-sm font-medium" style={{ color: 'var(--t-text)' }}>
            Drop a file or <span style={{ color: 'var(--t-accent)' }}>browse</span>
          </p>
          <p className="font-ui text-xs">Images, Audio, Video, PDF — up to {MAX_FILE_MB} MB</p>
        </div>
      </div>
      {error && <p className="text-xs font-ui px-3 py-2 rounded-lg border" style={{ color: '#ef4444', background: '#fef2f2', borderColor: '#fecaca' }}>⚠️ {error}</p>}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────

export function MediaInsertModal({ editor, onClose }: MediaInsertModalProps) {
  const [tab, setTab] = useState<Tab>('link')

  const handleInsert = (kind: MediaKind, src: string, label: string, extra?: { mimeType?: string; fileSize?: number }) => {
    insertMedia(editor, kind, src, label, extra)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--t-border)', background: 'var(--t-toolbar-bg)' }}>
          <h2 className="font-ui font-semibold text-sm" style={{ color: 'var(--t-text)' }}>Insert Media at Cursor</h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--t-text)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--t-border)' }}>
          {(['link', 'upload'] as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-sm font-ui font-medium transition-all"
              style={{
                borderBottom: tab === t ? `2px solid var(--t-accent)` : '2px solid transparent',
                color: tab === t ? 'var(--t-accent)' : 'var(--t-text-muted)',
                background: 'transparent',
                marginBottom: '-1px',
              }}>
              {t === 'link' ? '🔗 Link URL' : '📁 Upload File'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === 'link'
            ? <LinkTab onInsert={handleInsert} />
            : <UploadTab onInsert={handleInsert} />
          }
        </div>
      </div>
    </div>
  )
}
