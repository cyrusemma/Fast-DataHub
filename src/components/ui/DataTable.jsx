import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { SkeletonRows } from './Skeleton'
import EmptyState from './EmptyState'

/**
 * columns: [{ key, header, render?(row), className?, align? }]
 */
export default function DataTable({
  columns,
  data = [],
  loading = false,
  onRowClick,
  empty,
  page,
  totalPages,
  total,
  onPageChange,
  className,
}) {
  const showPagination = page != null && totalPages != null && totalPages > 1

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-100 bg-white shadow-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center'
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          {!loading && data.length > 0 && (
            <tbody className="divide-y divide-slate-100">
              {data.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-primary-50/40'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'whitespace-nowrap px-5 py-4 text-sm text-slate-700',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {loading && <SkeletonRows rows={6} cols={columns.length} />}
      {!loading && data.length === 0 && (empty || <EmptyState />)}

      {showPagination && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
          <p className="text-sm text-slate-500">
            Page <span className="font-semibold text-dark">{page}</span> of {totalPages}
            {total != null && <span className="ml-1 text-slate-400">· {total} total</span>}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
