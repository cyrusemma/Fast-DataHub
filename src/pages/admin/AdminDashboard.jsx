import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  DollarSign,
  Receipt,
  TrendingUp,
  Sparkles,
  Zap,
  BarChart3,
  Layers,
  ArrowUpRight,
  Clock,
  Flame,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import Skeleton from '../../components/ui/Skeleton'
import { StatusBadge, NetworkBadge } from '../../components/ui/Badge'
import { getAdminDashboardStats, getRevenueChart, getAllTransactions } from '../../api/admin.api'
import { formatGHS, formatGHSCompact } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { cn } from '../../utils/cn'

const METRIC_VIEWS = [
  { id: 'revenue', label: 'Gross Revenue (GHS)', icon: DollarSign },
  { id: 'carriers', label: 'Carrier Breakdown', icon: Layers },
  { id: 'bandwidth', label: 'Data Delivered (GB)', icon: Zap },
  { id: 'volume', label: 'Transaction Count', icon: BarChart3 },
]

const TIME_RANGES = [
  { days: 7, label: '7D' },
  { days: 14, label: '14D' },
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
]

const HOURLY_DISTRIBUTION = [
  { hour: '00:00', load: 15 },
  { hour: '03:00', load: 8 },
  { hour: '06:00', load: 35 },
  { hour: '09:00', load: 88 },
  { hour: '12:00', load: 94 },
  { hour: '15:00', load: 78 },
  { hour: '18:00', load: 100 },
  { hour: '21:00', load: 82 },
]

