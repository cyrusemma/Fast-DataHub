import { cn } from '../../utils/cn'
import { ROLE_LABELS } from '../../utils/constants'

const variants = {
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  neutral: 'bg-surface-raised text-text-muted border border-border',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  info: 'bg-info/10 text-info border border-info/20',
}

export default function Badge({ variant = 'neutral', children, className, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
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
  DELIVERED: 'success',
  PAID: 'success',
  ACTIVE: 'success',
  PROCESSING: 'info',
  IN_PROGRESS: 'info',
  PENDING: 'warning',
  FAILED: 'danger',
  SUSPENDED: 'danger',
  REVERSED: 'neutral',
}

export function StatusBadge({ status, className }) {
  return (
    <Badge variant={STATUS_MAP[status] || 'neutral'} dot className={className}>
      {status?.toLowerCase()}
    </Badge>
  )
}

const ROLE_STYLES = {
  SUPER_ADMIN: 'bg-primary/15 text-primary border-primary/30',
  NETWORK_ADMIN: 'bg-accent/15 text-accent border-accent/30',
  AGENT: 'bg-success/15 text-success border-success/30',
  RESELLER: 'bg-info/15 text-info border-info/30',
  CUSTOMER: 'bg-surface-raised text-text border-border',
  AUDITOR: 'bg-warning/15 text-warning border-warning/30',
}

export function RoleBadge({ role, className }) {
  const label = ROLE_LABELS[role] || role || 'User'
  const style = ROLE_STYLES[role] || 'bg-surface-raised text-text border-border'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
        style,
        className
      )}
    >
      {label}
    </span>
  )
}

const NETWORK_STYLES = {
  MTN: 'bg-[#FFCC00]/20 text-[#D97706] border-[#FFCC00]/50 font-bold',
  TELECEL: 'bg-[#E40000]/15 text-[#DC2626] border-[#E40000]/40 font-bold',
  AT: 'bg-[#003087]/15 text-[#2563EB] border-[#003087]/40 font-bold',
}

export function NetworkBadge({ network, className }) {
  const net = (network || '').toUpperCase()
  const style = NETWORK_STYLES[net] || 'bg-surface-raised text-text border-border font-bold'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs tracking-wide',
        style,
        className
      )}
    >
      {net}
    </span>
  )
}
