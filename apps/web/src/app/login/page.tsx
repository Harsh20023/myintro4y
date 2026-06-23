'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { AuthShell } from '@/components/auth/AuthShell'
import { GoogleButton } from '@/components/auth/GoogleButton'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      heading="Welcome back"
      subheading="Log in to your Conceptra account"
    >
      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl
                        animate-scale-in text-sm text-red-600">
          <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
          <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wider mb-2">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoFocus
            className="w-full px-4 py-3.5 bg-white border-2 border-ink-100 rounded-2xl text-ink-900 text-sm
                       placeholder:text-ink-300 outline-none transition-all duration-200
                       focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(13,148,136,0.08)]"
          />
        </div>

        {/* Password */}
        <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.15s' }}>
          <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 pr-12 bg-white border-2 border-ink-100 rounded-2xl text-ink-900 text-sm
                         placeholder:text-ink-300 outline-none transition-all duration-200
                         focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(13,148,136,0.08)]"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="animate-slide-up pt-2" style={{ opacity: 0, animationDelay: '0.2s' }}>
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3.5 rounded-2xl font-semibold text-sm text-white overflow-hidden
                       transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                       bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-900/20 hover:shadow-brand-900/30"
          >
            {/* Shimmer */}
            {!loading && (
              <span className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2.4s linear infinite',
                    }} />
            )}
            <span className="relative flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Logging in…</>
                : <>Log in <ArrowRight size={15} /></>}
            </span>
          </button>
        </div>
      </form>

      {/* OR divider */}
      <div className="flex items-center gap-3 my-5 animate-slide-up" style={{ opacity: 0, animationDelay: '0.25s' }}>
        <div className="flex-1 h-px bg-ink-100" />
        <span className="text-xs text-ink-300 font-medium">or</span>
        <div className="flex-1 h-px bg-ink-100" />
      </div>

      {/* Google */}
      <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
        <GoogleButton label="Continue with Google" />
      </div>

      <p className="text-center text-xs text-ink-300 mt-5 animate-slide-up" style={{ opacity: 0, animationDelay: '0.35s' }}>
        No account?{' '}
        <Link href="/signup" className="text-brand-600 font-semibold hover:underline">Sign up free</Link>
      </p>
    </AuthShell>
  )
}
