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
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="font-display text-base font-bold text-dark">Revenue Trend (Last 14 Days)</h2>
          <span className="text-xs font-semibold text-slate-400">Daily Gross Volume</span>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatGHSCompact} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [formatGHS(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#0066FF" strokeWidth={3} dot={{ fill: '#0066FF', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  )
}
