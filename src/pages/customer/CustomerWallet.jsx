import PageHeader from '../../components/shared/PageHeader'
import WalletCard from '../../components/shared/WalletCard'
import TopUpPanel from '../../components/shared/TopUpPanel'
import RecentTransactions from '../../components/shared/RecentTransactions'
import { useWallet } from '../../hooks/useWallet'

export default function CustomerWallet() {
  const wallet = useWallet()
  return (
    <>
      <PageHeader title="Wallet" subtitle="Top up and track live wallet balance." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <WalletCard balance={wallet.data?.balance} lastUpdated={wallet.data?.last_updated} loading={wallet.isLoading} />
          <RecentTransactions />
        </div>
        <TopUpPanel />
      </div>
    </>
  )
}
