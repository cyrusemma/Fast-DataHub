import { NETWORK_LIST } from '../../utils/constants'
import { cn } from '../../utils/cn'

const SELECTOR_STYLES = {
  MTN: {
    bg: 'bg-gradient-to-br from-amber-400/10 via-yellow-500/5 to-surface hover:border-amber-400',
    selected: 'border-2 border-yellow-200 ring-4 ring-amber-400/60 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.6)]',
    badge: 'bg-[#FFCC00] text-slate-950 font-black shadow-sm',
    badgeSelected: 'bg-slate-950 text-[#FFCC00] font-black shadow-sm',
    bar: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 h-1.5',
    subtext: 'text-text-muted',
    subtextSelected: 'text-amber-950/80 font-bold',
  },
  TELECEL: {
    bg: 'bg-gradient-to-br from-red-600/10 via-rose-600/5 to-surface hover:border-red-500',
    selected: 'border-2 border-rose-300 ring-4 ring-red-500/60 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)]',
    badge: 'bg-[#E40000] text-white font-black shadow-sm',
    badgeSelected: 'bg-white text-red-600 font-black shadow-sm',
    bar: 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 h-1.5',
    subtext: 'text-text-muted',
    subtextSelected: 'text-rose-100/90 font-bold',
  },
  AT: {
    bg: 'bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-red-500/10 hover:border-blue-500',
    selected: 'border-2 border-blue-300 ring-4 ring-blue-500/60 bg-gradient-to-br from-blue-600 via-indigo-600 to-red-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.6)]',
    badge: 'bg-gradient-to-r from-[#003087] to-[#E40000] text-white font-black shadow-sm',
    badgeSelected: 'bg-white text-blue-700 font-black shadow-sm',
    bar: 'bg-gradient-to-r from-blue-600 via-indigo-500 to-red-500 h-1.5',
    subtext: 'text-text-muted',
    subtextSelected: 'text-blue-100/90 font-bold',
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
            {!isSelected && <div className={cn('absolute top-0 left-0 right-0 h-1.5', style.bar)} />}

            <span
              className={cn(
                'mb-1.5 inline-flex rounded-md px-2 py-0.5 text-xs shadow-sm',
                isSelected ? style.badgeSelected : style.badge
              )}
            >
              {network.label}
            </span>
            <span
              className={cn(
                'block text-[11px] font-semibold',
                isSelected ? style.subtextSelected : style.subtext
              )}
            >
              Browse packages
            </span>
          </button>
        )
      })}
    </div>
  )
}
