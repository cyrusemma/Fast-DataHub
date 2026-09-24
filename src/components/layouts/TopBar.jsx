import { useState, useRef, useEffect } from 'react'
import {
  Menu,
  Wallet,
  Plus,
  Bell,
  LogOut,
  ChevronDown,
  CheckCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useWallet } from '../../hooks/useWallet'
import { useWalletStore } from '../../store/walletStore'
import { useAuthStore } from '../../store/authStore'
import { useRole } from '../../hooks/useRole'
import ModeSwitcher from '../shared/ModeSwitcher'
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
  '/agent/theme': 'Brand & Theme Settings',
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
  '/admin/theme': 'Platform Theme Settings',
}

const WALLET_PATH = { AGENT: '/agent/wallet', RESELLER: '/reseller/wallet', CUSTOMER: '/wallet' }

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n-1',
    title: 'Instant Delivery Active',
    description: 'MTN, Telecel, and AT automated provisioning gateways are 100% operational.',
    time: '5 mins ago',
    type: 'system',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Wallet System Update',
    description: 'Paystack checkout supports instant MoMo and Card top-ups.',
    time: '1 hour ago',
    type: 'wallet',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Number Verification Ready',
    description: 'Automatic carrier detection and mismatch alerts are now enabled.',
    time: '2 hours ago',
    type: 'feature',
    read: true,
  },
]

export default function TopBar({ onMenuClick, title: customTitle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading } = useWallet()
  const balance = useWalletStore((s) => s.balance)
  const { profile, clearAuth } = useAuthStore()
  const { role } = useRole()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  const dropdownRef = useRef(null)
  const notifRef = useRef(null)

  const isAdmin = ['SUPER_ADMIN', 'NETWORK_ADMIN', 'AUDITOR'].includes(role)
  const walletPath = WALLET_PATH[role]
  const currentTitle = customTitle || ROUTE_TITLES[location.pathname] || 'DataHUB'

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleSignOut = async () => {
    setDropdownOpen(false)
    try {
      await logout()
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-md transition-colors">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-raised hover:text-text lg:hidden transition"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <div className="truncate">
            <h1 className="font-display text-base sm:text-lg font-bold text-text truncate">
              {currentTitle}
            </h1>
            <p className="hidden text-xs text-text-muted sm:block">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Segmented Mode Switcher */}
          <ModeSwitcher variant="compact" />

          {/* Wallet Balance widget (for non-admin users) */}
          {!isAdmin && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pl-3 pr-1.5 shadow-sm">
              <Wallet size={16} className="text-primary" />
              <span className="font-display text-xs sm:text-sm font-bold text-text tabular-nums">
                {isLoading ? '—' : formatGHS(balance)}
              </span>
              {walletPath && (
                <button
                  type="button"
                  onClick={() => navigate(walletPath)}
                  title="Top up wallet"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white transition hover:brightness-110 shadow-sm"
                >
                  <Plus size={15} />
                </button>
              )}
            </div>
          )}

          {/* Notification bell & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev)
                setDropdownOpen(false)
              }}
              className="relative rounded-xl border border-border bg-surface p-2.5 text-text-muted shadow-sm transition hover:text-text hover:bg-surface-raised"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-surface p-3 shadow-2xl animate-fade-in z-50">
                <div className="flex items-center justify-between border-b border-border pb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-text">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      <CheckCheck size={13} />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="mt-2 space-y-2 max-h-80 overflow-y-auto pr-0.5">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 rounded-xl p-2.5 transition ${
                        notif.read
                          ? 'bg-transparent text-text-muted hover:bg-surface-raised/60'
                          : 'bg-primary/5 border border-primary/15 text-text'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 rounded-lg p-1.5 bg-primary/10 text-primary">
                        {notif.type === 'wallet' ? (
                          <CheckCircle2 size={16} />
                        ) : notif.type === 'feature' ? (
                          <Sparkles size={16} />
                        ) : (
                          <AlertCircle size={16} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-text truncate">{notif.title}</p>
                          <span className="text-[10px] text-text-muted shrink-0 ml-2">
                            {notif.time}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-text-muted leading-relaxed line-clamp-2">
                          {notif.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2.5 border-t border-border pt-2 text-center">
                  <Link
                    to={isAdmin ? '/admin/transactions' : '/history'}
                    onClick={() => setNotifOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>View all transactions & history</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen((prev) => !prev)
                setNotifOpen(false)
              }}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1.5 sm:pr-2.5 shadow-sm transition hover:border-primary/40"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent font-display text-xs font-bold text-white shadow-sm">
                {profile?.first_name?.[0] || 'U'}
                {profile?.last_name?.[0] || ''}
              </div>
              <div className="hidden text-left lg:block">
                <p className="text-xs font-bold text-text leading-tight">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {ROLE_LABELS[role] || role}
                </p>
              </div>
              <ChevronDown size={14} className="hidden sm:block text-text-muted" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-xl animate-fade-in z-50">
                <div className="border-b border-border px-3 py-2.5">
                  <p className="font-display text-sm font-bold text-text">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-text-muted truncate">{profile?.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {ROLE_LABELS[role] || role}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  {walletPath && (
                    <Link
                      to={walletPath}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-text hover:bg-surface-raised transition"
                    >
                      <Wallet size={15} className="text-primary" />
                      <span>Wallet ({formatGHS(balance)})</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition"
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
