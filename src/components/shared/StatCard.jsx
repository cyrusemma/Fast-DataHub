import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { SkeletonCard } from '../ui/Skeleton'

const tones = {
  primary: 'bg-primary/15 text-primary border border-primary/20',
  success: 'bg-success/15 text-success border border-success/20',
  warning: 'bg-warning/15 text-warning border border-warning/20',
  danger: 'bg-danger/15 text-danger border border-danger/20',
}

export default function StatCard({ label, value, icon: Icon, tone = 'primary', delta, deltaLabel, loading }) {
  if (loading) return <SkeletonCard />
  const positive = delta != null && delta >= 0

  return (
    <div className="card group p-5 transition-all duration-200 hover:shadow-card-hover hover:border-border-strong">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-text tabular-nums">{value}</p>
        </div>
        {Icon && (
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105', tones[tone])}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {delta != null && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold',
              positive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
            )}
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(delta)}%
          </span>
          {deltaLabel && <span className="text-text-subtle">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}
