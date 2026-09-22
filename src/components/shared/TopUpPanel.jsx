import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CreditCard, Sparkles } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { TOPUP_PRESETS } from '../../utils/constants'
import { formatGHS, pesewasToGHS, GHSToPesewas } from '../../utils/formatCurrency'
import { startTopupCheckout } from '../../api/wallet.api'
import { useAuthStore } from '../../store/authStore'

export default function TopUpPanel({ onTopupSuccess }) {
  const [selectedPreset, setSelectedPreset] = useState(TOPUP_PRESETS[2]) // 5000 pesewas = GHS 50
  const [customAmountGhs, setCustomAmountGhs] = useState('')
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const profile = useAuthStore((s) => s.profile)

  const activeAmountPesewas = customAmountGhs
    ? GHSToPesewas(parseFloat(customAmountGhs) || 0)
    : selectedPreset

  const handleCustomChange = (e) => {
    const val = e.target.value
    setCustomAmountGhs(val)
    if (val) {
      setSelectedPreset(null)
    }
  }

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset)
    setCustomAmountGhs('')
  }

  const handleTopUp = async () => {
    if (!activeAmountPesewas || activeAmountPesewas <= 0) {
      toast.error('Please enter a valid top-up amount')
      return
    }

    setLoading(true)
    try {
      await startTopupCheckout({
        amount: activeAmountPesewas,
        email: profile?.email,
        reference: `TOPUP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        metadata: { user_id: profile?.id },
      })
      await queryClient.invalidateQueries({ queryKey: ['wallet'] })
      await queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success(`Wallet topped up with ${formatGHS(activeAmountPesewas)}!`)
      if (onTopupSuccess) onTopupSuccess()
    } catch (err) {
      if (err.message !== 'Top-up cancelled') {
        toast.error(err.message || 'Top-up failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-text">Top up wallet</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
          <Sparkles size={12} /> Instant credit
        </span>
      </div>

      <p className="mt-1 text-xs text-text-muted">
        Choose a preset amount or enter a custom value in GHS.
      </p>

      {/* Preset pills */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {TOPUP_PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset && !customAmountGhs
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`rounded-xl border px-3 py-2.5 text-center text-xs sm:text-sm font-bold transition ${
                isSelected
                  ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20'
                  : 'border-border bg-surface-raised text-text hover:border-primary/40 hover:bg-surface'
              }`}
            >
              GHS {pesewasToGHS(preset)}
            </button>
          )
        })}
      </div>

      {/* Custom amount */}
      <div className="mt-4">
        <Input
          label="Or enter custom amount (GHS)"
          type="number"
          min="1"
          step="any"
          placeholder="e.g. 75"
          value={customAmountGhs}
          onChange={handleCustomChange}
        />
      </div>

      <div className="mt-5">
        <Button
          className="w-full"
          size="lg"
          icon={CreditCard}
          loading={loading}
          onClick={handleTopUp}
          disabled={!activeAmountPesewas || activeAmountPesewas <= 0}
        >
          Top Up with Paystack {activeAmountPesewas > 0 ? `(${formatGHS(activeAmountPesewas)})` : ''}
        </Button>
      </div>

      <p className="mt-3 text-center text-[11px] text-text-muted">
        Secured by Paystack. Supports MTN MoMo, Telecel Cash, AT Money, & Cards.
      </p>
    </div>
  )
}
