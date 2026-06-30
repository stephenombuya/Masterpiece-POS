import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import type { LoginRequest } from '@/types'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data)
      navigate('/sale')
    } catch {
      toast.error('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-3">
            <ShoppingCart size={28} className="text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-white">MasterpiecePOS</h1>
          <p className="text-primary-200 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username"
              placeholder="Enter username"
              autoComplete="username"
              autoFocus
              error={errors.username?.message}
              {...register('username', { required: 'Username is required' })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />
            <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="mt-2">
              Sign In
            </Button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-5">
            Default: <span className="font-mono font-semibold">admin / Admin@1234</span>
          </p>
        </div>
      </div>
    </div>
  )
}
