import { cn } from '../../utils/cn'

export default function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-card border border-slate-100/80',
        hover && 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
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
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
      <div>
        {title && <h3 className="font-display text-base font-bold text-dark">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>
}
