import { useQuery } from '@tanstack/react-query'
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import WalletCard from '../../components/shared/WalletCard'
import TopUpPanel from '../../components/shared/TopUpPanel'
import EmptyState from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/Badge'
import { SkeletonRows } from '../../components/ui/Skeleton'
import { useWallet } from '../../hooks/useWallet'
import { getTransactions } from '../../api/transactions.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDateTime, formatRelative } from '../../utils/formatDate'

export default function CustomerWallet() {
  const wallet = useWallet()

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['customer-wallet-transactions'],
    queryFn: async () => {
      const res = await getTransactions({ page: 1, limit: 20 })
      const filtered = (res?.data || []).filter((t) => t.type === 'TOPUP' || t.type === 'REFUND')
      return filtered.slice(0, 10)
    },
  })

  return (
    <>
      <PageHeader
        title="My Wallet"
        subtitle="Manage your prepaid balance, top up with Mobile Money or Card, and view deposits."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <WalletCard
            balance={wallet.data?.balance}
            lastUpdated={wallet.data?.last_updated}
            loading={wallet.isLoading}
          />

          {/* Wallet activity history (TOPUP / REFUND) */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="font-display text-base font-bold text-text">Wallet Deposits & Credits</h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  Recent top-ups and refund transactions
                </p>
              </div>
              <span className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                {txData?.length || 0} records
              </span>
            </div>

            {txLoading ? (
              <SkeletonRows rows={5} cols={4} />
            ) : txData && txData.length > 0 ? (
              <div className="divide-y divide-border">
                {txData.map((tx) => {
                  const isCredit = tx.type === 'TOPUP' || tx.type === 'REFUND'
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-4 p-4 hover:bg-surface-raised/60 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                            isCredit
                              ? 'bg-success/15 border-success/20 text-success'
                              : 'bg-danger/15 border-danger/20 text-danger'
                          }`}
                        >
                          {tx.type === 'REFUND' ? (
                            <RefreshCw size={18} />
                          ) : (
                            <ArrowDownLeft size={18} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-sm font-bold text-text truncate">
                            {tx.type === 'REFUND' ? 'Wallet Refund' : 'Paystack Top-up'}
                          </p>
                          <p className="text-xs text-text-muted font-mono truncate">
                            {tx.reference} · {formatRelative(tx.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-display text-sm font-extrabold text-success">
                          +{formatGHS(tx.amount)}
                        </p>
                        <div className="mt-0.5 flex items-center justify-end gap-1.5">
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8">
                <EmptyState
                  icon={Wallet}
                  title="No wallet deposits yet"
                  message="Use the panel on the right to make your first wallet top-up."
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <TopUpPanel />
        </div>
      </div>
    </>
  )
}
