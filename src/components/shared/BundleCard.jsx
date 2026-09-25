import { CheckCircle, RotateCcw } from 'lucide-react'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'
import { NETWORKS } from '../../utils/constants'
import { cn } from '../../utils/cn'

export default function BundleCard({ bundle, selected, onSelect }) {
  const network = NETWORKS[bundle.network]
  const hasRollover = bundle.network === 'TELECEL' || bundle.name?.toLowerCase().includes('rollover')

  return (
    <button
      type="button"
      onClick={() => onSelect?.(bundle)}
      className={cn(
        'group relative flex w-full flex-col justify-between rounded-2xl border p-3.5 sm:p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-primary/10'
          : 'border-border bg-surface hover:border-border-strong hover:bg-surface-raised'
      )}
    >
      <div className="w-full">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <span
            className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] sm:text-xs font-bold shadow-sm shrink-0"
            style={{ backgroundColor: network?.color, color: network?.text }}
          >
            {network?.label || bundle.network}
          </span>
          <div className="flex items-center gap-1">
            {hasRollover && (
              <span className="text-[10px] font-bold text-emerald-500 rounded-full border border-emerald-500/30 px-2 py-0.5 bg-emerald-500/10 flex items-center gap-0.5">
                <RotateCcw size={10} /> Rollover
              </span>
            )}
            <span className="text-[11px] font-medium text-text-muted rounded-full border border-border px-2 py-0.5 bg-surface-raised">
              {bundle.validity_days ? `${bundle.validity_days}d` : 'Non-expiry'}
            </span>
          </div>
        </div>

        <p className="mt-3 font-display text-lg sm:text-2xl font-black text-text tracking-tight">
          {formatDataSize(bundle.data_size_mb)}
        </p>
        <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{bundle.name}</p>
      </div>

      <div className="mt-3.5 flex items-end justify-between border-t border-border/70 pt-2.5 w-full">
        <div>
          <span className="block text-[10px] uppercase font-bold text-text-subtle">Price</span>
          <p className="font-display text-base sm:text-lg font-black text-primary">
            {formatGHS(bundle.price ?? bundle.selling_price)}
          </p>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition',
            selected
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-muted group-hover:text-primary group-hover:bg-primary/10'
          )}
        >
          {selected ? (
            <>
              <CheckCircle size={14} /> Selected
            </>
          ) : (
            'Select'
          )}
        </span>
      </div>
    </button>
  )
}
