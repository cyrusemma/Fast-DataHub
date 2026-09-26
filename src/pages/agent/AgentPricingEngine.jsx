import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calculator,
  Sliders,
  TrendingUp,
  Save,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Plus,
  RefreshCw,
  Zap,
  DollarSign,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select } from '../../components/ui/Input'
import { getAllBundles } from '../../api/bundles.api'
import { useAuthStore } from '../../store/authStore'
import { pricingEngine } from '../../services/pricingEngine'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'
import { cn } from '../../utils/cn'

const CARRIERS = [
  { id: 'MTN', name: 'MTN Ghana', color: 'border-amber-400 bg-amber-400/10 text-amber-500' },
  { id: 'TELECEL', name: 'Telecel Ghana', color: 'border-red-500 bg-red-500/10 text-red-500' },
  { id: 'AT', name: 'AirtelTigo / AT', color: 'border-blue-500 bg-blue-500/10 text-blue-500' },
]

export default function AgentPricingEngine() {
  const { profile } = useAuthStore()
  const agentId = profile?.id || 'agent-default'

  const [selectedNetwork, setSelectedNetwork] = useState('MTN')
  const [customPrices, setCustomPrices] = useState(() => pricingEngine.getAgentCustomPrices(agentId))
  const [isDirty, setIsDirty] = useState(false)

  // Mass markup tool state
  const [massMode, setMassMode] = useState('retail') // 'retail' | 'reseller'
  const [massType, setMassType] = useState('fixed') // 'fixed' | 'percentage'
  const [massValue, setMassValue] = useState(0.5)

  // Profit Forecaster state
  const [forecastDailyVolume, setForecastDailyVolume] = useState(50)
  const [forecastAvgMargin, setForecastAvgMargin] = useState(1.2)

  const { data: rawBundles = [], isLoading } = useQuery({
    queryKey: ['admin-bundles'],
    queryFn: getAllBundles,
  })

  // Filter bundles for selected network
  const networkBundles = useMemo(() => {
    return rawBundles.filter((b) => (b.network || '').toUpperCase() === selectedNetwork)
  }, [rawBundles, selectedNetwork])

  // Get effective price for a bundle
  const getBundlePrices = (b) => {
    const override = customPrices[b.id] || {}
    const agentCost = Number(b.agent_price ?? b.cost_price ?? (b.selling_price * 0.90))
    const retailPrice = override.selling_price !== undefined ? Number(override.selling_price) : Number(b.selling_price || agentCost * 1.08)
    const resellerPrice = override.reseller_price !== undefined ? Number(override.reseller_price) : Number(b.reseller_price || agentCost * 1.04)
    const isEnabled = override.enabled !== false

    const retailProfit = retailPrice - agentCost
    const retailMarginPct = retailPrice > 0 ? (retailProfit / retailPrice) * 100 : 0

    const resellerProfit = resellerPrice - agentCost
    const resellerMarginPct = resellerPrice > 0 ? (resellerProfit / resellerPrice) * 100 : 0

    return {
      agentCost,
      retailPrice,
      resellerPrice,
      retailProfit,
      retailMarginPct,
      resellerProfit,
      resellerMarginPct,
      isEnabled,
    }
  }

  // Update specific price in local state
  const handlePriceChange = (bundleId, field, value) => {
    const num = parseFloat(value) || 0
    setCustomPrices((prev) => ({
      ...prev,
      [bundleId]: {
        ...(prev[bundleId] || {}),
        [field]: num,
      },
    }))
    setIsDirty(true)
  }

  // Toggle bundle availability in agent store
  const handleToggleBundle = (bundleId, currentEnabled) => {
    setCustomPrices((prev) => ({
      ...prev,
      [bundleId]: {
        ...(prev[bundleId] || {}),
        enabled: !currentEnabled,
      },
    }))
    setIsDirty(true)
  }

  // 1-Click Mass Markup for current network
  const applyMassMarkup = () => {
    const updated = { ...customPrices }
    networkBundles.forEach((b) => {
      const agentCost = Number(b.agent_price ?? b.cost_price ?? (b.selling_price * 0.90))
      let newPrice = 0

      if (massType === 'fixed') {
        newPrice = agentCost + massValue
      } else {
        newPrice = agentCost * (1 + massValue / 100)
      }

      newPrice = Math.round(newPrice * 100) / 100

      updated[b.id] = {
        ...(updated[b.id] || {}),
        [massMode === 'retail' ? 'selling_price' : 'reseller_price']: newPrice,
      }
    })

    setCustomPrices(updated)
    setIsDirty(true)
    toast.success(`Updated ${networkBundles.length} ${selectedNetwork} packages!`)
  }

  // Save changes
  const handleSave = () => {
    pricingEngine.saveAgentCustomPrices(agentId, customPrices)
    setIsDirty(false)
    toast.success('Your custom pricing and profit margins are active!')
  }

  // Reset to system defaults
  const handleReset = () => {
    if (window.confirm('Reset all your custom selling prices back to platform defaults?')) {
      pricingEngine.saveAgentCustomPrices(agentId, {})
      setCustomPrices({})
      setIsDirty(false)
      toast.info('Prices reset to platform defaults')
    }
  }

  // Average profit metrics for summary
  const summaryMetrics = useMemo(() => {
    let totalRetailProfit = 0
    let totalResellerProfit = 0
    let count = 0

    networkBundles.forEach((b) => {
      const prices = getBundlePrices(b)
      if (prices.isEnabled) {
        totalRetailProfit += prices.retailProfit
        totalResellerProfit += prices.resellerProfit
        count++
      }
    })

    const avgRetailProfit = count > 0 ? totalRetailProfit / count : 0
    const avgResellerProfit = count > 0 ? totalResellerProfit / count : 0

    return { avgRetailProfit, avgResellerProfit, count }
  }, [networkBundles, customPrices])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Pricing & Profit Engine"
        subtitle="Control your retail selling prices, set wholesale margins for your downline resellers, and maximize your profits."
        action={
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500 animate-pulse">
                <AlertTriangle size={14} /> Unsaved changes
              </span>
            )}
            <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSave} disabled={!isDirty}>
              Save My Pricing
            </Button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 via-surface to-surface border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Avg Retail Margin</span>
            <DollarSign className="text-primary" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-text font-display">
            +{formatGHS(summaryMetrics.avgRetailProfit)} <span className="text-xs text-emerald-500 font-bold">/ sale</span>
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Your net profit when selling directly to customers</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 via-surface to-surface border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Avg Reseller Margin</span>
            <TrendingUp className="text-emerald-500" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-500 font-display">
            +{formatGHS(summaryMetrics.avgResellerProfit)} <span className="text-xs text-text-muted font-bold">/ sale</span>
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Passive commission from sub-reseller orders</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-500/10 via-surface to-surface border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Active Shop Catalog</span>
            <Layers className="text-amber-500" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-500 font-display">
            {summaryMetrics.count} of {networkBundles.length} Bundles
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Live {selectedNetwork} packages enabled</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500/10 via-surface to-surface border-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Monthly Projection</span>
            <Sparkles className="text-blue-500" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-500 font-display">
            {formatGHS(forecastDailyVolume * forecastAvgMargin * 30)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Based on {forecastDailyVolume} sales/day</p>
        </Card>
      </div>

      {/* Network Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-3">
        <div className="flex gap-2">
          {CARRIERS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedNetwork(c.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black border transition duration-150 flex items-center gap-2',
                selectedNetwork === c.id
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface border-border text-text-muted hover:text-text'
              )}
            >
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* 1-Click Mass Markup Bar */}
        <div className="flex items-center gap-2 bg-surface-raised p-2 rounded-xl border border-border flex-wrap">
          <span className="text-xs font-bold text-text flex items-center gap-1">
            <Sliders size={13} className="text-primary" /> 1-Click Markup:
          </span>
          <Select
            value={massMode}
            onChange={(e) => setMassMode(e.target.value)}
            className="text-xs py-1 px-2 h-8"
          >
            <option value="retail">Customer Retail Price</option>
            <option value="reseller">Downline Reseller Price</option>
          </Select>
          <Select
            value={massType}
            onChange={(e) => setMassType(e.target.value)}
            className="text-xs py-1 px-2 h-8"
          >
            <option value="fixed">Fixed (₵)</option>
            <option value="percentage">Percentage (%)</option>
          </Select>
          <div className="w-20">
            <Input
              type="number"
              step={massType === 'fixed' ? '0.1' : '1'}
              value={massValue}
              onChange={(e) => setMassValue(parseFloat(e.target.value) || 0)}
              className="text-xs py-1 px-2 h-8"
            />
          </div>
          <Button size="sm" variant="primary" onClick={applyMassMarkup} icon={Zap}>
            Apply
          </Button>
        </div>
      </div>

      {/* Bundles Pricing Matrix Table */}
      <Card className="p-0 overflow-hidden border-border">
        <div className="p-4 bg-surface-raised/50 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-text">
              {selectedNetwork} Bundle Wholesale Costs & Custom Margins
            </h3>
            <p className="text-xs text-text-muted">
              Enter your desired selling prices below. Net profit and margins calculate in real-time.
            </p>
          </div>
          <span className="text-xs font-semibold text-text-muted">
            {networkBundles.length} Packages
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-raised/20 text-text-muted uppercase text-[10px] tracking-wider font-bold">
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Package</th>
                <th className="p-3.5">Data Size</th>
                <th className="p-3.5 font-mono text-right">Your Wholesale Cost</th>
                <th className="p-3.5 text-center bg-primary/5">Retail Customer Price (₵)</th>
                <th className="p-3.5 text-right">Your Retail Profit</th>
                <th className="p-3.5 text-center bg-emerald-500/5">Downline Reseller Price (₵)</th>
                <th className="p-3.5 text-right">Your Reseller Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {networkBundles.map((b) => {
                const prices = getBundlePrices(b)
                const isCustom = customPrices[b.id]?.selling_price !== undefined || customPrices[b.id]?.reseller_price !== undefined

                return (
                  <tr
                    key={b.id}
                    className={cn(
                      'transition hover:bg-surface-raised/40',
                      !prices.isEnabled && 'opacity-50 bg-surface-raised/20'
                    )}
                  >
                    {/* Status / Enabled toggle */}
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleBundle(b.id, prices.isEnabled)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-extrabold border transition',
                          prices.isEnabled
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                        )}
                      >
                        {prices.isEnabled ? 'ACTIVE' : 'HIDDEN'}
                      </button>
                    </td>

                    {/* Bundle Name */}
                    <td className="p-3.5">
                      <span className="font-bold text-text block">{b.name}</span>
                      {isCustom && (
                        <span className="text-[10px] font-semibold text-primary">● Custom Price</span>
                      )}
                    </td>

                    {/* Data Size */}
                    <td className="p-3.5 font-mono font-bold text-text">
                      {formatDataSize(b.data_size_mb)}
                    </td>

                    {/* Agent Cost */}
                    <td className="p-3.5 text-right font-mono font-bold text-text-muted">
                      {formatGHS(prices.agentCost)}
                    </td>

                    {/* Customer Retail Selling Price Input */}
                    <td className="p-3.5 text-center bg-primary/5">
                      <div className="w-28 mx-auto">
                        <Input
                          type="number"
                          step="0.10"
                          min={prices.agentCost}
                          value={prices.retailPrice}
                          onChange={(e) => handlePriceChange(b.id, 'selling_price', e.target.value)}
                          className="text-right font-mono font-black text-primary text-xs py-1"
                        />
                      </div>
                    </td>

                    {/* Retail Profit Badge */}
                    <td className="p-3.5 text-right">
                      <span className={cn(
                        'font-bold font-mono px-2 py-0.5 rounded text-xs',
                        prices.retailProfit >= 0.5
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : 'text-amber-500 bg-amber-500/10'
                      )}>
                        +{formatGHS(prices.retailProfit)} ({prices.retailMarginPct.toFixed(1)}%)
                      </span>
                    </td>

                    {/* Reseller Price Input */}
                    <td className="p-3.5 text-center bg-emerald-500/5">
                      <div className="w-28 mx-auto">
                        <Input
                          type="number"
                          step="0.10"
                          min={prices.agentCost}
                          value={prices.resellerPrice}
                          onChange={(e) => handlePriceChange(b.id, 'reseller_price', e.target.value)}
                          className="text-right font-mono font-black text-emerald-500 text-xs py-1"
                        />
                      </div>
                    </td>

                    {/* Reseller Margin Badge */}
                    <td className="p-3.5 text-right">
                      <span className="font-bold font-mono px-2 py-0.5 rounded text-xs text-emerald-500 bg-emerald-500/10">
                        +{formatGHS(prices.resellerProfit)} ({prices.resellerMarginPct.toFixed(1)}%)
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Interactive Volume & Revenue Forecaster */}
      <Card className="p-5 border-border bg-gradient-to-br from-surface to-surface-raised space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Calculator className="text-primary" size={18} />
            <h3 className="font-display text-sm font-bold text-text">
              Agent Sales & Monthly Profit Forecaster
            </h3>
          </div>
          <span className="text-xs font-bold text-primary">Live Projection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text mb-1 block">Estimated Daily Bundles Sold</label>
              <Input
                type="number"
                min="1"
                max="5000"
                value={forecastDailyVolume}
                onChange={(e) => setForecastDailyVolume(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text mb-1 block">Average Net Profit per Bundle (₵)</label>
              <Input
                type="number"
                step="0.10"
                min="0.1"
                value={forecastAvgMargin}
                onChange={(e) => setForecastAvgMargin(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface border border-border text-center">
            <div className="p-3 rounded-lg bg-surface-raised border border-border">
              <span className="text-[10px] uppercase font-bold text-text-muted">Daily Profit</span>
              <p className="text-xl font-black text-emerald-500 font-display mt-1">
                {formatGHS(forecastDailyVolume * forecastAvgMargin)}
              </p>
              <span className="text-[10px] text-text-muted">{forecastDailyVolume} orders/day</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border">
              <span className="text-[10px] uppercase font-bold text-text-muted">Monthly Net Earnings</span>
              <p className="text-xl font-black text-primary font-display mt-1">
                {formatGHS(forecastDailyVolume * forecastAvgMargin * 30)}
              </p>
              <span className="text-[10px] text-text-muted">{forecastDailyVolume * 30} orders/mo</span>
            </div>

            <div className="col-span-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-bold flex items-center justify-center gap-1.5">
              <Sparkles size={14} /> At this rate, your estimated annual revenue is {formatGHS(forecastDailyVolume * forecastAvgMargin * 365)}!
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
