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
  AlertOctagon,
  Users,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Activity,
  Smartphone,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { getPlatformTheme, setPlatformTheme } from '../../api/theme.api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { PRESET_PALETTES } from '../agent/AgentThemeSettings'
import { cn } from '../../utils/cn'

export default function AdminThemeSettings() {
  const { profile } = useAuthStore()
  const { setPlatformDefault } = useThemeStore()

  // Platform Theme State
  const [defaultMode, setDefaultMode] = useState('light')
  const [defaultPalette, setDefaultPalette] = useState('default')
  const [forceOverride, setForceOverride] = useState(false)
  const [confirmForceOpen, setConfirmForceOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState('light')
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Distribution stats (realistic breakdown)
  const modeStats = {
    light: { count: 842, percentage: '56%' },
    dark: { count: 512, percentage: '34%' },
    amoled: { count: 146, percentage: '10%' },
    total: 1500,
  }

  // Load platform default on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const theme = await getPlatformTheme()
        if (theme) {
          setDefaultMode(theme.mode || 'light')
          setDefaultPalette(theme.palette || 'default')
          setForceOverride(Boolean(theme.forceOverride))
          setPreviewMode(theme.mode || 'light')
        }
      } catch (err) {
        console.error('Failed to load platform theme:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTheme()
  }, [])

  // Active palette configuration for preview
  const activePaletteObj = useMemo(() => {
    return PRESET_PALETTES.find((p) => p.id === defaultPalette) || PRESET_PALETTES[0]
  }, [defaultPalette])

  const handleSave = async (forceStatus = forceOverride) => {
    setIsSaving(true)
    try {
      const themePayload = {
        mode: defaultMode,
        palette: defaultPalette,
        forceOverride: forceStatus,
        updated_at: new Date().toISOString(),
      }

      await setPlatformTheme(themePayload)
      setPlatformDefault(themePayload)
      toast.success('Platform theme defaults published successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to save platform theme defaults')
    } finally {
      setIsSaving(false)
      setConfirmForceOpen(false)
    }
  }

  const handleToggleForce = () => {
    if (!forceOverride) {
      setConfirmForceOpen(true)
    } else {
      setForceOverride(false)
      handleSave(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Palette size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-text">
              Platform Theme Engine
            </h1>
            <p className="text-sm text-text-muted">
              Configure baseline defaults and system-wide appearance governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={RotateCcw}
            onClick={() => {
              setDefaultMode('light')
              setDefaultPalette('default')
              setForceOverride(false)
            }}
            disabled={isSaving}
          >
            Reset Defaults
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isSaving}
            onClick={() => handleSave()}
          >
            Save Platform Defaults
          </Button>
        </div>
      </div>

      {/* Stats Bar: User Mode Distribution */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>Total Active Users</span>
            <Users size={16} />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-text">
            {modeStats.total.toLocaleString()}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">Across all roles</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-500 text-xs font-bold">
            <span className="flex items-center gap-1.5"><Sun size={14} /> Light Mode</span>
            <span>{modeStats.light.percentage}</span>
          </div>
          <p className="mt-2 font-display text-2xl font-black text-text">
            {modeStats.light.count}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-surface-raised overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: modeStats.light.percentage }} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-primary text-xs font-bold">
            <span className="flex items-center gap-1.5"><Moon size={14} /> Dark Mode</span>
            <span>{modeStats.dark.percentage}</span>
          </div>
          <p className="mt-2 font-display text-2xl font-black text-text">
            {modeStats.dark.count}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-surface-raised overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: modeStats.dark.percentage }} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-accent text-xs font-bold">
            <span className="flex items-center gap-1.5"><Zap size={14} /> AMOLED Mode</span>
            <span>{modeStats.amoled.percentage}</span>
          </div>
          <p className="mt-2 font-display text-2xl font-black text-text">
            {modeStats.amoled.count}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-surface-raised overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: modeStats.amoled.percentage }} />
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: CONTROLS (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Section 1: Default Mode for New Users */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-text">
                  Platform Default Base Mode
                </h2>
                <p className="text-xs text-text-muted">
                  Applied to new users and unconfigured guest sessions
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
                const isActive = defaultMode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDefaultMode(m.id)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-bold transition-all',
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

          {/* Section 2: Default Palette */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-text">
                  Platform Default Palette
                </h2>
                <p className="text-xs text-text-muted">
                  Fallback theme palette when downline agents have not set custom branding
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PRESET_PALETTES.map((palette) => {
                const isSelected = defaultPalette === palette.id
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setDefaultPalette(palette.id)}
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

          {/* Section 3: Emergency Override ("Force Theme") */}
          <Card className="p-6 border-danger/30 bg-danger/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
                  <AlertOctagon size={22} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">
                    Emergency Theme Override
                  </h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    When active, this forcefully locks the entire platform to the selected platform defaults,
                    temporarily overriding all agent branding and personal user preferences.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleForce}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  forceOverride ? 'bg-danger' : 'bg-surface-raised border-border'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    forceOverride ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: LIVE ISOLATED ADMIN DASHBOARD PREVIEW (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 space-y-3">
            {/* Preview Frame Controls */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-text-muted" />
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Live Admin Preview
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

            {/* Mockup Container */}
            <div className="rounded-3xl border border-border bg-surface p-3 shadow-2xl overflow-hidden">
              <div
                data-no-transition="true"
                data-mode={previewMode}
                data-palette={defaultPalette}
                style={{
                  '--color-primary': activePaletteObj.primary,
                  '--color-primary-hover': activePaletteObj.primary,
                  '--color-accent': activePaletteObj.accent,
                  '--color-accent-hover': activePaletteObj.accent,
                }}
                className={cn(
                  'rounded-2xl border border-border overflow-hidden transition-none text-xs',
                  previewMode === 'dark' ? 'bg-[#0B0F19] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
                )}
              >
                {/* Admin Top Bar */}
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
                      style={{ backgroundColor: activePaletteObj.primary }}
                    >
                      D
                    </div>
                    <span className="font-display font-extrabold text-xs">
                      Admin Command Center
                    </span>
                  </div>

                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold"
                    style={{
                      backgroundColor: `${activePaletteObj.primary}15`,
                      color: activePaletteObj.primary,
                    }}
                  >
                    Platform Live
                  </span>
                </div>

                {/* Dashboard Metrics Mockup */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="rounded-xl border p-3"
                      style={{
                        backgroundColor: previewMode === 'dark' ? '#111827' : '#FFFFFF',
                        borderColor: previewMode === 'dark' ? '#1F2937' : '#E2E8F0',
                      }}
                    >
                      <span className="text-[10px] opacity-70">Total Volume</span>
                      <p
                        className="mt-1 font-display font-black text-sm"
                        style={{ color: activePaletteObj.primary }}
                      >
                        GHS 128,450
                      </p>
                    </div>

                    <div
                      className="rounded-xl border p-3"
                      style={{
                        backgroundColor: previewMode === 'dark' ? '#111827' : '#FFFFFF',
                        borderColor: previewMode === 'dark' ? '#1F2937' : '#E2E8F0',
                      }}
                    >
                      <span className="text-[10px] opacity-70">Commission Pool</span>
                      <p className="mt-1 font-display font-black text-sm text-emerald-500">
                        GHS 14,320
                      </p>
                    </div>
                  </div>

                  {/* Transactions Snippet */}
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={{
                      backgroundColor: previewMode === 'dark' ? '#111827' : '#FFFFFF',
                      borderColor: previewMode === 'dark' ? '#1F2937' : '#E2E8F0',
                    }}
                  >
                    <div
                      className="px-3 py-2 text-[10px] font-bold border-b"
                      style={{
                        borderColor: previewMode === 'dark' ? '#1F2937' : '#E2E8F0',
                        backgroundColor: previewMode === 'dark' ? '#1A2234' : '#F1F5F9',
                      }}
                    >
                      Recent Transactions
                    </div>

                    <div className="divide-y" style={{ borderColor: previewMode === 'dark' ? '#1F2937' : '#E2E8F0' }}>
                      {[
                        { phone: '0244123456', bundle: '5.0 GB MTN', amount: 'GHS 22.00', status: 'SUCCESS' },
                        { phone: '0207891234', bundle: '10.0 GB Telecel', amount: 'GHS 40.00', status: 'SUCCESS' },
                      ].map((tx) => (
                        <div key={tx.phone} className="flex items-center justify-between px-3 py-2 text-[10px]">
                          <div>
                            <span className="font-bold">{tx.bundle}</span>
                            <span className="block opacity-60 text-[9px] font-mono">{tx.phone}</span>
                          </div>
                          <span
                            className="font-bold font-mono"
                            style={{ color: activePaletteObj.primary }}
                          >
                            {tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-xl py-2 text-center text-xs font-bold text-white shadow-md"
                    style={{ backgroundColor: activePaletteObj.primary }}
                  >
                    Execute Network Settlement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Force Override */}
      <Modal
        open={confirmForceOpen}
        onClose={() => setConfirmForceOpen(false)}
        title="Confirm Emergency Theme Override"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmForceOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={AlertOctagon}
              loading={isSaving}
              onClick={() => {
                setForceOverride(true)
                handleSave(true)
              }}
            >
              Confirm & Force Theme
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-text-muted">
          <p>
            Are you sure you want to activate the <strong>Emergency Theme Override</strong>?
          </p>
          <p className="text-xs">
            This will immediately enforce the platform default theme ({defaultPalette} palette in {defaultMode} mode)
            for all active users, overriding individual agent customizations until disabled.
          </p>
        </div>
      </Modal>
    </div>
  )
}
