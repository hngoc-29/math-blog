import { type Editor } from '@tiptap/react'
import { useCallback, useState } from 'react'

interface ToolbarProps {
  editor: Editor
  onInsertMedia: () => void
}

function Btn({ onClick, title, active, children }: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title} className={`toolbar-btn ${active ? 'is-active' : ''}`}>
      {children}
    </button>
  )
}
function Sep() { return <span className="toolbar-separator" /> }

export function Toolbar({ editor, onInsertMedia }: ToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)

  const setLink = useCallback(() => {
    if (linkUrl) editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    setShowLinkInput(false); setLinkUrl('')
  }, [editor, linkUrl])

  const insertImage = useCallback(() => {
    if (imageUrl) editor.chain().focus().setImage({ src: imageUrl }).run()
    setShowImageInput(false); setImageUrl('')
  }, [editor, imageUrl])

  const insertMath = useCallback(() => {
    editor.chain().focus().insertContent(' $$ \\LaTeX $$ ').run()
  }, [editor])

  return (
    <div className="border-b" style={{ borderColor: 'var(--t-border)', background: 'var(--t-toolbar-bg)' }}>
      <div className="px-3 py-2 flex flex-wrap items-center gap-0.5">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} title="Bold" active={editor.isActive('bold')}><strong>B</strong></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic" active={editor.isActive('italic')}><em>I</em></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline" active={editor.isActive('underline')}><span style={{ textDecoration: 'underline' }}>U</span></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike" active={editor.isActive('strike')}><span style={{ textDecoration: 'line-through' }}>S</span></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1" active={editor.isActive('heading', { level: 1 })}>H1</Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2" active={editor.isActive('heading', { level: 2 })}>H2</Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3" active={editor.isActive('heading', { level: 3 })}>H3</Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list" active={editor.isActive('bulletList')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list" active={editor.isActive('orderedList')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><text x="2" y="8" fontSize="8" fill="currentColor" stroke="none" fontWeight="700">1.</text><text x="2" y="14" fontSize="8" fill="currentColor" stroke="none" fontWeight="700">2.</text><text x="2" y="20" fontSize="8" fill="currentColor" stroke="none" fontWeight="700">3.</text></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task list" active={editor.isActive('taskList')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote" active={editor.isActive('blockquote')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code" active={editor.isActive('code')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block" active={editor.isActive('codeBlock')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="3"/><polyline points="8 9 4 12 8 15" strokeWidth="2.5"/><polyline points="16 9 20 12 16 15" strokeWidth="2.5"/></svg>
        </Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Superscript" active={editor.isActive('superscript')}>x<sup style={{ fontSize: '0.6em' }}>2</sup></Btn>
        <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} title="Subscript" active={editor.isActive('subscript')}>x<sub style={{ fontSize: '0.6em' }}>2</sub></Btn>
        <Sep />
        <Btn onClick={() => { if (editor.isActive('link')) { editor.chain().focus().unsetLink().run() } else { setShowLinkInput(v => !v) } }} title="Link" active={editor.isActive('link')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </Btn>
        <Btn onClick={() => setShowImageInput(v => !v)} title="Inline image URL">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </Btn>
        <Btn onClick={insertMath} title="Insert LaTeX math">
          <span style={{ fontFamily: 'serif', fontStyle: 'italic' }}>∑</span>
        </Btn>
        <Sep />

        {/* ── Media insert button ── */}
        <button
          type="button"
          onClick={onInsertMedia}
          title="Insert media at cursor (audio, video, file)"
          className="toolbar-btn flex items-center gap-1 px-2"
          style={{ width: 'auto', fontFamily: 'var(--font-ui, DM Sans)', fontSize: '0.8rem' }}
        >
          📎
          <span className="text-xs font-medium hidden sm:inline">Media</span>
        </button>

        <Sep />
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">―</Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left" active={editor.isActive({ textAlign: 'left' })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3z"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Center" active={editor.isActive({ textAlign: 'center' })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v2H3zm3 4h12v2H6zm-3 4h18v2H3zm3 4h12v2H6z"/></svg>
        </Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
        </Btn>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-t" style={{ borderColor: 'var(--t-border)' }}>
          <input type="url" placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && setLink()}
            className="flex-1 text-sm px-3 py-1.5 rounded-lg border focus:outline-none font-ui"
            style={{ background: 'var(--t-input-bg)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }} autoFocus />
          <button type="button" onClick={setLink} className="text-sm px-3 py-1.5 rounded-lg font-ui font-medium" style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}>Add</button>
          <button type="button" onClick={() => setShowLinkInput(false)} className="text-sm px-3 py-1.5 font-ui" style={{ color: 'var(--t-text-muted)' }}>Cancel</button>
        </div>
      )}

      {showImageInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-t" style={{ borderColor: 'var(--t-border)' }}>
          <input type="url" placeholder="https://... (image URL)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertImage()}
            className="flex-1 text-sm px-3 py-1.5 rounded-lg border focus:outline-none font-ui"
            style={{ background: 'var(--t-input-bg)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }} autoFocus />
          <button type="button" onClick={insertImage} className="text-sm px-3 py-1.5 rounded-lg font-ui font-medium" style={{ background: 'var(--t-accent)', color: 'var(--t-accent-text)' }}>Insert</button>
          <button type="button" onClick={() => setShowImageInput(false)} className="text-sm px-3 py-1.5 font-ui" style={{ color: 'var(--t-text-muted)' }}>Cancel</button>
        </div>
      )}
    </div>
  )
}
