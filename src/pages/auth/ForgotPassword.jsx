import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import AuthLayout from '../../components/layouts/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { forgotPassword } from '../../api/auth.api'

const schema = z.object({ email: z.string().email('Enter a valid email') })

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async ({ email }) => {
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      toast.error(err.message || 'Could not send reset email')
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" subtitle="We've sent you a password reset link.">
        <div className="rounded-xl border border-success/20 bg-success-light p-5 text-center">
          <MailCheck className="mx-auto text-success" size={36} />
          <p className="mt-3 text-sm text-slate-600">
            If an account exists for <span className="font-semibold text-dark">{getValues('email')}</span>, a reset
            link is on its way.
          </p>
        </div>
        <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:text-primary-600">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email address" type="email" placeholder="you@example.com" icon={Mail} error={errors.email?.message} {...register('email')} />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
      <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:text-primary-600">
        <ArrowLeft size={16} /> Back to sign in
      </Link>
    </AuthLayout>
  )
}
