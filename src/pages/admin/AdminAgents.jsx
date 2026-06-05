import { useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/Badge'
import { getAgentPerformance } from '../../api/admin.api'
import { formatGHS } from '../../utils/formatCurrency'

export default function AdminAgents() {
  const { data = [], isLoading } = useQuery({ queryKey: ['agent-performance'], queryFn: getAgentPerformance })
  const columns = [
    { key: 'name', header: 'Agent', render: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'email', header: 'Email' },
    { key: 'resellerCount', header: 'Resellers', align: 'right' },
    { key: 'totalCommission', header: 'Commission', align: 'right', render: (r) => formatGHS(r.totalCommission) },
    { key: 'pendingCommission', header: 'Pending', align: 'right', render: (r) => formatGHS(r.pendingCommission) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]
  return (
    <>
      <PageHeader title="Agents" subtitle="Agent network performance and commission exposure." />
      <DataTable columns={columns} data={data} loading={isLoading} />
    </>
  )
}
