import { useState } from 'react'
import type { MediaAttachment } from '../../utils/encode'

interface MediaRendererProps { media: MediaAttachment[] }

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Convert YouTube/Vimeo watch URLs to embed URLs
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    // Dailymotion
    const dmMatch = url.match(/dailymotion\.com\/video\/([a-z0-9]+)/i)
    if (dmMatch) return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`
    return null
  } catch { return null }
}

function isEmbedPlatform(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/.test(url)
}

// ── Cards ──────────────────────────────────────────────────────────────────

function ImageCard({ m }: { m: MediaAttachment }) {
  const [lightbox, setLightbox] = useState(false)
  const src = m.dataUrl // works for both base64 and remote URL
  return (
    <>
      <div className="rounded-2xl overflow-hidden cursor-zoom-in border"
        style={{ borderColor: 'var(--t-border)' }}
        onClick={() => setLightbox(true)}>
        <img src={src} alt={m.name} className="w-full object-cover max-h-[480px]" style={{ display: 'block' }} />
        <div className="px-4 py-2.5 border-t text-xs font-ui flex items-center gap-2"
          style={{ borderColor: 'var(--t-border)', color: 'var(--t-text-muted)', background: 'var(--t-surface)' }}>
          🖼️ <span className="truncate">{m.name}</span>
          {m.source === 'upload' && <span>· {formatBytes(m.size)}</span>}
          <span style={{ color: 'var(--t-accent)', marginLeft: 'auto' }}>Click to enlarge</span>
        </div>
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          style={{ background: 'rgba(0,0,0,0.92)' }} onClick={() => setLightbox(false)}>
          <img src={src} alt={m.name} className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </>
  )
}

function AudioCard({ m }: { m: MediaAttachment }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-ui text-sm font-medium truncate" style={{ color: 'var(--t-text)' }}>{m.name}</p>
          <p className="font-ui text-xs" style={{ color: 'var(--t-text-muted)' }}>
            {m.source === 'url' ? '🔗 Streaming' : formatBytes(m.size)}
          </p>
        </div>
      </div>
      <audio controls className="w-full" style={{ accentColor: 'var(--t-accent)' }}>
        <source src={m.dataUrl} type={m.source === 'upload' ? m.mimeType : undefined} />
        Your browser does not support audio playback.
      </audio>
    </div>
  )
}

function VideoCard({ m }: { m: MediaAttachment }) {
  const embedUrl = m.source === 'url' ? toEmbedUrl(m.dataUrl) : null
  const isEmbed = embedUrl !== null

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--t-border)' }}>
      {isEmbed ? (
        <div className="relative" style={{ paddingTop: '56.25%' /* 16:9 */ }}>
          <iframe
            src={embedUrl!}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ border: 'none' }}
            title={m.name}
          />
        </div>
      ) : (
        <video controls className="w-full max-h-[400px]" style={{ display: 'block', background: '#000' }}>
          <source src={m.dataUrl} type={m.source === 'upload' ? m.mimeType : undefined} />
          Your browser does not support video playback.
        </video>
      )}
      <div className="px-4 py-2.5 border-t text-xs font-ui flex items-center gap-2"
        style={{ borderColor: 'var(--t-border)', color: 'var(--t-text-muted)', background: 'var(--t-surface)' }}>
        🎬 <span className="truncate">{m.name}</span>
        {m.source === 'upload' && <span>· {formatBytes(m.size)}</span>}
        {m.source === 'url' && isEmbed && <span>· Embedded</span>}
        {m.source === 'url' && !isEmbed && <span>· Streaming</span>}
      </div>
    </div>
  )
}

function FileCard({ m }: { m: MediaAttachment }) {
  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = m.dataUrl; a.download = m.name; a.click()
  }
  return (
    <div className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: 'var(--t-toolbar-bg)' }}>
        {m.mimeType === 'application/pdf' ? '📄' : '📎'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm font-medium truncate" style={{ color: 'var(--t-text)' }}>{m.name}</p>
        <p className="font-ui text-xs" style={{ color: 'var(--t-text-muted)' }}>{m.mimeType} · {formatBytes(m.size)}</p>
      </div>
      <button type="button" onClick={handleDownload}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-medium"
        style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download
      </button>
    </div>
  )
}

// ── Renderer ───────────────────────────────────────────────────────────────

export function MediaRenderer({ media }: MediaRendererProps) {
  if (!media || media.length === 0) return null

  const images = media.filter(m => m.type === 'image')
  const audios = media.filter(m => m.type === 'audio')
  const videos = media.filter(m => m.type === 'video')
  const files  = media.filter(m => m.type === 'file')

  return (
    <div className="mt-10 space-y-8">
      {images.length > 0 && (
        <section>
          <h3 className="font-ui text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--t-text-muted)' }}>
            Images ({images.length})
          </h3>
          <div className={`grid gap-4 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {images.map(m => <ImageCard key={m.id} m={m} />)}
          </div>
        </section>
      )}
      {audios.length > 0 && (
        <section>
          <h3 className="font-ui text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--t-text-muted)' }}>
            Audio ({audios.length})
          </h3>
          <div className="space-y-3">
            {audios.map(m => <AudioCard key={m.id} m={m} />)}
          </div>
        </section>
      )}
      {videos.length > 0 && (
        <section>
          <h3 className="font-ui text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--t-text-muted)' }}>
            Videos ({videos.length})
          </h3>
          <div className="space-y-4">
            {videos.map(m => <VideoCard key={m.id} m={m} />)}
          </div>
        </section>
      )}
      {files.length > 0 && (
        <section>
          <h3 className="font-ui text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--t-text-muted)' }}>
            Files ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map(m => <FileCard key={m.id} m={m} />)}
          </div>
        </section>
      )}
    </div>
  )
}
