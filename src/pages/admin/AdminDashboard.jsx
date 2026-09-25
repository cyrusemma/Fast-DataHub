import { useQuery } from '@tanstack/react-query'
import { Activity, DollarSign, Receipt, TrendingUp, Sparkles, Radio } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import Skeleton from '../../components/ui/Skeleton'
import GhanaLiveHeatmap from '../../components/analytics/GhanaLiveHeatmap'
import { getAdminDashboardStats, getRevenueChart } from '../../api/admin.api'
import { formatGHS, formatGHSCompact } from '../../utils/formatCurrency'

export default function AdminDashboard() {
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminDashboardStats })
  const chart = useQuery({ queryKey: ['revenue-chart'], queryFn: () => getRevenueChart(14) })

  return (
    <>
      <PageHeader
        title="Admin Control Center"
        subtitle="Live network throughput, glowing revenue telemetry, and regional telemetry grid."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatGHS(stats.data?.total_revenue)}
          icon={DollarSign}
          loading={stats.isLoading}
        />
        <StatCard
          label="Today's Revenue"
          value={formatGHS(stats.data?.today_revenue)}
          icon={TrendingUp}
          tone="success"
          loading={stats.isLoading}
        />
        <StatCard
          label="Transactions"
          value={stats.data?.total_transactions || 0}
          icon={Receipt}
          tone="warning"
          loading={stats.isLoading}
        />
        <StatCard
          label="Success Rate"
          value={`${stats.data?.success_rate || 0}%`}
          icon={Activity}
          tone="primary"
          loading={stats.isLoading}
        />
      </div>

      {/* Fluid Heatmap Section */}
      <div className="mt-6">
        <GhanaLiveHeatmap />
      </div>

      {/* Glowing Revenue Trend Area Chart */}
      <div className="card mt-6 p-6 relative overflow-hidden">
        {/* Subtle ambient light behind chart */}
        <div className="pointer-events-none absolute -top-10 right-10 h-60 w-60 rounded-full bg-primary/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-black text-text">
                Revenue Velocity (Last 14 Days)
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                <Sparkles size={11} /> Fluid Gradient
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Daily gross sales trajectory across all telecom routes
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-text-muted">
            GHS Gross Volume
          </span>
        </div>

        <div className="relative z-10 mt-6 h-80">
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
              <AreaChart data={chart.data || []}>
                <defs>
                  {/* Glowing Multi-Stop Linear Gradient */}
                  <linearGradient id="revenueGlowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.65} />
                    <stop offset="45%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Glow filter for the stroke */}
                  <filter id="lineGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  opacity={0.4}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  stroke="var(--color-border)"
                  axisLine={{ stroke: 'var(--color-border)', opacity: 0.5 }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatGHSCompact}
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  stroke="var(--color-border)"
                  axisLine={{ stroke: 'var(--color-border)', opacity: 0.5 }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [formatGHS(v), 'Gross Revenue']}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-primary)',
                    borderWidth: '1.5px',
                    borderRadius: '16px',
                    color: 'var(--color-text)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 15px rgba(var(--color-primary-rgb), 0.3)',
                  }}
                  itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={3.5}
                  fill="url(#revenueGlowGradient)"
                  filter="url(#lineGlowFilter)"
                  activeDot={{
                    r: 7,
                    fill: 'var(--color-primary)',
                    stroke: 'var(--color-surface)',
                    strokeWidth: 3,
                    filter: 'url(#lineGlowFilter)',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  )
}

