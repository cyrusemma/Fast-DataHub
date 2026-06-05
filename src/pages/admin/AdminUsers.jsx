import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Input'
import { getAllUsers, updateUserStatus } from '../../api/admin.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { ROLE_LABELS } from '../../utils/constants'

export default function AdminUsers() {
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('')
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-users', page, role], queryFn: () => getAllUsers({ page, role: role || undefined }) })
  const mutation = useMutation({
    mutationFn: ({ id, status }) => updateUserStatus(id, status),
    onSuccess: () => { toast.success('User status updated'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }) },
    onError: (e) => toast.error(e.message),
  })
  const columns = [
    { key: 'name', header: 'Name', render: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (r) => ROLE_LABELS[r.role] },
    { key: 'balance', header: 'Wallet', align: 'right', render: (r) => formatGHS(r.wallets?.balance) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Joined', render: (r) => formatDate(r.created_at) },
    { key: 'action', header: '', align: 'right', render: (r) => <Button size="sm" variant={r.status === 'SUSPENDED' ? 'success' : 'danger'} loading={mutation.isPending} onClick={() => mutation.mutate({ id: r.id, status: r.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' })}>{r.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}</Button> },
  ]
  return (
    <>
      <PageHeader title="Users" subtitle="View users, roles, balances, and account status." action={<Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}><option value="">All roles</option>{Object.keys(ROLE_LABELS).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</Select>} />
      <DataTable columns={columns} data={data?.data || []} loading={isLoading} page={data?.page} totalPages={data?.totalPages} total={data?.total} onPageChange={setPage} />
    </>
  )
}
