import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { History, ShoppingCart, Wallet, Wifi } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import WalletCard from '../../components/shared/WalletCard'
import StatCard from '../../components/shared/StatCard'
import RecentTransactions from '../../components/shared/RecentTransactions'
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
        subtitle="Buy data bundles and monitor your wallet activity."
        action={<Link to="/buy"><Button icon={Wifi}>Buy data</Button></Link>}
      />
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr]">
        <WalletCard balance={wallet.data?.balance} lastUpdated={wallet.data?.last_updated} loading={wallet.isLoading} />
        <div className="grid gap-5 sm:grid-cols-3">
          <StatCard label="Total spent" value={formatGHS(stats?.totalSpent)} icon={Wallet} loading={isLoading} />
          <StatCard label="Purchases" value={stats?.purchaseCount || 0} icon={ShoppingCart} tone="success" loading={isLoading} />
          <StatCard label="Today" value={stats?.todayCount || 0} icon={History} tone="warning" loading={isLoading} />
        </div>
      </div>
      <div className="mt-6">
        <RecentTransactions />
      </div>
    </>
  )
}
