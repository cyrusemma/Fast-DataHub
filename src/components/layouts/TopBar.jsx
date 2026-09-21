import { useState, useRef, useEffect } from 'react'
import { Menu, Wallet, Plus, Bell, Sun, Moon, SunMedium, LogOut, ChevronDown, User } from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useWallet } from '../../hooks/useWallet'
import { useWalletStore } from '../../store/walletStore'
import { useAuthStore } from '../../store/authStore'
import { useRole } from '../../hooks/useRole'
import { useThemeStore } from '../../store/themeStore'
import { formatGHS } from '../../utils/formatCurrency'
import { logout } from '../../api/auth.api'
import { ROLE_LABELS } from '../../utils/constants'

const ROUTE_TITLES = {
  '/': 'Overview',
  '/home': 'Customer Dashboard',
  '/buy': 'Buy Data',
  '/history': 'Transaction History',
  '/wallet': 'My Wallet',
  '/agent': 'Agent Dashboard',
  '/agent/buy-bulk': 'Bulk Data Purchase',
  '/agent/resellers': 'My Resellers',
  '/agent/commissions': 'Commissions',
  '/agent/wallet': 'Agent Wallet',
  '/reseller': 'Reseller Dashboard',
  '/reseller/sell': 'Sell Data',
  '/reseller/earnings': 'Sales & Margins',
  '/reseller/wallet': 'Reseller Wallet',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/transactions': 'Transaction Records',
  '/admin/agents': 'Agent Network',
  '/admin/bundles': 'Bundle Management',
  '/admin/finance': 'Financial Overview',
  '/admin/audit-logs': 'Audit Logs',
}

const WALLET_PATH = { AGENT: '/agent/wallet', RESELLER: '/reseller/wallet', CUSTOMER: '/wallet' }

export default function TopBar({ onMenuClick, title: customTitle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading } = useWallet()
  const balance = useWalletStore((s) => s.balance)
  const { profile, clearAuth } = useAuthStore()
  const { role } = useRole()
  const { theme, cycleTheme } = useThemeStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const isAdmin = ['SUPER_ADMIN', 'NETWORK_ADMIN', 'AUDITOR'].includes(role)
  const walletPath = WALLET_PATH[role]
  const currentTitle = customTitle || ROUTE_TITLES[location.pathname] || 'DataHUB'

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    try {
      await logout()
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon size={18} className="text-blue-400" />
    if (theme === 'outdoor') return <SunMedium size={18} className="text-amber-500 font-bold" />
    return <Sun size={18} className="text-amber-500" />
  }

  const getThemeLabel = () => {
    if (theme === 'dark') return 'Dark'
    if (theme === 'outdoor') return 'Outdoor'
    return 'Light'
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-surface/85 backdrop-blur-md transition-colors">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-dark lg:hidden transition"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <div className="truncate">
            <h1 className="font-display text-base sm:text-lg font-bold text-dark truncate">
              {currentTitle}
            </h1>
            <p className="hidden text-xs text-slate-400 sm:block">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme switcher */}
          <button
            type="button"
            onClick={cycleTheme}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:bg-slate-50"
            title={`Current theme: ${getThemeLabel()} (Click to cycle)`}
          >
            {getThemeIcon()}
            <span className="hidden md:inline capitalize">{getThemeLabel()}</span>
          </button>

          {/* Wallet Balance widget (for non-admin users) */}
          {!isAdmin && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-1.5 shadow-sm">
              <Wallet size={16} className="text-primary" />
              <span className="font-display text-xs sm:text-sm font-bold text-dark tabular-nums">
                {isLoading ? '—' : formatGHS(balance)}
              </span>
              {walletPath && (
                <button
                  type="button"
                  onClick={() => navigate(walletPath)}
                  title="Top up wallet"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-600 shadow-sm"
                >
                  <Plus size={15} />
                </button>
              )}
            </div>
          )}

          {/* Notification bell */}
          <button
            type="button"
            className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:text-dark"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
          </button>

          {/* User profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 sm:pr-2.5 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-500 font-display text-xs font-bold text-white shadow-sm">
                {profile?.first_name?.[0] || 'U'}
                {profile?.last_name?.[0] || ''}
              </div>
              <div className="hidden text-left lg:block">
                <p className="text-xs font-bold text-dark leading-tight">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {ROLE_LABELS[role] || role}
                </p>
              </div>
              <ChevronDown size={14} className="hidden sm:block text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-fade-in z-50">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="font-display text-sm font-bold text-dark">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {ROLE_LABELS[role] || role}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  {walletPath && (
                    <Link
                      to={walletPath}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Wallet size={15} className="text-primary" />
                      <span>Wallet ({formatGHS(balance)})</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-light transition"
                  >
                    <LogOut size={15} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
