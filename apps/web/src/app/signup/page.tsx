'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  UserCircle, Briefcase, Building2,
  Eye, EyeOff, ArrowRight, Loader2, Check, ChevronLeft,
} from 'lucide-react'
import { api, AccountType, RegisterPayload } from '@/lib/api'
import { AuthShell } from '@/components/auth/AuthShell'
import { GoogleButton } from '@/components/auth/GoogleButton'

// ── Password rules ────────────────────────────────────────────────────────────
const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p: string) => /\d/.test(p) },
]

// ── Account type definitions ──────────────────────────────────────────────────
const ACCOUNT_TYPES: {
  id: AccountType
  icon: React.ElementType
  label: string
  tag: string
  lines: string[]
  accent: { border: string; bg: string; iconColor: string; tagBg: string; tagText: string }
}[] = [
  {
    id: 'individual',
    icon: UserCircle,
    label: 'Individual',
    tag: 'Solo',
    lines: ['Personal books & accounts', 'Basic GST & tax filing', 'Simple stock management'],
    accent: {
      border: 'border-ink-200 hover:border-ink-400',
      bg: 'bg-white',
      iconColor: 'text-ink-500',
      tagBg: 'bg-ink-100',
      tagText: 'text-ink-500',
    },
  },
  {
    id: 'professional',
    icon: Briefcase,
    label: 'Professional',
    tag: 'CA / Firm',
    lines: ['Manage multiple client orgs', 'Full accounting per client', 'GST & income tax filing', 'Cross-org financial reports'],
    accent: {
      border: 'border-brand-300 hover:border-brand-500',
      bg: 'bg-brand-50/60',
      iconColor: 'text-brand-600',
      tagBg: 'bg-brand-600',
      tagText: 'text-white',
    },
  },
  {
    id: 'organization',
    icon: Building2,
    label: 'Organization',
    tag: 'Entity',
    lines: ['Company / business entity', 'Full accounting & stock', 'GST & income tax compliance', 'Operational delegation'],
    accent: {
      border: 'border-emerald-300 hover:border-emerald-500',
      bg: 'bg-emerald-50/60',
      iconColor: 'text-emerald-600',
      tagBg: 'bg-emerald-600',
      tagText: 'text-white',
    },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function InputField({
  label, value, onChange, type = 'text', placeholder, required, autoFocus, optional,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean; autoFocus?: boolean; optional?: boolean
}) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-semibold text-ink-600 uppercase tracking-wider mb-2">
        {label}
        {optional && <span className="normal-case font-normal text-ink-300 tracking-normal">(optional)</span>}
      </label>
      <div className="relative">
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          className="w-full px-4 py-3.5 pr-12 bg-white border-2 border-ink-100 rounded-2xl text-ink-900 text-sm
                     placeholder:text-ink-300 outline-none transition-all duration-200
                     focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(13,148,136,0.08)]"
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Step 1 — type picker ──────────────────────────────────────────────────────
function TypePicker({ onSelect }: { onSelect: (t: AccountType) => void }) {
  const [hovered, setHovered] = useState<AccountType | null>(null)

  return (
    <div>
      <div className="mb-8 animate-slide-up" style={{ opacity: 0, animationDelay: '0.05s' }}>
        <h1 className="font-display font-bold text-3xl text-ink-950 mb-1.5">Create your account</h1>
        <p className="text-ink-400 text-sm">Choose the account type that best describes you</p>
      </div>

      <div className="space-y-3">
        {ACCOUNT_TYPES.map((t, i) => {
          const Icon = t.icon
          const isHov = hovered === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200
                          animate-slide-up cursor-pointer
                          ${t.accent.bg} ${t.accent.border}
                          ${isHov ? 'shadow-md -translate-y-0.5' : ''}`}
              style={{ opacity: 0, animationDelay: `${0.1 + i * 0.07}s` }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0
                                 border border-white/60 shadow-sm`}>
                  <Icon size={20} className={t.accent.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-ink-900">{t.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.accent.tagBg} ${t.accent.tagText}`}>
                      {t.tag}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {t.lines.map(line => (
                      <div key={line} className="flex items-center gap-1.5 text-xs text-ink-400">
                        <div className="w-1 h-1 rounded-full bg-ink-300 flex-shrink-0" />
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
                <ArrowRight size={16} className={`text-ink-300 flex-shrink-0 mt-1 transition-transform duration-200 ${isHov ? 'translate-x-0.5 text-ink-500' : ''}`} />
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 my-5 animate-slide-up" style={{ opacity: 0, animationDelay: '0.35s' }}>
        <div className="flex-1 h-px bg-ink-100" />
        <span className="text-xs text-ink-300 font-medium">or</span>
        <div className="flex-1 h-px bg-ink-100" />
      </div>

      <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.4s' }}>
        <GoogleButton label="Sign up with Google" />
      </div>

      <p className="text-center text-xs text-ink-300 mt-5 animate-slide-up" style={{ opacity: 0, animationDelay: '0.45s' }}>
        Already have an account?{' '}
        <Link href="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link>
      </p>
    </div>
  )
}

// ── Step 2 — details form ─────────────────────────────────────────────────────
function DetailsForm({
  accountType,
  onBack,
}: {
  accountType: AccountType
  onBack: () => void
}) {
  const router  = useRouter()
  const typeInfo = ACCOUNT_TYPES.find(t => t.id === accountType)!
  const Icon    = typeInfo.icon

  // common
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [passFocused, setPassFocused] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // individual
  const [displayName, setDisplayName] = useState('')

  // professional
  const [firmName, setFirmName]             = useState('')
  const [membershipNumber, setMembership]   = useState('')

  // organization
  const [orgName, setOrgName] = useState('')
  const [pan, setPan]         = useState('')
  const [gstin, setGstin]     = useState('')

  const allRulesMet = RULES.every(r => r.test(password))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!allRulesMet) { setError('Password does not meet all requirements'); return }
    setLoading(true)
    try {
      const payload: RegisterPayload = { email, password, accountType }
      if (accountType === 'individual' && displayName) payload.displayName = displayName
      if (accountType === 'professional') {
        if (firmName) payload.firmName = firmName
        if (membershipNumber) payload.membershipNumber = membershipNumber
      }
      if (accountType === 'organization') {
        payload.orgName = orgName
        if (pan) payload.pan = pan
        if (gstin) payload.gstin = gstin
      }
      await api.register(payload)
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-7 animate-slide-up" style={{ opacity: 0, animationDelay: '0.05s' }}>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 mb-4 transition-colors group"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Type badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border mb-4
                          ${typeInfo.accent.bg} ${typeInfo.accent.border.split(' ')[0]}`}>
          <Icon size={14} className={typeInfo.accent.iconColor} />
          <span className="text-xs font-semibold text-ink-700">{typeInfo.label} account</span>
        </div>

        <h1 className="font-display font-bold text-3xl text-ink-950 mb-1">Your details</h1>
        <p className="text-ink-400 text-sm">Fill in the information to create your account</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl
                        animate-scale-in text-sm text-red-600">
          <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Individual ── */}
        {accountType === 'individual' && (
          <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
            <InputField
              label="Full Name" value={displayName} onChange={setDisplayName}
              placeholder="Rahul Sharma" optional autoFocus
            />
          </div>
        )}

        {/* ── Professional ── */}
        {accountType === 'professional' && (
          <>
            <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
              <InputField
                label="Firm / Practice Name" value={firmName} onChange={setFirmName}
                placeholder="Sharma & Associates" optional autoFocus
              />
            </div>
            <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.13s' }}>
              <InputField
                label="Membership Number" value={membershipNumber} onChange={setMembership}
                placeholder="ICAI / ICSI membership no." optional
              />
            </div>
          </>
        )}

        {/* ── Organization ── */}
        {accountType === 'organization' && (
          <>
            <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
              <InputField
                label="Organisation Name" value={orgName} onChange={setOrgName}
                placeholder="Acme Pvt Ltd" required autoFocus
              />
            </div>
            <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.13s' }}>
              <InputField
                label="PAN" value={pan} onChange={v => setPan(v.toUpperCase())}
                placeholder="AABCA1234Z" optional
              />
            </div>
            <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.16s' }}>
              <InputField
                label="GSTIN" value={gstin} onChange={v => setGstin(v.toUpperCase())}
                placeholder="27AABCA1234Z1Z5" optional
              />
            </div>
          </>
        )}

        {/* ── Email ── */}
        <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.2s' }}>
          <InputField
            label="Work Email" value={email} onChange={setEmail}
            type="email" placeholder="you@company.com" required
          />
        </div>

        {/* ── Password ── */}
        <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '0.23s' }}>
          <div>
            <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <PasswordInput value={password} onChange={setPassword} onFocus={() => setPassFocused(true)} />
            </div>
            {passFocused && password.length > 0 && (
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
        </div>

        {/* ── Submit ── */}
        <div className="animate-slide-up pt-2" style={{ opacity: 0, animationDelay: '0.28s' }}>
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
                : <>Create account <ArrowRight size={15} /></>}
            </span>
          </button>
        </div>
      </form>

      <p className="text-center text-xs text-ink-300 mt-5 animate-slide-up" style={{ opacity: 0, animationDelay: '0.33s' }}>
        Already have an account?{' '}
        <Link href="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link>
      </p>
    </div>
  )
}

function PasswordInput({ value, onChange, onFocus }: { value: string; onChange: (v: string) => void; onFocus: () => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Create a strong password"
        required
        minLength={8}
        className="w-full px-4 py-3.5 pr-12 bg-white border-2 border-ink-100 rounded-2xl text-ink-900 text-sm
                   placeholder:text-ink-300 outline-none transition-all duration-200
                   focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(13,148,136,0.08)]"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const [accountType, setAccountType] = useState<AccountType | null>(null)

  return (
    <AuthShell
      heading=""
      subheading=""
    >
      {accountType === null
        ? <TypePicker onSelect={setAccountType} />
        : <DetailsForm accountType={accountType} onBack={() => setAccountType(null)} />
      }
    </AuthShell>
  )
}
