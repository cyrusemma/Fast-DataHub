/**
 * Fast-DataHub Intelligent Pricing Engine
 * Handles dynamic markup calculations, role-based pricing tiers,
 * volume brackets, flash sales, minimum profit floors, and multi-service fees.
 */

const PRICING_STORAGE_KEY = 'fdh_pricing_engine_rules_v1'

export const DEFAULT_PRICING_CONFIG = {
  // Global & Carrier Markup Rules
  markupRules: {
    MTN: {
      type: 'percentage', // 'percentage' | 'fixed' | 'tiered'
      percentage: 8.5, // 8.5% markup over base cost
      fixedAmount: 1.0,
      tiers: [
        { maxMb: 5120, markupGhs: 0.5 },    // Up to 5GB: +₵0.50
        { maxMb: 20480, markupGhs: 1.5 },   // 6GB - 20GB: +₵1.50
        { maxMb: 102400, markupGhs: 3.5 },  // 25GB+: +₵3.50
      ],
      minProfitFloor: 0.30, // Minimum GHS 0.30 profit per transaction
    },
    TELECEL: {
      type: 'percentage',
      percentage: 8.0,
      fixedAmount: 1.0,
      tiers: [
        { maxMb: 10240, markupGhs: 1.0 },
        { maxMb: 30720, markupGhs: 2.2 },
        { maxMb: 102400, markupGhs: 4.0 },
      ],
      minProfitFloor: 0.30,
    },
    AT: {
      type: 'percentage',
      percentage: 9.0,
      fixedAmount: 0.8,
      tiers: [
        { maxMb: 5120, markupGhs: 0.4 },
        { maxMb: 20480, markupGhs: 1.2 },
        { maxMb: 102400, markupGhs: 3.0 },
      ],
      minProfitFloor: 0.25,
    },
  },

  // Role Tier Multipliers / Discounts from Customer Selling Price
  roleTiers: {
    CUSTOMER: {
      label: 'Retail Customer',
      discountPct: 0,
      minMarginPct: 5.0,
      description: 'Standard retail rates with no wholesale discount',
    },
    RESELLER: {
      label: 'Reseller Tier',
      discountPct: 3.5, // 3.5% discount off customer price
      minMarginPct: 3.0,
      description: 'Discounts for registered fast resellers',
    },
    AGENT: {
      label: 'Master Agent',
      discountPct: 6.0, // 6.0% discount off customer price
      minMarginPct: 2.0,
      description: 'Wholesale pricing for master bulk distribution agents',
    },
    VIP_DEALER: {
      label: 'VIP High-Volume Dealer',
      discountPct: 8.0,
      minMarginPct: 1.5,
      description: 'Highest volume enterprise dealers',
    },
  },

  // Volume / Bulk Quantity Breakpoints
  volumeDiscounts: [
    { minQty: 10, maxQty: 49, extraDiscountPct: 1.5, label: '10+ Bulk Pack' },
    { minQty: 50, maxQty: 99, extraDiscountPct: 3.0, label: '50+ High Volume' },
    { minQty: 100, maxQty: 9999, extraDiscountPct: 5.0, label: '100+ Enterprise Batch' },
  ],

  // Promotional Flash Sales & Time-Limited Discounts
  flashSales: [
    {
      id: 'flash-weekend-frenzy',
      name: 'Weekend Data Blitz',
      network: 'ALL', // 'ALL' | 'MTN' | 'TELECEL' | 'AT'
      discountPct: 3.0,
      active: false,
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      bannerText: '⚡ Flash Sale Live: Extra 3% OFF all carrier bundles this weekend!',
    },
  ],

  // Other Value Added Services
  vasRules: {
    airtime: {
      cashbackPct: 2.0, // 2% discount/cashback on airtime
      minAmount: 1.0,
      maxAmount: 1000.0,
    },
    checkers: {
      waecMarkupGhs: 4.0,
      beceMarkupGhs: 3.5,
      novdecMarkupGhs: 5.0,
    },
    bills: {
      convenienceFeeGhs: 1.0,
      feeType: 'flat', // 'flat' | 'percentage'
      percentageFee: 1.0,
    },
  },

  // System Safeguards
  safeguards: {
    strictProfitFloorEnabled: true,
    globalMinProfitGhs: 0.20,
    maxDiscountCapPct: 15.0,
    autoRoundToDecimals: 2,
    roundToFivePesewas: false, // Round to nearest 0.05
  },
}

export class PricingEngine {
  constructor() {
    this.config = this.loadConfig()
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem(PRICING_STORAGE_KEY)
      if (stored) {
        return { ...DEFAULT_PRICING_CONFIG, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.warn('Failed to load pricing config, using defaults', e)
    }
    return DEFAULT_PRICING_CONFIG
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    try {
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(this.config))
      window.dispatchEvent(new CustomEvent('fdh_pricing_updated', { detail: this.config }))
    } catch (e) {
      console.error('Failed to save pricing config', e)
    }
    return this.config
  }

