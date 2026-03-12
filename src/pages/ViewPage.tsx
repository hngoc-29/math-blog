import { useState, useEffect } from 'react'
import type { Payload } from '../utils/encode'
import { MarkdownRenderer } from '../components/MarkdownRenderer'

import { ThemePicker } from '../components/ThemePicker'
import { useTheme, type Theme, THEMES } from '../context/ThemeContext'

interface ViewPageProps { payload: Payload }

export function ViewPage({ payload }: ViewPageProps) {
  const { setTheme, config } = useTheme()
  const [copied, setCopied] = useState(false)

  // Apply theme from payload when page loads
  useEffect(() => {
    if (payload.theme && payload.theme in THEMES) {
      setTheme(payload.theme as Theme)
    }
  }, [payload.theme, setTheme])

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedDate = payload.createdAt
    ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(payload.createdAt))
    : null

  const isHtml = payload.content.trimStart().startsWith('<')

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--t-bg)' }}>
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-64 opacity-[0.06] rounded-full"
          style={{ background: `radial-gradient(ellipse, ${config.accent} 0%, transparent 70%)` }} />
      </div>

      {/* Top bar */}
      <nav className="sticky top-0 z-10 backdrop-blur-md border-b" style={{ background: 'var(--t-nav-bg)', borderColor: 'var(--t-border)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 group shrink-0">
            <span style={{ color: 'var(--t-accent)' }}>✦</span>
            <span className="font-ui text-sm group-hover:opacity-70 transition-opacity" style={{ color: 'var(--t-text-muted)' }}>ShareLink</span>
          </a>
          <div className="flex items-center gap-2">
            <ThemePicker />
            <button type="button" onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-ui font-medium transition-all border"
              style={copied
                ? { background: '#dcfce7', borderColor: '#86efac', color: '#15803d' }
                : { background: 'var(--t-surface)', borderColor: 'var(--t-border)', color: 'var(--t-text-muted)' }}>
              {copied ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Copy link</>
              )}
            </button>
            <a href="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-ui font-medium transition-colors"
              style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create new
            </a>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="relative max-w-3xl mx-auto px-4 py-12 md:py-20">
        {formattedDate && (
          <p className="fade-up font-ui text-xs uppercase tracking-widest mb-6" style={{ color: 'var(--t-text-muted)' }}>
            {formattedDate}
          </p>
        )}

        <h1 className="fade-up fade-up-1 font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] mb-8" style={{ color: 'var(--t-text)' }}>
          {payload.title}
        </h1>

        {/* Divider */}
        <div className="fade-up fade-up-2 flex items-center gap-4 mb-10">
          <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${config.accent}99, transparent)` }} />
          <span style={{ color: 'var(--t-accent)' }}>✦</span>
          <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${config.accent}99, transparent)` }} />
        </div>

        {/* Content */}
        <div className="fade-up fade-up-3">
          <MarkdownRenderer content={payload.content} isHtml={isHtml} />
        </div>




        {/* Footer card */}
        <div className="fade-up fade-up-4 mt-16 rounded-2xl border px-6 py-5" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--t-accent)' }}>✦</span>
            <div>
              <p className="font-ui text-sm font-medium" style={{ color: 'var(--t-text)' }}>Made with ShareLink</p>
              <p className="font-ui text-xs mt-0.5" style={{ color: 'var(--t-text-muted)' }}>No backend · No database · 100% in the URL</p>
            </div>
            <a href="/" className="ml-auto font-ui text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-70" style={{ color: 'var(--t-accent)' }}>
              Create your own →
            </a>
          </div>
        </div>
      </article>
    </div>
  )
}
