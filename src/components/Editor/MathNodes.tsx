import { Node, InputRule, mergeAttributes, nodePasteRule } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import type { Transaction } from '@tiptap/pm/state'
import type { Node as PMNode } from '@tiptap/pm/model'
import { useEffect, useRef, useState } from 'react'
import { renderMathToHtml, isMathRenderError } from '../../utils/math'

/**
 * Inserts a block-level node at [from, to). If that range happens to be the
 * *entire* content of its parent text block (the common case: pressing Enter
 * for a new line, then typing "$$...$$" as the whole line), replaces the
 * parent block itself instead — otherwise ProseMirror's replace would leave
 * an empty paragraph sitting above the new block node.
 */
function insertBlockNode(tr: Transaction, doc: PMNode, from: number, to: number, node: PMNode) {
  const $from = doc.resolve(from)
  const depth = $from.depth
  if (depth > 0 && from === $from.start(depth) && to === $from.end(depth)) {
    tr.replaceWith($from.before(depth), $from.after(depth), node)
  } else {
    tr.replaceWith(from, to, node)
  }
}

// ── Quick-insert LaTeX snippets, so people don't need to memorize syntax ────

const QUICK_SYMBOLS: Array<{ label: string; insert: string; caret?: number }> = [
  { label: 'x²', insert: '^{}', caret: -1 },
  { label: 'x₂', insert: '_{}', caret: -1 },
  { label: 'a⁄b', insert: '\\frac{}{}', caret: -3 },
  { label: '√', insert: '\\sqrt{}', caret: -1 },
  { label: 'Σ', insert: '\\sum_{}^{}', caret: -4 },
  { label: '∫', insert: '\\int_{}^{}', caret: -4 },
  { label: '∞', insert: '\\infty' },
  { label: 'π', insert: '\\pi' },
  { label: 'α', insert: '\\alpha' },
  { label: 'β', insert: '\\beta' },
  { label: 'θ', insert: '\\theta' },
  { label: '≤', insert: '\\le' },
  { label: '≥', insert: '\\ge' },
  { label: '≠', insert: '\\ne' },
  { label: '±', insert: '\\pm' },
  { label: '×', insert: '\\times' },
  { label: '→', insert: '\\to' },
  { label: '{ }', insert: '\\{ \\}', caret: -3 },
]

function SymbolPalette({ onInsert }: { onInsert: (snippet: string, caret: number) => void }) {
  return (
    <div className="math-edit-symbols">
      {QUICK_SYMBOLS.map(s => (
        <button
          key={s.label}
          type="button"
          className="math-symbol-btn"
          tabIndex={-1}
          onMouseDown={e => {
            e.preventDefault()
            onInsert(s.insert, s.caret ?? 0)
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

// ── Inline math: $...$ ───────────────────────────────────────────────────

function MathInlineView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const latex: string = node.attrs.latex ?? ''
  const [editing, setEditing] = useState(latex.trim() === '')
  const [draft, setDraft] = useState(latex)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) return
    setDraft(latex)
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      deleteNode()
      return
    }
    updateAttributes({ latex: trimmed })
    setEditing(false)
  }

  const cancel = () => {
    if (!latex.trim()) {
      deleteNode()
      return
    }
    setDraft(latex)
    setEditing(false)
  }

  const insertSnippet = (snippet: string, caret: number) => {
    const el = inputRef.current
    const start = el?.selectionStart ?? draft.length
    const end = el?.selectionEnd ?? draft.length
    const next = draft.slice(0, start) + snippet + draft.slice(end)
    setDraft(next)
    requestAnimationFrame(() => {
      const pos = start + snippet.length + caret
      el?.focus()
      el?.setSelectionRange(pos, pos)
    })
  }

  if (!editing) {
    const html = renderMathToHtml(latex || '\\,', false)
    const hasError = isMathRenderError(html)
    return (
      <NodeViewWrapper as="span" className="math-chip-wrapper">
        <span
          className={`math-inline-chip${hasError ? ' has-error' : ''}`}
          contentEditable={false}
          onClick={() => setEditing(true)}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </NodeViewWrapper>
    )
  }

  const previewHtml = renderMathToHtml(draft || '\\,', false)

  return (
    <NodeViewWrapper as="span" className="math-chip-wrapper is-editing">
      <span className="math-inline-chip is-placeholder" contentEditable={false}>∑</span>
      <span className="math-edit-panel" contentEditable={false}>
        <div className="math-edit-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        <input
          ref={inputRef}
          type="text"
          className="math-edit-input"
          value={draft}
          placeholder="Nhập LaTeX, ví dụ: x^2 + y^2"
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
            else if (e.key === 'Escape') { e.preventDefault(); cancel() }
            else if (e.key === 'Tab') { e.preventDefault(); commit() }
          }}
          onBlur={commit}
        />
        <SymbolPalette onInsert={insertSnippet} />
        <div className="math-edit-actions">
          <button type="button" className="math-edit-delete" tabIndex={-1} onMouseDown={e => { e.preventDefault(); deleteNode() }}>Xóa</button>
          <button type="button" className="math-edit-done" tabIndex={-1} onMouseDown={e => { e.preventDefault(); commit() }}>Xong</button>
        </div>
      </span>
    </NodeViewWrapper>
  )
}

export const InlineMath = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      latex: { default: '', renderHTML: () => ({}) },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
        getAttrs: el => ({ latex: (el as HTMLElement).getAttribute('data-latex') || '' }),
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.attrs.latex ?? ''
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'math-inline', 'data-latex': latex }),
      `$${latex}$`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineView)
  },

  addInputRules() {
    return [
      new InputRule({
        // Matches "$expr$" right after the closing $ is typed. The dollar
        // signs can't be adjacent to another $ (so it won't fire inside a
        // $$..$$ block), and the expression can't start/end with a space
        // (so plain "$5 and $10" prose isn't mistaken for math).
        find: /(?<!\$)\$([^\s$](?:[^$\n]*[^\s$])?)\$(?!\$)$/,
        handler: ({ state, range, match }) => {
          const latex = match[1]?.trim()
          if (!latex) return
          const { tr } = state
          tr.replaceWith(range.from, range.to, this.type.create({ latex }))
        },
      }),
      new InputRule({
        // The view page also accepts \( ... \) for inline math — mirror that here.
        find: /\\\(([^]*?)\\\)$/,
        handler: ({ state, range, match }) => {
          const latex = match[1]?.trim()
          if (!latex) return
          const { tr } = state
          tr.replaceWith(range.from, range.to, this.type.create({ latex }))
        },
      }),
    ]
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: /(?<!\$)\$([^\s$](?:[^$\n]*[^\s$])?)\$(?!\$)/g,
        type: this.type,
        getAttributes: match => ({ latex: match[1]?.trim() ?? '' }),
      }),
      nodePasteRule({
        find: /\\\(([^]*?)\\\)/g,
        type: this.type,
        getAttributes: match => ({ latex: match[1]?.trim() ?? '' }),
      }),
    ]
  },
})

