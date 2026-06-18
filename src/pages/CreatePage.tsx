import { useEffect, useMemo, useState } from 'react'
import { RichEditor } from '../components/Editor'
import { QRCodeCard } from '../components/QRCodeCard'
import { ThemePicker } from '../components/ThemePicker'
import { buildShareURL, estimateSize, type Payload } from '../utils/encode'
import { useTheme } from '../context/ThemeContext'
import { MarkdownRenderer } from '../components/MarkdownRenderer'

const DRAFT_KEY = 'sharelink:draft:v3'
const DRAFT_BLOB_PREFIX = 'sharelink:draft:content:v1:'
interface DraftContentRawRef {
  kind: 'raw'
  value: string
}

interface DraftContentBlobRef {
  kind: 'blob'
  key: string
  hash: string
  length: number
}

type DraftContentRef = DraftContentRawRef | DraftContentBlobRef

interface DraftState {
  title: string
  contentRef: DraftContentRef
  savedAt: string
}

function isEmptyContent(content: string) {
  return !content || content === '<p></p>' || content.replace(/<[^>]+>/g, '').trim() === ''
}

function hashText(input: string): string {
  // Fast non-cryptographic hash used only as a localStorage key.
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

function shouldStoreInline(content: string): boolean {
  return estimateRawContentRefSize(content) <= estimateBlobContentRefSize(content)
}

function estimateRawContentRefSize(content: string): number {
  return JSON.stringify({ kind: 'raw', value: content }).length
}

function estimateBlobContentRefSize(content: string): number {
  const hash = hashText(content)
  return JSON.stringify({
    kind: 'blob',
    key: `${DRAFT_BLOB_PREFIX}${hash}`,
    hash,
    length: content.length,
  }).length
}

function makeContentRef(content: string): DraftContentRef {
  if (shouldStoreInline(content)) {
    return { kind: 'raw', value: content }
  }

  const hash = hashText(content)
  return {
    kind: 'blob',
    key: `${DRAFT_BLOB_PREFIX}${hash}`,
    hash,
    length: content.length,
  }
}

function readContentFromRef(ref: DraftContentRef): string {
  if (ref.kind === 'raw') return ref.value
  try {
    return localStorage.getItem(ref.key) ?? ''
  } catch {
    return ''
  }
}

function loadDraftMeta(): DraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DraftState> & { content?: string }
    if (typeof parsed.title !== 'string') {
      return null
    }

    const savedAt = typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString()

    // New format
    if (parsed.contentRef) {
      const ref = parsed.contentRef as Partial<DraftContentRef> & { kind?: string }
      if (ref.kind === 'raw' && typeof ref.value === 'string') {
        return {
          title: parsed.title,
          contentRef: { kind: 'raw', value: ref.value },
          savedAt,
        }
      }

      if (
        ref.kind === 'blob' &&
        typeof ref.key === 'string' &&
        typeof ref.hash === 'string' &&
        typeof ref.length === 'number'
      ) {
        return {
          title: parsed.title,
          contentRef: {
            kind: 'blob',
            key: ref.key,
            hash: ref.hash,
            length: ref.length,
          },
          savedAt,
        }
      }
    }

    // Legacy format from older builds: { title, content, savedAt }
    if (typeof parsed.content === 'string') {
      const content = parsed.content
      return {
        title: parsed.title,
        contentRef: makeContentRef(content),
        savedAt,
      }
    }

    return null
  } catch {
    return null
  }
}

function loadDraft(): DraftState | null {
  const draft = loadDraftMeta()
  if (!draft) return null

  const content = readContentFromRef(draft.contentRef)
  if (!content && draft.contentRef.kind === 'blob') {
    return null
  }

  return draft
}

