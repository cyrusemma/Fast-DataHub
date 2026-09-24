import { Link } from 'react-router-dom'
import { Compass, Home, ArrowLeft } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { useRole } from '../hooks/useRole'

export default function NotFound() {
  const { session } = useAuthStore()
  const { defaultPath } = useRole()

  const destination = session ? defaultPath || '/' : '/login'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-12 text-center select-none">
      <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-8 ring-primary/5 shadow-inner">
        <Compass size={48} className="animate-spin" style={{ animationDuration: '16s' }} />
        <span className="absolute -bottom-1 -right-1 rounded-full bg-danger px-2 py-0.5 text-xs font-black text-white ring-4 ring-bg">
          404
        </span>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-black text-text">
        Page Not Found
      </h1>

      <p className="mt-2 max-w-md text-sm text-text-muted leading-relaxed">
        The link you followed might be broken, expired, or the page may have been moved to another location.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
        <Link to={destination}>
          <Button icon={Home}>
            {session ? 'Back to Dashboard' : 'Sign In'}
          </Button>
        </Link>
      </div>

      <p className="mt-12 text-xs text-text-subtle">
        Fast-DataHub · Automated Telecom Gateway
      </p>
    </div>
  )
}
