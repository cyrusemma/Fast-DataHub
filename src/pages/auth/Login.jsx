import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import AuthLayout from '../../components/layouts/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { login } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'
import { IS_MOCK } from '../../api/supabase'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const DEMO_ACCOUNTS = [
  { label: 'Customer', email: 'customer1@datahub.gh', password: 'Customer1234!' },
  { label: 'Reseller', email: 'reseller1@datahub.gh', password: 'Reseller1234!' },
  { label: 'Agent', email: 'agent1@datahub.gh', password: 'Agent1234!' },
  { label: 'Admin', email: 'admin@datahub.gh', password: 'Admin1234!' },
]

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values) => {
    try {
      const { session, profile } = await login(values)
      setAuth(profile, session)
      toast.success(`Welcome back, ${profile.first_name}!`)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Login failed')
    }
  }

  const fillDemo = (acct) => {
    setValue('email', acct.email)
    setValue('password', acct.password)
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your DataHUB account to continue.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email address" type="email" placeholder="you@example.com" icon={Mail} error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" placeholder="••••••••" icon={Lock} error={errors.password?.message} {...register('password')} />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-600">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} iconRight={ArrowRight}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to DataHUB?{' '}
        <Link to="/register" className="font-semibold text-primary hover:text-primary-600">
          Create an account
        </Link>
      </p>

      {IS_MOCK && (
        <div className="mt-8 rounded-xl border border-dashed border-primary/30 bg-primary-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Demo mode · tap to fill</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => fillDemo(a)}
                className="rounded-lg border border-primary/20 bg-white px-3 py-2 text-left text-xs transition hover:border-primary hover:shadow-sm"
              >
                <span className="block font-semibold text-dark">{a.label}</span>
                <span className="text-slate-400">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
