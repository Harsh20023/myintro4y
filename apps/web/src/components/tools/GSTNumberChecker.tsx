'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle2, XCircle, RefreshCw, AlertTriangle,
  Building2, MapPin, Calendar, Tag, Info, Search, FileText, BarChart2, Hash, CreditCard,
} from 'lucide-react'
import { Input, Card, Badge } from '@/components/ui'
import { gst, pan, type GSTNTaxpayer, type GSTFilingData, type FilingEntry, type FrequencyRow, type PANResult } from '@/lib/api'
import { validateGSTIN, parseGSTIN } from '@/lib/logic/gstin'

// ── Shared helpers ────────────────────────────────────────────────────────────

type Phase = 'idle' | 'captcha-loading' | 'ready' | 'verifying' | 'searching' | 'result' | 'error'

function getCurrentFY(): string {
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()
  const start = month >= 4 ? year : year - 1
  return `${start}-${start + 1}`
}

function getAvailableYears(): string[] {
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()
  const start = month >= 4 ? year : year - 1
  return Array.from({ length: 5 }, (_, i) => {
    const s = start - i
    return `${s}-${s + 1}`
  })
}

function parsePeriod(taxp: string): string {
  if (!taxp) return '—'
  if (/^\d{6}$/.test(taxp)) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const m = parseInt(taxp.slice(0, 2)) - 1
    return months[m] ? `${months[m]} ${taxp.slice(2)}` : taxp
  }
  return taxp
}

