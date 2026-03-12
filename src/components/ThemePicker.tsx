import { useState } from 'react'
import { THEMES, type Theme, useTheme } from '../context/ThemeContext'

export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Change theme"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-medium transition-all border"
        style={{
          background: 'var(--t-surface)',
          borderColor: 'var(--t-border)',
          color: 'var(--t-text-muted)',
        }}
      >
        <span>{THEMES[theme].emoji}</span>
        <span className="hidden sm:inline">{THEMES[theme].label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-xl shadow-2xl border overflow-hidden min-w-[160px]"
            style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}
          >
            {(Object.keys(THEMES) as Theme[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTheme(t); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-ui text-left transition-colors hover:opacity-80"
                style={{
                  background: theme === t ? 'var(--t-accent)' : 'transparent',
                  color: theme === t ? 'var(--t-accent-text)' : 'var(--t-text)',
                }}
              >
                <span className="text-base">{THEMES[t].emoji}</span>
                <span>{THEMES[t].label}</span>
                {theme === t && (
                  <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
