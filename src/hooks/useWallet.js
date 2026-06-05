import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../api/supabase'
import { useAuthStore } from '../store/authStore'
import { useWalletStore } from '../store/walletStore'

export function useWallet() {
  const { profile } = useAuthStore()
  const { setBalance } = useWalletStore()

  const query = useQuery({
    queryKey: ['wallet', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('wallets')
        .select('balance,currency,last_updated')
        .eq('user_id', profile.id)
        .single()
      if (data) setBalance(data.balance)
      return data
    },
  })

  // Realtime: live wallet balance updates via Supabase channel subscription.
  useEffect(() => {
    if (!profile?.id) return
    const channel = supabase
      .channel(`wallet:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setBalance(payload.new.balance)
          query.refetch()
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  return query
}
