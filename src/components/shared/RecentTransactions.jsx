import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { getRecentTransactions } from '../../api/transactions.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatRelative } from '../../utils/formatDate'
import { CREDIT_TYPES } from '../../utils/constants'
import { StatusBadge } from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { SkeletonRows } from '../ui/Skeleton'
import TransactionReceiptModal from './TransactionReceiptModal'

export default function RecentTransactions() {
  const { data = [], isLoading } = useQuery({ queryKey: ['recent-transactions'], queryFn: () => getRecentTransactions(6) })
  const [selectedTx, setSelectedTx] = useState(null)

  return (
    <>
      <div className="card overflow-hidden">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-text">Recent transactions</h2>
          <span className="text-xs text-text-muted">Click any item for receipt</span>
        </div>
        {isLoading ? (
          <SkeletonRows rows={5} cols={3} />
        ) : data.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions yet" message="Activity will appear here after your first top-up or data purchase." />
        ) : (
          <div className="divide-y divide-border">
            {data.map((tx) => {
              const credit = CREDIT_TYPES.includes(tx.type)
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-surface-raised/60 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{tx.data_bundles?.name || tx.type.replace('_', ' ')}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{formatRelative(tx.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={credit ? 'text-sm font-bold text-success' : 'text-sm font-bold text-danger'}>
                      {credit ? '+' : '-'}{formatGHS(tx.amount)}
                    </p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <TransactionReceiptModal
        open={Boolean(selectedTx)}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </>
  )
}

