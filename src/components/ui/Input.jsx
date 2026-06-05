import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../utils/cn'

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, type = 'text', className, containerClassName, ...props },
  ref
) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'w-full rounded-xl border bg-white text-dark placeholder:text-slate-400 transition-all',
            'h-11 text-sm',
            Icon ? 'pl-10' : 'pl-3.5',
            isPassword ? 'pr-11' : 'pr-3.5',
            'focus:outline-none focus:ring-2',
            error
              ? 'border-danger/60 focus:border-danger focus:ring-danger/20'
              : 'border-slate-200 focus:border-primary focus:ring-primary/20',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
})

export default Input

export const Select = forwardRef(function Select(
  { label, error, children, className, containerClassName, ...props },
  ref
) {
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-dark transition-all',
          'focus:outline-none focus:ring-2',
          error ? 'border-danger/60 focus:ring-danger/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
})
