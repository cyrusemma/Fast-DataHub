import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={cn('animate-spin text-primary', className)} />
}

export function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg py-24 text-text-muted">
      <Spinner size={36} />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
