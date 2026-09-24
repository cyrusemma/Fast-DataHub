import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useRole } from '../../hooks/useRole'
import { navIcons } from './navIcons'
import { cn } from '../../utils/cn'

export default function MobileBottomNav() {
  const { navItems } = useRole()

  // Display top 4-5 primary items for the bottom bar
  const primaryItems = navItems.slice(0, 4)

  if (!primaryItems.length) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/90 backdrop-blur-lg lg:hidden px-2 py-1.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around">
        {primaryItems.map((item) => {
          const Icon = navIcons[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={
                item.path === '/' ||
                item.path === '/admin' ||
                item.path === '/agent' ||
                item.path === '/reseller'
              }
              className={({ isActive }) =>
                cn(
                  'relative flex flex-1 flex-col items-center justify-center py-1.5 px-1 text-center transition-colors',
                  isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex h-6 w-6 items-center justify-center">
                    {Icon && <Icon size={20} className={isActive ? 'text-primary' : 'text-text-muted'} />}
                  </div>
                  <span className="mt-1 text-[10px] tracking-tight truncate max-w-[72px]">
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-dot"
                      className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-primary"
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
