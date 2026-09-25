import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Sun,
  Moon,
  Zap,
  Check,
  RotateCcw,
  Save,
  AlertTriangle,
  Smartphone,
  Monitor,
  CheckCircle2,
  Wifi,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { getAgentTheme, setAgentTheme } from '../../api/theme.api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { cn } from '../../utils/cn'

export const PRESET_PALETTES = [
  {
    id: 'default',
    name: 'Electric Blue',
    subtitle: 'Platform Standard',
    primary: '#2563EB',
    accent: '#3B82F6',
    border: '#93C5FD',
  },
  {
    id: 'ocean',
    name: 'Ocean Teal',
    subtitle: 'Calm & Modern',
    primary: '#0891B2',
    accent: '#06B6D4',
    border: '#67E8F9',
  },
  {
    id: 'midnight',
    name: 'Midnight Purple',
    subtitle: 'Vibrant & Bold',
    primary: '#7C3AED',
    accent: '#8B5CF6',
    border: '#C4B5FD',
  },
  {
    id: 'ember',
    name: 'Ember Orange',
    subtitle: 'Energetic & Warm',
    primary: '#EA580C',
    accent: '#F97316',
    border: '#FDBA74',
  },
  {
    id: 'forest',
    name: 'Forest Emerald',
    subtitle: 'Fresh & Trustworthy',
    primary: '#16A34A',
    accent: '#22C55E',
    border: '#86EFAC',
  },
  {
    id: 'gold',
    name: 'Gold Amber',
    subtitle: 'Premium & Executive',
    primary: '#D97706',
    accent: '#F59E0B',
    border: '#FCD34D',
  },
]

// Relative luminance & WCAG contrast calculation
function getLuminance(hex) {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length !== 6) return 0.5
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255

  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  )
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

function getContrastWithWhite(hex) {
  try {
    const lum = getLuminance(hex)
    return (1.0 + 0.05) / (lum + 0.05)
  } catch {
    return 4.5
  }
}

