import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import { getAuditLogs } from '../../api/admin.api'
import { formatDateTime } from '../../utils/formatDate'

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({ queryKey: ['audit-logs', page], queryFn: () => getAuditLogs({ page }) })
  const columns = [
    { key: 'action', header: 'Action' },
    { key: 'resource', header: 'Resource' },
    { key: 'user', header: 'User', render: (r) => r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : '-' },
    { key: 'ip_address', header: 'IP address' },
    { key: 'created_at', header: 'Date', render: (r) => formatDateTime(r.created_at) },
  ]
  return (
    <>
      <PageHeader title="Audit logs" subtitle="Read-only trace of sensitive platform actions." />
      <DataTable columns={columns} data={data?.data || []} loading={isLoading} page={data?.page} totalPages={data?.totalPages} total={data?.total} onPageChange={setPage} />
    </>
  )
}
