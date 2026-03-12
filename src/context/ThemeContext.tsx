import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Theme = 'parchment' | 'dark' | 'sepia' | 'neon' | 'slate'

export interface ThemeConfig {
  id: Theme
  label: string
  emoji: string
  bg: string
  surface: string
  border: string
  text: string
  textMuted: string
  accent: string
  accentText: string
  editorBg: string
  toolbarBg: string
  codeBg: string
  codeText: string
  inputBg: string
  navBg: string
  scrollbarThumb: string
}

export const THEMES: Record<Theme, ThemeConfig> = {
  parchment: {
    id: 'parchment',
    label: 'Parchment',
    emoji: '📜',
    bg: '#fdfaf5',
    surface: '#ffffff',
    border: '#e4ddd0',
    text: '#2a231d',
    textMuted: '#8a7660',
    accent: '#c49a3c',
    accentText: '#2a231d',
    editorBg: '#ffffff',
    toolbarBg: '#f7f3ed',
    codeBg: '#1e1a16',
    codeText: '#e4ddd0',
    inputBg: '#ffffff',
    navBg: 'rgba(253,250,245,0.85)',
    scrollbarThumb: '#cfc4b0',
  },
  dark: {
    id: 'dark',
    label: 'Midnight',
    emoji: '🌙',
    bg: '#0f1117',
    surface: '#1a1d27',
    border: '#2e3347',
    text: '#e8eaf6',
    textMuted: '#6b7280',
    accent: '#818cf8',
    accentText: '#ffffff',
    editorBg: '#1a1d27',
    toolbarBg: '#13151f',
    codeBg: '#0a0c12',
    codeText: '#c9d1ff',
    inputBg: '#1a1d27',
    navBg: 'rgba(15,17,23,0.9)',
    scrollbarThumb: '#374151',
  },
  sepia: {
    id: 'sepia',
    label: 'Sepia',
    emoji: '☕',
    bg: '#f5ede0',
    surface: '#fdf6ec',
    border: '#d4b896',
    text: '#3b2a1a',
    textMuted: '#7c5c3e',
    accent: '#9b4f1a',
    accentText: '#ffffff',
    editorBg: '#fdf6ec',
    toolbarBg: '#ede0cf',
    codeBg: '#2a1810',
    codeText: '#f5d9c4',
    inputBg: '#fdf6ec',
    navBg: 'rgba(245,237,224,0.88)',
    scrollbarThumb: '#c8a882',
  },
  neon: {
    id: 'neon',
    label: 'Neon',
    emoji: '⚡',
    bg: '#050a0e',
    surface: '#0d1b22',
    border: '#00e5ff22',
    text: '#e0f7fa',
    textMuted: '#4dd0e1',
    accent: '#00e5ff',
    accentText: '#050a0e',
    editorBg: '#0d1b22',
    toolbarBg: '#071318',
    codeBg: '#020709',
    codeText: '#b2ff59',
    inputBg: '#0d1b22',
    navBg: 'rgba(5,10,14,0.92)',
    scrollbarThumb: '#006064',
  },
  slate: {
    id: 'slate',
    label: 'Slate',
    emoji: '🪨',
    bg: '#f1f5f9',
    surface: '#ffffff',
    border: '#cbd5e1',
    text: '#0f172a',
    textMuted: '#64748b',
    accent: '#0ea5e9',
    accentText: '#ffffff',
    editorBg: '#ffffff',
    toolbarBg: '#f8fafc',
    codeBg: '#0f172a',
    codeText: '#e2e8f0',
    inputBg: '#ffffff',
    navBg: 'rgba(241,245,249,0.9)',
    scrollbarThumb: '#94a3b8',
  },
}

interface ThemeContextType {
  theme: Theme
  config: ThemeConfig
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'parchment',
  config: THEMES.parchment,
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('sl-theme') as Theme) ?? 'parchment'
  })

  const config = THEMES[theme]

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('sl-theme', t)
  }

  // Apply CSS variables to :root
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--t-bg', config.bg)
    root.style.setProperty('--t-surface', config.surface)
    root.style.setProperty('--t-border', config.border)
    root.style.setProperty('--t-text', config.text)
    root.style.setProperty('--t-text-muted', config.textMuted)
    root.style.setProperty('--t-accent', config.accent)
    root.style.setProperty('--t-accent-text', config.accentText)
    root.style.setProperty('--t-editor-bg', config.editorBg)
    root.style.setProperty('--t-toolbar-bg', config.toolbarBg)
    root.style.setProperty('--t-code-bg', config.codeBg)
    root.style.setProperty('--t-code-text', config.codeText)
    root.style.setProperty('--t-input-bg', config.inputBg)
    root.style.setProperty('--t-nav-bg', config.navBg)
    root.style.setProperty('--t-scrollbar', config.scrollbarThumb)
    document.body.style.background = config.bg
    document.body.style.color = config.text
  }, [config])

  return (
    <ThemeContext.Provider value={{ theme, config, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
