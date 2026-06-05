import { cn } from '../../utils/cn'

const variants = {
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-[#B47C00]',
  danger: 'bg-danger-light text-danger',
  neutral: 'bg-slate-100 text-slate-500',
  primary: 'bg-primary-50 text-primary',
}

export default function Badge({ variant = 'neutral', children, className, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
        variants[variant] || variants.neutral,
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}

const STATUS_MAP = {
  SUCCESS: 'success',
  PAID: 'success',
  ACTIVE: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  SUSPENDED: 'danger',
  REVERSED: 'neutral',
}

export function StatusBadge({ status }) {
  return (
    <Badge variant={STATUS_MAP[status] || 'neutral'} dot>
      {status?.toLowerCase()}
    </Badge>
  )
}
