import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={cn('animate-spin text-primary', className)} />
}

export function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
      <Spinner size={32} />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
