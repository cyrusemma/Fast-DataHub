import { useEffect, useState } from 'react'
import { supabase } from '../api/supabase'
import { useAuthStore } from '../store/authStore'
import { getCurrentProfile } from '../api/auth.api'

export function useAuthListener() {
  const { setAuth, clearAuth } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const p = await getCurrentProfile()
        if (p) setAuth(p, session)
        else clearAuth()
      }
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const p = await getCurrentProfile()
        if (p) setAuth(p, session)
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ready }
}
