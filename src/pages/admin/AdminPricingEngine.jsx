import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calculator,
  Sliders,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Percent,
  Layers,
  Zap,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  ArrowRight,
  Flame,
  DollarSign,
  Tag,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { getAllBundles, updateBundle } from '../../api/bundles.api'
import { pricingEngine, DEFAULT_PRICING_CONFIG } from '../../services/pricingEngine'
import { formatGHS } from '../../utils/formatCurrency'
import { formatDataSize } from '../../utils/formatDate'
import { cn } from '../../utils/cn'

const CARRIERS = [
  { id: 'MTN', name: 'MTN Ghana', color: 'from-amber-400 to-yellow-500', text: 'text-amber-500' },
  { id: 'TELECEL', name: 'Telecel Ghana', color: 'from-red-600 to-rose-600', text: 'text-red-500' },
  { id: 'AT', name: 'AirtelTigo / AT', color: 'from-blue-600 to-red-600', text: 'text-blue-500' },
]

export default function AdminPricingEngine() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('rules') // 'rules' | 'roles' | 'flash' | 'volume' | 'simulator' | 'vas'
  const [config, setConfig] = useState(() => pricingEngine.loadConfig())
  const [isDirty, setIsDirty] = useState(false)
  const [repriceModalOpen, setRepriceModalOpen] = useState(false)
  const [repriceCarrier, setRepriceCarrier] = useState('ALL')
  const [newFlashModalOpen, setNewFlashModalOpen] = useState(false)

  // Live Simulator state
  const [simCarrier, setSimCarrier] = useState('MTN')
  const [simCost, setSimCost] = useState(10.0)
  const [simSizeMb, setSimSizeMb] = useState(2048)
  const [simRole, setSimRole] = useState('CUSTOMER')
  const [simQuantity, setSimQuantity] = useState(1)

  // Bundles for mass repricer preview
  const { data: bundles = [], isLoading: bundlesLoading } = useQuery({
    queryKey: ['admin-bundles'],
    queryFn: getAllBundles,
  })

  // Flash Sale Form State
  const [flashForm, setFlashForm] = useState({
    name: '',
    network: 'ALL',
    discountPct: 5.0,
    active: true,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    bannerText: 'Flash Sale Live: Extra discount on all packages!',
  })

  const handleSaveConfig = () => {
    pricingEngine.saveConfig(config)
    setIsDirty(false)
    toast.success('Pricing Engine rules updated and active!')
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset all pricing engine rules to system defaults?')) {
      const reset = pricingEngine.resetToDefaults()
      setConfig(reset)
      setIsDirty(false)
      toast.info('Pricing rules reset to defaults')
    }
  }

  // Simulator dynamic evaluation
  const simResult = useMemo(() => {
    return pricingEngine.evaluatePrice({
      costPrice: simCost,
      network: simCarrier,
      sizeMb: simSizeMb,
      role: simRole,
      quantity: simQuantity,
    })
  }, [config, simCarrier, simCost, simSizeMb, simRole, simQuantity])

  // Mass reprice preview
  const massRepricePreview = useMemo(() => {
    return bundles
      .filter((b) => repriceCarrier === 'ALL' || b.network === repriceCarrier)
      .map((b) => {
        const cost = b.cost_price || b.selling_price * 0.92
        const newRetail = pricingEngine.calculateBaseSellingPrice(cost, b.network, b.data_size_mb)
        const agentEval = pricingEngine.evaluatePrice({
          costPrice: cost,
          sellingPrice: newRetail,
          network: b.network,
          role: 'AGENT',
        })
        const resellerEval = pricingEngine.evaluatePrice({
          costPrice: cost,
          sellingPrice: newRetail,
          network: b.network,
          role: 'RESELLER',
        })

        return {
          ...b,
          new_selling_price: newRetail,
          new_agent_price: agentEval.unitPrice,
          new_reseller_price: resellerEval.unitPrice,
          diff_selling: (newRetail - (b.selling_price || 0)).toFixed(2),
        }
      })
  }, [bundles, repriceCarrier, config])

  // Mass reprice mutation
  const executeMassReprice = useMutation({
    mutationFn: async () => {
      for (const item of massRepricePreview) {
        await updateBundle(item.id, {
          selling_price: item.new_selling_price,
          agent_price: item.new_agent_price,
          reseller_price: item.new_reseller_price,
        })
      }
    },
    onSuccess: () => {
      toast.success(`Successfully updated ${massRepricePreview.length} packages!`)
      setRepriceModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-bundles'] })
      queryClient.invalidateQueries({ queryKey: ['bundles'] })
    },
    onError: (err) => {
      toast.error(`Reprice failed: ${err.message}`)
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelligent Pricing Engine"
        subtitle="Dynamic markup algorithms, role pricing tiers, flash sale campaigns, and automated profit floor safeguards."
        action={
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500 animate-pulse">
                <AlertTriangle size={14} /> Unsaved changes
              </span>
            )}
            <Button variant="secondary" icon={RotateCcw} onClick={handleResetDefaults}>
              Defaults
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSaveConfig} disabled={!isDirty}>
              Apply & Save Rules
            </Button>
          </div>
        }
      />

      {/* Top Engine KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 relative overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-surface border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Active Markups</span>
            <Calculator className="text-primary" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-text font-display">
            {config.markupRules.MTN.percentage}% / {config.markupRules.TELECEL.percentage}% / {config.markupRules.AT.percentage}%
          </p>
          <p className="mt-1 text-[11px] text-text-muted">MTN / Telecel / AT dynamic margins</p>
        </Card>

        <Card className="p-4 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-surface to-surface border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Profit Safeguard</span>
            <ShieldCheck className="text-emerald-500" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-500 font-display">
            {config.safeguards.strictProfitFloorEnabled ? `Min ₵${config.safeguards.globalMinProfitGhs.toFixed(2)}` : 'Off'}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Automated negative margin breaker</p>
        </Card>

        <Card className="p-4 relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-surface to-surface border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Flash Promos</span>
            <Flame className="text-amber-500" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-500 font-display">
            {config.flashSales.filter((f) => f.active).length} Active
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Time-limited customer discounts</p>
        </Card>

        <Card className="p-4 relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-surface to-surface border-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Wholesale Spreads</span>
            <TrendingUp className="text-blue-500" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-500 font-display">
            -{config.roleTiers.AGENT.discountPct}% / -{config.roleTiers.RESELLER.discountPct}%
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Agent / Reseller tier wholesale spreads</p>
        </Card>
      </div>

      {/* Engine Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-2">
        {[
          { id: 'rules', label: 'Markup Formulas', icon: Sliders },
          { id: 'roles', label: 'Role Pricing Matrix', icon: Percent },
          { id: 'flash', label: 'Flash Sales & Promos', icon: Flame },
          { id: 'volume', label: 'Bulk Volume Breaks', icon: Layers },
          { id: 'simulator', label: 'Live Profit Simulator', icon: Calculator },
          { id: 'vas', label: 'VAS (Airtime & Bills)', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition duration-150 whitespace-nowrap',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:bg-surface-raised hover:text-text'
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: MARKUP FORMULAS */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-text">Carrier Dynamic Markup Rules</h3>
              <p className="text-xs text-text-muted">Define how retail customer prices are computed from supplier API base cost.</p>
            </div>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => setRepriceModalOpen(true)}
              className="text-xs"
            >
              1-Click Mass Reprice Bundles
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {CARRIERS.map((c) => {
              const rule = config.markupRules[c.id]
              return (
                <Card key={c.id} className="p-5 space-y-4 relative overflow-hidden border-border/80">
                  <div className={cn('absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r', c.color)} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('font-display font-black text-base', c.text)}>{c.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-text-muted px-2 py-0.5 rounded bg-surface-raised border border-border">
                      {rule.type.toUpperCase()}
                    </span>
                  </div>

                  {/* Markup Type Selector */}
                  <div>
                    <label className="text-xs font-bold text-text mb-1 block">Markup Strategy</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['percentage', 'fixed', 'tiered'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setConfig((prev) => ({
                              ...prev,
                              markupRules: {
                                ...prev.markupRules,
                                [c.id]: { ...prev.markupRules[c.id], type },
                              },
                            }))
                            setIsDirty(true)
                          }}
                          className={cn(
                            'py-1.5 text-[11px] font-bold rounded-lg border transition',
                            rule.type === type
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-border bg-surface text-text-muted hover:text-text'
                          )}
                        >
                          {type === 'percentage' ? '% Margin' : type === 'fixed' ? 'Fixed ₵' : 'Tiered GB'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Percentage Mode */}
                  {rule.type === 'percentage' && (
                    <div>
                      <label className="text-xs font-semibold text-text mb-1 block">Markup Percentage (%)</label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={rule.percentage}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setConfig((prev) => ({
                              ...prev,
                              markupRules: {
                                ...prev.markupRules,
                                [c.id]: { ...prev.markupRules[c.id], percentage: val },
                              },
                            }))
                            setIsDirty(true)
                          }}
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-text-muted font-bold">%</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-1">E.g., ₵10.00 base cost $\rightarrow$ ₵{(10 * (1 + rule.percentage / 100)).toFixed(2)} retail</p>
                    </div>
                  )}

                  {/* Fixed Mode */}
                  {rule.type === 'fixed' && (
                    <div>
                      <label className="text-xs font-semibold text-text mb-1 block">Fixed Markup Amount (₵)</label>
                      <Input
                        type="number"
                        step="0.10"
                        min="0"
                        value={rule.fixedAmount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setConfig((prev) => ({
                            ...prev,
                            markupRules: {
                              ...prev.markupRules,
                              [c.id]: { ...prev.markupRules[c.id], fixedAmount: val },
                            },
                          }))
                          setIsDirty(true)
                        }}
                      />
                      <p className="text-[10px] text-text-muted mt-1">Adds flat ₵{rule.fixedAmount.toFixed(2)} on top of every package</p>
                    </div>
                  )}

                  {/* Tiered Step Mode */}
                  {rule.type === 'tiered' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-text block">Data Volume Tiers</label>
                      {rule.tiers?.map((tier, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-raised border border-border">
                          <span>Up to {tier.maxMb >= 1024 ? `${tier.maxMb / 1024}GB` : `${tier.maxMb}MB`}</span>
                          <span className="font-bold text-emerald-500">+₵{tier.markupGhs.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Profit Floor for Carrier */}
                  <div className="pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-muted">Min Profit Floor:</span>
                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.05"
                          min="0"
                          value={rule.minProfitFloor}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setConfig((prev) => ({
                              ...prev,
                              markupRules: {
                                ...prev.markupRules,
                                [c.id]: { ...prev.markupRules[c.id], minProfitFloor: val },
                              },
                            }))
                            setIsDirty(true)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* System Safeguards Section */}
          <Card className="p-5 space-y-4 bg-surface-raised/40 border-border">
            <h4 className="font-display text-sm font-bold text-text flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" /> Platform Financial Safeguards & Circuit Breakers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
                <div>
                  <p className="text-xs font-bold text-text">Strict Profit Floor</p>
                  <p className="text-[10px] text-text-muted">Prevent loss on API cost jumps</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.safeguards.strictProfitFloorEnabled}
                  onChange={(e) => {
                    setConfig((prev) => ({
                      ...prev,
                      safeguards: { ...prev.safeguards, strictProfitFloorEnabled: e.target.checked },
                    }))
                    setIsDirty(true)
                  }}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
                <div>
                  <p className="text-xs font-bold text-text">Max Discount Cap</p>
                  <p className="text-[10px] text-text-muted">Maximum stackable discount</p>
                </div>
                <span className="text-xs font-black text-amber-500">{config.safeguards.maxDiscountCapPct}%</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
                <div>
                  <p className="text-xs font-bold text-text">Round to 5 Pesewas</p>
                  <p className="text-[10px] text-text-muted">e.g. ₵4.05 instead of ₵4.03</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.safeguards.roundToFivePesewas}
                  onChange={(e) => {
                    setConfig((prev) => ({
                      ...prev,
                      safeguards: { ...prev.safeguards, roundToFivePesewas: e.target.checked },
                    }))
                    setIsDirty(true)
                  }}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: ROLE PRICING MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-display text-lg font-bold text-text">Role-Based Pricing Matrix</h3>
            <p className="text-xs text-text-muted">
              Configure wholesale discounts and minimum margin thresholds across user account levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(config.roleTiers).map(([key, tier]) => (
              <Card key={key} className="p-5 space-y-3 border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display font-bold text-base text-text">{tier.label}</span>
                    <p className="text-xs text-text-muted">{tier.description}</p>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {key}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-text mb-1 block">Discount off Retail</label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="30"
                        value={tier.discountPct}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setConfig((prev) => ({
                            ...prev,
                            roleTiers: {
                              ...prev.roleTiers,
                              [key]: { ...prev.roleTiers[key], discountPct: val },
                            },
                          }))
                          setIsDirty(true)
                        }}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-text-muted font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text mb-1 block">Min Guaranteed Margin</label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        value={tier.minMarginPct}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setConfig((prev) => ({
                            ...prev,
                            roleTiers: {
                              ...prev.roleTiers,
                              [key]: { ...prev.roleTiers[key], minMarginPct: val },
                            },
                          }))
                          setIsDirty(true)
                        }}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-text-muted font-bold">%</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FLASH SALES & PROMOS */}
      {activeTab === 'flash' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-text">Promotional Flash Sales</h3>
              <p className="text-xs text-text-muted">Time-limited discounts automatically applied at checkout with customer banners.</p>
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setNewFlashModalOpen(true)}
              className="text-xs"
            >
              New Flash Campaign
            </Button>
          </div>

          <div className="space-y-3">
            {config.flashSales.map((flash) => {
              const now = new Date()
              const isExpired = new Date(flash.endTime) < now
              return (
                <Card key={flash.id} className="p-4 border-border flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      'p-2.5 rounded-xl border',
                      flash.active && !isExpired
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                        : 'bg-surface-raised text-text-muted border-border'
                    )}>
                      <Flame size={20} className={flash.active && !isExpired ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text">{flash.name}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {flash.network}
                        </span>
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          flash.active && !isExpired
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        )}>
                          {flash.active && !isExpired ? 'LIVE NOW' : isExpired ? 'EXPIRED' : 'PAUSED'}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{flash.bannerText}</p>
                      <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1 font-mono">
                        <Clock size={11} /> {new Date(flash.startTime).toLocaleDateString()} — {new Date(flash.endTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-amber-500 font-display">-{flash.discountPct}% OFF</span>
                    <Button
                      size="sm"
                      variant={flash.active ? 'secondary' : 'primary'}
                      onClick={() => {
                        setConfig((prev) => ({
                          ...prev,
                          flashSales: prev.flashSales.map((f) =>
                            f.id === flash.id ? { ...f, active: !f.active } : f
                          ),
                        }))
                        setIsDirty(true)
                      }}
                    >
                      {flash.active ? 'Pause' : 'Activate'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({
                          ...prev,
                          flashSales: prev.flashSales.filter((f) => f.id !== flash.id),
                        }))
                        setIsDirty(true)
                      }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition"
                      title="Delete campaign"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BULK VOLUME BREAKS */}
      {activeTab === 'volume' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-display text-lg font-bold text-text">Bulk Volume Quantity Breaks</h3>
            <p className="text-xs text-text-muted">Automated volume discounts applied for bulk agent and reseller orders.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.volumeDiscounts.map((tier, idx) => (
              <Card key={idx} className="p-5 space-y-3 border-border">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-text">{tier.label}</span>
                  <span className="text-xs font-black text-emerald-500">+{tier.extraDiscountPct}% Bonus</span>
                </div>
                <div className="space-y-2 text-xs text-text-muted">
                  <div className="flex justify-between">
                    <span>Min Quantity:</span>
                    <span className="font-bold text-text">{tier.minQty} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Quantity:</span>
                    <span className="font-bold text-text">{tier.maxQty} units</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: LIVE PROFIT SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulator Inputs */}
          <Card className="lg:col-span-5 p-5 space-y-4 border-border">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Calculator size={18} className="text-primary" />
              <h3 className="font-display text-base font-bold text-text">Sandbox Calculation Inputs</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Network Carrier</label>
                <div className="grid grid-cols-3 gap-2">
                  {CARRIERS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSimCarrier(c.id)}
                      className={cn(
                        'py-2 text-xs font-bold rounded-xl border transition',
                        simCarrier === c.id
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-border bg-surface text-text-muted hover:text-text'
                      )}
                    >
                      {c.id}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text mb-1 block">Supplier Base Cost (₵)</label>
                <Input
                  type="number"
                  step="0.10"
                  min="0"
                  value={simCost}
                  onChange={(e) => setSimCost(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text mb-1 block">Data Size (MB)</label>
                  <Input
                    type="number"
                    step="512"
                    min="512"
                    value={simSizeMb}
                    onChange={(e) => setSimSizeMb(parseInt(e.target.value) || 1024)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text mb-1 block">Buyer Role</label>
                  <Select value={simRole} onChange={(e) => setSimRole(e.target.value)}>
                    <option value="CUSTOMER">Retail Customer</option>
                    <option value="RESELLER">Reseller (-{config.roleTiers.RESELLER.discountPct}%)</option>
                    <option value="AGENT">Master Agent (-{config.roleTiers.AGENT.discountPct}%)</option>
                    <option value="VIP_DEALER">VIP Dealer (-{config.roleTiers.VIP_DEALER.discountPct}%)</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text mb-1 block">Order Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={simQuantity}
                  onChange={(e) => setSimQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </Card>

          {/* Simulator Visual Waterfall Output */}
          <Card className="lg:col-span-7 p-5 space-y-4 border-border bg-gradient-to-br from-surface to-surface-raised">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-display text-base font-bold text-text">Waterfall Margin Breakdown</h3>
              <span className={cn(
                'text-xs font-black px-2.5 py-1 rounded-full border flex items-center gap-1.5',
                simResult.isHealthyMargin
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
              )}>
                {simResult.isHealthyMargin ? (
                  <>
                    <Sparkles size={13} /> Healthy Margin
                  </>
                ) : (
                  <>
                    <AlertTriangle size={13} /> Narrow Margin
                  </>
                )}
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-surface border border-border">
                <span className="text-text-muted">1. Supplier Base Cost:</span>
                <span className="font-mono font-bold text-text">{formatGHS(simCost)}</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-surface border border-border">
                <span className="text-text-muted">2. Base Retail Price ({simCarrier} markup):</span>
                <span className="font-mono font-bold text-text">{formatGHS(simResult.baseRetail)}</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-surface border border-border">
                <span className="text-text-muted">3. Role Discount ({simRole}):</span>
                <span className="font-mono font-bold text-blue-500">-{simResult.roleDiscountPct}%</span>
              </div>

              {simResult.activeFlashSale && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                  <span className="flex items-center gap-1.5">
                    <Flame size={13} /> Flash Sale Promo ({simResult.activeFlashSale.name}):
                  </span>
                  <span className="font-mono font-bold">-{simResult.activeFlashSale.discountPct}%</span>
                </div>
              )}

              {simResult.appliedVolumeBreak && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} /> Volume Break ({simResult.appliedVolumeBreak.label}):
                  </span>
                  <span className="font-mono font-bold">-{simResult.appliedVolumeBreak.extraDiscountPct}%</span>
                </div>
              )}

              {simResult.isFloorGuarded && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} /> Min Profit Floor Safeguard:
                  </span>
                  <span className="font-bold">Protected</span>
                </div>
              )}
            </div>

            {/* Final KPI Box */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-surface to-surface border-2 border-primary/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted">Unit Price</span>
                <p className="text-lg font-black text-text font-display">{formatGHS(simResult.unitPrice)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted">Total Checkout</span>
                <p className="text-lg font-black text-primary font-display">{formatGHS(simResult.totalPrice)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted">Net Profit</span>
                <p className="text-lg font-black text-emerald-500 font-display">{formatGHS(simResult.netProfit)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted">Net Margin %</span>
                <p className="text-lg font-black text-emerald-500 font-display">{simResult.profitMarginPct}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 6: VAS & VALUE ADDED SERVICES */}
      {activeTab === 'vas' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-display text-lg font-bold text-text">Value Added Services (VAS) Rules</h3>
            <p className="text-xs text-text-muted">Cashback incentives, checker card profit markups, and utility bill convenience fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 space-y-4 border-border">
              <div className="flex items-center gap-2">
                <Tag className="text-primary" size={18} />
                <h4 className="font-bold text-sm text-text">Airtime Cashback & Margin</h4>
              </div>
              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Customer Cashback Rate (%)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={config.vasRules.airtime.cashbackPct}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setConfig((prev) => ({
                      ...prev,
                      vasRules: { ...prev.vasRules, airtime: { ...prev.vasRules.airtime, cashbackPct: val } },
                    }))
                    setIsDirty(true)
                  }}
                />
              </div>
            </Card>

            <Card className="p-5 space-y-4 border-border">
              <div className="flex items-center gap-2">
                <DollarSign className="text-emerald-500" size={18} />
                <h4 className="font-bold text-sm text-text">WAEC & BECE Checkers Margin</h4>
              </div>
              <div>
                <label className="text-xs font-semibold text-text mb-1 block">WAEC Markup (₵)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={config.vasRules.checkers.waecMarkupGhs}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setConfig((prev) => ({
                      ...prev,
                      vasRules: {
                        ...prev.vasRules,
                        checkers: { ...prev.vasRules.checkers, waecMarkupGhs: val },
                      },
                    }))
                    setIsDirty(true)
                  }}
                />
              </div>
            </Card>

            <Card className="p-5 space-y-4 border-border">
              <div className="flex items-center gap-2">
                <Zap className="text-amber-500" size={18} />
                <h4 className="font-bold text-sm text-text">Utility Bills Convenience Fee</h4>
              </div>
              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Flat Convenience Fee (₵)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={config.vasRules.bills.convenienceFeeGhs}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setConfig((prev) => ({
                      ...prev,
                      vasRules: {
                        ...prev.vasRules,
                        bills: { ...prev.vasRules.bills, convenienceFeeGhs: val },
                      },
                    }))
                    setIsDirty(true)
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL: 1-Click Mass Reprice Bundles */}
      <Modal
        open={repriceModalOpen}
        onClose={() => setRepriceModalOpen(false)}
        title="1-Click Mass Reprice Packages"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRepriceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={executeMassReprice.isPending}
              onClick={() => executeMassReprice.mutate()}
            >
              Apply to {massRepricePreview.length} Live Packages
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            This will recalculate and update retail, reseller, and agent prices across all active packages based on your current pricing engine formulas.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text">Filter Network:</span>
            <div className="flex gap-1.5">
              {['ALL', 'MTN', 'TELECEL', 'AT'].map((net) => (
                <button
                  key={net}
                  onClick={() => setRepriceCarrier(net)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold border transition',
                    repriceCarrier === net ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-text-muted'
                  )}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 border border-border rounded-xl p-2 bg-surface-raised/40">
            {massRepricePreview.slice(0, 15).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface border border-border">
                <div>
                  <span className="font-bold text-text">{b.name} ({b.network})</span>
                  <span className="block text-[10px] text-text-muted">Cost: {formatGHS(b.cost_price || b.selling_price * 0.92)}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="line-through text-text-muted">{formatGHS(b.selling_price)}</span>
                    <ArrowRight size={12} className="text-primary" />
                    <span className="font-black text-emerald-500">{formatGHS(b.new_selling_price)}</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    Agent: {formatGHS(b.new_agent_price)}
                  </span>
                </div>
              </div>
            ))}
            {massRepricePreview.length > 15 && (
              <p className="text-center text-[11px] text-text-muted py-1 font-semibold">
                + {massRepricePreview.length - 15} more packages ready for update
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL: New Flash Sale */}
      <Modal
        open={newFlashModalOpen}
        onClose={() => setNewFlashModalOpen(false)}
        title="Create Flash Sale Campaign"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setNewFlashModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!flashForm.name.trim()) {
                  toast.error('Campaign name is required')
                  return
                }
                const newFlash = {
                  id: `flash-${Date.now()}`,
                  ...flashForm,
                  startTime: new Date(flashForm.startTime).toISOString(),
                  endTime: new Date(flashForm.endTime).toISOString(),
                }
                setConfig((prev) => ({
                  ...prev,
                  flashSales: [newFlash, ...prev.flashSales],
                }))
                setIsDirty(true)
                setNewFlashModalOpen(false)
                toast.success('Flash sale campaign created!')
              }}
            >
              Create Campaign
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Campaign Name"
            placeholder="e.g. Flash Friday Rush"
            value={flashForm.name}
            onChange={(e) => setFlashForm({ ...flashForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Target Carrier"
              value={flashForm.network}
              onChange={(e) => setFlashForm({ ...flashForm, network: e.target.value })}
            >
              <option value="ALL">All Networks</option>
              <option value="MTN">MTN Only</option>
              <option value="TELECEL">Telecel Only</option>
              <option value="AT">AirtelTigo Only</option>
            </Select>
            <Input
              label="Discount %"
              type="number"
              step="0.5"
              min="0.5"
              max="25"
              value={flashForm.discountPct}
              onChange={(e) => setFlashForm({ ...flashForm, discountPct: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={flashForm.startTime}
              onChange={(e) => setFlashForm({ ...flashForm, startTime: e.target.value })}
            />
            <Input
              label="End Date & Time"
              type="datetime-local"
              value={flashForm.endTime}
              onChange={(e) => setFlashForm({ ...flashForm, endTime: e.target.value })}
            />
          </div>
          <Input
            label="Banner Announcement Copy"
            value={flashForm.bannerText}
            onChange={(e) => setFlashForm({ ...flashForm, bannerText: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  )
}
