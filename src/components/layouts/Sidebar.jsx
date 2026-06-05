import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, X } from 'lucide-react'
import { useRole } from '../../hooks/useRole'
import { useAuthStore } from '../../store/authStore'
import { navIcons } from './navIcons'
import { ROLE_LABELS } from '../../utils/constants'
import { logout } from '../../api/auth.api'
import { cn } from '../../utils/cn'

function NavItems({ onNavigate }) {
  const { navItems } = useRole()
  return (
    <nav className="flex-1 space-y-1 px-3">
      {navItems.map((item) => {
        const Icon = navIcons[item.icon]
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/' || item.path === '/admin' || item.path === '/agent' || item.path === '/reseller'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 -z-0 rounded-xl bg-primary shadow-lg shadow-primary/30"
                    transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  {Icon && <Icon size={19} />}
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

function SidebarInner({ onNavigate }) {
  const { profile, clearAuth } = useAuthStore()
  const { role } = useRole()

  const handleLogout = async () => {
    await logout()
    clearAuth()
  }

  return (
    <div className="flex h-full flex-col bg-dark py-6">
      <div className="flex items-center justify-between px-6 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <span className="font-display text-lg font-extrabold">D</span>
          </div>
          <span className="font-display text-lg font-bold text-white">DataHUB</span>
        </div>
      </div>

      <NavItems onNavigate={onNavigate} />

      <div className="mt-4 px-3">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-success font-display text-sm font-bold text-white">
              {profile?.first_name?.[0]}
              {profile?.last_name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="truncate text-xs text-slate-400">{ROLE_LABELS[role]}</p>
            </div>
            <button onClick={handleLogout} title="Sign out" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-danger">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed h-screen w-64">
          <SidebarInner />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute left-0 top-0 h-full w-64"
          >
            <button onClick={onClose} className="absolute right-3 top-5 z-20 rounded-lg p-1.5 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <SidebarInner onNavigate={onClose} />
          </motion.div>
        </div>
      )}
    </>
  )
}
