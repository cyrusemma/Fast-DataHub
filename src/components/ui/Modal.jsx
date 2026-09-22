import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '../../utils/cn'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export default function Modal({ open, onClose, title, subtitle, children, size = 'md', footer, closeable = true }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && closeable && onClose?.()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, closeable])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closeable && onClose?.()}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'relative w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-2xl font-sans',
              'rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)]',
              sizes[size]
            )}
          >
            {(title || closeable) && (
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-4">
                <div>
                  {title && <h3 className="font-display text-base font-bold text-[var(--color-text)]">{title}</h3>}
                  {subtitle && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
                </div>
                {closeable && (
                  <button
                    onClick={onClose}
                    className="-mr-1.5 rounded-lg p-1.5 text-[var(--color-text-subtle)] transition hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            <div className="px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
