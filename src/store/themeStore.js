import { create } from 'zustand'

export const BASE_MODES = ['light', 'dark', 'amoled']
export const PALETTES = ['default', 'ocean', 'midnight', 'ember', 'forest', 'gold', 'custom']

const THEME_PREF_KEY = 'datahub-theme-pref'

function getLocalModePref() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(THEME_PREF_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.modeOverride || null
    }
  } catch {
    /* ignore */
  }
  return null
}

function saveLocalModePref(mode) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(THEME_PREF_KEY, JSON.stringify({ modeOverride: mode }))
  } catch {
    /* ignore */
  }
}

export function applyDOMTheme({ mode, palette, primaryColor, accentColor }) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  // Set mode & palette data attributes
  root.setAttribute('data-mode', mode || 'light')
  root.setAttribute('data-palette', palette || 'default')

  // Handle custom brand colors
  if (palette === 'custom' && primaryColor) {
    root.style.setProperty('--color-primary', primaryColor)
    root.style.setProperty('--color-primary-hover', primaryColor)
    if (accentColor) {
      root.style.setProperty('--color-accent', accentColor)
      root.style.setProperty('--color-accent-hover', accentColor)
    }
  } else {
    root.style.removeProperty('--color-primary')
    root.style.removeProperty('--color-primary-hover')
    root.style.removeProperty('--color-accent')
    root.style.removeProperty('--color-accent-hover')
  }
}

export const useThemeStore = create((set, get) => ({
  mode: 'light',
  palette: 'default',
  primaryColor: null,
  accentColor: null,
  agentTheme: null,
  platformDefault: null,

  setMode: (mode) => {
    if (!BASE_MODES.includes(mode)) return
    saveLocalModePref(mode)
    set({ mode })
    get().applyTheme()
  },

  setAgentTheme: (themeObj) => {
    set({ agentTheme: themeObj })
    get().applyTheme()
  },

  setPlatformDefault: (themeObj) => {
    set({ platformDefault: themeObj })
    get().applyTheme()
  },

  applyTheme: () => {
    const state = get()
    const localMode = getLocalModePref()

    // 1. Palette & brand colors: Agent theme override > Platform default > default
    const sourceTheme = state.agentTheme || state.platformDefault || {}
    const resolvedPalette = sourceTheme.palette || state.palette || 'default'
    const resolvedPrimary = sourceTheme.primaryColor || (resolvedPalette === 'custom' ? state.primaryColor : null)
    const resolvedAccent = sourceTheme.accentColor || (resolvedPalette === 'custom' ? state.accentColor : null)

    // 2. Base Mode: Local user preference > Agent mode > Platform default mode > 'light'
    const resolvedMode =
      localMode ||
      state.mode ||
      sourceTheme.mode ||
      'light'

    applyDOMTheme({
      mode: resolvedMode,
      palette: resolvedPalette,
      primaryColor: resolvedPrimary,
      accentColor: resolvedAccent,
    })

    set({
      mode: resolvedMode,
      palette: resolvedPalette,
      primaryColor: resolvedPrimary,
      accentColor: resolvedAccent,
    })
  },

  initTheme: () => {
    const localMode = getLocalModePref()
    if (localMode) {
      set({ mode: localMode })
    }
    get().applyTheme()
  },
}))
