import { Wallet, Plus, ArrowUpRight } from 'lucide-react'
import { formatGHS } from '../../utils/formatCurrency'
import { formatRelative } from '../../utils/formatDate'

export default function WalletCard({ balance, lastUpdated, onTopUp, currency = 'GHS', loading }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary to-primary/85 p-6 text-white shadow-lg shadow-primary/10">
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/80">
            <Wallet size={18} />
            <span className="text-sm font-medium">Wallet balance</span>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur">{currency}</span>
        </div>

        <p className="mt-5 font-display text-4xl font-extrabold tabular-nums">
          {loading ? <span className="inline-block h-9 w-40 animate-pulse rounded-lg bg-white/20" /> : formatGHS(balance)}
        </p>
        <p className="mt-1.5 text-xs text-white/70">
          {lastUpdated ? `Updated ${formatDateRelative(lastUpdated)}` : 'Live balance'}
        </p>

        {onTopUp && (
          <button
            onClick={onTopUp}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-sm font-semibold text-text shadow-sm transition hover:bg-surface-raised"
          >
            <Plus size={17} /> Top up wallet
            <ArrowUpRight size={15} className="text-primary" />
          </button>
        )}
      </div>
    </div>
  )
}
