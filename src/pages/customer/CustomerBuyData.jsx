import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CheckCircle,
  Megaphone,
  Phone,
  Send,
  Flame,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  User,
  ArrowRight,
  Wallet,
  RotateCcw,
  CheckCircle2,
  Clock,
  Truck,
  Star,
} from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import NetworkSelector from '../../components/shared/NetworkSelector'
import BundleCard from '../../components/shared/BundleCard'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { NetworkBadge } from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { getBundles } from '../../api/bundles.api'
import { buyData, getRecentTransactions } from '../../api/transactions.api'
import { useRole } from '../../hooks/useRole'
import { useAuthStore } from '../../store/authStore'
import { useWalletStore } from '../../store/walletStore'
import { useWallet } from '../../hooks/useWallet'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'
import {
  isValidGhanaPhone,
  normalizeGhanaPhone,
  detectGhanaNetwork,
} from '../../utils/phoneValidation'
import { cn } from '../../utils/cn'

export default function CustomerBuyData() {
  const { role } = useRole()
  const profile = useAuthStore((s) => s.profile)
  const balance = useWalletStore((s) => s.balance)
  useWallet() // ensures live balance sync

  const [network, setNetwork] = useState('MTN')
  const [bundle, setBundle] = useState(null)
  const [phone, setPhone] = useState(profile?.phone || '')
  const [confirm, setConfirm] = useState(false)
  const [verifiedByUser, setVerifiedByUser] = useState(false)
  const [done, setDone] = useState(null)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  // Manual User Favorites from localStorage
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fdh_user_favorites') || '[]')
    } catch {
      return []
    }
  })

  const toggleFavorite = (b) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(b.id)
      const next = exists ? prev.filter((id) => id !== b.id) : [...prev, b.id]
      localStorage.setItem('fdh_user_favorites', JSON.stringify(next))
      if (exists) {
        toast.info(`Removed ${b.name} from favorites`)
      } else {
        toast.success(`Saved ${b.name} to your favorites! ⭐`)
      }
      return next
    })
  }

  // Bundles query
  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['bundles', network, role],
    queryFn: () => getBundles({ network, role }),
  })

  // Recent recipients & purchase history query for 1-tap quick fill + smart frequency algorithm
  const { data: recentTxs = [] } = useQuery({
    queryKey: ['recent-recipients-buy-data'],
    queryFn: () => getRecentTransactions(15),
  })

  // Intelligent Frequency-Based Auto-Suggestion Algorithm
  const frequencyMap = useMemo(() => {
    const counts = {}
    recentTxs.forEach((t) => {
      if (t.bundle_id) {
        counts[t.bundle_id] = (counts[t.bundle_id] || 0) + 1
      }
      if (t.metadata?.bundle_name) {
        counts[t.metadata.bundle_name] = (counts[t.metadata.bundle_name] || 0) + 1
      }
    })
    return counts
  }, [recentTxs])

  // Suggested & Favorite bundles for this network
  const favoriteAndSuggestedBundles = useMemo(() => {
    return bundles.filter((b) => {
      const isManualFav = favoriteIds.includes(b.id)
      const count = frequencyMap[b.id] || frequencyMap[b.name] || 0
      return isManualFav || count >= 2
    })
  }, [bundles, favoriteIds, frequencyMap])

  const recentRecipients = useMemo(() => {
    const list = []
    const seen = new Set()
    recentTxs.forEach((t) => {
      if (t.recipient_phone && !seen.has(t.recipient_phone)) {
        seen.add(t.recipient_phone)
        list.push({ phone: t.recipient_phone, network: t.network || detectGhanaNetwork(t.recipient_phone) })
      }
    })
    return list.slice(0, 3)
  }, [recentTxs])

  // Phone validation & carrier detection
  const normalizedPhone = useMemo(() => normalizeGhanaPhone(phone), [phone])
  const validPhone = useMemo(() => isValidGhanaPhone(phone), [phone])
  const detectedCarrier = useMemo(() => detectGhanaNetwork(phone), [phone])
  const isCarrierMismatch = Boolean(validPhone && detectedCarrier && detectedCarrier !== network)

  // Best-value featured bundles
  const featuredBundles = useMemo(() => {
    const valueScore = (b) => (b.price ?? b.selling_price ?? 1) / Math.max(b.data_size_mb || 1, 1)
    return [...bundles]
      .sort((a, b) => valueScore(a) - valueScore(b))
      .slice(0, 3)
  }, [bundles])

  const bundlePrice = bundle?.price ?? bundle?.selling_price ?? 0
  const hasSufficientBalance = balance >= bundlePrice
  const balanceAfterPurchase = Math.max(0, balance - bundlePrice)

  const handleOpenReview = () => {
    if (!validPhone) {
      toast.error('Please enter a valid Ghanaian phone number')
      return
    }
    if (!bundle) {
      toast.error('Please select a data bundle')
      return
    }
    setVerifiedByUser(false)
    setConfirm(true)
  }

  const submit = async () => {
    if (!verifiedByUser) {
      toast.error('Please check the verification box before continuing')
      return
    }
    if (!hasSufficientBalance) {
      toast.error('Insufficient wallet balance. Please top up your wallet.')
      return
    }

    setLoading(true)
    try {
      const tx = await buyData({
        bundleId: bundle.id,
        recipientPhone: normalizedPhone,
        idempotencyKey: crypto.randomUUID(),
      })
      setDone(tx)
      setConfirm(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['my-stats'] }),
      ])
      toast.success('Order placed! Telecom dispatch is currently processing.')
    } catch (err) {
      toast.error(err.message || 'Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    const isSuccess = done.status === 'SUCCESS' || done.status === 'DELIVERED'
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-surface p-6 sm:p-10 text-center shadow-xl animate-fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary shadow-inner">
          <Clock size={40} className="animate-pulse" strokeWidth={2.5} />
        </div>
        <h1 className="mt-6 font-display text-2xl sm:text-3xl font-black text-text">
          Order Placed & Processing
        </h1>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">
          Your order for <strong className="text-text">{done.metadata?.bundle_name || 'Data Bundle'}</strong> to{' '}
          <strong className="font-mono text-text">{done.recipient_phone}</strong> has been received by the gateway.
          Telecom network delivery typically completes in <strong>30–120 seconds</strong>.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-surface-raised p-4 text-xs space-y-2.5 text-left">
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              Processing with Carrier
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Transaction Reference:</span>
            <span className="font-mono font-bold text-text">{done.reference || 'REF-' + Date.now()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Amount Deducted:</span>
            <span className="font-bold text-primary font-mono">{formatGHS(done.amount || bundlePrice)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/track"
            className="flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary/90 transition"
          >
            <Truck size={16} /> Track Order Live
          </Link>
          <Button
            size="lg"
            variant="outline"
            icon={RotateCcw}
            onClick={() => {
              setDone(null)
              setBundle(null)
            }}
          >
            Buy Another Bundle
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Buy Data"
        subtitle="Choose your network, verify recipient number, select your bundle, and pay instantly from your wallet."
      />

      {/* Service live notice */}
      <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-surface to-success/10 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/20">
              <Megaphone size={18} />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-text">Automated Real-Time Telco Delivery</p>
              <p className="text-xs sm:text-sm text-text-muted">
                Direct API delivery to MTN, Telecel, and AT Ghana. Select your carrier to view live wholesale offers.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-text-muted shadow-sm">
              <TrendingUp size={14} className="text-success" /> {bundles.length} live offers
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-text-muted shadow-sm">
              <CheckCircle2 size={14} className="text-primary" /> Best-value deals highlighted
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr] xl:grid-cols-[420px_1fr]">
        {/* LEFT COLUMN: 1. SELECT NETWORK & 2. RECIPIENT PHONE VERIFICATION */}
        <div className="space-y-6">
          {/* Step 1: Network Selection */}
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-text-muted">
                Step 1 · Choose Network
              </h2>
              <NetworkBadge network={network} />
            </div>
            <div className="mt-3.5">
              <NetworkSelector
                value={network}
                onChange={(n) => {
                  setNetwork(n)
                  setBundle(null)
                }}
              />
            </div>
          </div>

          {/* Step 2: Recipient Phone Number & Verification */}
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-text-muted">
                Step 2 · Verify Recipient Number
              </h2>
              {validPhone && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                  <CheckCircle2 size={13} /> Verified Phone
                </span>
              )}
            </div>

            <div className="mt-3.5 space-y-3">
              <div className="relative">
                <Input
                  label="Recipient Phone Number (Ghana)"
                  icon={Phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0241234567 or 0551234567"
                  className="font-mono text-sm tracking-wide font-semibold"
                  error={phone && !validPhone ? 'Enter a valid 10-digit Ghana phone number (e.g. 024XXXXXXX)' : ''}
                />
                {detectedCarrier && (
                  <div className="absolute right-3 top-8 pointer-events-none">
                    <NetworkBadge network={detectedCarrier} />
                  </div>
                )}
              </div>

              {/* Quick Fill Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {profile?.phone && phone !== profile.phone && (
                  <button
                    type="button"
                    onClick={() => setPhone(profile.phone)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-xs font-semibold text-text hover:border-primary hover:text-primary transition"
                  >
                    <User size={12} /> Use My Number ({profile.phone})
                  </button>
                )}
                {recentRecipients.map((rec) => (
                  <button
                    key={rec.phone}
                    type="button"
                    onClick={() => setPhone(rec.phone)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-mono transition',
                      phone === rec.phone
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-surface-raised text-text-muted hover:border-primary/40 hover:text-text'
                    )}
                  >
                    <Phone size={11} /> {rec.phone}
                  </button>
                ))}
              </div>

              {/* Carrier Mismatch Warning Banner */}
              {isCarrierMismatch && (
                <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3.5 text-xs text-text space-y-2 animate-fade-in">
                  <div className="flex items-start gap-2 text-warning">
                    <AlertTriangle size={17} className="shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Carrier Mismatch Detected:</strong>
                      <p className="mt-0.5 text-text-muted leading-relaxed">
                        This number (<span className="font-mono font-bold text-text">{phone}</span>) belongs to{' '}
                        <strong className="text-text">{detectedCarrier}</strong>, but you are buying an{' '}
                        <strong className="text-text">{network}</strong> bundle.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-warning/20">
                    <span className="text-[11px] text-text-muted">Did you mean to switch carrier?</span>
                    <button
                      type="button"
                      onClick={() => setNetwork(detectedCarrier)}
                      className="rounded-lg bg-warning text-dark px-2.5 py-1 text-[11px] font-extrabold shadow-sm hover:brightness-105 transition"
                    >
                      Switch to {detectedCarrier}
                    </button>
                  </div>
                </div>
              )}

              {/* Selected summary & CTA button */}
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Selected Bundle:</span>
                  <span className="font-bold text-text truncate max-w-[200px]">
                    {bundle ? `${bundle.name} (${formatGHS(bundlePrice)})` : 'None selected'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Available Wallet:</span>
                  <span className={cn('font-bold', hasSufficientBalance ? 'text-success' : 'text-danger')}>
                    {formatGHS(balance)}
                  </span>
                </div>

                <Button
                  className="w-full mt-2"
                  size="lg"
                  disabled={!bundle || !validPhone}
                  iconRight={ArrowRight}
                  onClick={handleOpenReview}
                >
                  Review & Verify Purchase
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 3. DATA BUNDLE CATALOG (RESPONSIVE GRID) */}
        <div className="space-y-5">
          <div className="card p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-text">
                  Step 3 · Select {network} Data Bundle
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  Pick your preferred volume and validity. Best-value bundles are ranked first.
                </p>
              </div>
              <span className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-semibold text-text-muted shrink-0">
                {bundles.length} bundles available
              </span>
            </div>

            {/* Smart Favorites & Frequently Bought Shelf */}
            {favoriteAndSuggestedBundles.length > 0 && (
              <div className="mt-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-surface to-primary/5 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500">
                    <Star size={14} className="fill-amber-500 text-amber-500" />
                    <span>Your Favorite & Frequent {network} Packages</span>
                  </div>
                  <span className="text-[10px] text-text-muted">1-tap re-order</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {favoriteAndSuggestedBundles.map((item) => (
                    <BundleCard
                      key={`fav-${item.id}`}
                      bundle={item}
                      selected={bundle?.id === item.id}
                      onSelect={setBundle}
                      isFavorite={favoriteIds.includes(item.id)}
                      onToggleFavorite={toggleFavorite}
                      frequencyCount={frequencyMap[item.id] || frequencyMap[item.name] || 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Featured Best-Value Row */}
            {featuredBundles.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  <Flame size={14} className="text-primary" />
                  <span>Featured Best-Value Packages</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {featuredBundles.map((item) => (
                    <BundleCard
                      key={`feat-${item.id}`}
                      bundle={item}
                      selected={bundle?.id === item.id}
                      onSelect={setBundle}
                      isFavorite={favoriteIds.includes(item.id)}
                      onToggleFavorite={toggleFavorite}
                      frequencyCount={frequencyMap[item.id] || frequencyMap[item.name] || 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Bundles Grid */}
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  All {network} Bundles
                </h3>
                <span className="text-[11px] text-text-muted">
                  Click the <Star size={11} className="inline text-amber-500" /> on any card to save to favorites
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                ) : bundles.length > 0 ? (
                  bundles.map((b) => (
                    <BundleCard
                      key={b.id}
                      bundle={b}
                      selected={bundle?.id === b.id}
                      onSelect={setBundle}
                      isFavorite={favoriteIds.includes(b.id)}
                      onToggleFavorite={toggleFavorite}
                      frequencyCount={frequencyMap[b.id] || frequencyMap[b.name] || 0}
                    />
                  ))
                ) : (
                  <div className="sm:col-span-2 xl:col-span-3">
                    <EmptyState
                      title="No bundles found"
                      message={`No active bundles configured for ${network}. Please switch to another carrier.`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DOUBLE-VERIFICATION CONFIRMATION MODAL */}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Verify & Confirm Purchase"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              loading={loading}
              disabled={!verifiedByUser || !hasSufficientBalance}
              onClick={submit}
              icon={ShieldCheck}
            >
              Pay {formatGHS(bundlePrice)}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Prominent Verification Highlight Card */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Recipient Phone Number
              </span>
              <NetworkBadge network={detectedCarrier || network} />
            </div>

            <p className="font-mono text-2xl font-black text-text tracking-wider">
              {normalizedPhone}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <CheckCircle size={14} className="text-success" />
              <span>Validated Ghanaian mobile line on {detectedCarrier || network}</span>
            </div>
          </div>

          {/* Bundle & Financial Breakdown */}
          <div className="rounded-2xl border border-border bg-surface-raised p-4 space-y-2.5 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-muted">Package:</span>
              <span className="font-bold text-text">{bundle?.name} ({formatDataSize(bundle?.data_size_mb)})</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-muted">Network:</span>
              <span className="font-bold text-text">{network}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-text-muted">Price:</span>
              <span className="font-display font-black text-primary text-base">
                {formatGHS(bundlePrice)}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-xs">
              <span className="text-text-muted">Wallet Balance After Purchase:</span>
              <span className={cn('font-bold', hasSufficientBalance ? 'text-success' : 'text-danger')}>
                {formatGHS(balanceAfterPurchase)}
              </span>
            </div>
          </div>

          {!hasSufficientBalance && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-semibold">
              <AlertTriangle size={16} className="shrink-0" />
              <span>Insufficient balance. Need {formatGHS(bundlePrice - balance)} more to purchase.</span>
            </div>
          )}

          {/* Explicit User Verification Checkbox */}
          <label className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5 cursor-pointer select-none transition hover:border-primary/40">
            <input
              type="checkbox"
              checked={verifiedByUser}
              onChange={(e) => setVerifiedByUser(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div className="text-xs">
              <span className="font-bold text-text">
                I have double-checked and verified that {normalizedPhone} is the correct recipient.
              </span>
              <p className="mt-0.5 text-text-muted">
                Data purchases are delivered automatically and cannot be recalled or refunded once sent.
              </p>
            </div>
          </label>
        </div>
      </Modal>
    </>
  )
}
