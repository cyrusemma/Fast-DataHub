import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { createBundle, getAllBundles, toggleBundle, updateBundle } from '../../api/bundles.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'

const empty = { network: 'MTN', name: '', data_size_mb: 1024, validity_days: 30, cost_price: 0, selling_price: 0, agent_price: 0, reseller_price: 0, is_active: true }

export default function AdminBundles() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const queryClient = useQueryClient()
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-bundles'], queryFn: getAllBundles })
  const save = useMutation({
    mutationFn: () => editing ? updateBundle(editing.id, form) : createBundle(form),
    onSuccess: () => { toast.success('Bundle saved'); setOpen(false); setEditing(null); setForm(empty); queryClient.invalidateQueries({ queryKey: ['admin-bundles'] }) },
    onError: (e) => toast.error(e.message),
  })
  const toggle = useMutation({ mutationFn: (row) => toggleBundle(row.id, !row.is_active), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bundles'] }) })
  const columns = [
    { key: 'name', header: 'Bundle' },
    { key: 'network', header: 'Network' },
    { key: 'size', header: 'Size', render: (r) => formatDataSize(r.data_size_mb) },
    { key: 'selling_price', header: 'Customer', align: 'right', render: (r) => formatGHS(r.selling_price) },
    { key: 'reseller_price', header: 'Reseller', align: 'right', render: (r) => formatGHS(r.reseller_price) },
    { key: 'agent_price', header: 'Agent', align: 'right', render: (r) => formatGHS(r.agent_price) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'ACTIVE' : 'SUSPENDED'} /> },
    { key: 'actions', header: '', align: 'right', render: (r) => <div className="flex justify-end gap-2"><Button size="sm" variant="secondary" onClick={() => { setEditing(r); setForm(r); setOpen(true) }}>Edit</Button><Button size="sm" variant="ghost" onClick={() => toggle.mutate(r)}>{r.is_active ? 'Disable' : 'Enable'}</Button></div> },
  ]
  const set = (key, value) => setForm((f) => ({ ...f, [key]: ['data_size_mb', 'validity_days', 'cost_price', 'selling_price', 'agent_price', 'reseller_price'].includes(key) ? Number(value) : value }))
  return (
    <>
      <PageHeader title="Bundles" subtitle="Create and manage network bundle pricing." action={<Button icon={Plus} onClick={() => { setEditing(null); setForm(empty); setOpen(true) }}>New bundle</Button>} />
      <DataTable columns={columns} data={data} loading={isLoading} />
      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); setForm(empty) }} title={editing ? 'Edit bundle' : 'New bundle'} footer={<Button loading={save.isPending} onClick={() => save.mutate()}>Save bundle</Button>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Network" value={form.network} onChange={(e) => set('network', e.target.value)}><option>MTN</option><option>TELECEL</option><option>AT</option></Select>
          <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <Input label="Size MB" type="number" value={form.data_size_mb} onChange={(e) => set('data_size_mb', e.target.value)} />
          <Input label="Validity days" type="number" value={form.validity_days} onChange={(e) => set('validity_days', e.target.value)} />
          <Input label="Cost price" type="number" value={form.cost_price} onChange={(e) => set('cost_price', e.target.value)} />
          <Input label="Customer price" type="number" value={form.selling_price} onChange={(e) => set('selling_price', e.target.value)} />
          <Input label="Agent price" type="number" value={form.agent_price} onChange={(e) => set('agent_price', e.target.value)} />
          <Input label="Reseller price" type="number" value={form.reseller_price} onChange={(e) => set('reseller_price', e.target.value)} />
        </div>
      </Modal>
    </>
  )
}
