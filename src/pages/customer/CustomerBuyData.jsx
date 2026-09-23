import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle, Megaphone, Phone, Send, Sparkles, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import NetworkSelector from '../../components/shared/NetworkSelector'
import BundleCard from '../../components/shared/BundleCard'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { getBundles } from '../../api/bundles.api'
import { buyData } from '../../api/transactions.api'
import { useRole } from '../../hooks/useRole'
import { useAuthStore } from '../../store/authStore'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'
import { isValidGhanaPhone, normalizeGhanaPhone } from '../../utils/phoneValidation'

export default function CustomerBuyData() {
  const { role } = useRole()
  const profile = useAuthStore((s) => s.profile)
  const [network, setNetwork] = useState('MTN')
  const [bundle, setBundle] = useState(null)
  const [phone, setPhone] = useState(profile?.phone || '')
  const [confirm, setConfirm] = useState(false)
  const [done, setDone] = useState(null)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const { data: bundles = [], isLoading } = useQuery({ queryKey: ['bundles', network, role], queryFn: () => getBundles({ network, role }) })
  const validPhone = useMemo(() => isValidGhanaPhone(phone), [phone])
  const featuredBundles = useMemo(() => {
    const valueScore = (bundleItem) => bundleItem.price / Math.max(bundleItem.data_size_mb || 1, 1)
    return [...bundles]
      .sort((left, right) => valueScore(left) - valueScore(right))
      .slice(0, 3)
  }, [bundles])
  const liveOfferCount = bundles.length

  const submit = async () => {
    setLoading(true)
    try {
      const tx = await buyData({ bundleId: bundle.id, recipientPhone: normalizeGhanaPhone(phone), idempotencyKey: crypto.randomUUID() })
      setDone(tx)
      setConfirm(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ])
      toast.success('Data purchase successful')
    } catch (err) {
      toast.error(err.message || 'Purchase failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle size={34} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-text">Bundle delivered</h1>
        <p className="mt-2 text-sm text-text-muted">{done.metadata?.bundle_name} was sent to {done.recipient_phone}.</p>
        <Button className="mt-6" onClick={() => { setDone(null); setBundle(null) }}>Buy another bundle</Button>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Buy data" subtitle="Choose a network, select a bundle, confirm the recipient, then pay from wallet." />
      <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-surface to-success/10 px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/20">
              <Megaphone size={18} />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-text">Service notice</p>
              <p className="text-sm text-text-muted">Live bundle prices are updated in real time. Pick the network first to see current offers.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-text-muted shadow-sm">
              <TrendingUp size={14} className="text-success" /> {liveOfferCount} live offers
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-text-muted shadow-sm">
              <Sparkles size={14} className="text-primary" /> Best-value bundles highlighted
            </span>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="font-display text-base font-bold text-text">1. Select network</h2>
            <div className="mt-4"><NetworkSelector value={network} onChange={(n) => { setNetwork(n); setBundle(null) }} /></div>
          </div>
          <div className="card p-5">
            <h2 className="font-display text-base font-bold text-text">3. Recipient phone</h2>
            <Input className="mt-4" icon={Phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0241234567" error={phone && !validPhone ? 'Enter a valid Ghana phone number' : ''} />
            <Button className="mt-4 w-full" disabled={!bundle || !validPhone} icon={Send} onClick={() => setConfirm(true)}>Review purchase</Button>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-text">2. Pick bundle</h2>
              <p className="mt-1 text-xs text-text-muted">Best-value offers are highlighted first for faster comparison.</p>
            </div>
            <span className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-semibold text-text-muted">{bundles.length} offers</span>
          </div>

          {featuredBundles.length > 0 && (
            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              {featuredBundles.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBundle(item)}
                  className={`rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    bundle?.id === item.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-primary/10'
                      : 'border-border bg-surface hover:border-border-strong hover:bg-surface-raised'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-sm"
                      style={{ backgroundColor: index === 0 ? '#0F9D58' : index === 1 ? '#FFB300' : '#0066FF', color: '#fff' }}
                    >
                      {index === 0 ? 'Best value' : index === 1 ? 'Popular' : 'Hot pick'}
                    </span>
                    <span className="text-xs font-semibold text-text-subtle">{item.network}</span>
                  </div>
                  <p className="mt-3 font-display text-base font-extrabold text-text">{item.name}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{formatDataSize(item.data_size_mb)} · {item.validity_days} day validity</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="font-display text-lg font-extrabold text-primary">{formatGHS(item.price)}</p>
                    <span className="text-xs font-semibold text-text-subtle">Tap to select</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : bundles.length ? bundles.map((b) => (
              <BundleCard key={b.id} bundle={b} selected={bundle?.id === b.id} onSelect={setBundle} />
            )) : <div className="sm:col-span-2 xl:col-span-3"><EmptyState title="No bundles found" /></div>}
          </div>
        </div>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Confirm purchase" footer={
        <>
          <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button loading={loading} onClick={submit}>Pay {formatGHS(bundle?.price)}</Button>
        </>
      }>
        <div className="space-y-3 text-sm">
          <p className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Bundle</span><span className="font-semibold text-text">{bundle?.name}</span></p>
          <p className="flex justify-between border-b border-border pb-2"><span className="text-text-muted">Recipient</span><span className="font-mono font-semibold text-text">{normalizeGhanaPhone(phone)}</span></p>
          <p className="flex justify-between pt-1"><span className="text-text-muted">Amount</span><span className="font-display font-black text-primary text-base">{formatGHS(bundle?.price)}</span></p>
        </div>
      </Modal>
    </>
  )
}
