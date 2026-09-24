import { useState } from 'react'
import {
  Check,
  Copy,
  Printer,
  Receipt,
  Smartphone,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { StatusBadge, NetworkBadge } from '../ui/Badge'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { CREDIT_TYPES } from '../../utils/constants'
import { normalizeGhanaPhone, detectGhanaNetwork } from '../../utils/phoneValidation'
import { cn } from '../../utils/cn'

export default function TransactionReceiptModal({ transaction, open, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!transaction) return null

  const isCredit = CREDIT_TYPES.includes(transaction.type)
  const bundle = transaction.data_bundles
  const phone = transaction.recipient_phone || transaction.metadata?.recipient_phone || transaction.metadata?.phone
  const network = transaction.network || bundle?.network || (phone ? detectGhanaNetwork(phone) : null)

  const handleCopy = () => {
    if (transaction.reference) {
      navigator.clipboard.writeText(transaction.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transaction Receipt"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
            className="print:hidden"
          >
            Print Receipt
          </Button>
          <Button size="sm" onClick={onClose} className="print:hidden">
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-4 print:p-0">
        {/* Receipt Header Banner */}
        <div className="rounded-2xl border border-border bg-surface-raised p-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isCredit ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {transaction.type?.replace(/_/g, ' ')}
          </p>

          <p
            className={cn(
              'font-display text-3xl font-black mt-1',
              isCredit ? 'text-success' : 'text-text'
            )}
          >
            {isCredit ? '+' : '-'}{formatGHS(transaction.amount)}
          </p>

          <div className="mt-2.5 flex items-center justify-center gap-2">
            <StatusBadge status={transaction.status} />
            {network && <NetworkBadge network={network} />}
          </div>
        </div>

        {/* Reference Strip */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5 text-xs">
          <div className="min-w-0">
            <span className="text-text-muted">Reference: </span>
            <span className="font-mono font-bold text-text truncate select-all">
              {transaction.reference || 'N/A'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy reference code"
            className="ml-2 flex items-center gap-1 rounded-lg border border-border bg-surface-raised px-2.5 py-1 font-semibold text-text transition hover:border-primary/40 hover:text-primary"
          >
            {copied ? (
              <>
                <Check size={13} className="text-success" />
                <span className="text-success text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Detailed Breakdown */}
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border text-xs">
          {bundle?.name && (
            <div className="flex items-center justify-between p-3.5">
              <span className="flex items-center gap-2 text-text-muted">
                <Layers size={14} className="text-primary" />
                Package / Bundle
              </span>
              <span className="font-bold text-text text-right">{bundle.name}</span>
            </div>
          )}

          {phone && (
            <div className="flex items-center justify-between p-3.5">
              <span className="flex items-center gap-2 text-text-muted">
                <Smartphone size={14} className="text-primary" />
                Recipient Number
              </span>
              <span className="font-mono font-bold text-text">{normalizeGhanaPhone(phone)}</span>
            </div>
          )}

          <div className="flex items-center justify-between p-3.5">
            <span className="flex items-center gap-2 text-text-muted">
              <Calendar size={14} className="text-primary" />
              Date & Timestamp
            </span>
            <span className="font-medium text-text text-right">
              {formatDateTime(transaction.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5">
            <span className="flex items-center gap-2 text-text-muted">
              <Receipt size={14} className="text-primary" />
              Payment Channel
            </span>
            <span className="font-semibold text-text">
              {transaction.metadata?.channel || (isCredit ? 'Paystack Checkout' : 'Wallet Debit')}
            </span>
          </div>

          {transaction.metadata?.gateway_reference && (
            <div className="flex items-center justify-between p-3.5">
              <span className="text-text-muted">Gateway Ref</span>
              <span className="font-mono text-text-subtle text-[11px]">
                {transaction.metadata.gateway_reference}
              </span>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-text-muted">
          <ShieldCheck size={13} className="text-success" />
          <span>Verified & recorded on Fast-DataHub ledger</span>
        </div>
      </div>
    </Modal>
  )
}
