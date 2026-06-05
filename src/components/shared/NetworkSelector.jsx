import { NETWORK_LIST } from '../../utils/constants'
import { cn } from '../../utils/cn'

export default function NetworkSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {NETWORK_LIST.map((network) => (
        <button
          key={network.id}
          type="button"
          onClick={() => onChange(network.id)}
          className={cn(
            'h-20 rounded-xl border bg-white p-3 text-left shadow-card transition',
            value === network.id ? 'border-primary ring-2 ring-primary/20' : 'border-slate-100 hover:border-primary/40'
          )}
        >
          <span
            className="mb-2 inline-flex rounded-md px-2 py-1 text-xs font-bold"
            style={{ backgroundColor: network.color, color: network.text }}
          >
            {network.label}
          </span>
          <span className="block text-xs font-medium text-slate-500">Browse bundles</span>
        </button>
      ))}
    </div>
  )
}