// ── Block math: $$...$$ ──────────────────────────────────────────────────

function MathBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const latex: string = node.attrs.latex ?? ''
  const [editing, setEditing] = useState(latex.trim() === '')
  const [draft, setDraft] = useState(latex)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing) return
    setDraft(latex)
    const id = requestAnimationFrame(() => textareaRef.current?.focus())
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      deleteNode()
      return
    }
    updateAttributes({ latex: trimmed })
    setEditing(false)
  }

  const cancel = () => {
    if (!latex.trim()) {
      deleteNode()
      return
    }
    setDraft(latex)
    setEditing(false)
  }

  const insertSnippet = (snippet: string, caret: number) => {
    const el = textareaRef.current
    const start = el?.selectionStart ?? draft.length
    const end = el?.selectionEnd ?? draft.length
    const next = draft.slice(0, start) + snippet + draft.slice(end)
    setDraft(next)
    requestAnimationFrame(() => {
      const pos = start + snippet.length + caret
      el?.focus()
      el?.setSelectionRange(pos, pos)
    })
  }

  const source = editing ? draft : latex
  const html = renderMathToHtml(source || '\\,', true)
  const hasError = isMathRenderError(html)

  return (
    <NodeViewWrapper>
      <div
        className={`math-block-card${hasError ? ' has-error' : ''}${editing ? ' is-editing' : ''}`}
        contentEditable={false}
        data-drag-handle
      >
        {!editing ? (
          <div className="math-block-preview" onClick={() => setEditing(true)} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="math-block-edit">
            <div className="math-edit-preview" dangerouslySetInnerHTML={{ __html: html }} />
            <textarea
              ref={textareaRef}
              className="math-block-textarea"
              value={draft}
              placeholder={'Nhập LaTeX, ví dụ:\n\\int_0^1 x^2\\,dx'}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commit() }
                else if (e.key === 'Escape') { e.preventDefault(); cancel() }
              }}
              onBlur={commit}
            />
            <SymbolPalette onInsert={insertSnippet} />
            <div className="math-edit-actions">
              <button type="button" className="math-edit-delete" tabIndex={-1} onMouseDown={e => { e.preventDefault(); deleteNode() }}>Xóa</button>
              <span className="math-edit-hint">Ctrl/Cmd + Enter để xong</span>
              <button type="button" className="math-edit-done" tabIndex={-1} onMouseDown={e => { e.preventDefault(); commit() }}>Xong</button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const BlockMath = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      latex: { default: '', renderHTML: () => ({}) },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
        getAttrs: el => ({ latex: (el as HTMLElement).getAttribute('data-latex') || '' }),
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.attrs.latex ?? ''
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'math-block', 'data-latex': latex }),
      `$$${latex}$$`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView)
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\$\$([^$\n]+)\$\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1]?.trim()
          if (!latex) return
          const { tr } = state
          insertBlockNode(tr, state.doc, range.from, range.to, this.type.create({ latex }))
        },
      }),
      new InputRule({
        // The view page also accepts \[ ... \] for display math — mirror that here.
        find: /\\\[([^]*?)\\\]$/,
        handler: ({ state, range, match }) => {
          const latex = match[1]?.trim()
          if (!latex) return
          const { tr } = state
          insertBlockNode(tr, state.doc, range.from, range.to, this.type.create({ latex }))
        },
      }),
    ]
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: /\$\$([^$\n]+)\$\$/g,
        type: this.type,
        getAttributes: match => ({ latex: match[1]?.trim() ?? '' }),
      }),
      nodePasteRule({
        find: /\\\[([^]*?)\\\]/g,
        type: this.type,
        getAttributes: match => ({ latex: match[1]?.trim() ?? '' }),
      }),
    ]
  },
})
