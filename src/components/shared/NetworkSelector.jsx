import { NETWORK_LIST } from '../../utils/constants'
import { cn } from '../../utils/cn'

const SELECTOR_STYLES = {
  MTN: {
    bg: 'bg-gradient-to-br from-amber-400/20 via-yellow-500/10 to-surface hover:border-amber-400',
    selected: 'border-amber-500 ring-2 ring-amber-400/50 bg-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    badge: 'bg-[#FFCC00] text-black font-extrabold',
    bar: 'bg-gradient-to-r from-amber-400 to-yellow-500',
  },
  TELECEL: {
    bg: 'bg-gradient-to-br from-red-600/20 via-rose-600/10 to-surface hover:border-red-500',
    selected: 'border-red-600 ring-2 ring-red-500/50 bg-red-600/20 shadow-[0_0_15px_rgba(239,68,68,0.25)]',
    badge: 'bg-[#E40000] text-white font-extrabold',
    bar: 'bg-gradient-to-r from-red-600 to-rose-600',
  },
  AT: {
    bg: 'bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-red-500/20 hover:border-blue-500',
    selected: 'border-blue-600 ring-2 ring-blue-500/50 bg-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.25)]',
    badge: 'bg-gradient-to-r from-[#003087] to-[#E40000] text-white font-extrabold',
    bar: 'bg-gradient-to-r from-blue-600 to-red-500',
  },
}

export default function NetworkSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {NETWORK_LIST.map((network) => {
        const style = SELECTOR_STYLES[network.id] || SELECTOR_STYLES.MTN
        const isSelected = value === network.id
        return (
          <button
            key={network.id}
            type="button"
            onClick={() => onChange(network.id)}
            className={cn(
              'relative h-20 rounded-2xl border p-3 text-left shadow-sm transition-all duration-200 overflow-hidden',
              style.bg,
              isSelected ? style.selected : 'border-border'
            )}
          >
            {/* Top radiant line */}
            <div className={cn('absolute top-0 left-0 right-0 h-1', style.bar)} />

            <span className={cn('mb-1.5 inline-flex rounded-md px-2 py-0.5 text-xs shadow-sm', style.badge)}>
              {network.label}
            </span>
            <span className="block text-[11px] font-semibold text-text-muted">Browse packages</span>
          </button>
        )
      })}
    </div>
  )
}
