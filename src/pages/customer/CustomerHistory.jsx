import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Receipt, Search, Filter, X, RotateCcw } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/ui/DataTable'
import { StatusBadge, NetworkBadge } from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import TransactionReceiptModal from '../../components/shared/TransactionReceiptModal'
import { getTransactions } from '../../api/transactions.api'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { CREDIT_TYPES, NETWORK_LIST, TRANSACTION_STATUSES, TRANSACTION_TYPES } from '../../utils/constants'
import { cn } from '../../utils/cn'

export default function CustomerHistory() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [network, setNetwork] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [selectedTx, setSelectedTx] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, type, status, network],
    queryFn: () =>
      getTransactions({
        page,
        limit: 12,
        type: type || undefined,
        status: status || undefined,
        network: network || undefined,
      }),
  })

  // Client-side search filtering across reference, phone, and bundle name
  const filteredData = useMemo(() => {
    const rows = data?.data || []
    if (!search.trim()) return rows
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      const ref = (r.reference || '').toLowerCase()
      const bundle = (r.data_bundles?.name || '').toLowerCase()
      const phone = (r.recipient_phone || r.metadata?.recipient_phone || '').toLowerCase()
      return ref.includes(q) || bundle.includes(q) || phone.includes(q)
    })
  }, [data?.data, search])

  const hasActiveFilters = Boolean(search || network || type || status)

  const clearFilters = () => {
    setSearch('')
    setNetwork('')
    setType('')
    setStatus('')
    setPage(1)
  }

  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-xs text-text">{r.reference}</span>
          {r.recipient_phone && (
            <p className="font-mono text-[11px] text-text-muted mt-0.5">{r.recipient_phone}</p>
          )}
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (r) => r.type.replace(/_/g, ' ') },
    { key: 'bundle', header: 'Bundle', render: (r) => r.data_bundles?.name || '-' },
    {
      key: 'network',
      header: 'Network',
      render: (r) => {
        const net = r.network || r.data_bundles?.network
        return net ? <NetworkBadge network={net} /> : '-'
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (r) => (
        <span
          className={
            CREDIT_TYPES.includes(r.type) ? 'font-bold text-success' : 'font-bold text-danger'
          }
        >
          {CREDIT_TYPES.includes(r.type) ? '+' : '-'}
          {formatGHS(r.amount)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Date', render: (r) => formatDateTime(r.created_at) },
  ]

  return (
    <>
      <PageHeader
        title="History"
        subtitle="All wallet top-ups, data purchases, and refunds."
        action={
          hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition hover:border-primary/40 hover:text-primary shadow-sm"
            >
              <RotateCcw size={13} />
              <span>Reset filters</span>
            </button>
          )
        }
      />

      {/* FILTER CONTROLS BAR */}
      <div className="mb-5 space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Instant Search input */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ref, phone, bundle..."
              className="w-full rounded-xl border border-border bg-surface-raised pl-9 pr-8 py-2 text-xs font-medium text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Network Carrier Selector */}
          <div>
            <select
              value={network}
              onChange={(e) => {
                setNetwork(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Networks (MTN, Telecel, AT)</option>
              {NETWORK_LIST.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Transaction Types</option>
              <option value="DATA_PURCHASE">Data Purchases</option>
              <option value="TOPUP_PAYSTACK">Wallet Top-ups</option>
              <option value="COMMISSION">Commissions</option>
              <option value="REFUND">Refunds</option>
            </select>
          </div>

          {/* Transaction Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Statuses</option>
              {TRANSACTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Carrier Quick Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/70 text-xs">
          <span className="text-text-muted text-[11px] font-semibold mr-1 flex items-center gap-1">
            <Filter size={12} /> Quick filter:
          </span>
          {['', 'MTN', 'TELECEL', 'AT'].map((net) => {
            const isSelected = network === net
            return (
              <button
                key={net || 'ALL'}
                type="button"
                onClick={() => {
                  setNetwork(net)
                  setPage(1)
                }}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-bold transition',
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-raised text-text-muted hover:text-text hover:bg-surface'
                )}
              >
                {net || 'All Carriers'}
              </button>
            )
          })}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        page={data?.page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPageChange={setPage}
        onRowClick={(row) => setSelectedTx(row)}
        empty={
          <EmptyState
            icon={Receipt}
            title={hasActiveFilters ? 'No matching transactions' : 'No transactions found'}
            message={
              hasActiveFilters
                ? 'Try adjusting or resetting your search filters to find what you are looking for.'
                : 'Activity will appear here after your first data purchase or wallet top-up.'
            }
            action={
              hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-border bg-surface-raised px-4 py-2 text-xs font-bold text-text hover:border-primary/40 hover:text-primary"
                >
                  Clear Filters
                </button>
              )
            }
          />
        }
      />

      <TransactionReceiptModal
        open={Boolean(selectedTx)}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </>
  )
}
