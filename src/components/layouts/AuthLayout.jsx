import { motion } from 'framer-motion'
import { ShieldCheck, Zap, TrendingUp } from 'lucide-react'

const features = [
  { icon: Zap, title: 'Instant delivery', desc: 'Bundles land on any MTN, Telecel or AirtelTigo line in seconds.' },
  { icon: TrendingUp, title: 'Earn as you grow', desc: 'Tiered commissions for agents and resellers across the network.' },
  { icon: ShieldCheck, title: 'Bank-grade security', desc: 'Atomic wallet ledger, idempotent payments, full audit trail.' },
]

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand / marketing panel */}
      <div className="mesh-bg relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <span className="font-display text-xl font-extrabold text-white">D</span>
          </div>
          <span className="font-display text-xl font-bold text-white">DataHUB</span>
        </div>

        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-extrabold leading-tight text-white"
          >
            Mobile data,
            <br />
            reimagined for Ghana.
          </motion.h1>
          <p className="mt-4 max-w-md text-base text-white/70">
            The wallet-first platform powering customers, resellers and agents across every network.
          </p>

          <div className="mt-10 space-y-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-start gap-3.5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur">
                  <f.icon size={18} />
                </div>
                <div>
                  <p className="font-display font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} DataHUB. Built for the Ghanaian market.</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <span className="font-display text-lg font-extrabold">D</span>
            </div>
            <span className="font-display text-lg font-bold text-dark">DataHUB</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-display text-2xl font-extrabold text-dark">{title}</h2>
            {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
