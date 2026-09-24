import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import { StatusBadge, NetworkBadge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Input'
import TransactionReceiptModal from '../../components/shared/TransactionReceiptModal'
import { getAllTransactions } from '../../api/admin.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { CREDIT_TYPES, TRANSACTION_STATUSES } from '../../utils/constants'

export default function AdminTransactions() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [selectedTx, setSelectedTx] = useState(null)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', page, status],
    queryFn: () => getAllTransactions({ page, status: status || undefined }),
  })

  const columns = [
    { key: 'reference', header: 'Reference', render: (r) => <span className="font-mono font-bold text-xs">{r.reference}</span> },
    { key: 'user', header: 'User', render: (r) => (r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : '-') },
    { key: 'type', header: 'Type', render: (r) => r.type.replace(/_/g, ' ') },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (r) => (
        <span className={CREDIT_TYPES.includes(r.type) ? 'font-bold text-success' : 'font-bold text-danger'}>
          {CREDIT_TYPES.includes(r.type) ? '+' : '-'}{formatGHS(r.amount)}
        </span>
      ),
    },
    { key: 'network', header: 'Network', render: (r) => (r.network ? <NetworkBadge network={r.network} /> : '-') },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Date', render: (r) => formatDateTime(r.created_at) },
  ]

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="All wallet, bulk purchases, and data activity across Fast-DataHub."
        action={
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            {TRANSACTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />
      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        page={data?.page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPageChange={setPage}
        onRowClick={(row) => setSelectedTx(row)}
      />

      <TransactionReceiptModal
        open={Boolean(selectedTx)}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </>
  )
}

