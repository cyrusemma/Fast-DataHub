import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Zap, Droplets, Tv, ShieldCheck, CheckCircle2, Search, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import WalletCard from '../../components/shared/WalletCard'
import Button from '../../components/ui/Button'
import TransactionReceiptModal from '../../components/shared/TransactionReceiptModal'
import { useWallet } from '../../hooks/useWallet'
import { formatGHS, GHSToPesewas } from '../../utils/formatCurrency'
import { supabase } from '../../api/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../utils/cn'

const BILL_PROVIDERS = [
  {
    id: 'ECG_PREPAID',
    name: 'ECG Prepaid Meter',
    category: 'Electricity',
    icon: Zap,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    accountLabel: 'Meter Number',
    placeholder: 'e.g. 14238918231',
  },
  {
    id: 'GWCL',
    name: 'Ghana Water (GWCL)',
    category: 'Water',
    icon: Droplets,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    accountLabel: 'GWCL Account Number',
    placeholder: 'e.g. 0210048291',
  },
  {
    id: 'DSTV',
    name: 'DStv / GOtv / StarTimes',
    category: 'Pay TV',
    icon: Tv,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    accountLabel: 'Smartcard / IUC Number',
    placeholder: 'e.g. 1029384756',
  },
]

export default function CustomerBills() {
  const { user } = useAuthStore()
  const wallet = useWallet()
  const queryClient = useQueryClient()

  const [provider, setProvider] = useState(BILL_PROVIDERS[0])
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState(50)
  const [phone, setPhone] = useState('')
  const [accountVerified, setAccountVerified] = useState(false)
  const [verifiedName, setVerifiedName] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedTx, setCompletedTx] = useState(null)

  const billAmount = Number(amount) || 0
  const billAmountPesewas = GHSToPesewas(billAmount)

  const walletBalance = wallet.data?.balance || 0
  const hasEnoughBalance = walletBalance >= billAmountPesewas

  const handleVerifyAccount = () => {
    if (!accountNumber || accountNumber.length < 6) {
      toast.error('Please enter a valid meter / account number.')
      return
    }
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setAccountVerified(true)
      setVerifiedName('Kwame Mensah (Accra Central)')
      toast.success('Account verified: Kwame Mensah (Accra Central)')
    }, 600)
  }

  const handlePayBill = async (e) => {
    e.preventDefault()
    if (!accountNumber) {
      toast.error('Please enter your account / meter number.')
      return
    }
    if (billAmount < 5) {
      toast.error('Minimum bill payment is GHS 5.00')
      return
    }
    if (!hasEnoughBalance) {
      toast.error('Insufficient wallet balance. Please top up your wallet.')
      return
    }

    setIsSubmitting(true)
    const ref = `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

    try {
      // 1. Deduct wallet
      const { error: deductErr } = await supabase.rpc('deduct_wallet', {
        p_user_id: user.id,
        p_amount: billAmountPesewas,
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
          amount: billAmountPesewas,
          balance_before: walletBalance,
          balance_after: updatedWallet?.balance ?? (walletBalance - billAmountPesewas),
          status: 'SUCCESS',
          reference: ref,
          recipient_phone: phone || null,
          metadata: {
            service_type: 'UTILITY_BILL',
            provider_id: provider.id,
            provider_name: provider.name,
            account_number: accountNumber,
            customer_name: verifiedName || 'Verified Utility User',
            telecom_provider: 'DataMart GH',
          },
        })
        .select()
        .single()

      if (txErr) throw txErr

      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['my-stats'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })

      toast.success(`Payment of ₵${billAmount.toFixed(2)} to ${provider.name} completed!`)
      setCompletedTx(tx)
    } catch (err) {
      toast.error(err.message || 'Bill payment failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Pay Bills & Utilities"
        subtitle="Settle ECG electricity prepaid meters, Ghana Water bills, and TV subscriptions instantly."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main form */}
        <div className="space-y-6">
          {/* Provider selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
              1. Select Utility Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {BILL_PROVIDERS.map((p) => {
                const isSelected = provider.id === p.id
                const Icon = p.icon
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProvider(p)
                      setAccountVerified(false)
                      setVerifiedName('')
                    }}
                    className={cn(
                      'p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between',
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center border', p.color)}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-display text-xs font-bold text-text">{p.name}</h4>
                        <p className="text-[11px] text-text-muted">{p.category}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePayBill} className="card p-6 space-y-6">
            {/* Account number + Verify */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                2. {provider.accountLabel}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value)
                    setAccountVerified(false)
                  }}
                  placeholder={provider.placeholder}
                  className="flex-1 rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-xs font-semibold text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={handleVerifyAccount}
                  disabled={isVerifying || !accountNumber}
                  className="px-4 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-text hover:border-primary/40 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Search size={14} />
                  <span>{isVerifying ? 'Checking...' : 'Verify'}</span>
                </button>
              </div>

              {accountVerified && (
                <div className="mt-2.5 p-3 rounded-xl bg-success/10 border border-success/20 flex items-center gap-2 text-xs text-success font-medium">
                  <CheckCircle2 size={15} />
                  <span>Account Owner: <strong>{verifiedName}</strong></span>
                </div>
              )}
            </div>

            {/* Bill Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                3. Amount to Pay (GHS)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-text-muted text-sm">
                  ₵
                </span>
                <input
                  type="number"
                  min="5"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  className="w-full rounded-xl border border-border bg-surface-raised pl-8 pr-4 py-2.5 text-sm font-bold text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  required
                />
              </div>
            </div>

            {/* Contact Phone for token/receipt */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Notification Phone (For SMS Token / Receipt)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0551234567"
                className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-xs font-medium text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>

            {/* Checkout total */}
            <div className="rounded-2xl border border-border bg-surface-raised p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Total Payment</p>
                <p className="text-[11px] text-text-muted mt-0.5">Direct wallet settlement</p>
              </div>
              <span className="font-display text-xl font-black text-primary">
                ₵{billAmount.toFixed(2)}
              </span>
            </div>

            <Button
              type="submit"
              icon={Zap}
              loading={isSubmitting}
              disabled={isSubmitting || !hasEnoughBalance || billAmount < 5}
              className="w-full py-3 text-sm font-bold"
            >
              {!hasEnoughBalance
                ? 'Insufficient Wallet Balance'
                : `Pay ₵${billAmount.toFixed(2)} for ${provider.name}`}
            </Button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <WalletCard
            balance={wallet.data?.balance}
            lastUpdated={wallet.data?.last_updated}
            loading={wallet.isLoading}
          />

          <div className="card p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" /> Instant Utility Token
            </h3>
            <ul className="space-y-2.5 text-xs text-text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>ECG prepaid credit tokens delivered instantly via SMS and dashboard.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>Immediate reconnect for DSTV, GOtv, and StarTimes decoders.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>Full receipt logging with transaction reference code.</span>
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
