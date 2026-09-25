import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Zap, Activity, Radio, MapPin, Globe, Sparkles, Filter } from 'lucide-react'
import { cn } from '../../utils/cn'

const REGIONS_DATA = [
  {
    id: 'accra',
    name: 'Greater Accra',
    hub: 'Accra Core Hub',
    x: 235,
    y: 295,
    traffic: '42.8%',
    throughput: '3.8 Gbps',
    ordersToday: '1,420 orders',
    topNetwork: 'MTN (64%)',
    color: '#3B82F6',
    ping: '12ms',
  },
  {
    id: 'ashanti',
    name: 'Ashanti Region',
    hub: 'Kumasi Node',
    x: 180,
    y: 220,
    traffic: '28.4%',
    throughput: '2.4 Gbps',
    ordersToday: '980 orders',
    topNetwork: 'MTN (58%)',
    color: '#F59E0B',
    ping: '16ms',
  },
  {
    id: 'western',
    name: 'Western Region',
    hub: 'Takoradi Harbor Node',
    x: 130,
    y: 290,
    traffic: '12.1%',
    throughput: '1.1 Gbps',
    ordersToday: '410 orders',
    topNetwork: 'Telecel (46%)',
    color: '#EF4444',
    ping: '19ms',
  },
  {
    id: 'northern',
    name: 'Northern & Savannah',
    hub: 'Tamale Grid Hub',
    x: 175,
    y: 110,
    traffic: '8.5%',
    throughput: '780 Mbps',
    ordersToday: '260 orders',
    topNetwork: 'MTN (71%)',
    color: '#10B981',
    ping: '24ms',
  },
  {
    id: 'eastern',
    name: 'Eastern & Central',
    hub: 'Koforidua Relay',
    x: 215,
    y: 245,
    traffic: '5.2%',
    throughput: '510 Mbps',
    ordersToday: '190 orders',
    topNetwork: 'AT (38%)',
    color: '#8B5CF6',
    ping: '18ms',
  },
  {
    id: 'volta',
    name: 'Volta & Oti',
    hub: 'Ho Relay Node',
    x: 275,
    y: 225,
    traffic: '3.0%',
    throughput: '340 Mbps',
    ordersToday: '115 orders',
    topNetwork: 'MTN (54%)',
    color: '#06B6D4',
    ping: '21ms',
  },
]

const FIBER_CONNECTIONS = [
  { from: 'accra', to: 'ashanti', path: 'M 235 295 Q 210 250 180 220' },
  { from: 'accra', to: 'western', path: 'M 235 295 Q 180 305 130 290' },
  { from: 'ashanti', to: 'northern', path: 'M 180 220 Q 170 160 175 110' },
  { from: 'accra', to: 'eastern', path: 'M 235 295 Q 225 270 215 245' },
  { from: 'eastern', to: 'volta', path: 'M 215 245 Q 245 235 275 225' },
]

