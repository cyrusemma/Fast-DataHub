import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserPlus, Users, Link2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import CopyButton from '../../components/ui/CopyButton'
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
    {
      key: 'phone',
      header: 'Phone',
      render: (r) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span>{r.phone}</span>
          <CopyButton text={r.phone} iconOnly size="xs" variant="ghost" toastMessage="Phone copied" />
        </div>
      ),
    },
    { key: 'balance', header: 'Wallet', align: 'right', render: (r) => formatGHS(r.wallets?.balance) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Joined', render: (r) => formatDate(r.created_at) },
  ]

  const generate = async () => {
    setLoading(true)
    try {
      const res = await getInviteCode()
      setInvite(res)
      toast.success('Invite code generated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to generate invite code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="My resellers"
        subtitle="Invite and manage resellers under your agent account."
        action={
          <Button icon={UserPlus} loading={loading} onClick={generate}>
            Generate invite
          </Button>
        }
      />

      {invite && (
        <div className="mb-6 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-surface to-accent/5 p-5 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                <KeyRound size={13} /> Active Invitation Code
              </span>
              <p className="font-mono text-2xl font-black tracking-widest text-text mt-1">
                {invite.inviteCode}
              </p>
              <p className="text-xs text-text-muted">
                Share this code or direct link with individuals who want to register as your sub-resellers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <CopyButton
                text={invite.inviteCode}
                label="Copy Code"
                toastMessage="Invite code copied to clipboard"
                size="md"
              />
              <CopyButton
                text={invite.inviteUrl || `${window.location.origin}/register?ref=${invite.inviteCode}`}
                label="Copy Invite Link"
                variant="primary"
                size="md"
                toastMessage="Invite link copied to clipboard"
              />
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        empty={
          <EmptyState
            icon={Users}
            title="No resellers yet"
            message="Generate an invite code to start building your network."
          />
        }
      />
    </>
  )
}

