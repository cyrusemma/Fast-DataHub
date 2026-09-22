import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { getPlatformTheme, getAgentTheme } from '../api/theme.api'

export function useThemeInit() {
  const { profile, isAuthenticated } = useAuthStore()
  const { setAgentTheme, setPlatformDefault, applyTheme } = useThemeStore()

  useEffect(() => {
    let isMounted = true

    async function syncThemes() {
      try {
        // 1. Fetch platform-wide default
        const platformTheme = await getPlatformTheme()
        if (isMounted && platformTheme) {
          setPlatformDefault(platformTheme)
        }

        // 2. Fetch agent-specific theme if user is under an agent or is an agent
        if (profile) {
          if (['CUSTOMER', 'RESELLER'].includes(profile.role) && profile.agent_id) {
            const agentTheme = await getAgentTheme(profile.agent_id)
            if (isMounted) setAgentTheme(agentTheme)
          } else if (profile.role === 'AGENT' && profile.agent_theme) {
            if (isMounted) setAgentTheme(profile.agent_theme)
          } else {
            if (isMounted) setAgentTheme(null)
          }
        } else {
          if (isMounted) setAgentTheme(null)
        }

        if (isMounted) applyTheme()
      } catch (err) {
        console.warn('Theme synchronization error:', err)
      }
    }

    syncThemes()

    return () => {
      isMounted = false
    }
  }, [profile?.id, profile?.role, profile?.agent_id, isAuthenticated])
}