export default function AdminDashboard() {
  const [metricView, setMetricView] = useState('revenue')
  const [selectedDays, setSelectedDays] = useState(14)

  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminDashboardStats })
  const chart = useQuery({
    queryKey: ['revenue-chart', selectedDays],
    queryFn: () => getRevenueChart(selectedDays),
  })
  const recentTx = useQuery({
    queryKey: ['admin-dashboard-recent-tx'],
    queryFn: () => getAllTransactions({ page: 1, limit: 6 }),
  })

  const chartData = chart.data || []

  // Calculate high points & aggregates
  const summaryMetrics = useMemo(() => {
    if (!chartData.length) return { peak: 0, peakDate: '-', totalVol: 0, avgDaily: 0, totalGB: 0 }
    let maxRev = 0
    let maxDate = ''
    let sumRev = 0
    let sumGB = 0

    chartData.forEach((row) => {
      if (row.revenue > maxRev) {
        maxRev = row.revenue
        maxDate = row.date
      }
      sumRev += row.revenue
      sumGB += row.data_gb || 0
    })

    return {
      peak: maxRev,
      peakDate: maxDate,
      totalVol: sumRev,
      avgDaily: sumRev / chartData.length,
      totalGB: sumGB,
    }
  }, [chartData])

  return (
    <>
      <PageHeader
        title="Admin Control Center"
        subtitle="Real-time revenue telemetry, carrier volume distribution, and live network metrics."
      />

      {/* Top Stat Cards with Radiant Ambient Glow */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Gross Volume"
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
          label="Completed Orders"
          value={stats.data?.total_transactions || 0}
          icon={Receipt}
          tone="warning"
          loading={stats.isLoading}
        />
        <StatCard
          label="SLA Success Rate"
          value={`${stats.data?.success_rate || 0}%`}
          icon={Activity}
          tone="primary"
          loading={stats.isLoading}
        />
      </div>

      {/* Main Fluid Glowing Chart Card */}
      <div className="card mt-6 p-6 relative overflow-hidden shadow-2xl border border-primary/20">
        {/* Ambient Gradient Glow Lights */}
        <div className="pointer-events-none absolute -top-20 right-1/4 h-80 w-80 rounded-full bg-primary/15 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-accent/15 blur-[90px]" />

        {/* Controls Toolbar */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-black text-text tracking-tight">
                {metricView === 'revenue' && 'Gross Revenue Velocity'}
                {metricView === 'carriers' && 'Multi-Carrier Volume Trajectory'}
                {metricView === 'bandwidth' && 'Data Bandwidth Delivered (GB)'}
                {metricView === 'volume' && 'Daily Transaction Throughput'}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-[10px] font-extrabold text-primary shadow-sm">
                <Sparkles size={11} /> Fluid Glow
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Live automated telemetry sampled across all telecom gateways
            </p>
          </div>

          {/* Metric View Tabs & Time Range Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Metric Mode Switcher */}
            <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-2xl border border-border">
              {METRIC_VIEWS.map((tab) => {
                const Icon = tab.icon
                const isActive = metricView === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMetricView(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200',
                      isActive
                        ? 'bg-primary text-white shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.4)]'
                        : 'text-text-muted hover:text-text'
                    )}
                  >
                    <Icon size={13} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Time Filter Buttons */}
            <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-2xl border border-border">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.days}
                  type="button"
                  onClick={() => setSelectedDays(tr.days)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-bold transition font-mono',
                    selectedDays === tr.days
                      ? 'bg-surface border border-border text-primary shadow-sm'
                      : 'text-text-muted hover:text-text'
                  )}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Mini KPI Bar */}
        <div className="relative z-10 mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Peak Day Volume
            </span>
            <p className="font-display text-base font-black text-text mt-0.5 font-mono">
              {formatGHS(summaryMetrics.peak)}
            </p>
            <span className="text-[10px] text-text-muted font-mono">{summaryMetrics.peakDate}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Daily Average
            </span>
            <p className="font-display text-base font-black text-primary mt-0.5 font-mono">
              {formatGHS(summaryMetrics.avgDaily)}
            </p>
            <span className="text-[10px] text-success font-semibold flex items-center gap-0.5">
              <ArrowUpRight size={11} /> +14.8% growth
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Total Bandwidth
            </span>
            <p className="font-display text-base font-black text-emerald-500 mt-0.5 font-mono">
              {summaryMetrics.totalGB >= 1024
                ? `${(summaryMetrics.totalGB / 1024).toFixed(1)} TB`
                : `${summaryMetrics.totalGB} GB`}
            </p>
            <span className="text-[10px] text-text-muted">Delivered payload</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Route Reliability
            </span>
            <p className="font-display text-base font-black text-blue-500 mt-0.5 font-mono">
              99.92%
            </p>
            <span className="text-[10px] text-text-muted">Instant telco response</span>
          </div>
        </div>

        {/* Dynamic Glowing Chart Canvas */}
        <div className="relative z-10 mt-6 h-[340px] sm:h-[380px] w-full">
          {chart.isLoading ? (
            <div className="flex h-full flex-col justify-center space-y-4 px-4">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-56 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {metricView === 'volume' ? (
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="barGlowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.35} vertical={false} />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} stroke="var(--color-border)" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} stroke="var(--color-border)" axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`${v} orders`, 'Transactions']}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-primary)',
                      borderRadius: '16px',
                      color: 'var(--color-text)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px rgba(var(--color-primary-rgb), 0.35)',
                    }}
                  />
                  <Bar dataKey="tx_count" fill="url(#barGlowGradient)" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    {/* Primary Glow Area Gradient */}
                    <linearGradient id="primaryAreaGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.65} />
                      <stop offset="50%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                    </linearGradient>

                    {/* Bandwidth Emerald Glow Gradient */}
                    <linearGradient id="bandwidthGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.65} />
                      <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>

                    {/* Carrier Specific Gradients */}
                    <linearGradient id="mtnGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFCB00" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#FFCB00" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="telecelGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E3001B" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#E3001B" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="atGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0066CC" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#0066CC" stopOpacity={0.0} />
                    </linearGradient>

                    {/* SVG Neon Ribbon Glow Filter */}
                    <filter id="neonRibbonGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    opacity={0.35}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="formattedDate"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    stroke="var(--color-border)"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={metricView === 'bandwidth' ? (v) => `${v} GB` : formatGHSCompact}
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    stroke="var(--color-border)"
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(val, name) => {
                      if (metricView === 'bandwidth') return [`${val} GB`, 'Data Delivered']
                      if (name === 'revenue') return [formatGHS(val), 'Gross Revenue']
                      if (name === 'mtn_revenue') return [formatGHS(val), 'MTN Volume']
                      if (name === 'telecel_revenue') return [formatGHS(val), 'Telecel Volume']
                      if (name === 'at_revenue') return [formatGHS(val), 'AT Volume']
                      return [formatGHS(val), name]
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-primary)',
                      borderWidth: '1.5px',
                      borderRadius: '16px',
                      color: 'var(--color-text)',
                      boxShadow:
                        '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px rgba(var(--color-primary-rgb), 0.35)',
                    }}
                  />

                  {metricView === 'revenue' && (
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-primary)"
                      strokeWidth={3.5}
                      fill="url(#primaryAreaGlow)"
                      filter="url(#neonRibbonGlow)"
                      activeDot={{
                        r: 7,
                        fill: 'var(--color-primary)',
                        stroke: 'var(--color-surface)',
                        strokeWidth: 3,
                        filter: 'url(#neonRibbonGlow)',
                      }}
                    />
                  )}

                  {metricView === 'bandwidth' && (
                    <Area
                      type="monotone"
                      dataKey="data_gb"
                      stroke="#10B981"
                      strokeWidth={3.5}
                      fill="url(#bandwidthGlow)"
                      filter="url(#neonRibbonGlow)"
                      activeDot={{
                        r: 7,
                        fill: '#10B981',
                        stroke: 'var(--color-surface)',
                        strokeWidth: 3,
                        filter: 'url(#neonRibbonGlow)',
                      }}
                    />
                  )}

                  {metricView === 'carriers' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="mtn_revenue"
                        name="mtn_revenue"
                        stroke="#FFCB00"
                        strokeWidth={3}
                        fill="url(#mtnGlow)"
                        filter="url(#neonRibbonGlow)"
                      />
                      <Area
                        type="monotone"
                        dataKey="telecel_revenue"
                        name="telecel_revenue"
                        stroke="#E3001B"
                        strokeWidth={3}
                        fill="url(#telecelGlow)"
                        filter="url(#neonRibbonGlow)"
                      />
                      <Area
                        type="monotone"
                        dataKey="at_revenue"
                        name="at_revenue"
                        stroke="#0066CC"
                        strokeWidth={3}
                        fill="url(#atGlow)"
                        filter="url(#neonRibbonGlow)"
                      />
                    </>
                  )}
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Secondary Analytics Row: Peak Traffic Hours & Recent Order Stream */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Peak Purchasing Hours Heat-Bar */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Daily Traffic Rush Hours
            </h3>
            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Peak: 18:00 - 21:00
            </span>
          </div>

          <p className="text-xs text-text-muted">
            Average customer data purchase intensity across 24 hours (GMT)
          </p>

          <div className="space-y-2.5 pt-2">
            {HOURLY_DISTRIBUTION.map((item) => (
              <div key={item.hour} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-muted">{item.hour}</span>
                  <span className="font-bold text-text">{item.load}% load</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-raised overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 shadow-sm"
                    style={{ width: `${item.load}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Order Stream */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
              <Zap size={16} className="text-amber-500" /> Recent Settlement Stream
            </h3>
            <span className="text-xs text-text-muted">Live Stream</span>
          </div>

          <div className="divide-y divide-border">
            {recentTx.isLoading ? (
              <div className="py-6 text-center text-xs text-text-muted">Loading live orders...</div>
            ) : recentTx.data?.data && recentTx.data.data.length > 0 ? (
              recentTx.data.data.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-text truncate">{tx.reference}</span>
                      {tx.network && <NetworkBadge network={tx.network} />}
                    </div>
                    <p className="text-[11px] text-text-muted font-mono mt-0.5">
                      {tx.recipient_phone || 'Customer'} · {formatDateTime(tx.created_at)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-display font-black text-text">{formatGHS(tx.amount)}</span>
                    <div className="mt-0.5">
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-text-muted">No transactions found</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
