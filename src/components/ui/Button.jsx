import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const variants = {
  primary:
    'bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm shadow-primary/30 disabled:bg-primary/50',
  secondary:
    'bg-white text-dark border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 disabled:opacity-50',
  danger: 'bg-danger text-white hover:bg-red-600 shadow-sm shadow-danger/30 disabled:opacity-60',
  success: 'bg-success text-white hover:bg-emerald-500 shadow-sm shadow-success/30 disabled:opacity-60',
  dark: 'bg-dark text-white hover:bg-slate-800 disabled:opacity-60',
}

const sizes = {
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
  icon: 'h-10 w-10 rounded-xl',
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
        'inline-flex items-center justify-center font-semibold font-display transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed select-none active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'lg' ? 20 : 18} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 16 : 18} />
      )}
      {children}
      {!loading && IconRight && <IconRight size={size === 'sm' ? 16 : 18} />}
    </button>
  )
})

export default Button
