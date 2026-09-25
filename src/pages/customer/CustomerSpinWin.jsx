import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, Sparkles, Gift, Flame, Trophy, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import PageHeader from '../../components/shared/PageHeader'
import Button from '../../components/ui/Button'
import { useWallet } from '../../hooks/useWallet'
import { formatGHS } from '../../utils/formatCurrency'

const WHEEL_SECTORS = [
  { label: '500 MB Data', color: '#3b82f6', value: '500MB', type: 'DATA' },
  { label: '₵2.00 Cash', color: '#10b981', value: '2.00', type: 'CASH' },
  { label: '100 MB Data', color: '#8b5cf6', value: '100MB', type: 'DATA' },
  { label: 'Try Again', color: '#64748b', value: '0', type: 'NONE' },
  { label: '1 GB Data', color: '#f59e0b', value: '1GB', type: 'DATA' },
  { label: '₵1.00 Cash', color: '#06b6d4', value: '1.00', type: 'CASH' },
  { label: '250 MB Data', color: '#ec4899', value: '250MB', type: 'DATA' },
  { label: 'Double Cashback', color: '#f97316', value: '2X', type: 'BONUS' },
]

export default function CustomerSpinWin() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [wonPrize, setWonPrize] = useState(null)
  const [spinsLeft, setSpinsLeft] = useState(1)

  const numSectors = WHEEL_SECTORS.length
  const sectorAngle = 360 / numSectors

  const handleSpin = () => {
    if (isSpinning || spinsLeft <= 0) return

    setIsSpinning(true)
    setWonPrize(null)

    // Pick a random sector with high probability of winning nice prizes
    const winningIndex = Math.floor(Math.random() * numSectors)
    const extraRounds = 5 + Math.floor(Math.random() * 3) // 5-7 full spins
    const targetAngle = extraRounds * 360 + (360 - winningIndex * sectorAngle - sectorAngle / 2)

    const newRotation = rotation + targetAngle
    setRotation(newRotation)

    setTimeout(() => {
      setIsSpinning(false)
      setSpinsLeft((prev) => Math.max(0, prev - 1))
      const prize = WHEEL_SECTORS[winningIndex]
      setWonPrize(prize)

      if (prize.type !== 'NONE') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
        toast.success(`Congratulations! You won ${prize.label}!`)
      } else {
        toast.info('Better luck next spin! Come back tomorrow.')
      }
    }, 4500)
  }

  return (
    <>
      <PageHeader
        title="Spin & Win"
        subtitle="Claim your daily spin for a chance to win free data bundles and wallet credits."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Wheel Section */}
        <div className="card p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Wheel pointer needle */}
          <div className="relative z-20 -mb-5 flex justify-center">
            <div className="h-0 w-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-danger filter drop-shadow-md" />
          </div>

          {/* Wheel Circle SVG */}
          <div className="relative h-72 w-72 sm:h-80 sm:w-80">
            <motion.div
              className="h-full w-full rounded-full border-4 border-surface-raised shadow-2xl overflow-hidden relative"
              animate={{ rotate: rotation }}
              transition={{ duration: 4.5, ease: [0.15, 0.9, 0.2, 1] }}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {WHEEL_SECTORS.map((sector, idx) => {
                  const startAngle = (idx * sectorAngle * Math.PI) / 180
                  const endAngle = (((idx + 1) * sectorAngle) * Math.PI) / 180
                  const x1 = 50 + 50 * Math.cos(startAngle)
                  const y1 = 50 + 50 * Math.sin(startAngle)
                  const x2 = 50 + 50 * Math.cos(endAngle)
                  const y2 = 50 + 50 * Math.sin(endAngle)
                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`

                  const textAngle = idx * sectorAngle + sectorAngle / 2
                  const textRadius = 35
                  const tx = 50 + textRadius * Math.cos((textAngle * Math.PI) / 180)
                  const ty = 50 + textRadius * Math.sin((textAngle * Math.PI) / 180)

                  return (
                    <g key={idx}>
                      <path d={pathData} fill={sector.color} opacity={0.92} />
                      <text
                        x={tx}
                        y={ty}
                        fill="#ffffff"
                        fontSize="3.8"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="central"
                        transform={`rotate(${textAngle + 90}, ${tx}, ${ty})`}
                      >
                        {sector.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </motion.div>

            {/* Center cap */}
            <div className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-surface border-4 border-surface-raised shadow-xl flex items-center justify-center z-10">
              <Dices size={22} className="text-primary" />
            </div>
          </div>

          {/* Spin Action */}
          <div className="mt-8 text-center space-y-3">
            <Button
              onClick={handleSpin}
              disabled={isSpinning || spinsLeft <= 0}
              icon={Sparkles}
              className="py-3 px-8 text-sm font-bold shadow-lg"
            >
              {isSpinning
                ? 'Spinning the Wheel...'
                : spinsLeft > 0
                ? 'SPIN NOW (1 Free Spin)'
                : 'Next Spin Available in 12h'}
            </Button>
            <p className="text-xs text-text-muted">
              {spinsLeft > 0 ? '1 daily spin available' : 'Come back tomorrow for your next free spin!'}
            </p>
          </div>

          {/* Winning Modal / Banner */}
          <AnimatePresence>
            {wonPrize && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-6 p-4 rounded-2xl border border-primary/30 bg-primary/10 text-center max-w-sm w-full"
              >
                {wonPrize.type !== 'NONE' ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      Prize Won!
                    </p>
                    <h3 className="font-display text-xl font-black text-text mt-1">
                      {wonPrize.label}
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      Reward has been credited to your active wallet rewards!
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-display text-base font-bold text-text">Try Again!</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Don't worry, you can spin again tomorrow!
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
              <Trophy size={18} className="text-primary" /> Spin & Win Rules
            </h3>
            <ul className="space-y-2.5 text-xs text-text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>Every registered Fast-DataHub user gets 1 free spin every 24 hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>Won data bundles are automatically topped up to your registered number.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                <span>Cash rewards are immediately deposited into your main wallet.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
