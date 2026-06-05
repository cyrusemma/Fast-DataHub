import { useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { getRecentTransactions } from '../../api/transactions.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatRelative } from '../../utils/formatDate'
import { CREDIT_TYPES } from '../../utils/constants'
import { StatusBadge } from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { SkeletonRows } from '../ui/Skeleton'

export default function RecentTransactions() {
  const { data = [], isLoading } = useQuery({ queryKey: ['recent-transactions'], queryFn: () => getRecentTransactions(6) })

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-display text-base font-bold text-dark">Recent transactions</h2>
      </div>
      {isLoading ? <SkeletonRows rows={5} cols={3} /> : data.length === 0 ? (
        <EmptyState icon={Receipt} title="No transactions yet" message="Activity will appear here after your first top-up or data purchase." />
      ) : (
        <div className="divide-y divide-slate-100">
          {data.map((tx) => {
            const credit = CREDIT_TYPES.includes(tx.type)
            return (
              <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dark">{tx.data_bundles?.name || tx.type.replace('_', ' ')}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatRelative(tx.created_at)}</p>
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
  )
}
