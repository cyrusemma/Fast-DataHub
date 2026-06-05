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
        'relative rounded-xl border bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-100'
      )}
    >
      {selected && <CheckCircle size={18} className="absolute right-3 top-3 text-primary" />}
      <span className="inline-flex rounded-md px-2 py-1 text-xs font-bold" style={{ backgroundColor: network?.color, color: network?.text }}>
        {network?.label || bundle.network}
      </span>
      <p className="mt-4 font-display text-xl font-extrabold text-dark">{formatDataSize(bundle.data_size_mb)}</p>
      <p className="mt-1 text-sm text-slate-500">{bundle.validity_days} day validity</p>
      <p className="mt-4 font-display text-lg font-bold text-primary">{formatGHS(bundle.price ?? bundle.selling_price)}</p>
    </button>
  )
}
