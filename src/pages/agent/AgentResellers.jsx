import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/Badge'
import { getInviteCode, getMyResellers } from '../../api/agents.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function AgentResellers() {
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(false)
  const { data = [], isLoading } = useQuery({ queryKey: ['my-resellers'], queryFn: getMyResellers })
  const columns = [
    { key: 'name', header: 'Name', render: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'balance', header: 'Wallet', align: 'right', render: (r) => formatGHS(r.wallets?.balance) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Joined', render: (r) => formatDate(r.created_at) },
  ]
  const generate = async () => {
    setLoading(true)
    try {
      const data = await getInviteCode()
      setInvite(data)
      toast.success('Invite code ready')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }
  const copy = async () => {
    await navigator.clipboard.writeText(invite?.inviteUrl || invite?.inviteCode)
    toast.success('Copied')
  }
  return (
    <>
      <PageHeader title="My resellers" subtitle="Invite and manage resellers under your agent account." action={<Button icon={UserPlus} loading={loading} onClick={generate}>Generate invite</Button>} />
      {invite && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Invite code</p>
            <p className="font-display text-lg font-bold text-dark">{invite.inviteCode}</p>
          </div>
          <Button variant="secondary" icon={Copy} onClick={copy}>Copy invite</Button>
        </div>
      )}
      <DataTable columns={columns} data={data} loading={isLoading} empty={<EmptyState icon={Users} title="No resellers yet" message="Generate an invite code to start building your network." />} />
    </>
  )
}
