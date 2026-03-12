import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { useState } from 'react'

interface MarkdownRendererProps {
  content: string
  isHtml?: boolean
}

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

// ── Parse custom media divs out of HTML ───────────────────────────────────

interface MediaNode {
  type: 'audio' | 'video' | 'file'
  src: string
  label: string
  sourcetype?: string
  mimetype?: string
  filesize?: string
}

function parseMediaDiv(div: Element): MediaNode | null {
  const dataType = div.getAttribute('data-type')
  const src = div.getAttribute('src') || div.getAttribute('data-src') || ''
  const label = div.getAttribute('label') || div.getAttribute('data-label') || ''
  const sourcetype = div.getAttribute('sourcetype') || div.getAttribute('data-sourcetype') || ''
  const mimetype = div.getAttribute('mimetype') || div.getAttribute('data-mimetype') || ''
  const filesize = div.getAttribute('filesize') || div.getAttribute('data-filesize') || ''
  if (dataType === 'audio-block') return { type: 'audio', src, label, sourcetype }
  if (dataType === 'video-block') return { type: 'video', src, label, sourcetype }
  if (dataType === 'file-block') return { type: 'file', src, label, mimetype, filesize }
  return null
}

// ── Render the HTML with replaced media nodes ──────────────────────────────

function AudioView({ src, label, sourcetype }: { src: string; label: string; sourcetype?: string }) {
  return (
    <div className="my-4 rounded-xl border p-4" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        <p className="font-ui text-sm font-medium truncate" style={{ color: 'var(--t-text)' }}>{label || src}</p>
      </div>
      <audio controls className="w-full" style={{ accentColor: 'var(--t-accent)' }}>
        <source src={src} type={sourcetype || undefined} />
        Your browser does not support audio.
      </audio>
    </div>
  )
}

function VideoView({ src, label }: { src: string; label: string }) {
  const embedUrl = toEmbedUrl(src)
  return (
    <div className="my-4 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--t-border)' }}>
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
      {label && (
        <div className="px-4 py-2.5 border-t text-xs font-ui"
          style={{ borderColor: 'var(--t-border)', color: 'var(--t-text-muted)', background: 'var(--t-surface)' }}>
          🎬 {label}
        </div>
      )}
    </div>
  )
}

function FileView({ src, label, mimetype, filesize }: { src: string; label: string; mimetype?: string; filesize?: string }) {
  return (
    <div className="my-4 rounded-xl border p-4 flex items-center gap-4"
      style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: 'var(--t-toolbar-bg)' }}>
        {mimetype === 'application/pdf' ? '📄' : '📎'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm font-medium truncate" style={{ color: 'var(--t-text)' }}>{label || 'File'}</p>
        {(mimetype || filesize) && (
          <p className="font-ui text-xs" style={{ color: 'var(--t-text-muted)' }}>
            {[mimetype, filesize].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <a href={src} download={label || 'file'}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-medium"
        style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download
      </a>
    </div>
  )
}

// ── HTML renderer that replaces media divs with React components ───────────

function HtmlRenderer({ html }: { html: string }) {
  // Split HTML on media block divs and render them as React
  // We use a DOM parser to walk through the nodes
  const parts: React.ReactNode[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const body = doc.body

  let key = 0
  const walk = (node: Node): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent
    if (node.nodeType !== Node.ELEMENT_NODE) return null
    const el = node as Element

    // Check for media blocks
    const dataType = el.getAttribute('data-type')
    if (dataType === 'audio-block') {
      const m = parseMediaDiv(el)
      if (m && m.type === 'audio') return <AudioView key={key++} src={m.src} label={m.label} sourcetype={m.sourcetype} />
    }
    if (dataType === 'video-block') {
      const m = parseMediaDiv(el)
      if (m && m.type === 'video') return <VideoView key={key++} src={m.src} label={m.label} />
    }
    if (dataType === 'file-block') {
      const m = parseMediaDiv(el)
      if (m && m.type === 'file') return <FileView key={key++} src={m.src} label={m.label} mimetype={m.mimetype} filesize={m.filesize} />
    }

    // Recurse into children — serialize non-media nodes back to HTML for dangerouslySetInnerHTML
    // For simplicity, collect runs of "normal" HTML and media nodes, then render
    const childParts: React.ReactNode[] = []
    let htmlBuffer = ''

    for (const child of Array.from(el.childNodes)) {
      const childEl = child as Element
      const childDataType = childEl.getAttribute?.('data-type')

      if (childDataType === 'audio-block' || childDataType === 'video-block' || childDataType === 'file-block') {
        // Flush buffered HTML first
        if (htmlBuffer.trim()) {
          childParts.push(
            <div key={key++} className="markdown-body" dangerouslySetInnerHTML={{ __html: htmlBuffer }} />
          )
          htmlBuffer = ''
        }
        const m = parseMediaDiv(childEl)
        if (m) {
          if (m.type === 'audio') childParts.push(<AudioView key={key++} src={m.src} label={m.label} sourcetype={m.sourcetype} />)
          if (m.type === 'video') childParts.push(<VideoView key={key++} src={m.src} label={m.label} />)
          if (m.type === 'file') childParts.push(<FileView key={key++} src={m.src} label={m.label} mimetype={m.mimetype} filesize={m.filesize} />)
        }
      } else {
        htmlBuffer += (child as Element).outerHTML || child.textContent || ''
      }
    }

    if (htmlBuffer.trim()) {
      childParts.push(
        <div key={key++} className="markdown-body" dangerouslySetInnerHTML={{ __html: htmlBuffer }} />
      )
    }

    return <>{childParts}</>
  }

  // Check if the body itself has any media blocks
  const hasMedia = body.querySelector('[data-type="audio-block"],[data-type="video-block"],[data-type="file-block"]')

  if (!hasMedia) {
    return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
  }

  const result = walk(body)
  return <>{result}</>
}

// ── Public component ───────────────────────────────────────────────────────

export function MarkdownRenderer({ content, isHtml = false }: MarkdownRendererProps) {
  if (isHtml) {
    return <HtmlRenderer html={content} />
  }

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
