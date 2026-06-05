import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { SkeletonCard } from '../ui/Skeleton'

const tones = {
  primary: 'bg-primary-50 text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-[#B47C00]',
  danger: 'bg-danger-light text-danger',
}

export default function StatCard({ label, value, icon: Icon, tone = 'primary', delta, deltaLabel, loading }) {
  if (loading) return <SkeletonCard />
  const positive = delta != null && delta >= 0

  return (
    <div className="card group p-5 transition-all duration-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-dark tabular-nums">{value}</p>
        </div>
        {Icon && (
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tones[tone])}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {delta != null && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold',
              positive ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
            )}
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(delta)}%
          </span>
          {deltaLabel && <span className="text-slate-400">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}