  resetToDefaults() {
    this.config = DEFAULT_PRICING_CONFIG
    localStorage.removeItem(PRICING_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('fdh_pricing_updated', { detail: this.config }))
    return this.config
  }

  /**
   * Calculate retail selling price from base supplier cost
   */
  calculateBaseSellingPrice(costPrice, network, sizeMb = 1024) {
    const net = (network || 'MTN').toUpperCase()
    const rule = this.config.markupRules[net] || this.config.markupRules.MTN
    const cost = Number(costPrice) || 0

    let markup = 0
    if (rule.type === 'percentage') {
      markup = cost * (rule.percentage / 100)
    } else if (rule.type === 'fixed') {
      markup = rule.fixedAmount
    } else if (rule.type === 'tiered' && rule.tiers) {
      const tier = rule.tiers.find((t) => sizeMb <= t.maxMb) || rule.tiers[rule.tiers.length - 1]
      markup = tier ? tier.markupGhs : 1.0
    }

    // Apply minimum profit floor
    const minFloor = rule.minProfitFloor || this.config.safeguards.globalMinProfitGhs
    if (markup < minFloor) {
      markup = minFloor
    }

    let sellingPrice = cost + markup
    return this.roundPrice(sellingPrice)
  }

  /**
   * Calculate dynamic final price for a specific role, quantity, and active promos
   */
  evaluatePrice({
    bundle,
    costPrice,
    sellingPrice,
    network,
    sizeMb = 1024,
    role = 'CUSTOMER',
    quantity = 1,
    promoCode = null,
  }) {
    const cost = Number(costPrice ?? bundle?.cost_price ?? (sellingPrice ? sellingPrice * 0.92 : 0))
    let baseRetail = sellingPrice ? Number(sellingPrice) : this.calculateBaseSellingPrice(cost, network || bundle?.network, sizeMb)

    const netKey = (network || bundle?.network || 'MTN').toUpperCase()
    const tierConfig = this.config.roleTiers[role] || this.config.roleTiers.CUSTOMER

    // 1. Role Discount
    let priceAfterRole = baseRetail * (1 - (tierConfig.discountPct || 0) / 100)

    // 2. Active Flash Sale Discount
    let activeFlashSale = null
    const now = new Date()
    for (const flash of this.config.flashSales) {
      if (flash.active && (flash.network === 'ALL' || flash.network === netKey)) {
        const start = new Date(flash.startTime)
        const end = new Date(flash.endTime)
        if (now >= start && now <= end) {
          activeFlashSale = flash
          priceAfterRole = priceAfterRole * (1 - (flash.discountPct || 0) / 100)
          break
        }
      }
    }

    // 3. Volume Quantity Break Discount
    let appliedVolumeBreak = null
    if (quantity > 1 && this.config.volumeDiscounts) {
      for (const bracket of this.config.volumeDiscounts) {
        if (quantity >= bracket.minQty && quantity <= bracket.maxQty) {
          appliedVolumeBreak = bracket
          priceAfterRole = priceAfterRole * (1 - (bracket.extraDiscountPct || 0) / 100)
          break
        }
      }
    }

    // 4. Profit Safeguard Floor Check
    const minFloor = this.config.markupRules[netKey]?.minProfitFloor || this.config.safeguards.globalMinProfitGhs || 0.20
    let unitPrice = priceAfterRole

    if (this.config.safeguards.strictProfitFloorEnabled) {
      if (unitPrice - cost < minFloor) {
        unitPrice = cost + minFloor
      }
    }

    unitPrice = this.roundPrice(unitPrice)
    const totalPrice = this.roundPrice(unitPrice * quantity)
    const totalCost = this.roundPrice(cost * quantity)
    const netProfit = this.roundPrice(totalPrice - totalCost)
    const profitMarginPct = totalPrice > 0 ? this.roundPrice((netProfit / totalPrice) * 100) : 0

    return {
      unitPrice,
      totalPrice,
      totalCost,
      netProfit,
      profitMarginPct,
      baseRetail: this.roundPrice(baseRetail),
      costPerUnit: cost,
      roleDiscountPct: tierConfig.discountPct || 0,
      activeFlashSale,
      appliedVolumeBreak,
      isFloorGuarded: unitPrice === cost + minFloor,
      isHealthyMargin: profitMarginPct >= 3.0,
    }
  }

  /**
   * Helper to round prices cleanly according to platform safeguards
   */
  roundPrice(val) {
    if (this.config.safeguards.roundToFivePesewas) {
      return Math.round(val * 20) / 20
    }
    return Math.round(val * 100) / 100
  }
}

export const pricingEngine = new PricingEngine()
