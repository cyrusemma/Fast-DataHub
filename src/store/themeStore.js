import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const THEMES = ['light', 'dark', 'outdoor']

export function applyThemeClass(theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-dark', 'theme-outdoor')
  root.classList.add(`theme-${theme}`)
  root.setAttribute('data-theme', theme)
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        if (!THEMES.includes(theme)) return
        applyThemeClass(theme)
        set({ theme })
      },
      cycleTheme: () => {
        const current = get().theme
        const nextIndex = (THEMES.indexOf(current) + 1) % THEMES.length
        const nextTheme = THEMES[nextIndex]
        applyThemeClass(nextTheme)
        set({ theme: nextTheme })
      },
      initTheme: () => {
        const current = get().theme || 'light'
        applyThemeClass(current)
      },
    }),
    {
      name: 'datahub-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeClass(state.theme)
        }
      },
    }
  )
)