function fmtDate(raw?: string) {
  if (!raw) return '—'
  const d = new Date(raw)
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Shared sub-components ─────────────────────────────────────────────────────

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

function FilingStatus({ sts }: { sts: string }) {
  const s = sts?.toLowerCase() ?? ''
  if (s === 'filed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
      <CheckCircle2 size={10} /> Filed
    </span>
  )
  if (!s || s.includes('not')) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-ink-100 text-ink-500 text-xs font-medium">
      Not Filed
    </span>
  )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
      {sts}
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

function FilingTable({ title, entries }: { title: string; entries: FilingEntry[] }) {
  if (entries.length === 0) return (
    <div>
      <p className="text-xs font-semibold text-ink-600 mb-2">{title}</p>
      <p className="text-xs text-ink-400 py-4 text-center border border-dashed border-ink-200 rounded-xl">No data available</p>
    </div>
  )
  return (
    <div>
      <p className="text-xs font-semibold text-ink-600 mb-2">{title}</p>
      <div className="rounded-xl border border-ink-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-ink-50 border-b border-ink-100">
              <th className="text-left px-3 py-2 font-medium text-ink-500">Period</th>
              <th className="text-left px-3 py-2 font-medium text-ink-500">Date Filed</th>
              <th className="text-left px-3 py-2 font-medium text-ink-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50">
                <td className="px-3 py-2 text-ink-700 font-medium">{parsePeriod(e.taxp)}</td>
                <td className="px-3 py-2 text-ink-600">{e.dof || '—'}</td>
                <td className="px-3 py-2"><FilingStatus sts={e.sts} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FrequencyChip({ freq }: { freq: string }) {
  const f = freq?.toLowerCase()
  const cls = f === 'monthly'   ? 'bg-blue-50 border-blue-200 text-blue-700'
            : f === 'quarterly' ? 'bg-purple-50 border-purple-200 text-purple-700'
            : f === 'na' || !f  ? 'bg-ink-100 text-ink-400'
            :                     'bg-amber-50 border-amber-200 text-amber-700'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${cls}`}>
      {freq || 'N/A'}
    </span>
  )
}

function FrequencyTable({ rows }: { rows: FrequencyRow[] }) {
  if (rows.length === 0) return (
    <p className="text-xs text-ink-400 text-center py-6 border border-dashed border-ink-200 rounded-xl">
      No frequency data available
    </p>
  )
  return (
    <div className="rounded-xl border border-ink-100 overflow-hidden overflow-x-auto">
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr className="bg-ink-50 border-b border-ink-100">
            <th className="text-left px-3 py-2 font-medium text-ink-500">Financial Year</th>
            <th className="text-center px-3 py-2 font-medium text-ink-500">Apr–Jun</th>
            <th className="text-center px-3 py-2 font-medium text-ink-500">Jul–Sep</th>
            <th className="text-center px-3 py-2 font-medium text-ink-500">Oct–Dec</th>
            <th className="text-center px-3 py-2 font-medium text-ink-500">Jan–Mar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-ink-50 last:border-0">
              <td className="px-3 py-2.5 font-mono font-medium text-ink-700">{r.fy}</td>
              <td className="px-3 py-2.5 text-center"><FrequencyChip freq={r.aprJun} /></td>
              <td className="px-3 py-2.5 text-center"><FrequencyChip freq={r.julSep} /></td>
              <td className="px-3 py-2.5 text-center"><FrequencyChip freq={r.octDec} /></td>
              <td className="px-3 py-2.5 text-center"><FrequencyChip freq={r.janMar} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type FilingTab = 'filing-table' | 'return-frequency'

function FilingSection({ filingSessionId, initialData }: { filingSessionId: string; initialData: GSTFilingData | null }) {
  const [activeTab, setActiveTab]   = useState<FilingTab>('filing-table')
  const [selectedFY, setSelectedFY] = useState(getCurrentFY())
  const [tableData, setTableData]   = useState<GSTFilingData | null>(initialData)
  const [freqData, setFreqData]     = useState<FrequencyRow[] | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const years = getAvailableYears()

  async function fetchData(tab: FilingTab, fy: string) {
    setLoading(true); setError('')
    try {
      const result = await gst.getFilings(filingSessionId, fy, tab)
      if (tab === 'return-frequency') setFreqData(result.frequency ?? [])
      else setTableData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (!initialData) fetchData('filing-table', selectedFY) }, [])

  function handleTabChange(tab: FilingTab) {
    setActiveTab(tab); setError('')
    if (tab === 'return-frequency' && !freqData) fetchData('return-frequency', selectedFY)
  }

  return (
    <Card padding="sm">
      <div className="flex gap-2 mb-4">
        <button onClick={() => handleTabChange('filing-table')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
            activeTab === 'filing-table' ? 'bg-ink-800 text-white border-ink-800' : 'bg-white text-ink-500 border-ink-200 hover:bg-ink-50'
          }`}>
          <FileText size={12} /> Show Filing Table
        </button>
        <button onClick={() => handleTabChange('return-frequency')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
            activeTab === 'return-frequency' ? 'bg-ink-800 text-white border-ink-800' : 'bg-white text-ink-500 border-ink-200 hover:bg-ink-50'
          }`}>
          <BarChart2 size={12} /> Return Filing Frequency
        </button>
      </div>

      {activeTab === 'filing-table' && (
        <div className="flex items-center gap-2 mb-4">
          <select value={selectedFY} onChange={e => setSelectedFY(e.target.value)}
            className="text-xs border border-ink-200 rounded-lg px-2.5 py-1.5 bg-white text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
            {years.map(fy => <option key={fy} value={fy}>{fy}</option>)}
          </select>
          <button onClick={() => fetchData('filing-table', selectedFY)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {loading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={12} />}
            {loading ? 'Fetching…' : 'Search'}
          </button>
        </div>
      )}

      {activeTab === 'return-frequency' && (
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => fetchData('return-frequency', selectedFY)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {loading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RefreshCw size={12} />}
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-3">
          <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-ink-400">
          <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Fetching from GSTN portal…
        </div>
      )}
      {!loading && activeTab === 'filing-table' && tableData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FilingTable title="GSTR-3B" entries={tableData.gstr3b} />
          <FilingTable title="GSTR-1 / IFF" entries={tableData.gstr1} />
        </div>
      )}
      {!loading && activeTab === 'return-frequency' && freqData && (
        <FrequencyTable rows={freqData} />
      )}
      {!loading && !error && (
        activeTab === 'filing-table' && !tableData ? (
          <p className="text-xs text-ink-400 text-center py-6">Select a year and click Search.</p>
        ) : activeTab === 'return-frequency' && !freqData ? (
          <p className="text-xs text-ink-400 text-center py-6">Click Refresh to load frequency data.</p>
        ) : null
      )}
    </Card>
  )
}

// ── GSTIN section ─────────────────────────────────────────────────────────────

function GstinSection({ initialGstin = '' }: { initialGstin?: string }) {
  const [phase, setPhase]                         = useState<Phase>('idle')
  const [gstin, setGSTIN]                         = useState(initialGstin)
  const [captchaText, setCaptchaText]             = useState('')
  const [captchaImg, setCaptchaImg]               = useState('')
  const [sessionId, setSessionId]                 = useState('')
  const [result, setResult]                       = useState<GSTNTaxpayer | null>(null)
  const [errorMsg, setErrorMsg]                   = useState('')
  const [filingSessionId, setFilingSessionId]     = useState<string | null>(null)
  const [initialFilingData, setInitialFilingData] = useState<GSTFilingData | null>(null)

  const validation  = validateGSTIN(gstin)
  const parts       = validation.valid ? parseGSTIN(gstin) : null
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!validation.valid) return
    if (phase === 'captcha-loading' || phase === 'ready' || phase === 'verifying') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadCaptcha(gstin), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gstin, validation.valid])

  async function loadCaptcha(val: string) {
    setPhase('captcha-loading'); setCaptchaText(''); setResult(null)
    setFilingSessionId(null); setInitialFilingData(null); setErrorMsg('')
    try {
      const data = await gst.getCaptcha(val.trim().toUpperCase())
      setCaptchaImg(data.captcha); setSessionId(data.sessionId); setPhase('ready')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load captcha'); setPhase('error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!captchaText.trim() || phase !== 'ready') return
    setPhase('verifying')
    try {
      const data = await gst.verify(sessionId, captchaText.trim())
      setResult(data)
      if (data.filingSessionId) {
        setFilingSessionId(data.filingSessionId)
        setInitialFilingData(data.filing ?? null)
      }
      setPhase('result')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed'); setPhase('result')
    }
  }

  function handleReset() {
    setGSTIN(''); setCaptchaText(''); setCaptchaImg(''); setSessionId('')
    setResult(null); setFilingSessionId(null); setInitialFilingData(null)
    setErrorMsg(''); setPhase('idle')
  }

  const isLoading = phase === 'captcha-loading' || phase === 'verifying'

  return (
    <div className="space-y-5">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input label="GSTIN" value={gstin}
              onChange={e => {
                const v = e.target.value.toUpperCase()
                setGSTIN(v)
                if (phase !== 'idle') { setCaptchaImg(''); setSessionId(''); setCaptchaText(''); setPhase('idle') }
              }}
              placeholder="e.g. 06ABBDW4182K1ZD" maxLength={15}
              className="font-mono tracking-wider" disabled={isLoading}
              error={gstin.length > 0 && !validation.valid && validation.message ? validation.message : undefined}
            />
            {parts && (
              <p className="mt-1.5 text-xs text-brand-600 font-medium flex items-center gap-1">
                <MapPin size={11} /> {parts.stateName} · PAN: {parts.pan}
              </p>
            )}
          </div>

          {(phase !== 'idle' || captchaImg) && (
            <div>
              <p className="label-base mb-2">Captcha</p>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-36 h-12 rounded-xl border border-ink-200 bg-ink-50 overflow-hidden flex items-center justify-center">
                  {phase === 'captcha-loading'
                    ? <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                    : captchaImg
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={captchaImg} alt="Captcha" className="w-full h-full object-contain" />
                    : <span className="text-xs text-ink-400">—</span>}
                </div>
                <div className="flex-1">
                  <Input value={captchaText} onChange={e => setCaptchaText(e.target.value)}
                    placeholder="Enter captcha text" disabled={phase !== 'ready'} className="font-mono" />
                </div>
                <button type="button" onClick={() => { if (validation.valid) loadCaptcha(gstin) }}
                  disabled={isLoading || !validation.valid} title="Refresh captcha"
                  className="flex-shrink-0 w-10 h-10 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 flex items-center justify-center transition-colors disabled:opacity-40">
                  <RefreshCw size={15} className={`text-ink-500 ${phase === 'captcha-loading' ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {phase === 'captcha-loading' && (
                <p className="mt-2 text-xs text-ink-400 flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-ink-300 border-t-transparent rounded-full animate-spin" />
                  Opening GST portal and filling your GSTIN…
                </p>
              )}
            </div>
          )}

          {(phase === 'ready' || phase === 'verifying') && (
            <button type="submit" disabled={!captchaText.trim() || phase !== 'ready'}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {phase === 'verifying'
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking GSTN…</>
                : <><Search size={16} /> Check GSTIN</>}
            </button>
          )}
        </form>
      </Card>

      {phase === 'result' && result && (
        <div className="space-y-4 animate-fade-up">
          {result.gstin && result.sts ? (
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
                  <DetailRow icon={<MapPin size={14} />} label="State Jurisdiction" value={result.stj} />
                  <DetailRow icon={<MapPin size={14} />} label="Registered Address" value={result.pradr?.adr} />
                  <DetailRow icon={<Tag size={14} />}    label="e-Invoice Status"   value={result.einvoiceStatus} />
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

              {result.bzsdtls && result.bzsdtls.length > 0 && (
                <Card padding="sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Goods &amp; Services (SAC/HSN)</p>
                  <div className="divide-y divide-ink-50">
                    {result.bzsdtls.map(item => (
                      <div key={item.saccd} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                        <span className="font-mono text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-md flex-shrink-0">{item.saccd}</span>
                        <span className="text-sm text-ink-800 capitalize">{item.sdes.toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {filingSessionId && (
                <FilingSection filingSessionId={filingSessionId} initialData={initialFilingData} />
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
                  {(result.msg ?? result.message)?.toLowerCase().includes('captcha') ? 'Incorrect captcha' : 'GSTIN not found'}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  {(result.msg ?? result.message)?.toLowerCase().includes('captcha')
                    ? 'The captcha was wrong. Please refresh and try a new one.'
                    : (result.msg ?? result.message) || 'No taxpayer is registered with this GSTIN.'}
                </p>
              </div>
            </div>
          )}
          <button onClick={handleReset} className="btn-secondary w-full flex items-center justify-center gap-2">
            <RefreshCw size={15} /> Check another GSTIN
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Could not connect to GSTN portal</p>
            <p className="text-red-600 text-xs mt-0.5">{errorMsg}</p>
            <button onClick={() => { if (validation.valid) loadCaptcha(gstin) }}
              className="mt-2 text-xs text-red-700 font-medium underline underline-offset-2">Try again</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PAN section ───────────────────────────────────────────────────────────────

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/

function validatePAN(value: string) {
  if (!value) return { valid: false }
  if (value.length < 10) return { valid: false, message: 'PAN must be 10 characters' }
  if (!PAN_RE.test(value)) return { valid: false, message: 'Invalid PAN format (e.g. ABBDW4182K)' }
  return { valid: true }
}

function PanSection({ onSelectGstin }: { onSelectGstin: (gstin: string) => void }) {
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

  async function loadCaptcha(val: string) {
    setPhase('captcha-loading'); setCaptchaText(''); setResults(null); setErrorMsg('')
    try {
      const data = await pan.getCaptcha(val.trim().toUpperCase())
      setCaptchaImg(data.captcha); setSessionId(data.sessionId); setPhase('ready')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load captcha'); setPhase('error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!captchaText.trim() || phase !== 'ready') return
    setPhase('searching')
    try {
      const data = await pan.search(sessionId, captchaText.trim())
      setResults(data.results); setPhase('result')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Search failed'); setPhase('result')
    }
  }

  function handleReset() {
    setPanValue(''); setCaptchaText(''); setCaptchaImg(''); setSessionId('')
    setResults(null); setErrorMsg(''); setPhase('idle')
  }

  const isLoading = phase === 'captcha-loading' || phase === 'searching'

  return (
    <div className="space-y-5">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input label="PAN" value={panValue}
              onChange={e => {
                const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
                setPanValue(v)
                if (phase !== 'idle') { setCaptchaImg(''); setSessionId(''); setCaptchaText(''); setPhase('idle') }
              }}
              placeholder="e.g. ABBDW4182K" maxLength={10}
              className="font-mono tracking-widest" disabled={isLoading}
              error={panValue.length > 0 && !validation.valid && validation.message ? validation.message : undefined}
            />
            <p className="mt-1 text-xs text-ink-400">Enter a 10-character PAN to find all linked GST registrations</p>
          </div>

          {(phase !== 'idle' || captchaImg) && (
            <div>
              <p className="label-base mb-2">Captcha</p>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-36 h-12 rounded-xl border border-ink-200 bg-ink-50 overflow-hidden flex items-center justify-center">
                  {phase === 'captcha-loading'
                    ? <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                    : captchaImg
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={captchaImg} alt="Captcha" className="w-full h-full object-contain" />
                    : <span className="text-xs text-ink-400">—</span>}
                </div>
                <div className="flex-1">
                  <Input value={captchaText} onChange={e => setCaptchaText(e.target.value)}
                    placeholder="Enter captcha text" disabled={phase !== 'ready'} className="font-mono" />
                </div>
                <button type="button" onClick={() => { if (validation.valid) loadCaptcha(panValue) }}
                  disabled={isLoading || !validation.valid} title="Refresh captcha"
                  className="flex-shrink-0 w-10 h-10 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 flex items-center justify-center transition-colors disabled:opacity-40">
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
            <button type="submit" disabled={!captchaText.trim() || phase !== 'ready'}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {phase === 'searching'
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Searching…</>
                : <><Search size={16} /> Find GSTINs by PAN</>}
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
                      <tr key={i}
                        onClick={() => onSelectGstin(r.gstin)}
                        title="Click to check this GSTIN"
                        className="border-b border-ink-50 last:border-0 hover:bg-brand-50/60 cursor-pointer group">
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5 font-mono font-medium text-ink-800 group-hover:text-brand-700">
                            {r.gstin}
                            <Hash size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                          </span>
                        </td>
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
                  {errorMsg.toLowerCase().includes('captcha') ? 'The captcha was wrong. Please refresh and try a new one.' : errorMsg}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">No GSTINs found</p>
                <p className="text-amber-700 text-xs mt-1">No registrations are linked to PAN {panValue}.</p>
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
            <button onClick={() => { if (validation.valid) loadCaptcha(panValue) }}
              className="mt-2 text-xs text-red-700 font-medium underline underline-offset-2">Try again</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

type Mode = 'gstin' | 'pan'

export function GSTNumberChecker() {
  const [mode, setMode]               = useState<Mode>('gstin')
  const [selectedGstin, setSelected]  = useState('')

  function handleSelectGstin(gstin: string) {
    setSelected(gstin)
    setMode('gstin')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-ink-100 rounded-xl border border-ink-200">
        <button onClick={() => setMode('gstin')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            mode === 'gstin' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
          }`}>
          <Hash size={14} /> Check by GSTIN
        </button>
        <button onClick={() => setMode('pan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            mode === 'pan' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
          }`}>
          <CreditCard size={14} /> Check by PAN
        </button>
      </div>

      {/* Both sections stay mounted so state survives tab switches.
          GstinSection key changes only when a GSTIN is picked from PAN results,
          forcing a remount+prefill for that specific case. */}
      <div className={mode === 'gstin' ? '' : 'hidden'}>
        <GstinSection key={`gstin-${selectedGstin}`} initialGstin={selectedGstin} />
      </div>
      <div className={mode === 'pan' ? '' : 'hidden'}>
        <PanSection onSelectGstin={handleSelectGstin} />
      </div>

      <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
        <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Data is fetched live from the <strong>GSTN portal</strong>. Results reflect current registration status as recorded by the Government of India.
        </p>
      </div>
    </div>
  )
}
