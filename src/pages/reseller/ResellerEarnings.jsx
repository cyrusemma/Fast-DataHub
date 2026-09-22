import { useQuery } from '@tanstack/react-query'
import { TrendingUp, DollarSign } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import MarginSimulator from '../../components/shared/MarginSimulator'
import { getResellerEarnings } from '../../api/agents.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

export default function ResellerEarnings() {
  const { data = [], isLoading } = useQuery({ queryKey: ['reseller-earnings'], queryFn: getResellerEarnings })

  const columns = [
    { key: 'reference', header: 'Reference' },
    { key: 'bundle', header: 'Bundle', render: (r) => r.data_bundles?.name || '-' },
    { key: 'amount', header: 'Sale price', align: 'right', render: (r) => formatGHS(r.amount) },
    {
      key: 'margin',
      header: 'Margin',
      align: 'right',
      render: (r) => (
        <span className="font-bold text-emerald-600">
          +{formatGHS((r.data_bundles?.reseller_price || 0) - (r.data_bundles?.agent_price || 0))}
        </span>
      ),
    },
    { key: 'created_at', header: 'Date', render: (r) => formatDateTime(r.created_at) },
  ]

  return (
    <>
      <PageHeader
        title="Sales & Earnings"
        subtitle="Computed margins from successful reseller data sales and interactive revenue simulation."
      />

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        empty={<EmptyState icon={TrendingUp} title="No earnings yet" message="Start selling data to build your profit margin history." />}
      />

      <div className="mt-8">
        <MarginSimulator />
      </div>
    </>
  )
}
