import { useQuery } from '@tanstack/react-query'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { DollarSign, TrendingUp, Wallet } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import { getFinanceSummary } from '../../api/admin.api'
import { formatGHS } from '../../utils/formatCurrency'

const colors = ['#0066FF', '#00C48C', '#FFB300']

export default function AdminFinance() {
  const { data, isLoading } = useQuery({ queryKey: ['finance-summary'], queryFn: getFinanceSummary })
  return (
    <>
      <PageHeader title="Finance" subtitle="Revenue, provider cost, margin, and network split." />
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard label="Revenue" value={formatGHS(data?.revenue)} icon={DollarSign} loading={isLoading} />
        <StatCard label="Cost" value={formatGHS(data?.cost)} icon={Wallet} tone="warning" loading={isLoading} />
        <StatCard label="Margin" value={formatGHS(data?.margin)} icon={TrendingUp} tone="success" loading={isLoading} />
      </div>
      <div className="card mt-6 p-5">
        <h2 className="font-display text-base font-bold text-dark">Revenue by network</h2>
        <div className="mt-5 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data?.byNetwork || []} dataKey="value" nameKey="network" outerRadius={110} label>
                {(data?.byNetwork || []).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatGHS(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
