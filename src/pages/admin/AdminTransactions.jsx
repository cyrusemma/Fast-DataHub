import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Input'
import { getAllTransactions } from '../../api/admin.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { CREDIT_TYPES, TRANSACTION_STATUSES } from '../../utils/constants'

export default function AdminTransactions() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const { data, isLoading } = useQuery({ queryKey: ['admin-transactions', page, status], queryFn: () => getAllTransactions({ page, status: status || undefined }) })
  const columns = [
    { key: 'reference', header: 'Reference' },
    { key: 'user', header: 'User', render: (r) => r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : '-' },
    { key: 'type', header: 'Type', render: (r) => r.type.replace('_', ' ') },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className={CREDIT_TYPES.includes(r.type) ? 'font-bold text-success' : 'font-bold text-danger'}>{formatGHS(r.amount)}</span> },
    { key: 'network', header: 'Network', render: (r) => r.network || '-' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Date', render: (r) => formatDateTime(r.created_at) },
  ]
  return (
    <>
      <PageHeader title="Transactions" subtitle="All wallet and data purchase activity." action={<Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All statuses</option>{TRANSACTION_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>} />
      <DataTable columns={columns} data={data?.data || []} loading={isLoading} page={data?.page} totalPages={data?.totalPages} total={data?.total} onPageChange={setPage} />
    </>
  )
}
