import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'

type Step = 'phone' | 'otp'

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    try {
      await authApi.requestOtp(phone)
      setInfo('OTP sent — check server console (dummy: 123456)')
      setStep('otp')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!otp.trim()) {
      setError('Enter the OTP')
      return
    }
    setLoading(true)
    try {
      const { token } = await authApi.verifyOtp(phone, otp)
      localStorage.setItem('chrome_admin_token', token)
      navigate('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shrink-0">
            🔒
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Chrome GST Manager</p>
            <p className="text-slate-500 text-sm">Admin Panel</p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-white text-xl font-bold mb-1">
            {step === 'phone' ? 'Sign in' : 'Enter OTP'}
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            {step === 'phone'
              ? 'Enter your phone number to receive an OTP'
              : `OTP sent to +91 ${phone}`}
          </p>

          {/* Alerts */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-950 border border-red-900 text-red-400 text-sm">
              {error}
            </div>
          )}
          {info && !error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-950 border border-emerald-900 text-emerald-400 text-sm">
              {info}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-95"
              >
                {loading ? <Spinner /> : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1.5">
                  One-Time Password
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors tracking-widest text-center text-lg"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-95"
              >
                {loading ? <Spinner /> : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); setInfo('') }}
                className="w-full py-2.5 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-sm transition-colors"
              >
                Change number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      Please wait…
    </span>
  )
}
