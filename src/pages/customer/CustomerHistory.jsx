import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { getTransactions } from '../../api/transactions.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { CREDIT_TYPES } from '../../utils/constants'

export default function CustomerHistory() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({ queryKey: ['transactions', page], queryFn: () => getTransactions({ page, limit: 12 }) })
  const columns = [
    { key: 'reference', header: 'Reference' },
    { key: 'type', header: 'Type', render: (r) => r.type.replace('_', ' ') },
    { key: 'bundle', header: 'Bundle', render: (r) => r.data_bundles?.name || '-' },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className={CREDIT_TYPES.includes(r.type) ? 'font-bold text-success' : 'font-bold text-danger'}>{CREDIT_TYPES.includes(r.type) ? '+' : '-'}{formatGHS(r.amount)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Date', render: (r) => formatDateTime(r.created_at) },
  ]
  return (
    <>
      <PageHeader title="History" subtitle="All wallet top-ups, data purchases, and refunds." />
      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        page={data?.page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPageChange={setPage}
        empty={<EmptyState icon={Receipt} title="No transactions found" />}
      />
    </>
  )
}
