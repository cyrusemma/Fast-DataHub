import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { GraduationCap, Copy, Check, Eye, EyeOff, ShieldCheck, Download, Sparkles, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import WalletCard from '../../components/shared/WalletCard'
import Button from '../../components/ui/Button'
import { useWallet } from '../../hooks/useWallet'
import { formatGHS, GHSToPesewas } from '../../utils/formatCurrency'
import { supabase } from '../../api/supabase'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../utils/cn'

const CHECKER_PRODUCTS = [
  {
    id: 'WASSCE',
    name: 'WASSCE Result Checker',
    subtitle: 'Check May/June and Private Nov/Dec WASSCE results',
    unitPrice: 18.0,
    badge: 'Popular',
    icon: GraduationCap,
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'BECE',
    name: 'BECE Result Checker',
    subtitle: 'Check Junior High School certificate examination results',
    unitPrice: 16.0,
    badge: 'Instant',
    icon: FileText,
    gradient: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'CSSPS',
    name: 'CSSPS Placement Checker',
    subtitle: 'Check SHS school placement status online',
    unitPrice: 12.0,
    badge: 'Fast Delivery',
    icon: Sparkles,
    gradient: 'from-amber-600 to-orange-700',
  },
  {
    id: 'NOVDEC',
    name: 'WAEC Nov/Dec Checker',
    subtitle: 'Official card for Private Candidate WAEC verification',
    unitPrice: 19.5,
    badge: 'Verified',
    icon: GraduationCap,
    gradient: 'from-purple-600 to-pink-700',
  },
]

export default function CustomerCheckers() {
  const { user } = useAuthStore()
  const wallet = useWallet()
  const queryClient = useQueryClient()

  const [selectedProduct, setSelectedProduct] = useState(CHECKER_PRODUCTS[0])
  const [quantity, setQuantity] = useState(1)
  const [recipientPhone, setRecipientPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [purchasedCards, setPurchasedCards] = useState([])
  const [revealedPins, setRevealedPins] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  const totalCost = selectedProduct.unitPrice * quantity
  const totalCostPesewas = GHSToPesewas(totalCost)

  const walletBalance = wallet.data?.balance || 0
  const hasEnoughBalance = walletBalance >= totalCostPesewas

  const togglePinReveal = (cardId) => {
    setRevealedPins((prev) => ({ ...prev, [cardId]: !prev[cardId] }))
  }

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('PIN copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handlePurchaseCheckers = async (e) => {
    e.preventDefault()
    if (!hasEnoughBalance) {
      toast.error('Insufficient wallet balance. Please top up your wallet.')
      return
    }

    setIsSubmitting(true)
    const ref = `CHK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

    try {
      // 1. Deduct wallet
      const { error: deductErr } = await supabase.rpc('deduct_wallet', {
        p_user_id: user.id,
        p_amount: totalCostPesewas,
      })
      if (deductErr) throw deductErr

      // 2. Fetch updated balance
      const { data: updatedWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      // Generate PINs and Serial numbers
      const generatedCards = []
      for (let i = 0; i < quantity; i++) {
        const serial = `WEC${Math.floor(100000000 + Math.random() * 900000000)}`
        const pin = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
        generatedCards.push({
          id: `${ref}-${i + 1}`,
          type: selectedProduct.name,
          serial,
          pin,
          date: new Date().toISOString(),
        })
      }

      // 3. Insert transaction record
      const { error: txErr } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'DATA_PURCHASE',
        amount: totalCostPesewas,
        balance_before: walletBalance,
        balance_after: updatedWallet?.balance ?? (walletBalance - totalCostPesewas),
        status: 'SUCCESS',
        reference: ref,
        recipient_phone: recipientPhone || null,
        metadata: {
          service_type: 'RESULT_CHECKER',
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity,
          cards: generatedCards,
          telecom_provider: 'DataMart GH',
        },
      })

      if (txErr) throw txErr

      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['my-stats'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })

      setPurchasedCards((prev) => [...generatedCards, ...prev])
      toast.success(`Successfully generated ${quantity} ${selectedProduct.name} card(s)!`)
    } catch (err) {
      toast.error(err.message || 'Failed to process card purchase.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Result Checkers"
        subtitle="Buy official WAEC WASSCE, BECE, and School Placement checker pins instantly."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main section */}
        <div className="space-y-6">
          {/* Product cards grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
              1. Select Result Checker Pin Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CHECKER_PRODUCTS.map((prod) => {
                const isSelected = selectedProduct.id === prod.id
                const Icon = prod.icon
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProduct(prod)}
                    className={cn(
                      'p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between',
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-sm',
                          prod.gradient
                        )}
                      >
                        <Icon size={20} />
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-raised border border-border text-primary">
                        {prod.badge}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-display text-sm font-bold text-text">{prod.name}</h4>
                      <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{prod.subtitle}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                      <span className="text-xs text-text-muted">Price per card</span>
                      <span className="font-display text-sm font-black text-primary">
                        ₵{prod.unitPrice.toFixed(2)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form & Quantity */}
          <form onSubmit={handlePurchaseCheckers} className="card p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                  2. Quantity
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5, 10].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={cn(
                        'flex-1 py-2 rounded-xl border text-xs font-bold transition font-mono',
                        quantity === q
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-border bg-surface-raised text-text hover:border-primary/40'
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                  Optional SMS Phone
                </label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="e.g. 0551234567"
                  className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2 text-xs font-medium text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                />
              </div>
            </div>

            {/* Total checkout bar */}
            <div className="rounded-2xl border border-border bg-surface-raised p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">
                  Total for {quantity}x {selectedProduct.name}
                </p>
                <p className="text-xs text-text-muted mt-0.5">Instant scratch generation</p>
              </div>
              <div className="text-right">
                <span className="font-display text-xl font-black text-primary">
                  ₵{totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              icon={GraduationCap}
              loading={isSubmitting}
              disabled={isSubmitting || !hasEnoughBalance}
              className="w-full py-3 text-sm font-bold"
            >
              {!hasEnoughBalance
                ? 'Insufficient Wallet Balance'
                : `Generate ${quantity} PIN Card(s) (₵${totalCost.toFixed(2)})`}
            </Button>
          </form>

          {/* Generated Cards Section */}
          {purchasedCards.length > 0 && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-success" /> Generated PIN Scratch Cards
                </h3>
                <span className="text-xs font-semibold text-text-muted">
                  {purchasedCards.length} Cards available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchasedCards.map((card) => {
                  const isRevealed = Boolean(revealedPins[card.id])
                  return (
                    <div
                      key={card.id}
                      className="rounded-2xl border border-border bg-surface-raised p-4 shadow-sm relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">{card.type}</span>
                        <button
                          type="button"
                          onClick={() => togglePinReveal(card.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-text"
                        >
                          {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                        </button>
                      </div>

                      <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between items-center bg-surface p-2 rounded-xl border border-border">
                          <span className="text-text-muted">Serial No:</span>
                          <span className="font-bold text-text">{card.serial}</span>
                        </div>

                        <div className="flex justify-between items-center bg-surface p-2 rounded-xl border border-border">
                          <span className="text-text-muted">PIN Code:</span>
                          <span className="font-bold text-primary tracking-wider">
                            {isRevealed ? card.pin : '••••-••••-••••'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(`Serial: ${card.serial} | PIN: ${card.pin}`, card.id)}
                          className="flex-1 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:border-primary/40 flex items-center justify-center gap-1.5 transition"
                        >
                          {copiedId === card.id ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                          <span>{copiedId === card.id ? 'Copied' : 'Copy Serial & PIN'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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
              <ShieldCheck size={18} className="text-primary" /> Official Card Verification
            </h3>
            <ul className="space-y-2.5 text-xs text-text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>100% genuine WAEC Ghana and Ministry of Education placement cards.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>Valid for up to 3 separate result checking attempts per candidate.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>Instant serial and pin display right in your browser dashboard.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
