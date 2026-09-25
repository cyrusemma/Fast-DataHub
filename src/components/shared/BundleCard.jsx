import { CheckCircle, RotateCcw, Star, Zap, Flame } from 'lucide-react'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'
import { NETWORKS } from '../../utils/constants'
import { cn } from '../../utils/cn'

const NETWORK_THEMES = {
  MTN: {
    bg: 'bg-gradient-to-br from-amber-500/15 via-yellow-500/8 to-surface',
    border: 'border-amber-400/40 hover:border-amber-400 hover:shadow-[0_4px_20px_rgba(245,158,11,0.18)]',
    selectedBorder: 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    topBar: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500',
    badgeBg: 'bg-[#FFCC00] text-black font-extrabold',
    accentColor: '#D97706',
  },
  TELECEL: {
    bg: 'bg-gradient-to-br from-red-600/15 via-rose-600/8 to-surface',
    border: 'border-red-500/40 hover:border-red-500 hover:shadow-[0_4px_20px_rgba(239,68,68,0.18)]',
    selectedBorder: 'border-red-600 ring-2 ring-red-500/40 bg-red-600/15 shadow-[0_0_20px_rgba(239,68,68,0.25)]',
    topBar: 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600',
    badgeBg: 'bg-[#E40000] text-white font-extrabold',
    accentColor: '#DC2626',
  },
  AT: {
    bg: 'bg-gradient-to-br from-blue-600/15 via-indigo-600/8 to-red-500/15',
    border: 'border-blue-500/40 hover:border-blue-500 hover:shadow-[0_4px_20px_rgba(37,99,235,0.18)]',
    selectedBorder: 'border-blue-600 ring-2 ring-blue-500/40 bg-blue-600/15 shadow-[0_0_20px_rgba(37,99,235,0.25)]',
    topBar: 'bg-gradient-to-r from-blue-600 via-indigo-500 to-red-500',
    badgeBg: 'bg-gradient-to-r from-[#003087] to-[#E40000] text-white font-extrabold',
    accentColor: '#2563EB',
  },
}

export default function BundleCard({
  bundle,
  selected,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
  frequencyCount = 0,
}) {
  const netKey = (bundle.network || '').toUpperCase()
  const theme = NETWORK_THEMES[netKey] || NETWORK_THEMES.MTN
  const hasRollover = netKey === 'TELECEL' || bundle.name?.toLowerCase().includes('rollover')

  return (
    <div
      className={cn(
        'group relative flex w-full flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 overflow-hidden',
        theme.bg,
        selected ? theme.selectedBorder : theme.border
      )}
    >
      {/* Top radiant carrier accent line */}
      <div className={cn('absolute top-0 left-0 right-0 h-1.5 opacity-90', theme.topBar)} />

      {/* Main card body - clickable */}
      <div
        onClick={() => onSelect?.(bundle)}
        className="w-full cursor-pointer"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-start justify-between gap-1.5 flex-wrap">
          {/* Carrier Badge with Brand Gradient */}
          <span className={cn('inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] shadow-sm', theme.badgeBg)}>
            {bundle.network}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Rollover badge for Telecel */}
            {hasRollover && (
              <span className="text-[10px] font-bold text-emerald-500 rounded-full border border-emerald-500/30 px-2 py-0.5 bg-emerald-500/10 flex items-center gap-0.5">
                <RotateCcw size={10} /> Rollover
              </span>
            )}

            {/* Validity */}
            <span className="text-[11px] font-semibold text-text-muted rounded-full border border-border px-2 py-0.5 bg-surface/80 backdrop-blur-sm">
              {bundle.validity_days ? `${bundle.validity_days}d` : 'Non-expiry'}
            </span>

            {/* Favorite Star Toggle Button */}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(bundle)
                }}
                className={cn(
                  'p-1.5 rounded-lg border transition duration-150',
                  isFavorite
                    ? 'border-amber-400 bg-amber-400/20 text-amber-500'
                    : 'border-border/60 bg-surface/60 text-text-muted hover:text-amber-500 hover:border-amber-400/50'
                )}
                title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              >
                <Star size={13} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        </div>

        {/* Frequent Pick / Smart Favorite algorithmic badge */}
        {frequencyCount > 1 && (
          <div className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
            <Flame size={11} className="animate-pulse" />
            <span>Frequent Pick ({frequencyCount}x bought)</span>
          </div>
        )}

        {/* Data Size Display */}
        <p className="mt-2.5 font-display text-xl sm:text-2xl font-black text-text tracking-tight">
          {formatDataSize(bundle.data_size_mb)}
        </p>
        <p className="mt-0.5 text-xs text-text-muted line-clamp-1 font-medium">{bundle.name}</p>
      </div>

      {/* Footer bar */}
      <div className="mt-4 flex items-end justify-between border-t border-border/60 pt-2.5 w-full">
        <div>
          <span className="block text-[10px] uppercase font-bold text-text-muted">Price</span>
          <p className="font-display text-base sm:text-lg font-black text-text">
            {formatGHS(bundle.price ?? bundle.selling_price)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelect?.(bundle)}
          className={cn(
            'inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm',
            selected
              ? 'bg-primary text-white ring-2 ring-primary/30'
              : 'border border-border bg-surface text-text hover:border-primary/50 hover:text-primary'
          )}
        >
          {selected ? (
            <>
              <CheckCircle size={14} /> Selected
            </>
          ) : (
            'Select'
          )}
        </button>
      </div>
    </div>
  )
}
