import { CheckCircle } from 'lucide-react'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'
import { NETWORKS } from '../../utils/constants'
import { cn } from '../../utils/cn'

export default function BundleCard({ bundle, selected, onSelect }) {
  const network = NETWORKS[bundle.network]
  return (
    <button
      type="button"
      onClick={() => onSelect?.(bundle)}
      className={cn(
        'group relative w-full rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-primary/10'
          : 'border-border bg-surface hover:border-border-strong hover:bg-surface-raised'
      )}
    >
      {selected && <CheckCircle size={18} className="absolute right-3.5 top-3.5 text-primary animate-fade-in" />}
      <span
        className="inline-flex rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm"
        style={{ backgroundColor: network?.color, color: network?.text }}
      >
        {network?.label || bundle.network}
      </span>
      <p className="mt-3 font-display text-lg sm:text-xl font-extrabold text-text tracking-tight">
        {formatDataSize(bundle.data_size_mb)}
      </p>
      <p className="mt-0.5 text-xs text-text-muted">{bundle.validity_days} day validity</p>
      <p className="mt-3 font-display text-base sm:text-lg font-black text-primary">
        {formatGHS(bundle.price ?? bundle.selling_price)}
      </p>
    </button>
  )
}
