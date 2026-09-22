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
        <label className="mb-1.5 block text-xs font-semibold text-[var(--color-text)]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]"
          />
        )}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'w-full rounded-[var(--radius-md)] border bg-[var(--color-bg-subtle)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] font-sans',
            'h-10 text-sm transition-all duration-150 ease-out',
            Icon ? 'pl-9' : 'pl-3.5',
            isPassword ? 'pr-10' : 'pr-3.5',
            'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
            error
              ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20'
              : 'border-[var(--color-border)]',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{hint}</p>
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
      {label && (
        <label className="mb-1.5 block text-xs font-semibold text-[var(--color-text)]">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'h-10 w-full rounded-[var(--radius-md)] border bg-[var(--color-bg-subtle)] px-3.5 text-sm text-[var(--color-text)] font-sans transition-all duration-150 ease-out',
          'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
          error
            ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20'
            : 'border-[var(--color-border)]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">{error}</p>}
    </div>
  )
})
