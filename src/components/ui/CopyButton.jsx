import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../utils/cn'

export default function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied!',
  toastMessage,
  iconOnly = false,
  size = 'sm',
  className,
  variant = 'secondary',
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (!text) return

    try {
      await navigator.clipboard.writeText(String(text))
      setCopied(true)
      if (toastMessage) {
        toast.success(toastMessage)
      }
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const sizeClasses = {
    xs: 'h-6 px-2 text-[11px] gap-1',
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-sm gap-2',
  }

  const iconOnlySizes = {
    xs: 'h-6 w-6 p-0 justify-center',
    sm: 'h-8 w-8 p-0 justify-center',
    md: 'h-9 w-9 p-0 justify-center',
  }

  const variantClasses = {
    secondary: 'border border-border bg-surface-raised text-text hover:border-primary/40 hover:text-primary hover:bg-surface',
    ghost: 'text-text-muted hover:text-text hover:bg-surface-raised',
    primary: 'bg-primary text-white hover:brightness-110 shadow-sm',
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? copiedLabel : `Copy ${text}`}
      className={cn(
        'inline-flex items-center rounded-lg font-semibold transition-all active:scale-95 select-none',
        iconOnly ? iconOnlySizes[size] || iconOnlySizes.sm : sizeClasses[size] || sizeClasses.sm,
        variantClasses[variant] || variantClasses.secondary,
        copied && 'border-success/40 bg-success/10 text-success hover:border-success/40 hover:text-success',
        className
      )}
    >
      {copied ? (
        <Check size={size === 'xs' ? 12 : 14} className="text-success shrink-0" />
      ) : (
        <Copy size={size === 'xs' ? 12 : 14} className="shrink-0" />
      )}
      {!iconOnly && (
        <span className={cn(copied && 'text-success')}>{copied ? copiedLabel : label}</span>
      )}
    </button>
  )
}
