import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import WalletCard from '../../components/shared/WalletCard'
import StatCard from '../../components/shared/StatCard'
import RecentTransactions from '../../components/shared/RecentTransactions'
import { useWallet } from '../../hooks/useWallet'
import { getMyStats } from '../../api/transactions.api'
import { getResellerEarnings } from '../../api/agents.api'
import { formatGHS } from '../../utils/formatCurrency'

export default function ResellerDashboard() {
  const wallet = useWallet()
  const { data: stats, isLoading } = useQuery({ queryKey: ['my-stats'], queryFn: getMyStats })
  const { data: earnings = [] } = useQuery({ queryKey: ['reseller-earnings'], queryFn: getResellerEarnings })
  const margin = earnings.reduce((sum, tx) => sum + ((tx.data_bundles?.reseller_price || 0) - (tx.data_bundles?.agent_price || 0)), 0)
  return (
    <>
      <PageHeader title="Reseller dashboard" subtitle="Sell data, track customer purchases, and monitor margin." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <WalletCard balance={wallet.data?.balance} lastUpdated={wallet.data?.last_updated} loading={wallet.isLoading} />
        <div className="grid gap-5 sm:grid-cols-3">
          <StatCard label="Sales" value={stats?.purchaseCount || 0} icon={ShoppingCart} loading={isLoading} />
          <StatCard label="Margin" value={formatGHS(margin)} icon={TrendingUp} tone="success" loading={isLoading} />
          <StatCard label="Spent" value={formatGHS(stats?.totalSpent)} icon={Wallet} tone="warning" loading={isLoading} />
        </div>
      </div>
      <div className="mt-6"><RecentTransactions /></div>
    </>
  )
}
