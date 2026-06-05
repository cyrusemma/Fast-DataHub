import { useQuery } from '@tanstack/react-query'
import { Banknote, Users, Wallet } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import WalletCard from '../../components/shared/WalletCard'
import StatCard from '../../components/shared/StatCard'
import RecentTransactions from '../../components/shared/RecentTransactions'
import { useWallet } from '../../hooks/useWallet'
import { getAgentStats } from '../../api/agents.api'
import { formatGHS } from '../../utils/formatCurrency'

export default function AgentDashboard() {
  const wallet = useWallet()
  const { data: stats, isLoading } = useQuery({ queryKey: ['agent-stats'], queryFn: getAgentStats })
  return (
    <>
      <PageHeader title="Agent dashboard" subtitle="Manage reseller performance, bulk purchases, and commissions." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <WalletCard balance={wallet.data?.balance} lastUpdated={wallet.data?.last_updated} loading={wallet.isLoading} />
        <div className="grid gap-5 sm:grid-cols-3">
          <StatCard label="Resellers" value={stats?.resellerCount || 0} icon={Users} loading={isLoading} />
          <StatCard label="Commission" value={formatGHS(stats?.totalCommission)} icon={Banknote} tone="success" loading={isLoading} />
          <StatCard label="Pending" value={formatGHS(stats?.pendingCommission)} icon={Wallet} tone="warning" loading={isLoading} />
        </div>
      </div>
      <div className="mt-6"><RecentTransactions /></div>
    </>
  )
}