export default function GhanaLiveHeatmap() {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS_DATA[0])
  const [activeNetwork, setActiveNetwork] = useState('ALL')
  const [livePulse, setLivePulse] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setLivePulse((p) => (p + 1) % 100)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-b from-surface via-surface to-primary/5 p-6 shadow-2xl">
      {/* Background ambient gradient glow blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent/20 blur-[90px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px]" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            </span>
            <h3 className="font-display text-base font-black text-text tracking-tight flex items-center gap-2">
              Ghana Telecom Live Fluid Grid
            </h3>
            <span className="rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-[10px] font-extrabold text-primary shadow-sm uppercase tracking-wider">
              Real-time Flow
            </span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Live fiber routing density and instant data dispatch across regional distribution hubs.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 bg-surface-raised p-1 rounded-2xl border border-border">
          {['ALL', 'MTN', 'TELECEL', 'AT'].map((net) => (
            <button
              key={net}
              type="button"
              onClick={() => setActiveNetwork(net)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200',
                activeNetwork === net
                  ? 'bg-primary text-white shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.5)]'
                  : 'text-text-muted hover:text-text'
              )}
            >
              {net}
            </button>
          ))}
        </div>
      </div>

      {/* Map & Telemetry Grid */}
      <div className="relative z-10 mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr] items-center">
        {/* Interactive Fluid SVG Canvas */}
        <div className="relative h-[340px] sm:h-[380px] w-full flex items-center justify-center rounded-2xl border border-border/60 bg-surface/50 backdrop-blur-md p-2 overflow-hidden shadow-inner">
          {/* Subtle grid lines background */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.12]" />

          <svg
            viewBox="50 40 280 300"
            className="h-full w-full max-w-[400px] drop-shadow-[0_0_20px_rgba(59,130,246,0.25)]"
          >
            <defs>
              {/* Glowing Line Gradients */}
              <linearGradient id="fiberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.9" />
              </linearGradient>

              {/* Node Glow Filters */}
              <filter id="glowEffect" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ghana Geographic Abstract Boundary Contour */}
            <path
              d="M 120 70 Q 200 45 240 60 Q 280 130 270 200 Q 295 240 260 310 Q 210 330 130 310 Q 90 270 100 200 Q 95 130 120 70 Z"
              fill="url(#fiberGlow)"
              fillOpacity="0.05"
              stroke="var(--color-primary)"
              strokeOpacity="0.25"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Active Fluid Fiber Cable Arcs */}
            {FIBER_CONNECTIONS.map((conn, idx) => (
              <g key={idx}>
                {/* Background base path */}
                <path
                  d={conn.path}
                  fill="none"
                  stroke="url(#fiberGlow)"
                  strokeWidth="2"
                  strokeOpacity="0.4"
                />
                {/* Animated light particle pulse along the fiber */}
                <path
                  d={conn.path}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="8 45"
                  strokeDashoffset={-livePulse * 2.5}
                  filter="url(#glowEffect)"
                  opacity="0.95"
                />
              </g>
            ))}

            {/* Regional Hub Nodes with Ripple Pulses */}
            {REGIONS_DATA.map((reg) => {
              const isSelected = selectedRegion.id === reg.id
              return (
                <g
                  key={reg.id}
                  onClick={() => setSelectedRegion(reg)}
                  className="cursor-pointer transition-transform duration-200"
                >
                  {/* Expanding ripple ring */}
                  <circle
                    cx={reg.x}
                    cy={reg.y}
                    r={isSelected ? 16 : 11}
                    fill={reg.color}
                    fillOpacity="0.2"
                    className="animate-ping"
                    style={{ animationDuration: isSelected ? '1.8s' : '3s' }}
                  />

                  {/* Outer glow ring */}
                  <circle
                    cx={reg.x}
                    cy={reg.y}
                    r={isSelected ? 10 : 7}
                    fill={reg.color}
                    fillOpacity="0.35"
                    stroke={reg.color}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    filter="url(#glowEffect)"
                  />

                  {/* Core white beacon point */}
                  <circle
                    cx={reg.x}
                    cy={reg.y}
                    r={isSelected ? 4.5 : 3.2}
                    fill="#ffffff"
                    stroke={reg.color}
                    strokeWidth="1.5"
                  />

                  {/* Node Label */}
                  <text
                    x={reg.x}
                    y={reg.y - (isSelected ? 14 : 10)}
                    fill="var(--color-text)"
                    fontSize={isSelected ? '8' : '7'}
                    fontWeight={isSelected ? '900' : '600'}
                    textAnchor="middle"
                    className="select-none pointer-events-none drop-shadow-md"
                  >
                    {reg.name.split(' ')[0]}
                  </text>
                </g>
              )
            })}
          </svg>

          <span className="absolute bottom-2.5 right-3 text-[10px] font-mono font-bold text-text-muted/80 flex items-center gap-1">
            <Radio size={12} className="text-emerald-500 animate-pulse" /> Live Telemetry
          </span>
        </div>

        {/* Regional Telemetry Stats Card */}
        <div className="space-y-4">
          <motion.div
            key={selectedRegion.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-primary/30 bg-surface-raised p-5 shadow-card relative overflow-hidden"
          >
            {/* Glowing top line */}
            <div
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(to right, ${selectedRegion.color}, transparent)`,
              }}
            />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  Selected Hub
                </span>
                <h4 className="font-display text-lg font-black text-text mt-0.5">
                  {selectedRegion.name}
                </h4>
                <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                  <MapPin size={12} className="text-primary" /> {selectedRegion.hub}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 border border-success/30 px-2 py-0.5 text-[11px] font-bold text-success">
                  <Zap size={11} /> {selectedRegion.ping}
                </span>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-surface p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Share of Traffic
                </span>
                <p className="font-display text-xl font-black text-primary mt-1">
                  {selectedRegion.traffic}
                </p>
                <span className="text-[10px] text-text-muted">{selectedRegion.ordersToday}</span>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Live Throughput
                </span>
                <p className="font-display text-xl font-black text-emerald-500 mt-1">
                  {selectedRegion.throughput}
                </p>
                <span className="text-[10px] text-text-muted font-mono">Fiber capacity 99.8%</span>
              </div>
            </div>

            {/* Dominant Network */}
            <div className="mt-3 rounded-xl border border-border bg-surface p-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Top Operator</span>
              <span className="font-bold text-xs text-text font-mono">
                {selectedRegion.topNetwork}
              </span>
            </div>
          </motion.div>

          {/* Quick summary chips */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-border bg-surface p-2.5">
              <span className="text-[10px] text-text-muted block">Active Towers</span>
              <span className="font-bold text-text font-mono">2,840</span>
            </div>
            <div className="rounded-xl border border-border bg-surface p-2.5">
              <span className="text-[10px] text-text-muted block">Avg Latency</span>
              <span className="font-bold text-success font-mono">14.2 ms</span>
            </div>
            <div className="rounded-xl border border-border bg-surface p-2.5">
              <span className="text-[10px] text-text-muted block">Dispatch SLA</span>
              <span className="font-bold text-primary font-mono">99.94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
