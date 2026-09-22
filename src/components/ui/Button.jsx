import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const variants = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)] hover:-translate-y-px active:translate-y-0 shadow-sm disabled:opacity-50 disabled:hover:translate-y-0',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] hover:border-[var(--color-border-strong)] disabled:opacity-50',
  ghost:
    'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] disabled:opacity-50',
  danger:
    'bg-[var(--color-danger)] text-white hover:opacity-90 hover:-translate-y-px active:translate-y-0 shadow-sm disabled:opacity-50 disabled:hover:translate-y-0',
  success:
    'bg-[var(--color-success)] text-white hover:opacity-90 hover:-translate-y-px active:translate-y-0 shadow-sm disabled:opacity-50 disabled:hover:translate-y-0',
}

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-[var(--radius-md)] gap-1.5',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-md)] gap-2',
  lg: 'h-12 px-6 text-base rounded-[var(--radius-md)] gap-2.5',
  icon: 'h-10 w-10 rounded-[var(--radius-md)]',
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className, children, loading, disabled, icon: Icon, iconRight: IconRight, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium font-sans select-none',
        'transition-all duration-150 ease-out',
        'focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'lg' ? 18 : 16} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 16} />
      )}
      {children}
      {!loading && IconRight && <IconRight size={size === 'sm' ? 14 : 16} />}
    </button>
  )
})

export default Button
