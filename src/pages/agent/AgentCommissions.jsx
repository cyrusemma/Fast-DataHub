import { useQuery } from '@tanstack/react-query'
import { Banknote } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/Badge'
import { getMyCommissions } from '../../api/agents.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

export default function AgentCommissions() {
  const { data = [], isLoading } = useQuery({ queryKey: ['my-commissions'], queryFn: getMyCommissions })
  const columns = [
    { key: 'transaction', header: 'Transaction', render: (r) => r.transactions?.reference || '-' },
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="font-bold text-success">{formatGHS(r.amount)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Date', render: (r) => formatDateTime(r.created_at) },
  ]
  return (
    <>
      <PageHeader title="Commissions" subtitle="Track earnings from reseller sales." />
      <DataTable columns={columns} data={data} loading={isLoading} empty={<EmptyState icon={Banknote} title="No commissions yet" />} />
    </>
  )
}
