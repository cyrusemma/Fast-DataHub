import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CreditCard } from 'lucide-react'
import Button from '../ui/Button'
import { TOPUP_PRESETS } from '../../utils/constants'
import { formatGHS } from '../../utils/formatCurrency'
import { startTopupCheckout } from '../../api/wallet.api'
import { useAuthStore } from '../../store/authStore'

export default function TopUpPanel() {
  const [amount, setAmount] = useState(TOPUP_PRESETS[2])
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const profile = useAuthStore((s) => s.profile)

  const topUp = async () => {
    setLoading(true)
    try {
      await startTopupCheckout({
        amount,
        email: profile?.email,
        reference: `TOPUP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        metadata: { user_id: profile?.id },
      })
      await queryClient.invalidateQueries({ queryKey: ['wallet', profile?.id] })
      await queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      toast.success('Wallet topped up successfully')
    } catch (err) {
      toast.error(err.message || 'Top-up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      <h2 className="font-display text-base font-bold text-dark">Top up wallet</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TOPUP_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset)}
            className={amount === preset ? 'rounded-xl border border-primary bg-primary-50 px-3 py-3 text-sm font-bold text-primary' : 'rounded-xl border border-slate-100 bg-white px-3 py-3 text-sm font-semibold text-slate-600 hover:border-primary/40'}
          >
            {formatGHS(preset)}
          </button>
        ))}
      </div>
      <Button className="mt-4 w-full" icon={CreditCard} loading={loading} onClick={topUp}>
        Pay with Paystack
      </Button>
    </div>
  )
}
