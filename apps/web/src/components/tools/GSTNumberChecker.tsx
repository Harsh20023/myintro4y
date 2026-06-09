'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle2, XCircle, RefreshCw, AlertTriangle,
  Building2, MapPin, Calendar, Tag, Info, Search,
} from 'lucide-react'
import { Input, Card, Badge } from '@/components/ui'
import { gst, type GSTNTaxpayer } from '@/lib/api'
import { validateGSTIN, parseGSTIN } from '@/lib/logic/gstin'

type Phase = 'idle' | 'captcha-loading' | 'ready' | 'verifying' | 'result' | 'error'

function fmtDate(raw?: string) {
  if (!raw) return '—'
  const d = new Date(raw)
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ sts }: { sts?: string }) {
  const s = sts?.toLowerCase() ?? ''
  if (s === 'active') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
      <CheckCircle2 size={14} /> Active
    </span>
  )
  if (s.includes('cancel')) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
      <XCircle size={14} /> {sts}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
      <AlertTriangle size={14} /> {sts ?? 'Unknown'}
    </span>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-ink-50 last:border-0">
      <span className="text-ink-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ink-400 font-medium">{label}</p>
        <p className="text-sm text-ink-800 font-medium mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

export function GSTNumberChecker() {
  const [phase, setPhase]             = useState<Phase>('idle')
  const [gstin, setGSTIN]             = useState('')
  const [captchaText, setCaptchaText] = useState('')
  const [captchaImg, setCaptchaImg]   = useState('')
  const [sessionId, setSessionId]     = useState('')
  const [result, setResult]           = useState<GSTNTaxpayer | null>(null)
  const [errorMsg, setErrorMsg]       = useState('')

  const validation = validateGSTIN(gstin)
  const parts      = validation.valid ? parseGSTIN(gstin) : null

  // Auto-load captcha whenever GSTIN becomes valid (debounced)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!validation.valid) return
    if (phase === 'captcha-loading' || phase === 'ready' || phase === 'verifying') return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadCaptcha(gstin)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gstin, validation.valid])

  async function loadCaptcha(gstinValue: string) {
    setPhase('captcha-loading')
    setCaptchaText('')
    setResult(null)
    setErrorMsg('')
    try {
      const data = await gst.getCaptcha(gstinValue.trim().toUpperCase())
      setCaptchaImg(data.captcha)
      setSessionId(data.sessionId)
      setPhase('ready')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load captcha')
      setPhase('error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!captchaText.trim() || phase !== 'ready') return
    setPhase('verifying')
    try {
      const data = await gst.verify(sessionId, captchaText.trim())
      setResult(data)
      setPhase('result')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed')
      setPhase('result')
    }
  }

  function handleReset() {
    setGSTIN('')
    setCaptchaText('')
    setCaptchaImg('')
    setSessionId('')
    setResult(null)
    setErrorMsg('')
    setPhase('idle')
  }

  function handleRefreshCaptcha() {
    if (validation.valid) loadCaptcha(gstin)
  }

  const isLoading = phase === 'captcha-loading' || phase === 'verifying'

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* GSTIN input — always editable */}
          <div>
            <Input
              label="GSTIN"
              value={gstin}
              onChange={e => {
                const v = e.target.value.toUpperCase()
                setGSTIN(v)
                // Reset captcha state when GSTIN changes
                if (phase !== 'idle') {
                  setCaptchaImg('')
                  setSessionId('')
                  setCaptchaText('')
                  setPhase('idle')
                }
              }}
              placeholder="e.g. 06AABCW7102K1ZD"
              maxLength={15}
              className="font-mono tracking-wider"
              disabled={isLoading}
              error={gstin.length > 0 && !validation.valid && validation.message ? validation.message : undefined}
            />
            {parts && (
              <p className="mt-1.5 text-xs text-brand-600 font-medium flex items-center gap-1">
                <MapPin size={11} /> {parts.stateName} · PAN: {parts.pan}
              </p>
            )}
          </div>

          {/* Captcha row — only shown once GSTIN is valid */}
          {(phase !== 'idle' || captchaImg) && (
            <div>
              <p className="label-base mb-2">Captcha</p>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-36 h-12 rounded-xl border border-ink-200 bg-ink-50 overflow-hidden flex items-center justify-center">
                  {phase === 'captcha-loading' ? (
                    <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  ) : captchaImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={captchaImg} alt="Captcha" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs text-ink-400">—</span>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    value={captchaText}
                    onChange={e => setCaptchaText(e.target.value)}
                    placeholder="Enter captcha text"
                    disabled={phase !== 'ready'}
                    className="font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  disabled={isLoading || !validation.valid}
                  title="Refresh captcha"
                  className="flex-shrink-0 w-10 h-10 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={15} className={`text-ink-500 ${phase === 'captcha-loading' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Hint: loading captcha automatically opens GST portal via Puppeteer */}
              {phase === 'captcha-loading' && (
                <p className="mt-2 text-xs text-ink-400 flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-ink-300 border-t-transparent rounded-full animate-spin" />
                  Opening GST portal and filling your GSTIN…
                </p>
              )}
            </div>
          )}

          {/* Show submit only when captcha is ready */}
          {(phase === 'ready' || phase === 'verifying') && (
            <button
              type="submit"
              disabled={!captchaText.trim() || phase !== 'ready'}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {phase === 'verifying' ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking GSTN…</>
              ) : (
                <><Search size={16} /> Check GSTIN</>
              )}
            </button>
          )}
        </form>
      </Card>

      {/* Result */}
      {phase === 'result' && result && (
        <div className="space-y-4 animate-fade-up">
          {result.flag === 'Y' ? (
            <>
              <Card className="border-l-4 border-l-green-400">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-ink-400 mb-1">{result.gstin}</p>
                    <h2 className="font-display font-bold text-lg text-ink-900 leading-tight capitalize">
                      {result.tradeNam || result.lgnm || 'Unknown Business'}
                    </h2>
                    {result.lgnm && result.tradeNam && result.lgnm.toLowerCase() !== result.tradeNam.toLowerCase() && (
                      <p className="text-xs text-ink-500 mt-0.5 capitalize">Legal: {result.lgnm}</p>
                    )}
                  </div>
                  <StatusBadge sts={result.sts} />
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card padding="sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">Registration</p>
                  <DetailRow icon={<Calendar size={14} />}  label="Registration Date" value={fmtDate(result.dtReg || result.rgdt)} />
                  <DetailRow icon={<Tag size={14} />}       label="Taxpayer Type"     value={result.dty} />
                  <DetailRow icon={<Building2 size={14} />} label="Constitution"      value={result.ctb} />
                  {result.cxdt && <DetailRow icon={<XCircle size={14} />} label="Cancellation Date" value={fmtDate(result.cxdt)} />}
                </Card>

                <Card padding="sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">Jurisdiction</p>
                  <DetailRow icon={<MapPin size={14} />} label="State Jurisdiction"  value={result.stj} />
                  <DetailRow icon={<MapPin size={14} />} label="Registered Address"  value={result.pradr?.adr} />
                  <DetailRow icon={<Tag size={14} />}    label="e-Invoice Status"    value={result.einvoiceStatus} />
                </Card>
              </div>

              {result.nba && result.nba.length > 0 && (
                <Card padding="sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Nature of Business</p>
                  <div className="flex flex-wrap gap-2">
                    {result.nba.map(b => <Badge key={b} variant="default">{b}</Badge>)}
                  </div>
                </Card>
              )}

              {result.lstupdt && (
                <p className="text-xs text-ink-400 text-right">Last updated: {fmtDate(result.lstupdt)}</p>
              )}
            </>
          ) : (
            <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl">
              <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  {result.msg?.toLowerCase().includes('captcha') ? 'Incorrect captcha' : 'GSTIN not found'}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  {result.msg?.toLowerCase().includes('captcha')
                    ? 'The captcha was wrong. Please refresh and try a new one.'
                    : result.msg || 'No taxpayer is registered with this GSTIN.'}
                </p>
              </div>
            </div>
          )}

          <button onClick={handleReset} className="btn-secondary w-full flex items-center justify-center gap-2">
            <RefreshCw size={15} /> Check another GSTIN
          </button>
        </div>
      )}

      {/* Error state (captcha load or verify failed) */}
      {phase === 'error' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Could not connect to GSTN portal</p>
            <p className="text-red-600 text-xs mt-0.5">{errorMsg}</p>
            <button onClick={handleRefreshCaptcha} className="mt-2 text-xs text-red-700 font-medium underline underline-offset-2">
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
        <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Data is fetched live from the <strong>GSTN portal</strong>. Results reflect current registration status as recorded by the Government of India.
        </p>
      </div>
    </div>
  )
}
