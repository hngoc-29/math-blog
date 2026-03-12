import { useState } from 'react'
import { RichEditor } from '../components/Editor'
import { QRCodeCard } from '../components/QRCodeCard'
import { ThemePicker } from '../components/ThemePicker'
import { buildShareURL, estimateSize } from '../utils/encode'
import { useTheme } from '../context/ThemeContext'

export function CreatePage() {
  const { config, theme } = useTheme()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const sizeKB = estimateSize({ title, content, theme })
  const sizeWarning = sizeKB > 8000
    ? 'URL may be too long for some browsers (> 8 MB)'
    : sizeKB > 4000
    ? 'URL is getting large — consider fewer or smaller embedded files'
    : null

  const handleGenerate = async () => {
    setError(null)
    if (!title.trim()) { setError('Please enter a title.'); return }
    const isEmpty = !content || content === '<p></p>' || content.replace(/<[^>]+>/g, '').trim() === ''
    if (isEmpty) { setError('Please write some content.'); return }
    setGenerating(true)
    try {
      const url = await buildShareURL({ title: title.trim(), content, theme })
      setShareUrl(url)
    } catch (e) {
      setError('Failed to generate link. Content may be too large.')
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--t-bg)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.08]"
          style={{ background: `radial-gradient(circle, ${config.accent} 0%, transparent 70%)` }} />
        <div className="absolute top-1/2 -left-24 w-64 h-64 rounded-full opacity-[0.04]"
          style={{ background: `radial-gradient(circle, ${config.text} 0%, transparent 70%)` }} />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-20 backdrop-blur-md border-b" style={{ background: 'var(--t-nav-bg)', borderColor: 'var(--t-border)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--t-accent)' }}>✦</span>
            <span className="font-ui text-sm font-semibold" style={{ color: 'var(--t-text)' }}>ShareLink</span>
          </div>
          <ThemePicker />
        </div>
      </nav>

      <div className="relative max-w-3xl mx-auto px-4 py-10 md:py-16">
        <header className="mb-10 fade-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-3" style={{ color: 'var(--t-text)' }}>
            Write Once,{' '}
            <span style={{ color: 'var(--t-accent)' }}>Share Everywhere</span>
          </h1>
          <p className="font-body text-lg leading-relaxed max-w-xl" style={{ color: 'var(--t-text-muted)' }}>
            Compose a rich message with formatting, math, and media — then generate a link. No backend needed.
          </p>
        </header>

        <div className="space-y-5">
          {/* Title */}
          <div className="fade-up fade-up-1">
            <label htmlFor="title" className="block font-ui text-sm font-medium mb-2" style={{ color: 'var(--t-text)' }}>Title</label>
            <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Give your message a title…"
              className="w-full px-4 py-3.5 rounded-xl border text-xl placeholder:opacity-30 focus:outline-none transition-all shadow-sm font-display"
              style={{ background: 'var(--t-input-bg)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }} />
          </div>

          {/* Editor */}
          <div className="fade-up fade-up-2">
            <label className="block font-ui text-sm font-medium mb-2" style={{ color: 'var(--t-text)' }}>
              Content
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--t-text-muted)' }}>
                Click 📎 Media in the toolbar to insert audio, video, images or files at cursor
              </span>
            </label>
            <RichEditor content={content} onChange={setContent} />
          </div>

          {/* Tips */}
          <div className="fade-up fade-up-2 rounded-xl border px-4 py-3"
            style={{ background: 'color-mix(in srgb, var(--t-surface) 60%, transparent)', borderColor: 'var(--t-border)' }}>
            <p className="font-ui text-xs leading-relaxed" style={{ color: 'var(--t-text-muted)' }}>
              <strong style={{ color: 'var(--t-text)' }}>💡 Tips:</strong>{' '}
              Use <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>$E=mc^2$</code> for inline math,{' '}
              <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>$$...$$</code> for display math.
              Use <strong style={{ color: 'var(--t-text)' }}>📎 Media</strong> in the toolbar to embed audio, video, files at any cursor position.
            </p>
          </div>

          {/* Size indicator */}
          {sizeKB > 50 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border font-ui text-xs"
              style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)', color: 'var(--t-text-muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Estimated URL size: <strong style={{ color: sizeWarning ? '#ef4444' : 'var(--t-accent)' }}>{sizeKB} KB</strong>
              {sizeWarning && <span style={{ color: '#ef4444' }}>— {sizeWarning}</span>}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border px-4 py-3" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
              <p className="font-ui text-sm" style={{ color: '#dc2626' }}>{error}</p>
            </div>
          )}

          {/* Generate */}
          <div className="fade-up fade-up-3">
            <button type="button" onClick={handleGenerate} disabled={generating}
              className="w-full py-4 rounded-xl font-ui font-medium text-base active:scale-[0.99] transition-all duration-150 shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)', boxShadow: `0 8px 24px ${config.accent}28` }}>
              {generating ? (
                <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Generating…</>
              ) : (
                <><span>✦</span>Generate Shareable Link</>
              )}
            </button>
          </div>

          {shareUrl && <QRCodeCard url={shareUrl} />}
        </div>

        <footer className="mt-16 pt-8 border-t text-center" style={{ borderColor: 'var(--t-border)' }}>
          <p className="font-ui text-xs" style={{ color: 'var(--t-text-muted)' }}>
            100% client-side · No backend · No cookies · Everything lives in the URL
          </p>
        </footer>
      </div>
    </div>
  )
}
