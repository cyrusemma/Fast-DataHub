import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle, Phone, Send } from 'lucide-react'
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
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light text-success">
          <CheckCircle size={34} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-dark">Bundle delivered</h1>
        <p className="mt-2 text-sm text-slate-500">{done.metadata?.bundle_name} was sent to {done.recipient_phone}.</p>
        <Button className="mt-6" onClick={() => { setDone(null); setBundle(null) }}>Buy another bundle</Button>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Buy data" subtitle="Choose a network, select a bundle, confirm the recipient, then pay from wallet." />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="font-display text-base font-bold text-dark">1. Select network</h2>
            <div className="mt-4"><NetworkSelector value={network} onChange={(n) => { setNetwork(n); setBundle(null) }} /></div>
          </div>
          <div className="card p-5">
            <h2 className="font-display text-base font-bold text-dark">3. Recipient phone</h2>
            <Input className="mt-4" icon={Phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0241234567" error={phone && !validPhone ? 'Enter a valid Ghana phone number' : ''} />
            <Button className="mt-4 w-full" disabled={!bundle || !validPhone} icon={Send} onClick={() => setConfirm(true)}>Review purchase</Button>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-base font-bold text-dark">2. Pick bundle</h2>
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
          <p className="flex justify-between"><span className="text-slate-500">Bundle</span><span className="font-semibold text-dark">{bundle?.name}</span></p>
          <p className="flex justify-between"><span className="text-slate-500">Recipient</span><span className="font-semibold text-dark">{normalizeGhanaPhone(phone)}</span></p>
          <p className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-display font-bold text-primary">{formatGHS(bundle?.price)}</span></p>
        </div>
      </Modal>
    </>
  )
}
