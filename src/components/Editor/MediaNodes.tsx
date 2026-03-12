import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

// ── Helpers ────────────────────────────────────────────────────────────────

function toEmbedUrl(url: string): string | null {
  try {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    const dmMatch = url.match(/dailymotion\.com\/video\/([a-z0-9]+)/i)
    if (dmMatch) return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`
    return null
  } catch { return null }
}

function isEmbedPlatform(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/.test(url)
}

// ── Audio Node ─────────────────────────────────────────────────────────────

function AudioNodeView({ node, deleteNode }: NodeViewProps) {
  const { src, label, sourcetype } = node.attrs
  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className="my-3 rounded-xl border p-3"
        style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}
        data-drag-handle
      >
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: 'var(--t-accent)' }}>🎵</span>
          <span className="font-ui text-xs truncate flex-1" style={{ color: 'var(--t-text-muted)' }}>
            {label || src}
          </span>
          <button
            type="button"
            onClick={deleteNode}
            className="w-5 h-5 rounded flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--t-text-muted)' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <audio controls className="w-full" style={{ accentColor: 'var(--t-accent)' }}>
          <source src={src} type={sourcetype || undefined} />
        </audio>
      </div>
    </NodeViewWrapper>
  )
}

export const AudioBlock = Node.create({
  name: 'audioBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: '' },
      label: { default: '' },
      sourcetype: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'audio-block' }, { tag: 'div[data-type="audio-block"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'audio-block', class: 'media-audio-block' })]
  },
  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView)
  },
})

// ── Video Node ─────────────────────────────────────────────────────────────

function VideoNodeView({ node, deleteNode }: NodeViewProps) {
  const { src, label } = node.attrs
  const embedUrl = toEmbedUrl(src)

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className="my-3 rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--t-border)' }}
        data-drag-handle
      >
        {/* Delete handle */}
        <div className="flex items-center gap-2 px-3 py-2 border-b"
          style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
          <span style={{ color: 'var(--t-accent)' }}>🎬</span>
          <span className="font-ui text-xs truncate flex-1" style={{ color: 'var(--t-text-muted)' }}>{label || src}</span>
          <button type="button" onClick={deleteNode}
            className="w-5 h-5 rounded flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--t-text-muted)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {embedUrl ? (
          <div className="relative" style={{ paddingTop: '56.25%', background: '#000' }}>
            <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{ border: 'none' }} title={label || 'Video'} />
          </div>
        ) : (
          <video controls className="w-full max-h-96" style={{ display: 'block', background: '#000' }}>
            <source src={src} />
          </video>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const VideoBlock = Node.create({
  name: 'videoBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: '' },
      label: { default: '' },
      sourcetype: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="video-block"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'video-block', class: 'media-video-block' })]
  },
  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView)
  },
})

// ── File Node ──────────────────────────────────────────────────────────────

function FileNodeView({ node, deleteNode }: NodeViewProps) {
  const { src, label, mimetype, filesize } = node.attrs

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = src; a.download = label || 'file'; a.click()
  }

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className="my-3 rounded-xl border p-3 flex items-center gap-3"
        style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}
        data-drag-handle
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ background: 'var(--t-toolbar-bg)' }}>
          {mimetype === 'application/pdf' ? '📄' : '📎'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-ui text-sm font-medium truncate" style={{ color: 'var(--t-text)' }}>{label || 'File'}</p>
          {filesize && <p className="font-ui text-xs" style={{ color: 'var(--t-text-muted)' }}>{mimetype} · {filesize}</p>}
        </div>
        <button type="button" onClick={handleDownload}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-ui font-medium"
          style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}>
          ↓ Download
        </button>
        <button type="button" onClick={deleteNode}
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--t-text-muted)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </NodeViewWrapper>
  )
}

export const FileBlock = Node.create({
  name: 'fileBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: '' },
      label: { default: '' },
      mimetype: { default: '' },
      filesize: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="file-block"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'file-block', class: 'media-file-block' })]
  },
  addNodeView() {
    return ReactNodeViewRenderer(FileNodeView)
  },
})
