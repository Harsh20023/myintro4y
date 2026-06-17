import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'

type Step = 'credentials' | 'totp'

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleCredentialsNext(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      return
    }
    setStep('totp')
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (totpCode.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app')
      return
    }
    setLoading(true)
    try {
      const { token } = await authApi.login(username, password, totpCode)
      localStorage.setItem('chrome_admin_token', token)
      navigate('/dashboard')
    } catch (err) {
      setError((err as Error).message)
      // Send back to credentials on auth failure so nothing is revealed
      setStep('credentials')
      setTotpCode('')
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

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <StepDot active={step === 'credentials'} done={step === 'totp'} label="1" />
          <div className="flex-1 h-px bg-slate-700" />
          <StepDot active={step === 'totp'} done={false} label="2" />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {step === 'credentials' ? (
            <>
              <h1 className="text-white text-xl font-bold mb-1">Sign in</h1>
              <p className="text-slate-500 text-sm mb-6">Enter your admin credentials</p>

              {error && <ErrorBanner message={error} />}

              <form onSubmit={handleCredentialsNext} className="space-y-4">
                <Field
                  label="Username"
                  type="text"
                  value={username}
                  onChange={setUsername}
                  placeholder="admin"
                  autoComplete="username"
                  autoFocus
                />
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all active:scale-95"
                >
                  Continue →
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-white text-xl font-bold mb-1">Authenticator code</h1>
              <p className="text-slate-500 text-sm mb-6">
                Open your authenticator app and enter the 6-digit code for <span className="text-slate-300">Chrome GST Manager</span>
              </p>

              {error && <ErrorBanner message={error} />}

              <form onSubmit={handleTotpSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-1.5">
                    6-digit code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors tracking-[0.5em] text-center text-xl font-mono"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-95"
                >
                  {loading ? <Spinner /> : 'Sign in'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setTotpCode(''); setError('') }}
                  className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  ← Back
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
      done    ? 'bg-blue-600 text-white' :
      active  ? 'bg-blue-600 text-white ring-2 ring-blue-400' :
                'bg-slate-700 text-slate-400'
    }`}>
      {done ? '✓' : label}
    </div>
  )
}

function Field({
  label, type, value, onChange, placeholder, autoComplete, autoFocus,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; autoComplete?: string; autoFocus?: boolean
}) {
  return (
    <div>
      <label className="block text-slate-400 text-sm font-medium mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 px-4 py-3 rounded-lg bg-red-950 border border-red-900 text-red-400 text-sm">
      {message}
    </div>
  )
}

function Spinner() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      Verifying…
    </span>
  )
}
