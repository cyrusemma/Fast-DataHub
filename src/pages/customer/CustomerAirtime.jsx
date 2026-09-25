import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Phone, Zap, ShieldCheck, CheckCircle2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import WalletCard from '../../components/shared/WalletCard'
import Button from '../../components/ui/Button'
import { NetworkBadge } from '../../components/ui/Badge'
import TransactionReceiptModal from '../../components/shared/TransactionReceiptModal'
import { useWallet } from '../../hooks/useWallet'
import { formatGHS, GHSToPesewas } from '../../utils/formatCurrency'
import { NETWORK_LIST } from '../../utils/constants'
import { supabase } from '../../api/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../utils/cn'

const AIRTIME_PRESETS = [5, 10, 20, 50, 100, 200]
const CASHBACK_PERCENT = 2 // 2% instant discount on airtime

export default function CustomerAirtime() {
  const { user } = useAuthStore()
  const wallet = useWallet()
  const queryClient = useQueryClient()

  const [network, setNetwork] = useState('MTN')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedTx, setCompletedTx] = useState(null)

  const rawCost = Number(amount) || 0
  const discount = (rawCost * CASHBACK_PERCENT) / 100
  const finalCost = Math.max(0, rawCost - discount)
  const finalCostPesewas = GHSToPesewas(finalCost)

  const walletBalance = wallet.data?.balance || 0
  const hasEnoughBalance = walletBalance >= finalCostPesewas

  // Auto-detect telecom carrier based on phone prefix
  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10)
    setPhone(cleaned)
    if (cleaned.length >= 3) {
      const prefix = cleaned.slice(0, 3)
      if (['024', '054', '055', '059', '025'].includes(prefix)) {
        setNetwork('MTN')
      } else if (['020', '050'].includes(prefix)) {
        setNetwork('TELECEL')
      } else if (['027', '057', '026', '056'].includes(prefix)) {
        setNetwork('AIRTELTIGO')
      }
    }
  }

  const handlePurchaseAirtime = async (e) => {
    e.preventDefault()
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit Ghana phone number.')
      return
    }
    if (rawCost < 1) {
      toast.error('Minimum airtime purchase is GHS 1.00')
      return
    }
    if (!hasEnoughBalance) {
      toast.error('Insufficient wallet balance. Please top up your wallet.')
      return
    }

    setIsSubmitting(true)
    const ref = `AT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

    try {
      // 1. Deduct wallet
      const { error: deductErr } = await supabase.rpc('deduct_wallet', {
        p_user_id: user.id,
        p_amount: finalCostPesewas,
      })
      if (deductErr) throw deductErr

      // 2. Fetch updated balance
      const { data: updatedWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      // 3. Insert transaction
      const { data: tx, error: txErr } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'DATA_PURCHASE',
          amount: finalCostPesewas,
          balance_before: walletBalance,
          balance_after: updatedWallet?.balance ?? (walletBalance - finalCostPesewas),
          status: 'SUCCESS',
          reference: ref,
          network: network,
          recipient_phone: phone,
          metadata: {
            service_type: 'AIRTIME_TOPUP',
            airtime_face_value: rawCost,
            cashback_applied_ghs: discount,
            telecom_provider: 'DataMart GH',
          },
        })
        .select()
        .single()

      if (txErr) throw txErr

      // Invalidate queries to refresh wallet & history
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['my-stats'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })

      toast.success(`Airtime order of GHS ${rawCost.toFixed(2)} to ${phone} submitted! Telecom dispatch in progress.`)
      setCompletedTx(tx)
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch airtime. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Buy Airtime"
        subtitle="Instant recharge for MTN, Telecel, and AT numbers with a 2% wallet discount."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main form */}
        <div className="space-y-6">
          <form onSubmit={handlePurchaseAirtime} className="card p-6 space-y-6">
            {/* Network Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                1. Select Telecom Network
              </label>
              <div className="grid grid-cols-3 gap-3">
                {NETWORK_LIST.map((net) => {
                  const isSelected = network === net.id
                  return (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setNetwork(net.id)}
                      className={cn(
                        'flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 text-center relative overflow-hidden',
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                          : 'border-border bg-surface-raised hover:border-primary/40'
                      )}
                    >
                      <NetworkBadge network={net.id} />
                      <span className="mt-2 text-xs font-bold text-text">{net.label}</span>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recipient Phone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  2. Recipient Phone Number
                </label>
                <span className="text-[11px] text-text-muted">Network auto-detects</span>
              </div>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="e.g. 0551234567"
                  className="w-full rounded-xl border border-border bg-surface-raised pl-10 pr-4 py-3 text-sm font-semibold text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  required
                />
              </div>
            </div>

            {/* Amount Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  3. Airtime Value (GHS)
                </label>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                  <Zap size={13} /> {CASHBACK_PERCENT}% Instant Discount
                </span>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {AIRTIME_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-xs font-bold transition font-mono',
                      amount === amt
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-border bg-surface-raised text-text hover:border-primary/40'
                    )}
                  >
                    ₵{amt}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-text-muted text-sm">
                  ₵
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Custom amount"
                  className="w-full rounded-xl border border-border bg-surface-raised pl-8 pr-4 py-2.5 text-sm font-bold text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  required
                />
              </div>
            </div>

            {/* Price breakdown summary */}
            <div className="rounded-2xl border border-border bg-surface-raised p-4 space-y-2.5">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Airtime Face Value</span>
                <span className="font-mono font-semibold text-text">₵{rawCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-success">
                <span>Fast-DataHub 2% Discount</span>
                <span className="font-mono font-bold">-₵{discount.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-text">You Pay</span>
                <span className="text-base font-extrabold font-mono text-primary">
                  ₵{finalCost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              icon={Zap}
              loading={isSubmitting}
              disabled={isSubmitting || !hasEnoughBalance || rawCost < 1}
              className="w-full py-3 text-sm font-bold"
            >
              {!hasEnoughBalance
                ? 'Insufficient Wallet Balance'
                : `Recharge ₵${rawCost.toFixed(2)} Now`}
            </Button>
          </form>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <WalletCard
            balance={wallet.data?.balance}
            lastUpdated={wallet.data?.last_updated}
            loading={wallet.isLoading}
          />

          <div className="card p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" /> Fast Airtime Perks
            </h3>
            <ul className="space-y-2.5 text-xs text-text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>Instant dispatch straight to the recipient's phone.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>2% instant savings charged directly from your wallet balance.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>Zero transaction fees or MoMo withdrawal deduction.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {completedTx && (
        <TransactionReceiptModal
          transaction={completedTx}
          onClose={() => setCompletedTx(null)}
        />
      )}
    </>
  )
}
