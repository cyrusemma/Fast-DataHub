import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCw, Zap, Phone, CheckCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { NetworkBadge } from '../ui/Badge'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { SkeletonCard } from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import { getTransactions, buyData } from '../../api/transactions.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'

export default function QuickReUp() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const { data: topReups = [], isLoading } = useQuery({
    queryKey: ['quick-reup-frequent'],
    queryFn: async () => {
      const res = await getTransactions({ page: 1, limit: 30, type: 'DATA_PURCHASE' })
      const txs = (res?.data || []).filter((t) => t.type === 'DATA_PURCHASE' && t.status === 'SUCCESS' && t.bundle_id && t.recipient_phone)

      // Frequency map by `${bundle_id}::${recipient_phone}`
      const map = new Map()
      txs.forEach((tx) => {
        const key = `${tx.bundle_id}::${tx.recipient_phone}`
        if (!map.has(key)) {
          map.set(key, {
            key,
            count: 0,
            bundleId: tx.bundle_id,
            bundleName: tx.data_bundles?.name || tx.metadata?.bundle_name || 'Data Bundle',
            dataSizeMb: tx.data_bundles?.data_size_mb || tx.metadata?.data_size_mb || 1024,
            network: tx.network || 'MTN',
            recipientPhone: tx.recipient_phone,
            lastPrice: tx.amount,
            lastDate: tx.created_at,
          })
        }
        map.get(key).count += 1
      })

      return Array.from(map.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    },
  })

  const handleOpenConfirm = (item) => {
    setSelectedItem(item)
    setConfirmOpen(true)
  }

  const handleQuickPurchase = async () => {
    if (!selectedItem) return
    setIsSubmitting(true)
    try {
      await buyData({
        bundleId: selectedItem.bundleId,
        recipientPhone: selectedItem.recipientPhone,
        idempotencyKey: crypto.randomUUID(),
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['my-stats'] }),
      ])
      toast.success(`Sent ${selectedItem.bundleName} to ${selectedItem.recipientPhone}!`)
      setConfirmOpen(false)
      setSelectedItem(null)
    } catch (err) {
      toast.error(err.message || 'Quick Re-Up failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Zap size={18} />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-dark">1-Tap Quick Re-Up</h2>
            <p className="text-xs text-slate-500">Your most frequent bundle recipients</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : topReups.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {topReups.map((item) => (
              <div
                key={item.key}
                className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:border-primary/40 hover:shadow-card transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <NetworkBadge network={item.network} />
                    <span className="text-[11px] font-semibold text-slate-400">
                      Ordered {item.count}×
                    </span>
                  </div>

                  <p className="mt-2.5 font-display text-sm font-bold text-dark truncate">
                    {item.bundleName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDataSize(item.dataSizeMb)}
                  </p>

                  <div className="mt-3 flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-50 rounded-lg px-2.5 py-1.5">
                    <Phone size={13} className="text-slate-400" />
                    <span>{item.recipientPhone}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="font-display text-sm font-extrabold text-primary">
                    {formatGHS(item.lastPrice)}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={RotateCw}
                    onClick={() => handleOpenConfirm(item)}
                  >
                    Send Again
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Zap}
            title="No frequent bundles yet"
            message="Your most frequent bundle and recipient combinations will appear here for 1-tap re-ordering after your first purchases."
          />
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Quick Re-Up"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button loading={isSubmitting} icon={ArrowRight} onClick={handleQuickPurchase}>
              Confirm & Pay {formatGHS(selectedItem?.lastPrice)}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Bundle</span>
            <span className="font-bold text-dark">{selectedItem?.bundleName}</span>
          </p>
          <p className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Recipient Phone</span>
            <span className="font-mono font-bold text-dark">{selectedItem?.recipientPhone}</span>
          </p>
          <p className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Network</span>
            <span className="font-bold text-dark">{selectedItem?.network}</span>
          </p>
          <p className="flex justify-between pt-1">
            <span className="text-slate-500">Amount Charged</span>
            <span className="font-display font-black text-primary text-base">
              {formatGHS(selectedItem?.lastPrice)}
            </span>
          </p>
        </div>
      </Modal>
    </div>
  )
}
