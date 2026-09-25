import { useState } from 'react'
import { Share2, Copy, Check, Users, Gift, TrendingUp, Sparkles, MessageCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'
import { formatGHS } from '../../utils/formatCurrency'

export default function CustomerReferrals() {
  const { user, profile } = useAuthStore()
  const [copied, setCopied] = useState(false)

  const referralCode = profile?.first_name
    ? `${profile.first_name.toLowerCase()}${user?.id?.slice(0, 4) || '77'}`
    : `hub${user?.id?.slice(0, 5) || '99'}`

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Referral link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Get instant cheap data bundles and airtime on Fast-DataHub with 1-tap delivery. Use my referral link to get instant bonus: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <>
      <PageHeader
        title="Refer & Earn"
        subtitle="Invite friends and family to Fast-DataHub and earn lifetime commission on their purchases."
      />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-surface to-accent/10 p-6 sm:p-8 shadow-card mb-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-3">
            <Gift size={14} />
            <span>Earn ₵1.00 Instant Cash + 0.5% Lifetime Data Margin</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-text tracking-tight">
            Share Fast-DataHub, <br />
            <span className="text-primary">Earn Real Passive Cash</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-text-muted leading-relaxed">
            Every time your referred friend tops up their wallet or buys data, you automatically receive commission straight into your wallet balance.
          </p>

          {/* Referral link box */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-sm">
              <span className="text-xs font-mono text-text font-bold truncate flex-1">
                {referralLink}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl border border-border bg-surface-raised text-xs font-bold text-text hover:border-primary/40 flex items-center gap-1.5 transition shrink-0"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <Button
              onClick={handleShareWhatsApp}
              icon={MessageCircle}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5"
            >
              Share on WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-5 sm:grid-cols-3 mb-6">
        <StatCard label="Total Friends Referred" value="12" icon={Users} tone="primary" />
        <StatCard label="Active Data Buyers" value="8" icon={TrendingUp} tone="success" />
        <StatCard label="Total Commission Earned" value={formatGHS(3450)} icon={Gift} tone="warning" />
      </div>

      {/* How it works */}
      <div className="card p-6 space-y-6">
        <h3 className="font-display text-base font-bold text-text">How Fast-DataHub Referrals Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-border bg-surface-raised space-y-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-sm text-text">Send Your Link</h4>
            <p className="text-xs text-text-muted">
              Share your custom referral link with friends, groups, or social media followers.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-surface-raised space-y-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-sm text-text">They Sign Up & Buy Data</h4>
            <p className="text-xs text-text-muted">
              When they create an account and buy their first bundle or airtime.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-surface-raised space-y-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="font-bold text-sm text-text">Instant Wallet Cash</h4>
            <p className="text-xs text-text-muted">
              Commission is credited directly to your wallet balance for data or cash withdrawal.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
