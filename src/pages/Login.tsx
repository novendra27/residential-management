import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { Home, Lock, Mail, AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('')
    const result = await authService.login(values.email, values.password)

    if (!result.ok) {
      setServerError(result.message)
      return
    }

    setAuth(result.data.token, result.data.user)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (decorative, hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 flex-col justify-between p-12 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-blue-300/10 blur-2xl" />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Home className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">RT Management</span>
        </div>

        {/* Center text */}
        <div className="relative space-y-5">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Kelola Perumahan<br />Lebih Mudah
          </h1>
          <p className="text-blue-100 text-base leading-relaxed max-w-sm">
            Pantau penghuni, tagihan, dan keuangan perumahan Anda dalam satu platform yang terintegrasi.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['Data Penghuni', 'Kelola Tagihan', 'Laporan Keuangan', 'Pengeluaran'].map((f) => (
              <span
                key={f}
                className="inline-flex items-center rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative text-xs text-blue-100/70">
          Sistem Manajemen Perumahan RT · {new Date().getFullYear()}
        </p>
      </div>

      {/* ── Right panel (login form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-blue-200">
              <Home className="h-7 w-7 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Selamat datang</h2>
            <p className="text-sm text-gray-500 mt-1">Masuk ke akun admin Anda untuk melanjutkan</p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@rt.com"
                  className="pl-9 h-11 bg-white border-gray-200 focus-visible:ring-primary"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 h-11 bg-white border-gray-200 focus-visible:ring-primary"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-sm shadow-blue-200 transition-all"
            >
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
