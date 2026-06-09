'use client'

import { useState, FormEvent, Suspense, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { AuthShell } from '@/components/auth/AuthShell'

function VerifyOtpForm() {
  const router             = useRouter()
  const searchParams       = useSearchParams()
  const { loginWithToken } = useAuth()

  const emailFromQuery = searchParams.get('email') ?? ''

  const [digits, setDigits]     = useState(['', '', '', '', '', ''])
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const inputRefs               = useRef<(HTMLInputElement | null)[]>([])

  const otp = digits.join('')

  const handleDigit = (idx: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = v
    setDigits(next)
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) return
    setError('')
    setLoading(true)
    try {
      const { token } = await api.verifyOtp(emailFromQuery, otp)
      setSuccess(true)
      await loginWithToken(token)
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      heading="Check your email"
      subheading={emailFromQuery
        ? `We sent a 6-digit code to ${emailFromQuery}`
        : 'Enter the 6-digit code we sent you'}
    >
      {/* Dev hint */}
      <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-brand-50 border border-brand-200 rounded-2xl
                      animate-slide-up" style={{ opacity: 0, animationDelay: '0.05s' }}>
        <ShieldCheck size={16} className="text-brand-600 flex-shrink-0" />
        <p className="text-xs text-brand-700">
          <span className="font-semibold">Dev mode:</span> OTP is always <span className="font-mono font-bold">123456</span>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl
                        animate-scale-in text-sm text-red-600">
          <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* OTP digit boxes */}
        <div className="flex gap-2.5 justify-between mb-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              autoFocus={i === 0}
              className={`w-full aspect-square text-center text-xl font-bold font-mono rounded-2xl border-2 outline-none
                          transition-all duration-200 bg-white text-ink-900
                          ${d ? 'border-brand-400 bg-brand-50 shadow-[0_0_0_4px_rgba(13,148,136,0.08)]'
                              : 'border-ink-100 focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(13,148,136,0.08)]'}`}
            />
          ))}
        </div>

        {/* Submit */}
        <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.15s' }}>
          <button
            type="submit"
            disabled={loading || otp.length < 6 || success}
            className="relative w-full py-3.5 rounded-2xl font-semibold text-sm text-white overflow-hidden
                       transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                       bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-900/20"
          >
            {!loading && !success && (
              <span className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2.4s linear infinite',
                    }} />
            )}
            <span className="relative flex items-center justify-center gap-2">
              {loading   ? <><Loader2 size={16} className="animate-spin" /> Verifying…</>
             : success   ? <>Verified! Redirecting…</>
             :              <>Verify & continue <ArrowRight size={15} /></>}
            </span>
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-ink-400 mt-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0.2s' }}>
        Wrong email?{' '}
        <Link href="/signup" className="text-brand-600 font-semibold hover:underline">Start over</Link>
      </p>
    </AuthShell>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  )
}
