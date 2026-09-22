import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, Award, DollarSign, Calendar, Sparkles, Target } from 'lucide-react'
import { formatGHS, GHSToPesewas } from '../../utils/formatCurrency'

const MILESTONES = [
  { name: 'Starter', minMonthly: 0, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  { name: 'Silver', minMonthly: 500, color: 'text-slate-800', bg: 'bg-slate-200', border: 'border-slate-300' },
  { name: 'Gold', minMonthly: 2000, color: 'text-amber-800', bg: 'bg-amber-100', border: 'border-amber-300' },
  { name: 'Diamond', minMonthly: 5000, color: 'text-blue-800', bg: 'bg-blue-100', border: 'border-blue-300' },
]

export default function MarginSimulator() {
  const [dailyVolume, setDailyVolume] = useState(15) // 1 to 200 transactions
  const [avgMarginGhs, setAvgMarginGhs] = useState(2.5) // GHS 0.50 to 20.00
  const [activeCustomers, setActiveCustomers] = useState(20) // 1 to 100 customers

  const calculations = useMemo(() => {
    const dailyIncomeGhs = dailyVolume * avgMarginGhs
    const weeklyIncomeGhs = dailyIncomeGhs * 7
    const monthlyIncomeGhs = dailyIncomeGhs * 30
    const annualIncomeGhs = dailyIncomeGhs * 365

    // Tier calculation
    let currentTier = MILESTONES[0]
    let nextTier = MILESTONES[1]

    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (monthlyIncomeGhs >= MILESTONES[i].minMonthly) {
        currentTier = MILESTONES[i]
        nextTier = MILESTONES[i + 1] || null
        break
      }
    }

    const gapToNext = nextTier ? nextTier.minMonthly - monthlyIncomeGhs : 0

    return {
      daily: GHSToPesewas(dailyIncomeGhs),
      weekly: GHSToPesewas(weeklyIncomeGhs),
      monthly: GHSToPesewas(monthlyIncomeGhs),
      annual: GHSToPesewas(annualIncomeGhs),
      monthlyGhs: monthlyIncomeGhs,
      currentTier,
      nextTier,
      gapToNext: GHSToPesewas(gapToNext),
    }
  }, [dailyVolume, avgMarginGhs, activeCustomers])

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Calculator size={22} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-dark">
              Reseller Profit & Margin Simulator
            </h2>
            <p className="text-xs text-slate-500">
              Project your revenue and scale your reseller earnings with live volume modeling
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${calculations.currentTier.bg} ${calculations.currentTier.color} ${calculations.currentTier.border}`}>
            <Award size={14} /> Tier: {calculations.currentTier.name}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* Sliders Area */}
        <div className="space-y-6">
          {/* Slider 1: Daily Transactions */}
          <div>
            <div className="flex justify-between text-xs font-bold text-dark">
              <span>Daily Transaction Volume</span>
              <span className="font-mono text-primary font-black text-sm">{dailyVolume} tx/day</span>
            </div>
            <input
              type="range"
              min="1"
              max="200"
              value={dailyVolume}
              onChange={(e) => setDailyVolume(Number(e.target.value))}
              className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1 tx</span>
              <span>100 tx</span>
              <span>200 tx</span>
            </div>
          </div>

          {/* Slider 2: Margin per transaction */}
          <div>
            <div className="flex justify-between text-xs font-bold text-dark">
              <span>Average Margin per Bundle</span>
              <span className="font-mono text-emerald-600 font-black text-sm">GHS {avgMarginGhs.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.25"
              value={avgMarginGhs}
              onChange={(e) => setAvgMarginGhs(Number(e.target.value))}
              className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>GHS 0.50</span>
              <span>GHS 10.00</span>
              <span>GHS 20.00</span>
            </div>
          </div>

          {/* Slider 3: Active customers */}
          <div>
            <div className="flex justify-between text-xs font-bold text-dark">
              <span>Active Customer Base</span>
              <span className="font-mono text-indigo-600 font-black text-sm">{activeCustomers} customers</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={activeCustomers}
              onChange={(e) => setActiveCustomers(Number(e.target.value))}
              className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Live Projections & Milestone Tiers */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-50/50 via-white to-emerald-50/40 p-5">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
            Projected Earnings
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Daily Profit</span>
              <p className="mt-1 font-display text-lg font-extrabold text-dark">
                {formatGHS(calculations.daily)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Weekly Profit</span>
              <p className="mt-1 font-display text-lg font-extrabold text-dark">
                {formatGHS(calculations.weekly)}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Monthly Projected Income</span>
                <Sparkles size={16} className="text-emerald-600" />
              </div>
              <p className="mt-1.5 font-display text-2xl font-black text-emerald-700">
                {formatGHS(calculations.monthly)}
              </p>
              <span className="text-[11px] font-medium text-emerald-600">
                Annual run rate: {formatGHS(calculations.annual)}/year
              </span>
            </div>
          </div>

          {/* Tier Milestones */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-xs font-bold text-dark mb-2">
              <span className="flex items-center gap-1.5">
                <Target size={14} className="text-primary" /> Milestone Tiers
              </span>
              {calculations.nextTier && (
                <span className="text-[11px] font-semibold text-slate-500">
                  {formatGHS(calculations.gapToNext)} to {calculations.nextTier.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
              {MILESTONES.map((m) => {
                const isCurrent = calculations.currentTier.name === m.name
                return (
                  <div
                    key={m.name}
                    className={`rounded-lg p-2 font-bold transition border ${
                      isCurrent
                        ? `${m.bg} ${m.color} ${m.border} ring-2 ring-primary/30`
                        : 'bg-white text-slate-400 border-slate-100'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="block text-[9px] font-mono opacity-80 mt-0.5">
                      GHS {m.minMonthly}+
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
