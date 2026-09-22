import { cn } from '../../utils/cn'

export default function Card({ className, children, hover = false, interactive = false, ...props }) {
  const isInteractive = hover || interactive
  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm font-sans',
        isInteractive && 'transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5 border-b border-[var(--color-border)]', className)}>
      <div>
        {title && <h3 className="font-display text-base font-bold text-[var(--color-text)]">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>
}
