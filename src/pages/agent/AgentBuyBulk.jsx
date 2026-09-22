import { useState, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Upload,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Wallet,
  Sparkles,
  Info,
  Layers,
  Phone,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import NetworkSelector from '../../components/shared/NetworkSelector'
import BundleCard from '../../components/shared/BundleCard'
import Button from '../../components/ui/Button'
import { NetworkBadge } from '../../components/ui/Badge'
import { getBundles } from '../../api/bundles.api'
import { buyData } from '../../api/transactions.api'
import { useWallet } from '../../hooks/useWallet'
import { useWalletStore } from '../../store/walletStore'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'
import {
  isValidGhanaPhone,
  normalizeGhanaPhone,
  detectGhanaNetwork,
} from '../../utils/phoneValidation'

export default function AgentBuyBulk() {
  const [network, setNetwork] = useState('MTN')
  const [selectedBundle, setSelectedBundle] = useState(null)
  const [rawText, setRawText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, successCount: 0, failCount: 0 })
  const [items, setItems] = useState([])
  const fileInputRef = useRef(null)

  const queryClient = useQueryClient()
  const wallet = useWallet()
  const balance = useWalletStore((s) => s.balance)

  const { data: bundles = [], isLoading: bundlesLoading } = useQuery({
    queryKey: ['bundles', network, 'AGENT'],
    queryFn: () => getBundles({ network, role: 'AGENT' }),
  })

  // Parse raw text into validated item list
  const parseNumbers = (text) => {
    if (!text.trim()) {
      setItems([])
      return
    }

    const lines = text
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter(Boolean)

    const seen = new Set()
    const parsed = lines.map((raw, index) => {
      const normalized = normalizeGhanaPhone(raw)
      const valid = isValidGhanaPhone(normalized)
      const carrier = detectGhanaNetwork(normalized)
      const isDuplicate = seen.has(normalized)
      if (valid) seen.add(normalized)
      const isMismatch = valid && carrier !== network

      return {
        id: `${index}-${raw}`,
        raw,
        phone: normalized,
        carrier,
        isValid: valid,
        isDuplicate,
        isMismatch,
        status: 'idle', // 'idle' | 'processing' | 'success' | 'failed'
        errorMessage: null,
      }
    })

    setItems(parsed)
  }

  const handleTextChange = (e) => {
    const val = e.target.value
    setRawText(val)
    parseNumbers(val)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result || ''
      setRawText(content)
      parseNumbers(content)
      toast.success(`Imported numbers from ${file.name}`)
    }
    reader.onerror = () => toast.error('Failed to read file')
    reader.readAsText(file)
  }

  const removeRow = (id) => {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    setRawText(updated.map((u) => u.phone).join('\n'))
  }

  const removeInvalid = () => {
    const updated = items.filter((item) => item.isValid && !item.isDuplicate)
    setItems(updated)
    setRawText(updated.map((u) => u.phone).join('\n'))
    toast.success('Removed invalid and duplicate numbers')
  }

  const removeMismatches = () => {
    const updated = items.filter((item) => item.isValid && !item.isMismatch && !item.isDuplicate)
    setItems(updated)
    setRawText(updated.map((u) => u.phone).join('\n'))
    toast.success(`Removed non-${network} numbers`)
  }

  const clearAll = () => {
    setItems([])
    setRawText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validItems = useMemo(
    () => items.filter((item) => item.isValid && !item.isMismatch && !item.isDuplicate),
    [items, network]
  )

  const invalidCount = items.filter((i) => !i.isValid).length
  const mismatchCount = items.filter((i) => i.isValid && i.isMismatch).length
  const duplicateCount = items.filter((i) => i.isDuplicate).length

  const bundlePrice = selectedBundle?.price || selectedBundle?.agent_price || 0
  const totalCost = validItems.length * bundlePrice
  const hasSufficientBalance = balance >= totalCost

  // Sequential batch executor
  const handleExecuteBatch = async () => {
    if (!selectedBundle) {
      toast.error('Please select a data bundle')
      return
    }
    if (validItems.length === 0) {
      toast.error('No valid numbers ready for purchase')
      return
    }
    if (!hasSufficientBalance) {
      toast.error('Insufficient wallet balance. Please top up first.')
      return
    }

    setIsProcessing(true)
    setProgress({ current: 0, total: validItems.length, successCount: 0, failCount: 0 })

    let successes = 0
    let failures = 0

    const updatedItems = [...items]

    for (let i = 0; i < validItems.length; i++) {
      const target = validItems[i]
      const index = updatedItems.findIndex((x) => x.id === target.id)

      if (index !== -1) {
        updatedItems[index].status = 'processing'
        setItems([...updatedItems])
      }

      try {
        await buyData({
          bundleId: selectedBundle.id,
          recipientPhone: target.phone,
          idempotencyKey: crypto.randomUUID(),
        })
        if (index !== -1) {
          updatedItems[index].status = 'success'
        }
        successes++
      } catch (err) {
        if (index !== -1) {
          updatedItems[index].status = 'failed'
          updatedItems[index].errorMessage = err.message || 'Delivery failed'
        }
        failures++
      }

      setProgress({
        current: i + 1,
        total: validItems.length,
        successCount: successes,
        failCount: failures,
      })
      setItems([...updatedItems])
    }

    setIsProcessing(false)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    ])

    if (failures === 0) {
      toast.success(`Bulk dispatch complete! All ${successes} bundles delivered.`)
    } else {
      toast.warning(`Bulk batch finished: ${successes} succeeded, ${failures} failed.`)
    }
  }

  return (
    <>
      <PageHeader
        title="Bulk Data Purchase"
        subtitle="Upload or paste multiple recipient numbers, auto-validate carriers, and dispatch agent-priced bundles."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        {/* Left Column: Network, Bundle & Summary */}
        <div className="space-y-5">
          {/* 1. Network Selector */}
          <div className="card p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-slate-500">
              Step 1 · Select Carrier
            </h2>
            <div className="mt-3">
              <NetworkSelector
                value={network}
                onChange={(net) => {
                  setNetwork(net)
                  setSelectedBundle(null)
                  parseNumbers(rawText)
                }}
              />
            </div>
          </div>

          {/* 2. Bundle Selector */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-slate-500">
                Step 2 · Select Agent Bundle
              </h2>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                Agent Wholesale Rate
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {bundlesLoading ? (
                <div className="col-span-2 py-8 text-center text-sm text-slate-400">
                  Loading agent bundles...
                </div>
              ) : bundles.length > 0 ? (
                bundles.map((b) => (
                  <BundleCard
                    key={b.id}
                    bundle={b}
                    selected={selectedBundle?.id === b.id}
                    onSelect={setSelectedBundle}
                  />
                ))
              ) : (
                <div className="col-span-2 py-6 text-center text-sm text-slate-400">
                  No active bundles for {network}
                </div>
              )}
            </div>
          </div>

          {/* 3. Cost Preview & Wallet Check */}
          <div className="card p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-slate-500">
              Batch Cost & Wallet Summary
            </h2>

            <div className="mt-4 space-y-3 divide-y divide-slate-100 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Bundle</span>
                <span className="font-bold text-dark">{selectedBundle?.name || 'None selected'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Unit Agent Price</span>
                <span className="font-bold text-primary">{formatGHS(bundlePrice)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Valid Recipients</span>
                <span className="font-extrabold text-dark">{validItems.length}</span>
              </div>
              <div className="flex justify-between pt-2 text-base">
                <span className="font-bold text-dark">Total Batch Cost</span>
                <span className="font-display font-black text-primary">{formatGHS(totalCost)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Available Wallet</span>
                <span className="font-bold text-dark">{formatGHS(balance)}</span>
              </div>
            </div>

            {!hasSufficientBalance && totalCost > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-light p-3 text-xs text-danger font-semibold">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Insufficient balance. Need {formatGHS(totalCost - balance)} more.</span>
              </div>
            )}

            <div className="mt-5">
              <Button
                className="w-full"
                size="lg"
                icon={Play}
                loading={isProcessing}
                disabled={isProcessing || !selectedBundle || validItems.length === 0 || !hasSufficientBalance}
                onClick={handleExecuteBatch}
              >
                {isProcessing
                  ? `Processing (${progress.current}/${progress.total})...`
                  : `Send to ${validItems.length} Recipients`}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Recipient Input & Parsing Table */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-dark">Step 3 · Recipient Numbers</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Paste numbers or upload a CSV/TXT list (one number per line).
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload File
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <textarea
                rows={5}
                value={rawText}
                onChange={handleTextChange}
                placeholder="0241234567&#10;0559876543&#10;0201122334"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Validation quick stats & action pills */}
            {items.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-700">
                    {validItems.length} Valid
                  </span>
                  {mismatchCount > 0 && (
                    <span className="rounded-md bg-amber-50 px-2 py-1 font-bold text-amber-700">
                      {mismatchCount} Carrier Mismatch
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="rounded-md bg-rose-50 px-2 py-1 font-bold text-rose-700">
                      {invalidCount} Invalid
                    </span>
                  )}
                  {duplicateCount > 0 && (
                    <span className="rounded-md bg-purple-50 px-2 py-1 font-bold text-purple-700">
                      {duplicateCount} Duplicate
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {(invalidCount > 0 || duplicateCount > 0) && (
                    <button
                      type="button"
                      onClick={removeInvalid}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Clean Invalid
                    </button>
                  )}
                  {mismatchCount > 0 && (
                    <button
                      type="button"
                      onClick={removeMismatches}
                      className="ml-2 text-xs font-semibold text-amber-600 hover:underline"
                    >
                      Remove Non-{network}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearAll}
                    className="ml-2 text-xs font-semibold text-slate-400 hover:text-dark"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar when dispatching */}
          {isProcessing && (
            <div className="card p-5 bg-gradient-to-r from-primary-50 to-emerald-50 border border-primary/20">
              <div className="flex items-center justify-between text-xs font-bold text-dark">
                <span>Dispatching Batch...</span>
                <span>
                  {progress.current} of {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span className="text-emerald-600 font-bold">{progress.successCount} Succeeded</span>
                <span className="text-rose-600 font-bold">{progress.failCount} Failed</span>
              </div>
            </div>
          )}

          {/* Parsed Numbers Table */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <h3 className="font-display text-sm font-bold text-dark">
                Parsed Numbers Roster ({items.length})
              </h3>
            </div>

            {items.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No phone numbers loaded. Enter or paste numbers above.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 transition ${
                      item.isMismatch || !item.isValid || item.isDuplicate
                        ? 'bg-amber-50/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Phone size={15} className="text-slate-400" />
                      <div>
                        <p className="font-mono font-bold text-dark">{item.phone || item.raw}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          {item.carrier && <NetworkBadge network={item.carrier} />}
                          {!item.isValid && (
                            <span className="text-[11px] font-semibold text-rose-600">Invalid phone</span>
                          )}
                          {item.isMismatch && (
                            <span className="text-[11px] font-semibold text-amber-600">
                              Requires {item.carrier}
                            </span>
                          )}
                          {item.isDuplicate && (
                            <span className="text-[11px] font-semibold text-purple-600">Duplicate</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.status === 'processing' && (
                        <span className="font-semibold text-primary animate-pulse">Sending...</span>
                      )}
                      {item.status === 'success' && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                          <CheckCircle2 size={15} /> Delivered
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600" title={item.errorMessage}>
                          <XCircle size={15} /> Failed
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        disabled={isProcessing}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
