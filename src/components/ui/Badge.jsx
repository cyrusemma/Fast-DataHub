import { cn } from '../../utils/cn'
import { ROLE_LABELS } from '../../utils/constants'

const variants = {
  success: 'bg-success-light text-success border border-success/20',
  warning: 'bg-warning-light text-[#B47C00] border border-warning/20',
  danger: 'bg-danger-light text-danger border border-danger/20',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
  primary: 'bg-primary-50 text-primary border border-primary/20',
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
  PAID: 'success',
  ACTIVE: 'success',
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
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  NETWORK_ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  AGENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  RESELLER: 'bg-blue-100 text-blue-800 border-blue-200',
  CUSTOMER: 'bg-slate-100 text-slate-700 border-slate-200',
  AUDITOR: 'bg-amber-100 text-amber-800 border-amber-200',
}

export function RoleBadge({ role, className }) {
  const label = ROLE_LABELS[role] || role || 'User'
  const style = ROLE_STYLES[role] || 'bg-slate-100 text-slate-700 border-slate-200'
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
  MTN: 'bg-[#FFCC00]/20 text-[#856404] border-[#FFCC00]/50 font-bold',
  TELECEL: 'bg-[#E40000]/15 text-[#C00000] border-[#E40000]/40 font-bold',
  AT: 'bg-[#003087]/15 text-[#003087] border-[#003087]/40 font-bold',
}

export function NetworkBadge({ network, className }) {
  const net = (network || '').toUpperCase()
  const style = NETWORK_STYLES[net] || 'bg-slate-100 text-slate-700 border-slate-200 font-bold'
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