function saveDraft(draft: Omit<DraftState, 'savedAt' | 'contentRef'> & { content: string }) {
  try {
    const currentMeta = loadDraftMeta()

    if (!draft.title.trim() && isEmptyContent(draft.content)) {
      if (currentMeta?.contentRef.kind === 'blob') {
        localStorage.removeItem(currentMeta.contentRef.key)
      }
      localStorage.removeItem(DRAFT_KEY)
      return
    }

    const contentRef = makeContentRef(draft.content)

    if (currentMeta?.contentRef.kind === 'blob') {
      const nextBlobKey = contentRef.kind === 'blob' ? contentRef.key : null
      if (currentMeta.contentRef.key !== nextBlobKey) {
        localStorage.removeItem(currentMeta.contentRef.key)
      }
    }

    if (contentRef.kind === 'blob') {
      localStorage.setItem(contentRef.key, draft.content)
    }

    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        title: draft.title,
        contentRef,
        savedAt: new Date().toISOString(),
      } satisfies DraftState),
    )
  } catch {
    // ignore storage failures
  }
}

function restoreDraftContent(draft: DraftState): string {
  return readContentFromRef(draft.contentRef)
}

function formattedDateTime(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function PreviewShell({ payload }: { payload: Payload }) {
  const isHtml = payload.content.trimStart().startsWith('<')
  const formattedDate = payload.createdAt
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(payload.createdAt))
    : null

  return (
    <article className="rounded-2xl border p-5 md:p-6 shadow-sm" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
      {formattedDate && (
        <p className="font-ui text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--t-text-muted)' }}>
          {formattedDate}
        </p>
      )}
      <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight mb-5" style={{ color: 'var(--t-text)' }}>
        {payload.title}
      </h2>
      <div className="prose-preview">
        <MarkdownRenderer content={payload.content} isHtml={isHtml} />
      </div>
    </article>
  )
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close help" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl border shadow-2xl" style={{ background: 'var(--t-bg)', borderColor: 'var(--t-border)' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-4 backdrop-blur-md" style={{ background: 'var(--t-nav-bg)', borderColor: 'var(--t-border)' }}>
          <div>
            <p className="font-ui text-xs uppercase tracking-widest" style={{ color: 'var(--t-text-muted)' }}>Help</p>
            <p className="font-ui text-sm mt-1" style={{ color: 'var(--t-text-muted)' }}>How to use the editor, LaTeX, and media</p>
          </div>
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl text-sm font-ui border" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)', color: 'var(--t-text-muted)' }}>
            Close
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-5">
          <section className="rounded-2xl border p-4" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
            <h3 className="font-ui font-semibold text-sm mb-2" style={{ color: 'var(--t-text)' }}>1) How to write</h3>
            <p className="font-ui text-sm leading-6" style={{ color: 'var(--t-text-muted)' }}>
              Type a title, then write content in the editor. Use the toolbar for bold, italic, lists, links, code blocks, tables, and alignment.
              Click <strong style={{ color: 'var(--t-text)' }}>Preview</strong> before generating a share link.
            </p>
          </section>

          <section className="rounded-2xl border p-4" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
            <h3 className="font-ui font-semibold text-sm mb-2" style={{ color: 'var(--t-text)' }}>2) LaTeX / math</h3>
            <div className="space-y-2 font-ui text-sm leading-6" style={{ color: 'var(--t-text-muted)' }}>
              <p>Inline math: <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>{'$E=mc^2$'}</code></p>
              <p>Block math: <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>{'$$\\frac{1}{2}$$'}</code></p>
              <p>Common symbols: <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>{'\\alpha \\beta \\gamma \\omega \\pi'}</code></p>
              <p>Examples: <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>{'\\sqrt{x}'}</code>, <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>{'\\sum_{i=1}^{n} i'}</code></p>
              <p>Special characters in math often need a backslash: <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>{'\\_ \\{ \\} \\% \\&'}</code></p>
            </div>
          </section>

          <section className="rounded-2xl border p-4" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
            <h3 className="font-ui font-semibold text-sm mb-2" style={{ color: 'var(--t-text)' }}>3) Media upload</h3>
            <p className="font-ui text-sm leading-6" style={{ color: 'var(--t-text-muted)' }}>
              Uploaded images, audio, video, and files are converted to <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>data:</code> Base64 URIs.
              That keeps the preview working even after refresh, but large files make the link longer.
            </p>
            <p className="font-ui text-sm leading-6 mt-2" style={{ color: 'var(--t-text-muted)' }}>
              For big files, prefer an external URL instead of upload.
            </p>
          </section>

          <section className="rounded-2xl border p-4" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)' }}>
            <h3 className="font-ui font-semibold text-sm mb-2" style={{ color: 'var(--t-text)' }}>4) Drafts and sharing</h3>
            <p className="font-ui text-sm leading-6" style={{ color: 'var(--t-text-muted)' }}>
              Drafts are auto-saved locally. When you come back, the app asks whether to restore them. Short draft text is saved directly; longer content is stored by a local hash key to keep the saved record smaller.
            </p>
            <p className="font-ui text-sm leading-6 mt-2" style={{ color: 'var(--t-text-muted)' }}>
              Use <strong style={{ color: 'var(--t-text)' }}>Preview</strong> to check the result first, then create the short link.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

