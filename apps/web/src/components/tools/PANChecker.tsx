'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle2, XCircle, RefreshCw, AlertTriangle, Search,
} from 'lucide-react'
import { Input, Card } from '@/components/ui'
import { pan, type PANResult } from '@/lib/api'

type Phase = 'idle' | 'captcha-loading' | 'ready' | 'searching' | 'result' | 'error'

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/

function validatePAN(value: string): { valid: boolean; message?: string } {
  if (!value) return { valid: false }
  if (value.length < 10) return { valid: false, message: 'PAN must be 10 characters' }
  if (!PAN_RE.test(value)) return { valid: false, message: 'Invalid PAN format (e.g. ABBDW4182K)' }
  return { valid: true }
}

function StatusChip({ sts }: { sts: string }) {
  const s = sts?.toLowerCase() ?? ''
  if (s === 'active') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
      <CheckCircle2 size={10} /> Active
    </span>
  )
  if (s.includes('cancel')) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
      <XCircle size={10} /> {sts}
    </span>
  )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
      {sts || 'Unknown'}
    </span>
  )
}

export function PANChecker() {
  const [phase, setPhase]           = useState<Phase>('idle')
  const [panValue, setPanValue]     = useState('')
  const [captchaText, setCaptchaText] = useState('')
  const [captchaImg, setCaptchaImg] = useState('')
  const [sessionId, setSessionId]   = useState('')
  const [results, setResults]       = useState<PANResult[] | null>(null)
  const [errorMsg, setErrorMsg]     = useState('')

  const validation  = validatePAN(panValue)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!validation.valid) return
    if (phase === 'captcha-loading' || phase === 'ready' || phase === 'searching') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadCaptcha(panValue), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panValue, validation.valid])

  async function loadCaptcha(panVal: string) {
    setPhase('captcha-loading')
    setCaptchaText('')
    setResults(null)
    setErrorMsg('')
    try {
      const data = await pan.getCaptcha(panVal.trim().toUpperCase())
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
    setPhase('searching')
    try {
      const data = await pan.search(sessionId, captchaText.trim())
      setResults(data.results)
      setPhase('result')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Search failed')
      setPhase('result')
    }
  }

  function handleReset() {
    setPanValue('')
    setCaptchaText('')
    setCaptchaImg('')
    setSessionId('')
    setResults(null)
    setErrorMsg('')
    setPhase('idle')
  }

  const isLoading = phase === 'captcha-loading' || phase === 'searching'

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="PAN"
              value={panValue}
              onChange={e => {
                const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
                setPanValue(v)
                if (phase !== 'idle') {
                  setCaptchaImg('')
                  setSessionId('')
                  setCaptchaText('')
                  setPhase('idle')
                }
              }}
              placeholder="e.g. ABBDW4182K"
              maxLength={10}
              className="font-mono tracking-widest"
              disabled={isLoading}
              error={panValue.length > 0 && !validation.valid && validation.message ? validation.message : undefined}
            />
            <p className="mt-1 text-xs text-ink-400">Enter 10-character PAN to find all associated GSTINs</p>
          </div>

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
                  onClick={() => { if (validation.valid) loadCaptcha(panValue) }}
                  disabled={isLoading || !validation.valid}
                  title="Refresh captcha"
                  className="flex-shrink-0 w-10 h-10 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={15} className={`text-ink-500 ${phase === 'captcha-loading' ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {phase === 'captcha-loading' && (
                <p className="mt-2 text-xs text-ink-400 flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-ink-300 border-t-transparent rounded-full animate-spin inline-block" />
                  Opening GST portal…
                </p>
              )}
            </div>
          )}

          {(phase === 'ready' || phase === 'searching') && (
            <button
              type="submit"
              disabled={!captchaText.trim() || phase !== 'ready'}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {phase === 'searching' ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Searching…</>
              ) : (
                <><Search size={16} /> Search by PAN</>
              )}
            </button>
          )}
        </form>
      </Card>

      {phase === 'result' && (
        <div className="space-y-4 animate-fade-up">
          {results && results.length > 0 ? (
            <Card padding="sm">
              <p className="text-xs font-semibold text-ink-500 mb-3">
                {results.length} GSTIN{results.length !== 1 ? 's' : ''} found for PAN {panValue}
              </p>
              <div className="rounded-xl border border-ink-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-ink-50 border-b border-ink-100">
                      <th className="text-left px-3 py-2 font-medium text-ink-500">GSTIN</th>
                      <th className="text-left px-3 py-2 font-medium text-ink-500">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-ink-500">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50">
                        <td className="px-3 py-2.5 font-mono font-medium text-ink-800">{r.gstin}</td>
                        <td className="px-3 py-2.5"><StatusChip sts={r.sts} /></td>
                        <td className="px-3 py-2.5 text-ink-600">{r.state || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : errorMsg ? (
            <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl">
              <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  {errorMsg.toLowerCase().includes('captcha') ? 'Incorrect captcha' : 'Search failed'}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  {errorMsg.toLowerCase().includes('captcha')
                    ? 'The captcha was wrong. Please refresh and try a new one.'
                    : errorMsg}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">No GSTINs found</p>
                <p className="text-amber-700 text-xs mt-1">No taxpayer registrations are linked to PAN {panValue}.</p>
              </div>
            </div>
          )}

          <button onClick={handleReset} className="btn-secondary w-full flex items-center justify-center gap-2">
            <RefreshCw size={15} /> Search another PAN
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Could not connect to GST portal</p>
            <p className="text-red-600 text-xs mt-0.5">{errorMsg}</p>
            <button
              onClick={() => { if (validation.valid) loadCaptcha(panValue) }}
              className="mt-2 text-xs text-red-700 font-medium underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
