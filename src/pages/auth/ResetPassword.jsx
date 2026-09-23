import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import AuthLayout from '../../components/layouts/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { supabase, IS_MOCK } from '../../api/supabase'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm: z.string().min(1, 'Confirm your new password'),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })

export default function ResetPassword() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = async ({ password }) => {
    setServerError('')
    try {
      if (!IS_MOCK) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
      }
      toast.success('Password updated successfully — please sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      const msg = err.message || 'Could not reset password. Your link may have expired.'
      setServerError(msg)
      toast.error(msg)
    }
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password to secure your account.">
      {serverError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
          <AlertCircle size={16} className="shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          error={errors.confirm?.message}
          {...register('confirm')}
        />

        <div className="rounded-xl border border-border bg-surface-raised p-3 text-[11px] text-text-muted">
          <p className="font-semibold text-text">Password requirements:</p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5">
            <li>At least 8 characters in length</li>
            <li>At least 1 uppercase letter</li>
            <li>At least 1 numeric digit</li>
          </ul>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} iconRight={ArrowRight}>
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Remember your password?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
