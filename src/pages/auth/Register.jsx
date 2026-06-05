import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, User, Phone, Ticket, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import AuthLayout from '../../components/layouts/AuthLayout'
import Input, { Select } from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { register as registerUser, login } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'
import { isValidGhanaPhone, normalizeGhanaPhone } from '../../utils/phoneValidation'

const schema = z
  .object({
    firstName: z.string().min(2, 'Required'),
    lastName: z.string().min(2, 'Required'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().refine(isValidGhanaPhone, 'Enter a valid Ghana phone number'),
    role: z.enum(['CUSTOMER', 'RESELLER', 'AGENT']),
    inviteCode: z.string().optional(),
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' })
  .refine((d) => !['RESELLER', 'AGENT'].includes(d.role) || (d.inviteCode && d.inviteCode.length > 3), {
    path: ['inviteCode'],
    message: 'Invite code required for this role',
  })

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '',
      role: params.get('invite') ? 'RESELLER' : 'CUSTOMER',
      inviteCode: params.get('invite') || '',
      password: '', confirm: '',
    },
  })

  const role = watch('role')
  const needsInvite = ['RESELLER', 'AGENT'].includes(role)

  const onSubmit = async (values) => {
    try {
      await registerUser({ ...values, phone: normalizeGhanaPhone(values.phone) })
      const { session, profile } = await login({ email: values.email, password: values.password })
      setAuth(profile, session)
      toast.success('Account created — welcome to DataHUB!')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join DataHUB in under a minute.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" placeholder="Ama" icon={User} error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last name" placeholder="Mensah" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input label="Email address" type="email" placeholder="you@example.com" icon={Mail} error={errors.email?.message} {...register('email')} />
        <Input label="Phone number" placeholder="024 123 4567" icon={Phone} error={errors.phone?.message} {...register('phone')} />

        <Select label="I am registering as" error={errors.role?.message} {...register('role')}>
          <option value="CUSTOMER">Customer — buy data for myself</option>
          <option value="RESELLER">Reseller — sell data & earn (invite required)</option>
          <option value="AGENT">Agent — manage resellers (invite required)</option>
        </Select>

        {needsInvite && (
          <Input label="Invite code" placeholder="AGT-XX-XXXX" icon={Ticket} error={errors.inviteCode?.message} {...register('inviteCode')} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label="Password" type="password" placeholder="••••••••" icon={Lock} error={errors.password?.message} {...register('password')} />
          <Input label="Confirm" type="password" placeholder="••••••••" error={errors.confirm?.message} {...register('confirm')} />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} iconRight={ArrowRight}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-600">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