export default function AgentThemeSettings() {
  const { profile } = useAuthStore()
  const { mode: currentMode, setMode: setGlobalMode, setAgentTheme: updateStoreTheme } = useThemeStore()

  // Local agent theme configuration state
  const [selectedPalette, setSelectedPalette] = useState('default')
  const [customPrimary, setCustomPrimary] = useState('#2563EB')
  const [customAccent, setCustomAccent] = useState('#3B82F6')
  const [isCustomExpanded, setIsCustomExpanded] = useState(false)
  const [previewMode, setPreviewMode] = useState('light')
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load agent theme from DB on mount
  useEffect(() => {
    async function loadTheme() {
      if (!profile?.id) return
      try {
        const theme = await getAgentTheme(profile.id)
        if (theme) {
          setSelectedPalette(theme.palette || 'default')
          if (theme.primaryColor) {
            setCustomPrimary(theme.primaryColor)
            setCustomAccent(theme.accentColor || '#3B82F6')
            if (theme.palette === 'custom') setIsCustomExpanded(true)
          }
        }
      } catch (err) {
        console.error('Failed to load agent theme:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTheme()
  }, [profile?.id])

  // Resolved active preview colors
  const activePrimary = useMemo(() => {
    if (selectedPalette === 'custom') return customPrimary
    const preset = PRESET_PALETTES.find((p) => p.id === selectedPalette)
    return preset?.primary || '#2563EB'
  }, [selectedPalette, customPrimary])

  const activeAccent = useMemo(() => {
    if (selectedPalette === 'custom') return customAccent
    const preset = PRESET_PALETTES.find((p) => p.id === selectedPalette)
    return preset?.accent || '#3B82F6'
  }, [selectedPalette, customAccent])

  // Contrast check
  const contrastRatio = useMemo(() => {
    return getContrastWithWhite(activePrimary).toFixed(2)
  }, [activePrimary])

  const isLowContrast = parseFloat(contrastRatio) < 3.0

  const handleSelectPalette = (id) => {
    setSelectedPalette(id)
    const preset = PRESET_PALETTES.find((p) => p.id === id)
    if (preset) {
      setCustomPrimary(preset.primary)
      setCustomAccent(preset.accent)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const themePayload = {
        palette: selectedPalette,
        primaryColor: selectedPalette === 'custom' ? customPrimary : null,
        accentColor: selectedPalette === 'custom' ? customAccent : null,
        updated_at: new Date().toISOString(),
      }

      await setAgentTheme(themePayload)
      updateStoreTheme(themePayload)
      toast.success('Brand theme published! All downline customer stores updated.')
    } catch (err) {
      toast.error(err.message || 'Failed to save theme settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setSelectedPalette('default')
    setCustomPrimary('#2563EB')
    setCustomAccent('#3B82F6')
    setIsCustomExpanded(false)

    try {
      const defaultPayload = { palette: 'default', primaryColor: null, accentColor: null }
      await setAgentTheme(defaultPayload)
      updateStoreTheme(defaultPayload)
      toast.success('Reset brand theme to default platform style.')
    } catch (err) {
      toast.error('Failed to reset theme')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Palette size={22} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black text-text">
                Brand & Theme Studio
              </h1>
              <p className="text-sm text-text-muted">
                Customize colors and styling for your downline customer stores and reseller network
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={RotateCcw}
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isSaving}
            onClick={handleSave}
          >
            Publish Theme
          </Button>
        </div>
      </div>

      {/* 2-Column Studio Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: CONTROLS (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Section 1: Agent Personal Base Mode */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-text">
                  Your Personal Viewing Mode
                </h2>
                <p className="text-xs text-text-muted">
                  Choose how your personal dashboard appears on this device
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light', icon: Sun, color: 'text-amber-500' },
                { id: 'dark', label: 'Dark', icon: Moon, color: 'text-primary' },
                { id: 'amoled', label: 'AMOLED', icon: Zap, color: 'text-accent fill-accent/20' },
              ].map((m) => {
                const Icon = m.icon
                const isActive = currentMode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setGlobalMode(m.id)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20'
                        : 'border-border bg-surface-raised text-text-muted hover:border-primary/40 hover:text-text'
                    )}
                  >
                    <Icon size={16} className={m.color} />
                    <span>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Section 2: Preset Palettes */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-text">
                  Curated Brand Palettes
                </h2>
                <p className="text-xs text-text-muted">
                  Select a professionally tuned palette that automatically styles your store
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PRESET_PALETTES.map((palette) => {
                const isSelected = selectedPalette === palette.id
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => handleSelectPalette(palette.id)}
                    className={cn(
                      'group relative flex flex-col rounded-2xl border p-4 text-left transition-all duration-150',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm'
                        : 'border-border bg-surface-raised hover:border-primary/40 hover:bg-surface'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-6 w-6 rounded-full shadow-sm"
                          style={{ backgroundColor: palette.primary }}
                        />
                        <span
                          className="h-4 w-4 rounded-full opacity-80"
                          style={{ backgroundColor: palette.accent }}
                        />
                      </div>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-display text-sm font-bold text-text">
                      {palette.name}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {palette.subtitle}
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Section 3: Custom Brand Hex Colors */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-text">
                  Custom Brand Hex Codes
                </h2>
                <p className="text-xs text-text-muted">
                  Match your company’s exact brand guide
                </p>
              </div>
              <Button
                variant={selectedPalette === 'custom' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedPalette('custom')
                  setIsCustomExpanded(true)
                }}
              >
                {selectedPalette === 'custom' ? 'Using Custom' : 'Enable Custom'}
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Primary Picker */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={customPrimary}
                      onChange={(e) => {
                        setSelectedPalette('custom')
                        setCustomPrimary(e.target.value)
                      }}
                      className="h-10 w-12 cursor-pointer rounded-xl border border-border bg-surface p-1"
                    />
                    <Input
                      type="text"
                      value={customPrimary}
                      onChange={(e) => {
                        setSelectedPalette('custom')
                        setCustomPrimary(e.target.value)
                      }}
                      placeholder="#2563EB"
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                {/* Accent Picker */}
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={customAccent}
                      onChange={(e) => {
                        setSelectedPalette('custom')
                        setCustomAccent(e.target.value)
                      }}
                      className="h-10 w-12 cursor-pointer rounded-xl border border-border bg-surface p-1"
                    />
                    <Input
                      type="text"
                      value={customAccent}
                      onChange={(e) => {
                        setSelectedPalette('custom')
                        setCustomAccent(e.target.value)
                      }}
                      placeholder="#3B82F6"
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* WCAG Contrast Warning */}
              {isLowContrast && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-text"
                >
                  <AlertTriangle size={17} className="text-warning shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-warning">Low Contrast Notice: </span>
                    Your primary color has a {contrastRatio}:1 contrast ratio against white text.
                    For maximum readability on buttons and cards, a ratio of 3.0:1 or higher is recommended.
                  </div>
                </motion.div>
              )}
            </div>
          </Card>

          {/* Section 4: Publish Notice */}
          <div className="rounded-2xl border border-border bg-surface-raised p-4 flex items-center gap-3">
            <ShieldCheck size={20} className="text-success shrink-0" />
            <p className="text-xs text-text-muted leading-relaxed">
              Theme updates take effect immediately for all your downline customer stores upon clicking{' '}
              <strong className="text-text">Publish Theme</strong>.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE ISOLATED CUSTOMER PREVIEW (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 space-y-3">
            {/* Preview Frame Controls */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-text-muted" />
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Live Customer Preview
                </span>
              </div>

              {/* Mode Toggle for Preview Only */}
              <div className="flex items-center rounded-lg border border-border bg-surface-raised p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode('light')}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition',
                    previewMode === 'light'
                      ? 'bg-surface text-text shadow-sm'
                      : 'text-text-muted hover:text-text'
                  )}
                >
                  <Sun size={12} className="text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('dark')}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition',
                    previewMode === 'dark'
                      ? 'bg-surface text-text shadow-sm'
                      : 'text-text-muted hover:text-text'
                  )}
                >
                  <Moon size={12} className="text-primary" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Mockup Device Container */}
            <div className="rounded-3xl border border-border bg-surface p-3 shadow-2xl overflow-hidden">
              <div
                data-no-transition="true"
                data-mode={previewMode}
                data-palette={selectedPalette}
                style={{
                  '--color-primary': activePrimary,
                  '--color-primary-hover': activePrimary,
                  '--color-accent': activeAccent,
                  '--color-accent-hover': activeAccent,
                }}
                className={cn(
                  'rounded-2xl border border-border overflow-hidden transition-none',
                  previewMode === 'dark' ? 'bg-[#0B0F19] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
                )}
              >
                {/* Store Top Bar */}
                <div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{
                    backgroundColor: previewMode === 'dark' ? '#111827' : '#FFFFFF',
                    borderColor: previewMode === 'dark' ? '#1F2937' : '#E2E8F0',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg font-bold text-white text-xs shadow-sm"
                      style={{ backgroundColor: activePrimary }}
                    >
                      D
                    </div>
                    <span
                      className="font-display font-extrabold text-xs"
                      style={{ color: previewMode === 'dark' ? '#F8FAFC' : '#0F172A' }}
                    >
                      {profile?.first_name ? `${profile.first_name}'s Store` : 'DataHUB Store'}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${activePrimary}15`,
                      color: activePrimary,
                    }}
                  >
                    <ShoppingBag size={11} />
                    <span>Store Online</span>
                  </div>
                </div>

                {/* Hero / Balance Banner */}
                <div className="p-4 space-y-3">
                  <div
                    className="rounded-xl p-4 text-white shadow-md relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${activePrimary}, ${activeAccent})`,
                    }}
                  >
                    <div className="flex justify-between items-center text-[10px] text-white/80">
                      <span>Customer Wallet</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5 font-bold">GHS</span>
                    </div>
                    <p className="mt-2 font-display text-xl font-extrabold">GHS 240.50</p>
                    <p className="mt-0.5 text-[10px] text-white/70">Instant 4G/5G Bundle Delivery</p>
                  </div>

                  {/* Network Picker Mock */}
                  <div className="space-y-1.5">
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: previewMode === 'dark' ? '#94A3B8' : '#64748B' }}
                    >
                      Select Network
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { name: 'MTN', color: '#FFCC00', text: '#000' },
                        { name: 'Telecel', color: '#E40000', text: '#FFF' },
                        { name: 'AirtelTigo', color: '#003087', text: '#FFF' },
                      ].map((net, i) => (
                        <div
                          key={net.name}
                          className="rounded-lg p-2 text-center text-[10px] font-bold border transition-all"
                          style={{
                            backgroundColor: i === 0 ? `${activePrimary}15` : previewMode === 'dark' ? '#111827' : '#FFFFFF',
                            borderColor: i === 0 ? activePrimary : previewMode === 'dark' ? '#1F2937' : '#E2E8F0',
                            color: previewMode === 'dark' ? '#F8FAFC' : '#0F172A',
                          }}
                        >
                          <span
                            className="inline-block rounded px-1.5 py-0.5 text-[9px]"
                            style={{ backgroundColor: net.color, color: net.text }}
                          >
                            {net.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bundles Cards Mock */}
                  <div className="space-y-2">
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: previewMode === 'dark' ? '#94A3B8' : '#64748B' }}
                    >
                      Available Bundles
                    </span>

                    {[
                      { size: '2.5 GB', price: 'GHS 12.00', validity: 'Non-expiry', selected: true },
                      { size: '5.0 GB', price: 'GHS 22.00', validity: 'Non-expiry', selected: false },
                    ].map((b) => (
                      <div
                        key={b.size}
                        className="flex items-center justify-between rounded-xl border p-3 text-xs"
                        style={{
                          backgroundColor: previewMode === 'dark' ? '#111827' : '#FFFFFF',
                          borderColor: b.selected ? activePrimary : previewMode === 'dark' ? '#1F2937' : '#E2E8F0',
                        }}
                      >
                        <div>
                          <p
                            className="font-bold font-display"
                            style={{ color: previewMode === 'dark' ? '#F8FAFC' : '#0F172A' }}
                          >
                            {b.size}
                          </p>
                          <p
                            className="text-[10px]"
                            style={{ color: previewMode === 'dark' ? '#94A3B8' : '#64748B' }}
                          >
                            {b.validity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className="font-extrabold font-display"
                            style={{ color: activePrimary }}
                          >
                            {b.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Primary Buy Button Mock */}
                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full rounded-xl py-2.5 text-center text-xs font-bold text-white shadow-md transition"
                      style={{
                        backgroundColor: activePrimary,
                      }}
                    >
                      Buy 2.5 GB Bundle Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
