import { motion } from 'framer-motion'
import { Sun, Moon, Zap } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { cn } from '../../utils/cn'

const MODES = [
  {
    id: 'light',
    label: 'Light',
    description: 'Clean & bright interface for daylight environments',
    icon: Sun,
    activeIconColor: 'text-amber-500',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Deep navy backdrop engineered for reduced eye strain',
    icon: Moon,
    activeIconColor: 'text-primary',
  },
  {
    id: 'amoled',
    label: 'AMOLED',
    description: 'Pure #000000 black canvas for OLED battery efficiency',
    icon: Zap,
    activeIconColor: 'text-accent fill-accent/20',
  },
]

export default function ModeSwitcher({
  variant = 'compact',
  className,
  layoutId = 'mode-switcher-pill',
}) {
  const { mode, setMode } = useThemeStore()

  if (variant === 'full') {
    return (
      <div
        role="radiogroup"
        aria-label="Theme mode selection"
        className={cn('grid grid-cols-1 gap-3 sm:grid-cols-3', className)}
      >
        {MODES.map((item) => {
          const Icon = item.icon
          const isActive = mode === item.id

          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${item.label} mode`}
              onClick={() => setMode(item.id)}
              className={cn(
                'group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200',
                isActive
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                  : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-raised'
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-raised text-text-muted group-hover:text-text'
                  )}
                >
                  <Icon size={20} />
                </div>
                {isActive && (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
                )}
              </div>

              <span className="mt-3 font-display text-sm font-bold text-text">
                {item.label}
              </span>
              <span className="mt-1 text-xs text-text-muted leading-relaxed">
                {item.description}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  // Compact variant (used in TopBar and headers)
  return (
    <div
      role="radiogroup"
      aria-label="Theme mode switcher"
      className={cn(
        'relative inline-flex items-center rounded-xl border border-border bg-surface-raised p-1 shadow-sm',
        className
      )}
    >
      {MODES.map((item) => {
        const Icon = item.icon
        const isActive = mode === item.id

        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${item.label} mode`}
            title={`${item.label} Mode`}
            onClick={() => setMode(item.id)}
            className={cn(
              'relative z-10 flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors duration-150',
              isActive
                ? 'text-text font-bold'
                : 'text-text-muted hover:text-text'
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-lg border border-border bg-surface shadow-sm"
                transition={{ type: 'spring', damping: 26, stiffness: 380 }}
              />
            )}
            <Icon
              size={15}
              className={cn(
                'transition-transform duration-150',
                isActive ? item.activeIconColor : 'text-text-muted group-hover:text-text',
                isActive && 'scale-110'
              )}
            />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
