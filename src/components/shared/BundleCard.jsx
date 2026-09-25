import { CheckCircle2, RotateCcw, Star, Zap, Flame } from 'lucide-react'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'
import { NETWORKS } from '../../utils/constants'
import { cn } from '../../utils/cn'

const NETWORK_THEMES = {
  MTN: {
    unselectedBg: 'bg-gradient-to-br from-amber-400/10 via-yellow-500/5 to-surface border-amber-400/40 hover:border-amber-400 hover:shadow-[0_4px_25px_rgba(245,158,11,0.25)]',
    selectedBg: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 border-2 border-yellow-200 ring-4 ring-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.65),0_10px_25px_rgba(245,158,11,0.4)]',
    topBar: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500',
    badgeBg: 'bg-[#FFCC00] text-slate-950 font-black shadow-sm',
    badgeSelectedBg: 'bg-slate-950 text-[#FFCC00] font-black shadow-sm',
    selectBtn: 'bg-slate-950 text-[#FFCC00] font-black shadow-[0_4px_15px_rgba(0,0,0,0.4)] ring-2 ring-slate-900 hover:bg-black',
    pillSelected: 'bg-amber-950/20 text-slate-950 border-amber-950/25 font-bold',
    titleColor: 'text-text',
    selectedTitleColor: 'text-slate-950 font-black',
    subtextColor: 'text-text-muted',
    selectedSubtextColor: 'text-amber-950/80 font-bold',
  },
  TELECEL: {
    unselectedBg: 'bg-gradient-to-br from-red-600/10 via-rose-600/5 to-surface border-red-500/40 hover:border-red-500 hover:shadow-[0_4px_25px_rgba(239,68,68,0.25)]',
    selectedBg: 'bg-gradient-to-br from-red-600 via-rose-600 to-red-700 border-2 border-rose-300 ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.65),0_10px_25px_rgba(239,68,68,0.4)]',
    topBar: 'bg-gradient-to-r from-red-600 via-rose-400 to-red-600',
    badgeBg: 'bg-[#E40000] text-white font-black shadow-sm',
    badgeSelectedBg: 'bg-white text-red-600 font-black shadow-sm',
    selectBtn: 'bg-white text-red-600 font-black shadow-[0_4px_15px_rgba(0,0,0,0.3)] ring-2 ring-white/70 hover:bg-rose-50',
    pillSelected: 'bg-white/20 text-white border-white/30 font-bold',
    titleColor: 'text-text',
    selectedTitleColor: 'text-white font-black',
    subtextColor: 'text-text-muted',
    selectedSubtextColor: 'text-rose-100/90 font-bold',
  },
  AT: {
    unselectedBg: 'bg-gradient-to-br from-blue-600/12 via-indigo-600/5 to-red-500/10 border-blue-500/40 hover:border-blue-500 hover:shadow-[0_4px_25px_rgba(37,99,235,0.25)]',
    selectedBg: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-red-600 border-2 border-blue-300 ring-4 ring-blue-500/60 shadow-[0_0_35px_rgba(37,99,235,0.65),0_10px_25px_rgba(228,0,0,0.4)]',
    topBar: 'bg-gradient-to-r from-blue-600 via-indigo-400 to-red-500',
    badgeBg: 'bg-gradient-to-r from-[#003087] to-[#E40000] text-white font-black shadow-sm',
    badgeSelectedBg: 'bg-white text-blue-700 font-black shadow-sm',
    selectBtn: 'bg-white text-blue-700 font-black shadow-[0_4px_15px_rgba(0,0,0,0.3)] ring-2 ring-white/70 hover:bg-blue-50',
    pillSelected: 'bg-white/20 text-white border-white/30 font-bold',
    titleColor: 'text-text',
    selectedTitleColor: 'text-white font-black',
    subtextColor: 'text-text-muted',
    selectedSubtextColor: 'text-blue-100/90 font-bold',
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
        'group relative flex w-full flex-col justify-between rounded-2xl p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 overflow-hidden',
        selected ? theme.selectedBg : theme.unselectedBg
      )}
    >
      {/* Top radiant carrier accent line */}
      {!selected && <div className={cn('absolute top-0 left-0 right-0 h-2 opacity-95', theme.topBar)} />}

      {/* Main card body - clickable */}
      <div
        onClick={() => onSelect?.(bundle)}
        className="w-full cursor-pointer pt-1"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-start justify-between gap-1.5 flex-wrap">
          {/* Carrier Badge with Bold Colors */}
          <span
            className={cn(
              'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs tracking-wide',
              selected ? theme.badgeSelectedBg : theme.badgeBg
            )}
          >
            {bundle.network}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Rollover badge for Telecel */}
            {hasRollover && (
              <span
                className={cn(
                  'text-[10px] rounded-full border px-2 py-0.5 flex items-center gap-0.5 shadow-sm',
                  selected
                    ? theme.pillSelected
                    : 'font-extrabold text-emerald-500 border-emerald-500/40 bg-emerald-500/15'
                )}
              >
                <RotateCcw size={10} /> Rollover
              </span>
            )}

            {/* Validity */}
            <span
              className={cn(
                'text-[11px] rounded-full border px-2.5 py-0.5 backdrop-blur-sm',
                selected
                  ? theme.pillSelected
                  : 'font-bold text-text-muted border-border/80 bg-surface/90'
              )}
            >
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
                  selected
                    ? isFavorite
                      ? 'border-white bg-white text-slate-950 shadow-md'
                      : 'border-white/30 bg-black/20 text-white hover:bg-white/30'
                    : isFavorite
                    ? 'border-amber-400 bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'border-border/80 bg-surface/80 text-text-muted hover:text-amber-500 hover:border-amber-400/50'
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
          <div
            className={cn(
              'mt-2.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold shadow-sm',
              selected
                ? theme.pillSelected
                : 'border-amber-500/40 bg-amber-500/20 text-amber-500'
            )}
          >
            <Flame size={11} className="animate-pulse" />
            <span>Frequent Pick ({frequencyCount}x bought)</span>
          </div>
        )}

        {/* Data Size Display with vibrant contrast */}
        <p
          className={cn(
            'mt-3 font-display text-2xl sm:text-3xl font-black tracking-tight',
            selected ? theme.selectedTitleColor : 'text-text'
          )}
        >
          {formatDataSize(bundle.data_size_mb)}
        </p>
        <p
          className={cn(
            'mt-0.5 text-xs line-clamp-1 font-semibold',
            selected ? theme.selectedSubtextColor : 'text-text-muted'
          )}
        >
          {bundle.name}
        </p>
      </div>

      {/* Footer bar */}
      <div
        className={cn(
          'mt-4 flex items-end justify-between border-t pt-3 w-full',
          selected ? (netKey === 'MTN' ? 'border-amber-950/20' : 'border-white/20') : 'border-border/70'
        )}
      >
        <div>
          <span
            className={cn(
              'block text-[10px] uppercase font-bold',
              selected ? theme.selectedSubtextColor : 'text-text-muted'
            )}
          >
            Price
          </span>
          <p
            className={cn(
              'font-display text-lg sm:text-xl font-black',
              selected ? theme.selectedTitleColor : 'text-text'
            )}
          >
            {formatGHS(bundle.price ?? bundle.selling_price)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelect?.(bundle)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition duration-200',
            selected
              ? theme.selectBtn
              : 'border border-border bg-surface text-text hover:border-primary/50 hover:text-primary shadow-sm'
          )}
        >
          {selected ? (
            <>
              <CheckCircle2 size={15} /> Selected
            </>
          ) : (
            'Select'
          )}
        </button>
      </div>
    </div>
  )
}