function PreviewModal({
  payload,
  onClose,
  onGenerate,
  generating,
}: {
  payload: Payload
  onClose: () => void
  onGenerate: () => void
  generating: boolean
}) {
  const sizeKB = estimateSize(payload)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl border shadow-2xl" style={{ background: 'var(--t-bg)', borderColor: 'var(--t-border)' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-4 backdrop-blur-md" style={{ background: 'var(--t-nav-bg)', borderColor: 'var(--t-border)' }}>
          <div>
            <p className="font-ui text-xs uppercase tracking-widest" style={{ color: 'var(--t-text-muted)' }}>Preview before share</p>
            <p className="font-ui text-sm mt-1" style={{ color: 'var(--t-text-muted)' }}>Estimated size: <span style={{ color: 'var(--t-accent)' }}>{sizeKB} KB</span></p>
          </div>
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl text-sm font-ui border" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)', color: 'var(--t-text-muted)' }}>
            Close
          </button>
        </div>

        <div className="p-5 md:p-6">
          <PreviewShell payload={payload} />
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-ui border" style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}>
              Edit more
            </button>
            <button
              type="button"
              onClick={onGenerate}
              disabled={generating}
              className="px-4 py-2.5 rounded-xl text-sm font-ui font-medium disabled:opacity-60"
              style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}
            >
              {generating ? 'Generating…' : 'Create short link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CreatePage() {
  const { config } = useTheme()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const currentPayload = useMemo<Payload>(() => ({ title, content }), [title, content])
  const sizeKB = estimateSize(currentPayload)
  const sizeWarning = sizeKB > 8000
    ? 'URL may be too long for some browsers (> 8 MB)'
    : sizeKB > 4000
    ? 'URL is getting large — consider fewer or smaller embedded files'
    : null

  useEffect(() => {
    const draft = loadDraft()
    if (!draft) return

    const shouldRestore = window.confirm(
      `We found a saved draft from ${formattedDateTime(draft.savedAt)}. Restore it?`,
    )

    if (!shouldRestore) return

    setTitle(draft.title)
    setContent(restoreDraftContent(draft))
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      saveDraft({ title, content })
    }, 350)

    return () => window.clearTimeout(id)
  }, [title, content])

  const validate = () => {
    if (!title.trim()) {
      setError('Please enter a title.')
      return false
    }
    if (isEmptyContent(content)) {
      setError('Please write some content.')
      return false
    }
    return true
  }

  const handlePreview = () => {
    setError(null)
    if (!validate()) return
    setShowPreview(true)
  }

  const handleGenerate = async () => {
    setError(null)
    if (!validate()) return

    setGenerating(true)
    try {
      const url = await buildShareURL(currentPayload)
      setShareUrl(url)
      setShowPreview(false)
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

      <nav className="sticky top-0 z-20 backdrop-blur-md border-b" style={{ background: 'var(--t-nav-bg)', borderColor: 'var(--t-border)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--t-accent)' }}>✦</span>
            <span className="font-ui text-sm font-semibold" style={{ color: 'var(--t-text)' }}>ShareLink</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="px-3 py-2 rounded-xl text-sm font-ui border"
              style={{ background: 'var(--t-surface)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}
            >
              Help
            </button>
            <ThemePicker />
          </div>
        </div>
      </nav>

      <div className="relative max-w-3xl mx-auto px-4 py-10 md:py-16">
        <header className="mb-10 fade-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-3" style={{ color: 'var(--t-text)' }}>
            Write Once,{' '}
            <span style={{ color: 'var(--t-accent)' }}>Share Everywhere</span>
          </h1>
          <p className="font-body text-lg leading-relaxed max-w-xl" style={{ color: 'var(--t-text-muted)' }}>
            Compose a rich message with formatting, math, and media — then preview it and create a compact link.
          </p>
        </header>

        <div className="space-y-5">
          <div className="fade-up fade-up-1">
            <label htmlFor="title" className="block font-ui text-sm font-medium mb-2" style={{ color: 'var(--t-text)' }}>Title</label>
            <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Give your message a title…"
              className="w-full px-4 py-3.5 rounded-xl border text-xl placeholder:opacity-30 focus:outline-none transition-all shadow-sm font-display"
              style={{ background: 'var(--t-input-bg)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }} />
          </div>

          <div className="fade-up fade-up-2">
            <label className="block font-ui text-sm font-medium mb-2" style={{ color: 'var(--t-text)' }}>
              Content
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--t-text-muted)' }}>
                Click 📎 Media in the toolbar to insert audio, video, images or files at cursor
              </span>
            </label>
            <RichEditor content={content} onChange={setContent} />
          </div>

          <div className="fade-up fade-up-2 rounded-xl border px-4 py-3"
            style={{ background: 'color-mix(in srgb, var(--t-surface) 60%, transparent)', borderColor: 'var(--t-border)' }}>
            <p className="font-ui text-xs leading-relaxed" style={{ color: 'var(--t-text-muted)' }}>
              <strong style={{ color: 'var(--t-text)' }}>💡 Tips:</strong>{' '}
              Use <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>$E=mc^2$</code> for inline math,{' '}
              <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--t-toolbar-bg)', color: 'var(--t-text)' }}>$$...$$</code> for display math.
              Drafts are auto-saved locally and restored when you come back.
            </p>
          </div>

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

          {error && (
            <div className="rounded-xl border px-4 py-3" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
              <p className="font-ui text-sm" style={{ color: '#dc2626' }}>{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 fade-up fade-up-3">
            <button type="button" onClick={handlePreview}
              className="w-full py-4 rounded-xl font-ui font-medium text-base active:scale-[0.99] transition-all duration-150 shadow-lg flex items-center justify-center gap-2"
              style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)', color: 'var(--t-text)' }}>
              Preview
            </button>
            <button type="button" onClick={handleGenerate} disabled={generating}
              className="w-full py-4 rounded-xl font-ui font-medium text-base active:scale-[0.99] transition-all duration-150 shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)', boxShadow: `0 8px 24px ${config.accent}28` }}>
              {generating ? (
                <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Generating…</>
              ) : (
                <><span>✦</span>Generate Short Link</>
              )}
            </button>
          </div>

          {shareUrl && <QRCodeCard url={shareUrl} />}
        </div>

        <footer className="mt-16 pt-8 border-t text-center" style={{ borderColor: 'var(--t-border)' }}>
          <p className="font-ui text-xs" style={{ color: 'var(--t-text-muted)' }}>
            100% client-side · No backend · No cookies · Everything stays compact in the URL
          </p>
        </footer>
      </div>

      {showPreview && (
        <PreviewModal
          payload={currentPayload}
          onClose={() => setShowPreview(false)}
          onGenerate={() => void handleGenerate()}
          generating={generating}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
