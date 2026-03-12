import { useEffect, useState } from 'react'
import { CreatePage } from './pages/CreatePage'
import { ViewPage } from './pages/ViewPage'
import { readPayloadFromURL } from './utils/decode'
import { ThemeProvider } from './context/ThemeContext'
import type { Payload } from './utils/encode'

function AppInner() {
  const [payload, setPayload] = useState<Payload | null | undefined>(undefined)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get('data')) { setPayload(null); return }
    readPayloadFromURL().then(setPayload)
  }, [])

  if (payload === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--t-bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--t-accent)' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p className="font-ui text-sm" style={{ color: 'var(--t-text-muted)' }}>Decoding…</p>
        </div>
      </div>
    )
  }

  if (payload) return <ViewPage payload={payload} />
  return <CreatePage />
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
