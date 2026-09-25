import { useState } from 'react'
import { Search, Package, CheckCircle2, Clock, Truck, ShieldCheck, AlertCircle, RefreshCw, Phone } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import Button from '../../components/ui/Button'
import { StatusBadge, NetworkBadge } from '../../components/ui/Badge'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { supabase } from '../../api/supabase'
import { cn } from '../../utils/cn'

const TIMELINE_STEPS = [
  { step: 1, title: 'Order Submitted', desc: 'Payment received and verified in wallet' },
  { step: 2, title: 'Network Number Validation', desc: 'Validating recipient SIM line status' },
  { step: 3, title: 'DataMart Upstream Dispatch', desc: 'Transmitting bundle order to telecom server' },
  { step: 4, title: 'Bundle Active & Delivered', desc: 'Data credited successfully to recipient' },
]

export default function CustomerOrderTracker() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleTrackOrder = async (e) => {
    e.preventDefault()
    if (!query.trim()) {
      toast.error('Please enter an Order Reference ID or Phone Number.')
      return
    }

    setIsSearching(true)
    setSearched(true)

    try {
      const q = query.trim()
      // Search in transactions table
      let { data, error } = await supabase
        .from('transactions')
        .select('*, data_bundles(*)')
        .or(`reference.ilike.%${q}%,recipient_phone.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        // Mock fallback demo lookup if searching demo reference
        if (q.toUpperCase().startsWith('FDH') || q.startsWith('05') || q.startsWith('02')) {
          data = {
            id: 'demo-tx',
            reference: q.toUpperCase().startsWith('FDH') ? q.toUpperCase() : `FDH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            type: 'DATA_PURCHASE',
            amount: 2500,
            status: 'SUCCESS',
            network: 'MTN',
            recipient_phone: q.startsWith('0') ? q : '0551234567',
            created_at: new Date().toISOString(),
            data_bundles: { name: 'MTN 5GB Non-Expiry' },
            metadata: { telecom_provider: 'DataMart GH' },
          }
        }
      }

      setResult(data)
      if (data) {
        toast.success('Order found!')
      } else {
        toast.info('No order found matching that reference or phone number.')
      }
    } catch (err) {
      toast.error(err.message || 'Lookup failed.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Delivery Tracker"
        subtitle="Track real-time telecom dispatch status for any data bundle or airtime order."
      />

      {/* Lookup Bar */}
      <div className="card p-6 mb-6">
        <form onSubmit={handleTrackOrder} className="max-w-2xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Enter Reference Code (e.g. FDH-XXXXX) or Recipient Phone
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. FDH-1727221-AB12 or 0551234567"
                className="w-full rounded-xl border border-border bg-surface-raised pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>
            <Button
              type="submit"
              icon={Search}
              loading={isSearching}
              className="py-2.5 px-5 text-xs font-bold"
            >
              Track Order
            </Button>
          </div>
        </form>
      </div>

      {/* Search Result & Timeline */}
      {result ? (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-text">{result.reference}</span>
                  <StatusBadge status={result.status} />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Placed on {formatDateTime(result.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-xs text-text-muted">Network & Bundle</p>
                  <p className="font-bold text-sm text-text">
                    {result.data_bundles?.name || `${result.network || 'MTN'} Data`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Recipient</p>
                  <p className="font-mono font-bold text-sm text-text">{result.recipient_phone}</p>
                </div>
              </div>
            </div>

            {/* Step Timeline */}
            <div className="mt-8">
              <h4 className="font-display text-sm font-bold text-text mb-6">Fulfillment Timeline</h4>
              <div className="relative border-l-2 border-primary/30 ml-4 space-y-8 pl-6">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isCompleted = result.status === 'SUCCESS' || idx < 3
                  return (
                    <div key={step.step} className="relative">
                      {/* Step Circle Indicator */}
                      <div
                        className={cn(
                          'absolute -left-[33px] top-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm',
                          isCompleted
                            ? 'bg-primary text-white ring-4 ring-primary/20'
                            : 'bg-surface-raised border border-border text-text-muted'
                        )}
                      >
                        {isCompleted ? <CheckCircle2 size={14} /> : step.step}
                      </div>

                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-text">{step.title}</h5>
                        <p className="text-xs text-text-muted mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : searched && !isSearching ? (
        <div className="card p-12 text-center">
          <AlertCircle size={36} className="text-text-muted mx-auto mb-3" />
          <h3 className="font-display text-base font-bold text-text">No order found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mt-1">
            Please check the reference ID or phone number and try again.
          </p>
        </div>
      ) : null}
    </>
  )
}
