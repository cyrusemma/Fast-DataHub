import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  History,
  ShoppingCart,
  Wallet,
  Wifi,
  PhoneCall,
  GraduationCap,
  Zap,
  Dices,
  Truck,
} from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import WalletCard from '../../components/shared/WalletCard'
import StatCard from '../../components/shared/StatCard'
import RecentTransactions from '../../components/shared/RecentTransactions'
import QuickReUp from '../../components/shared/QuickReUp'
import Button from '../../components/ui/Button'
import { useWallet } from '../../hooks/useWallet'
import { getMyStats } from '../../api/transactions.api'
import { formatGHS } from '../../utils/formatCurrency'

export default function CustomerDashboard() {
  const wallet = useWallet()
  const { data: stats, isLoading } = useQuery({ queryKey: ['my-stats'], queryFn: getMyStats })

  return (
    <>
      <PageHeader
        title="Customer home"
        subtitle="Buy data bundles, 1-tap re-order, and monitor your wallet activity."
        action={
          <Link to="/buy">
            <Button icon={Wifi}>Buy data</Button>
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr]">
        <WalletCard
          balance={wallet.data?.balance}
          lastUpdated={wallet.data?.last_updated}
          loading={wallet.isLoading}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <StatCard label="Total spent" value={formatGHS(stats?.totalSpent)} icon={Wallet} loading={isLoading} />
          <StatCard label="Purchases" value={stats?.purchaseCount || 0} icon={ShoppingCart} tone="success" loading={isLoading} />
          <StatCard label="Today" value={stats?.todayCount || 0} icon={History} tone="warning" loading={isLoading} />
        </div>
      </div>

      {/* Quick Services Hub */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-bold text-text uppercase tracking-wider">
            Quick Services Hub
          </h3>
          <span className="text-xs text-text-muted">Instant delivery via DataMart GH</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/buy"
            className="card p-3.5 flex flex-col items-center text-center hover:border-primary/50 hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
              <Wifi size={20} />
            </div>
            <span className="font-bold text-xs text-text">Buy Data</span>
            <span className="text-[10px] text-text-muted mt-0.5">Non-expiry</span>
          </Link>

          <Link
            to="/airtime"
            className="card p-3.5 flex flex-col items-center text-center hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-200">
              <PhoneCall size={18} />
            </div>
            <span className="font-bold text-xs text-text">Airtime</span>
            <span className="text-[10px] text-success font-semibold mt-0.5">2% Discount</span>
          </Link>

          <Link
            to="/checkers"
            className="card p-3.5 flex flex-col items-center text-center hover:border-blue-500/50 hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-200">
              <GraduationCap size={20} />
            </div>
            <span className="font-bold text-xs text-text">Checkers</span>
            <span className="text-[10px] text-text-muted mt-0.5">WASSCE & BECE</span>
          </Link>

          <Link
            to="/bills"
            className="card p-3.5 flex flex-col items-center text-center hover:border-amber-500/50 hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
              <Zap size={20} />
            </div>
            <span className="font-bold text-xs text-text">Pay Bills</span>
            <span className="text-[10px] text-text-muted mt-0.5">Power & Water</span>
          </Link>

          <Link
            to="/spin"
            className="card p-3.5 flex flex-col items-center text-center hover:border-purple-500/50 hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-200">
              <Dices size={20} />
            </div>
            <span className="font-bold text-xs text-text">Spin & Win</span>
            <span className="text-[10px] text-primary font-semibold mt-0.5">Free Daily</span>
          </Link>

          <Link
            to="/track"
            className="card p-3.5 flex flex-col items-center text-center hover:border-cyan-500/50 hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-2 group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-200">
              <Truck size={20} />
            </div>
            <span className="font-bold text-xs text-text">Track Order</span>
            <span className="text-[10px] text-text-muted mt-0.5">Live Status</span>
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <QuickReUp />
      </div>

      <div className="mt-6">
        <RecentTransactions />
      </div>
    </>
  )
}
