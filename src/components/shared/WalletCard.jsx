import { Wallet, Plus, ArrowUpRight } from 'lucide-react'
import { formatGHS } from '../../utils/formatCurrency'
import { formatRelative } from '../../utils/formatDate'

export default function WalletCard({ balance, lastUpdated, onTopUp, currency = 'GHS', loading }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-dark p-6 text-white shadow-lg mesh-bg">
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <Wallet size={18} />
            <span className="text-sm font-medium">Wallet balance</span>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold backdrop-blur">{currency}</span>
        </div>

        <p className="mt-5 font-display text-4xl font-extrabold tabular-nums">
          {loading ? <span className="inline-block h-9 w-40 animate-pulse rounded-lg bg-white/10" /> : formatGHS(balance)}
        </p>
        <p className="mt-1.5 text-xs text-white/50">
          {lastUpdated ? `Updated ${formatRelative(lastUpdated)}` : 'Live balance'}
        </p>

        {onTopUp && (
          <button
            onClick={onTopUp}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-white/90"
          >
            <Plus size={17} /> Top up wallet
            <ArrowUpRight size={15} className="text-primary" />
          </button>
        )}
      </div>
    </div>
  )
}
