import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calculator,
  Sliders,
  TrendingUp,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  RefreshCw,
  Zap,
  DollarSign,
  Layers,
  Sparkles,
  Store,
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

export default function ResellerPricingEngine() {
  const { profile } = useAuthStore()
  const resellerId = profile?.id || 'reseller-default'

  const [selectedNetwork, setSelectedNetwork] = useState('MTN')
  const [customPrices, setCustomPrices] = useState(() => pricingEngine.getResellerCustomPrices(resellerId))
  const [isDirty, setIsDirty] = useState(false)

  // Mass markup tool state
  const [massType, setMassType] = useState('fixed') // 'fixed' | 'percentage'
  const [massValue, setMassValue] = useState(0.5)

  // Forecaster state
  const [forecastDailyVolume, setForecastDailyVolume] = useState(25)
  const [forecastAvgMargin, setForecastAvgMargin] = useState(0.8)

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
    const wholesaleCost = Number(b.reseller_price ?? b.agent_price ?? (b.selling_price * 0.95))
    const sellingPrice = override.selling_price !== undefined ? Number(override.selling_price) : Number(b.selling_price || wholesaleCost * 1.06)
    const isEnabled = override.enabled !== false

    const profit = sellingPrice - wholesaleCost
    const marginPct = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0

    return {
      wholesaleCost,
      sellingPrice,
      profit,
      marginPct,
      isEnabled,
    }
  }

  // Update specific price in local state
  const handlePriceChange = (bundleId, value) => {
    const num = parseFloat(value) || 0
    setCustomPrices((prev) => ({
      ...prev,
      [bundleId]: {
        ...(prev[bundleId] || {}),
        selling_price: num,
      },
    }))
    setIsDirty(true)
  }

  // Toggle bundle availability in reseller catalog
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
      const cost = Number(b.reseller_price ?? b.agent_price ?? (b.selling_price * 0.95))
      let newPrice = 0

      if (massType === 'fixed') {
        newPrice = cost + massValue
      } else {
        newPrice = cost * (1 + massValue / 100)
      }

      newPrice = Math.round(newPrice * 100) / 100

      updated[b.id] = {
        ...(updated[b.id] || {}),
        selling_price: newPrice,
      }
    })

    setCustomPrices(updated)
    setIsDirty(true)
    toast.success(`Updated ${networkBundles.length} ${selectedNetwork} selling prices!`)
  }

  // Quick preset button click
  const applyPreset = (markupGhs) => {
    const updated = { ...customPrices }
    networkBundles.forEach((b) => {
      const cost = Number(b.reseller_price ?? b.agent_price ?? (b.selling_price * 0.95))
      updated[b.id] = {
        ...(updated[b.id] || {}),
        selling_price: Math.round((cost + markupGhs) * 100) / 100,
      }
    })
    setCustomPrices(updated)
    setIsDirty(true)
    toast.success(`Set +${formatGHS(markupGhs)} margin across all ${selectedNetwork} packages!`)
  }

  // Save changes
  const handleSave = () => {
    pricingEngine.saveResellerCustomPrices(resellerId, customPrices)
    setIsDirty(false)
    toast.success('Your custom retail prices and profit margins are active!')
  }

  // Reset to system defaults
  const handleReset = () => {
    if (window.confirm('Reset all your custom selling prices back to standard platform rates?')) {
      pricingEngine.saveResellerCustomPrices(resellerId, {})
      setCustomPrices({})
      setIsDirty(false)
      toast.info('Prices reset to defaults')
    }
  }

  // Average profit metrics
  const summaryMetrics = useMemo(() => {
    let totalProfit = 0
    let count = 0

    networkBundles.forEach((b) => {
      const prices = getBundlePrices(b)
      if (prices.isEnabled) {
        totalProfit += prices.profit
        count++
      }
    })

    const avgProfit = count > 0 ? totalProfit / count : 0
    return { avgProfit, count }
  }, [networkBundles, customPrices])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reseller Pricing & Profit Engine"
        subtitle="Set your own retail selling prices on all data bundles, customize your margins, and maximize your profits per transaction."
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
              Save My Prices
            </Button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 via-surface to-surface border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Avg Profit / Sale</span>
            <DollarSign className="text-primary" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-500 font-display">
            +{formatGHS(summaryMetrics.avgProfit)} <span className="text-xs text-text-muted font-bold">/ package</span>
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Your direct earnings deposited to wallet on sale</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 via-surface to-surface border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Active In Catalog</span>
            <Store className="text-emerald-500" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-text font-display">
            {summaryMetrics.count} of {networkBundles.length} Bundles
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Enabled {selectedNetwork} packages for customers</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-500/10 via-surface to-surface border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Daily Projection</span>
            <Flame className="text-amber-500" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-500 font-display">
            {formatGHS(forecastDailyVolume * forecastAvgMargin)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Based on {forecastDailyVolume} sales/day</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500/10 via-surface to-surface border-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Monthly Earnings</span>
            <Sparkles className="text-blue-500" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-500 font-display">
            {formatGHS(forecastDailyVolume * forecastAvgMargin * 30)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">30-day projected net profit</p>
        </Card>
      </div>

      {/* Network Selector Tabs & Quick Preset Strip */}
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

        {/* Quick Margin Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-text-muted mr-1">Quick Margins:</span>
          {[0.30, 0.50, 0.80, 1.00, 1.50].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => applyPreset(amt)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-border bg-surface-raised hover:border-primary hover:text-primary transition"
            >
              +{formatGHS(amt)}
            </button>
          ))}
        </div>
      </div>

      {/* Bundles Pricing Matrix Table */}
      <Card className="p-0 overflow-hidden border-border">
        <div className="p-4 bg-surface-raised/50 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-text">
              {selectedNetwork} Wholesale Purchase Costs & Your Selling Prices
            </h3>
            <p className="text-xs text-text-muted">
              Edit the "Your Selling Price" column to set your desired price for each bundle.
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
                <th className="p-3.5 text-center bg-primary/5">Your Customer Price (₵)</th>
                <th className="p-3.5 text-right">Your Net Profit (₵)</th>
                <th className="p-3.5 text-right">Profit Margin (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {networkBundles.map((b) => {
                const prices = getBundlePrices(b)
                const isCustom = customPrices[b.id]?.selling_price !== undefined

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
                        <span className="text-[10px] font-semibold text-primary">● Custom Rate</span>
                      )}
                    </td>

                    {/* Data Size */}
                    <td className="p-3.5 font-mono font-bold text-text">
                      {formatDataSize(b.data_size_mb)}
                    </td>

                    {/* Wholesale Cost */}
                    <td className="p-3.5 text-right font-mono font-bold text-text-muted">
                      {formatGHS(prices.wholesaleCost)}
                    </td>

                    {/* Reseller Selling Price Input */}
                    <td className="p-3.5 text-center bg-primary/5">
                      <div className="w-28 mx-auto">
                        <Input
                          type="number"
                          step="0.10"
                          min={prices.wholesaleCost}
                          value={prices.sellingPrice}
                          onChange={(e) => handlePriceChange(b.id, e.target.value)}
                          className="text-right font-mono font-black text-primary text-xs py-1"
                        />
                      </div>
                    </td>

                    {/* Net Profit Badge */}
                    <td className="p-3.5 text-right">
                      <span className={cn(
                        'font-bold font-mono px-2 py-0.5 rounded text-xs',
                        prices.profit >= 0.5
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : 'text-amber-500 bg-amber-500/10'
                      )}>
                        +{formatGHS(prices.profit)}
                      </span>
                    </td>

                    {/* Margin % */}
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-500">
                      {prices.marginPct.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Interactive Daily & Monthly Profit Forecaster */}
      <Card className="p-5 border-border bg-gradient-to-br from-surface to-surface-raised space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Calculator className="text-primary" size={18} />
            <h3 className="font-display text-sm font-bold text-text">
              Reseller Sales & Monthly Earnings Forecaster
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-500">Live Projection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text mb-1 block">Your Target Daily Sales (Bundles)</label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={forecastDailyVolume}
                onChange={(e) => setForecastDailyVolume(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text mb-1 block">Average Profit Margin (₵ per bundle)</label>
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
              <span className="text-[10px] uppercase font-bold text-text-muted">Daily Net Profit</span>
              <p className="text-xl font-black text-emerald-500 font-display mt-1">
                {formatGHS(forecastDailyVolume * forecastAvgMargin)}
              </p>
              <span className="text-[10px] text-text-muted">{forecastDailyVolume} bundles/day</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border">
              <span className="text-[10px] uppercase font-bold text-text-muted">Monthly Net Profit</span>
              <p className="text-xl font-black text-primary font-display mt-1">
                {formatGHS(forecastDailyVolume * forecastAvgMargin * 30)}
              </p>
              <span className="text-[10px] text-text-muted">{forecastDailyVolume * 30} bundles/mo</span>
            </div>

            <div className="col-span-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 font-bold">
              💰 Extra estimated annual take-home: {formatGHS(forecastDailyVolume * forecastAvgMargin * 365)}!
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
