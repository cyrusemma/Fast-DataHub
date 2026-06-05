import { Menu, Wallet, Plus, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../../hooks/useWallet'
import { useWalletStore } from '../../store/walletStore'
import { useAuthStore } from '../../store/authStore'
import { useRole } from '../../hooks/useRole'
import { formatGHS } from '../../utils/formatCurrency'
import Button from '../ui/Button'

const WALLET_PATH = { AGENT: '/agent/wallet', RESELLER: '/reseller/wallet', CUSTOMER: '/wallet' }

export default function TopBar({ onMenuClick, title }) {
  const navigate = useNavigate()
  const { isLoading } = useWallet()
  const balance = useWalletStore((s) => s.balance)
  const { profile } = useAuthStore()
  const { role } = useRole()
  const isAdmin = ['SUPER_ADMIN', 'NETWORK_ADMIN', 'AUDITOR'].includes(role)
  const walletPath = WALLET_PATH[role]

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-surface/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-lg p-2 text-slate-500 hover:bg-white lg:hidden">
            <Menu size={22} />
          </button>
          <div>
            {title && <h1 className="font-display text-lg font-bold text-dark">{title}</h1>}
            <p className="hidden text-xs text-slate-400 sm:block">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {!isAdmin && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-1.5 shadow-sm">
              <Wallet size={17} className="text-primary" />
              <span className="font-display text-sm font-bold text-dark tabular-nums">
                {isLoading ? '—' : formatGHS(balance)}
              </span>
              {walletPath && (
                <button
                  onClick={() => navigate(walletPath)}
                  title="Top up"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-600"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          )}

          <button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:text-dark">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-success font-display text-sm font-bold text-white">
            {profile?.first_name?.[0]}
            {profile?.last_name?.[0]}
          </div>
        </div>
      </div>
    </header>
  )
}
