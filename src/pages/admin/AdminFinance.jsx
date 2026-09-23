import { useQuery } from '@tanstack/react-query'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { DollarSign, TrendingUp, Wallet, PieChart as PieIcon } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import { NetworkBadge } from '../../components/ui/Badge'
import { getFinanceSummary } from '../../api/admin.api'
import { formatGHS } from '../../utils/formatCurrency'

const NETWORK_COLORS = {
  MTN: '#FFCB00',
  TELECEL: '#E3001B',
  AT: '#0066CC',
}

export default function AdminFinance() {
  const { data, isLoading } = useQuery({ queryKey: ['finance-summary'], queryFn: getFinanceSummary })

  const totalNetworkRev = (data?.byNetwork || []).reduce((sum, item) => sum + item.value, 0) || 1

  const chartData = (data?.byNetwork || []).map((item) => ({
    name: item.network,
    network: item.network,
    value: item.value,
    percentage: ((item.value / totalNetworkRev) * 100).toFixed(1),
    fill: NETWORK_COLORS[item.network] || '#94A3B8',
  }))

  return (
    <>
      <PageHeader
        title="Finance & Revenue"
        subtitle="Gross telecom sales, carrier cost breakdown, net profit margin, and volume split by operator."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard label="Total Gross Revenue" value={formatGHS(data?.revenue)} icon={DollarSign} loading={isLoading} />
        <StatCard label="Carrier Cost" value={formatGHS(data?.cost)} icon={Wallet} tone="warning" loading={isLoading} />
        <StatCard label="Net Platform Margin" value={formatGHS(data?.margin)} icon={TrendingUp} tone="success" loading={isLoading} />
      </div>

      <div className="card mt-6 p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <PieIcon size={20} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-text">Revenue by Network Operator</h2>
              <p className="text-xs text-text-muted">Distribution of successful data sales across telcos</p>
            </div>
          </div>
          <span className="text-xs font-bold text-text-muted">
            Total: {formatGHS(data?.revenue)}
          </span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr] items-center">
          {/* Pie Chart */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="var(--color-surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatGHS(value), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '12px',
                    color: 'var(--color-text)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Network Legend Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Operator Split</h3>
            {chartData.map((item) => (
              <div
                key={item.network}
                className="flex items-center justify-between rounded-xl border border-border bg-surface-raised p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.fill }} />
                  <NetworkBadge network={item.network} />
                </div>

                <div className="text-right">
                  <span className="font-display text-sm font-bold text-text">
                    {formatGHS(item.value)}
                  </span>
                  <span className="block text-[11px] font-semibold text-text-muted font-mono">
                    {item.percentage}% of volume
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
