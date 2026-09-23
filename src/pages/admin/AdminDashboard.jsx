import { useQuery } from '@tanstack/react-query'
import { Activity, DollarSign, Receipt, TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import Skeleton from '../../components/ui/Skeleton'
import { getAdminDashboardStats, getRevenueChart } from '../../api/admin.api'
import { formatGHS, formatGHSCompact } from '../../utils/formatCurrency'

export default function AdminDashboard() {
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminDashboardStats })
  const chart = useQuery({ queryKey: ['revenue-chart'], queryFn: () => getRevenueChart(14) })

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Network revenue, transaction health, and daily trend." />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={formatGHS(stats.data?.total_revenue)} icon={DollarSign} loading={stats.isLoading} />
        <StatCard label="Today revenue" value={formatGHS(stats.data?.today_revenue)} icon={TrendingUp} tone="success" loading={stats.isLoading} />
        <StatCard label="Transactions" value={stats.data?.total_transactions || 0} icon={Receipt} tone="warning" loading={stats.isLoading} />
        <StatCard label="Success rate" value={`${stats.data?.success_rate || 0}%`} icon={Activity} tone="primary" loading={stats.isLoading} />
      </div>

      <div className="card mt-6 p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-display text-base font-bold text-text">Revenue Trend (Last 14 Days)</h2>
            <p className="text-xs text-text-muted">Daily Gross Volume across all telcos</p>
          </div>
          <span className="text-xs font-semibold text-text-subtle">GHS Volume</span>
        </div>

        <div className="mt-5 h-80">
          {chart.isLoading ? (
            <div className="flex h-full flex-col justify-center space-y-4 px-4">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-48 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} stroke="var(--color-border)" />
                <YAxis tickFormatter={formatGHSCompact} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} stroke="var(--color-border)" />
                <Tooltip
                  formatter={(v) => [formatGHS(v), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '12px',
                    color: 'var(--color-text)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} dot={{ fill: 'var(--color-primary)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  )
}
