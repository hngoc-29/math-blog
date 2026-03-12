import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface QRCodeCardProps { url: string }

export function QRCodeCard({ url }: QRCodeCardProps) {
  const { config } = useTheme()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(url) } catch {
      const ta = document.createElement('textarea')
      ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.focus(); ta.select()
      document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayUrl = url.length > 80 ? url.slice(0, 80) + '…' : url

  return (
    <div className="fade-up fade-up-4 mt-6 rounded-2xl p-6 shadow-xl border"
      style={{ background: config.id === 'dark' || config.id === 'neon' ? config.surface : config.codeBg, borderColor: config.accent + '33' }}>
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* QR */}
        <div className="shrink-0 p-3 bg-white rounded-xl shadow-inner">
          <QRCodeSVG value={url} size={140} bgColor="#ffffff" fgColor="#1a1a2e" level="M" />
        </div>

        {/* URL + Actions */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-ui uppercase tracking-widest mb-2" style={{ color: config.accent }}>
            ✦ Shareable Link
          </p>
          <div className="rounded-xl px-4 py-3 mb-4 border" style={{ background: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="font-mono text-sm break-all leading-relaxed" style={{ color: config.accent }}>{displayUrl}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-ui font-medium transition-all duration-200"
              style={copied
                ? { background: '#22c55e', color: '#fff' }
                : { background: config.accent, color: config.accentText }}>
              {copied ? (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
              ) : (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy URL</>
              )}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-ui font-medium border transition-all duration-200"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Open
            </a>
          </div>
          <p className="mt-3 text-xs font-ui" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Scan QR code or share the link. No server — all data lives in the URL.
          </p>
        </div>
      </div>
    </div>
  )
}
