import { renderToString } from 'katex'

/**
 * Accepts a common typo where the leading backslash is typed as a slash.
 * Example: /omega -> \omega, /frac{1}{2} -> \frac{1}{2}
 * Leave normal division untouched: 1/2 stays as-is.
 */
export function normalizeLatexExpr(expr: string): string {
  const trimmed = expr.trim()
  return trimmed.replace(/^\/([A-Za-z]+)(?=\b|\{|\(|\[|$)/, '\\$1')
}

/**
 * Renders a LaTeX expression to KaTeX HTML. Never throws — on a parse error it
 * falls back to KaTeX's own inline error rendering (red text, `katex-error`
 * class), which callers can detect via `isMathRenderError`.
 */
export function renderMathToHtml(expr: string, displayMode: boolean): string {
  const normalized = normalizeLatexExpr(expr)
  try {
    return renderToString(normalized, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
    })
  } catch {
    const open = displayMode ? '$$' : '$'
    return `<span class="math-error">${open}${normalized}${open}</span>`
  }
}

export function isMathRenderError(html: string): boolean {
  return html.includes('katex-error') || html.includes('math-error')
}
