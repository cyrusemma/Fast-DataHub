import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import AuthLayout from '../../components/layouts/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { supabase, IS_MOCK } from '../../api/supabase'

const schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' })

export default function ResetPassword() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = async ({ password }) => {
    try {
      if (!IS_MOCK) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
      }
      toast.success('Password updated — please sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Could not reset password')
    }
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New password" type="password" icon={Lock} placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" icon={Lock} placeholder="••••••••" error={errors.confirm?.message} {...register('confirm')} />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  )
}
