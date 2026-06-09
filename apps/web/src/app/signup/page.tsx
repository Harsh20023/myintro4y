'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { AuthShell } from '@/components/auth/AuthShell'
import { GoogleButton } from '@/components/auth/GoogleButton'

const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p: string) => /\d/.test(p) },
]

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.register(email, password)
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const allRulesMet = RULES.every(r => r.test(password))

  return (
    <AuthShell
      heading="Create your account"
      subheading="Free forever — no credit card needed"
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
            Work email
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
              onFocus={() => setFocused(true)}
              placeholder="Create a strong password"
              required
              minLength={8}
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

          {/* Password strength rules */}
          {(focused && password.length > 0) && (
            <div className="mt-3 space-y-1.5 animate-slide-up" style={{ opacity: 0 }}>
              {RULES.map(rule => {
                const met = rule.test(password)
                return (
                  <div key={rule.label} className="flex items-center gap-2 text-xs transition-colors duration-200">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                                    ${met ? 'bg-brand-500' : 'bg-ink-100'}`}>
                      {met && <Check size={9} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={met ? 'text-brand-600' : 'text-ink-400'}>{rule.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="animate-slide-up pt-2" style={{ opacity: 0, animationDelay: '0.2s' }}>
          <button
            type="submit"
            disabled={loading || (password.length > 0 && !allRulesMet)}
            className="relative w-full py-3.5 rounded-2xl font-semibold text-sm text-white overflow-hidden
                       transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                       bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-900/20 hover:shadow-brand-900/30"
          >
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
                ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                : <>Sign up free <ArrowRight size={15} /></>}
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
        <GoogleButton label="Sign up with Google" />
      </div>

      <p className="text-center text-xs text-ink-300 mt-5 animate-slide-up" style={{ opacity: 0, animationDelay: '0.35s' }}>
        Already have an account?{' '}
        <Link href="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link>
      </p>
    </AuthShell>
  )
}
