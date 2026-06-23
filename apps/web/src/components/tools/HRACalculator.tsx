'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Info, RotateCcw, Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Input, Select, Card } from '@/components/ui'

// ── Constants ────────────────────────────────────────────────────────────────

const FY_OPTIONS = [
  { value: '2025-26', label: 'FY 2025-26 (Apr 2025 – Mar 2026)' },
  { value: '2024-25', label: 'FY 2024-25 (Apr 2024 – Mar 2025)' },
  { value: '2023-24', label: 'FY 2023-24 (Apr 2023 – Mar 2024)' },
]

const MONTH_NAMES = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March',
]

function getMonths(fy: string) {
  const y = parseInt(fy.split('-')[0])
  return MONTH_NAMES.map((name, i) => ({
    name, short: name.slice(0, 3),
    year: i < 9 ? y : y + 1,
  }))
}

const fmtINR = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))

const num = (v: string) => Math.max(0, parseFloat(v) || 0)

function calcMonth(basic: number, hraRcvd: number, rent: number, metro: boolean) {
  const c1 = hraRcvd
  const c2 = Math.max(0, rent - 0.1 * basic)
  const c3 = (metro ? 0.5 : 0.4) * basic
  const exemption = basic > 0 && hraRcvd > 0 && rent > 0
    ? Math.max(0, Math.min(c1, c2, c3))
    : 0
  return { c1, c2, c3, exemption, taxable: Math.max(0, hraRcvd - exemption) }
}

// ── Maximize suggestions ──────────────────────────────────────────────────────

interface HRASuggestion {
  type: 'rent' | 'basic' | 'hra_component'
  title: string
  detail: string
  monthlyGain: number
  annualGain: number
  targetMonthly?: number
  actionable: boolean
}

function getMaximizeSuggestions(
  basic: number,
  hraRcvd: number,
  rent: number,
  metro: boolean,
): HRASuggestion[] {
  if (basic === 0 || hraRcvd === 0 || rent === 0) return []
  const c1  = hraRcvd
  const c2  = Math.max(0, rent - 0.1 * basic)
  const c3  = (metro ? 0.5 : 0.4) * basic
  const pct = metro ? 0.5 : 0.4
  const pctLabel   = metro ? '50%' : '40%'
  const currentExempt = Math.min(c1, c2, c3)
  const sorted = [c1, c2, c3].sort((a, b) => a - b)
  const secondMin = sorted[1]
  const suggestions: HRASuggestion[] = []

  if (c2 === sorted[0]) {
    // Rent − 10% of basic is the bottleneck → increase rent
    const targetC2  = secondMin
    const targetRent = targetC2 + 0.1 * basic
    const addRent   = targetRent - rent
    if (addRent > 0) {
      suggestions.push({
        type: 'rent',
        title: `Increase monthly rent by ${fmtINR(addRent)} → pay ${fmtINR(targetRent)}/month`,
        detail: `New C2 = ${fmtINR(targetRent)} − 10% × ${fmtINR(basic)} = ${fmtINR(targetC2)}/month, matching the next cap (${c3 < c1 ? pctLabel + ' of Basic' : 'HRA received'}: ${fmtINR(secondMin)}/month)`,
        monthlyGain: targetC2 - currentExempt,
        annualGain:  (targetC2 - currentExempt) * 12,
        targetMonthly: targetRent,
        actionable: true,
      })
    }
  }

  if (c3 === sorted[0]) {
    // % of Basic is the bottleneck → increase basic salary
    // Solve: pct × b = rent − 0.1 × b → b(pct + 0.1) = rent → b = rent/(pct+0.1)
    const basicToMatchC2 = rent / (pct + 0.1)
    if (basicToMatchC2 > basic) {
      const newC3 = pct * basicToMatchC2
      suggestions.push({
        type: 'basic',
        title: `Increase monthly basic to ${fmtINR(basicToMatchC2)} (+${fmtINR(basicToMatchC2 - basic)}/month)`,
        detail: `New C3 = ${pctLabel} × ${fmtINR(basicToMatchC2)} = ${fmtINR(newC3)}/month, matching the Rent − 10% component at the same level`,
        monthlyGain: Math.min(c1, newC3) - currentExempt,
        annualGain:  (Math.min(c1, newC3) - currentExempt) * 12,
        targetMonthly: basicToMatchC2,
        actionable: true,
      })
    }
  }

  if (c1 === sorted[0]) {
    // HRA received from employer is the bottleneck — can't unilaterally fix
    suggestions.push({
      type: 'hra_component',
      title: 'HRA received from employer is the limiting factor',
      detail: `Your rent (C2 = ${fmtINR(c2)}/month) and basic % (C3 = ${fmtINR(c3)}/month) support more, but HRA received (${fmtINR(c1)}/month) caps the exemption. Ask your employer to restructure salary with a higher HRA component.`,
      monthlyGain: secondMin - c1,
      annualGain:  (secondMin - c1) * 12,
      actionable: false,
    })
  }

  return suggestions
}

// ── Shared result cards ───────────────────────────────────────────────────────

interface BreakdownRow {
  label: string
  formula: string
  monthly: number
  annual: number
}

function ComponentBreakdown({ rows, note }: { rows: BreakdownRow[]; note?: string }) {
  const minAnnual = Math.min(...rows.map(r => r.annual))
  return (
    <Card padding="sm">
      <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-1">
        Minimum of 3 components — which one is capping your exemption
      </p>
      {note && <p className="text-[11px] text-ink-400 mb-3">{note}</p>}
      {!note && <div className="mb-3" />}
      <div className="space-y-2">
        {rows.map((row, i) => {
          const isMin = row.annual === minAnnual
          return (
            <div key={i}
              className={`rounded-xl px-3 py-3 border ${isMin ? 'bg-brand-50 border-brand-200' : 'bg-ink-50 border-ink-100'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className={`text-sm font-semibold ${isMin ? 'text-brand-800' : 'text-ink-700'}`}>
                      {row.label}
                    </p>
                    {isMin && (
                      <span className="text-[10px] font-bold text-white bg-brand-500 px-2 py-0.5 rounded-full shrink-0">
                        CAP — exemption limited here
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-mono leading-relaxed ${isMin ? 'text-brand-600' : 'text-ink-400'}`}>
                    {row.formula}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`text-sm font-bold ${isMin ? 'text-brand-700' : 'text-ink-600'}`}>
                    {fmtINR(row.annual)}
                  </p>
                  <p className="text-[11px] text-ink-400">{fmtINR(row.monthly)}/mo</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function SuggestionCards({ suggestions }: { suggestions: HRASuggestion[] }) {
  if (suggestions.length === 0) return null
  return (
    <Card padding="sm">
      <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">
        How to maximize your exemption
      </p>
      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <div key={i}
            className={`rounded-xl border px-4 py-3 ${s.actionable ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className={`text-sm font-semibold mb-1 ${s.actionable ? 'text-green-800' : 'text-amber-800'}`}>
                  {s.type === 'rent'          && '🏠 '}
                  {s.type === 'basic'         && '💼 '}
                  {s.type === 'hra_component' && '📋 '}
                  {s.title}
                </p>
                <p className={`text-xs leading-relaxed ${s.actionable ? 'text-green-700' : 'text-amber-700'}`}>
                  {s.detail}
                </p>
              </div>
              {s.annualGain > 0 && (
                <div className={`text-right shrink-0 rounded-lg px-2 py-1.5 ${s.actionable ? 'bg-green-100' : 'bg-amber-100'}`}>
                  <p className={`text-xs font-bold ${s.actionable ? 'text-green-700' : 'text-amber-700'}`}>
                    +{fmtINR(s.annualGain)}/yr
                  </p>
                  <p className={`text-[11px] ${s.actionable ? 'text-green-600' : 'text-amber-600'}`}>
                    +{fmtINR(s.monthlyGain)}/mo
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function CellInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative inline-flex items-center">
      <span className="absolute left-3 text-ink-400 text-xs pointer-events-none select-none">₹</span>
      <input
        type="number" min="0" value={value}
        onChange={e => onChange(e.target.value)}
        className="w-32 pl-6 pr-2 py-1.5 text-sm border border-ink-200 rounded-lg
          focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100
          bg-white transition-colors hover:border-ink-300 appearance-none"
        placeholder="0"
      />
    </div>
  )
}

// Toggle for "enter as monthly" vs "enter as yearly" — used in yearly input mode
function FreqToggle({
  value, onChange,
}: {
  value: 'monthly' | 'yearly'
  onChange: (v: 'monthly' | 'yearly') => void
}) {
  return (
    <div className="flex rounded-lg border border-ink-200 overflow-hidden w-fit">
      {(['monthly', 'yearly'] as const).map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1 text-xs font-medium transition-all capitalize ${
            value === opt ? 'bg-ink-700 text-white' : 'bg-white text-ink-500 hover:bg-ink-50'
          }`}
        >
          {opt === 'monthly' ? 'Per month' : 'Per year'}
        </button>
      ))}
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function HRACalculator() {
  const [fy, setFy]               = useState('2025-26')
  const [employeeName, setName]   = useState('')
  const [dlOpen, setDlOpen]       = useState(false)
  const dlRef                     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dlRef.current && !dlRef.current.contains(e.target as Node)) setDlOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const [basicSalary, setBasic] = useState('')
  const [metro, setMetro]       = useState(true)
  const [inputMode, setMode]    = useState<'monthly' | 'yearly'>('monthly')
  const [view, setView]         = useState<'monthly' | 'annual'>('monthly')

  // ── Monthly mode state ────────────────────────────────────────────────────
  const [basics, setBasics]           = useState<string[]>(Array(12).fill(''))
  const [defaultHRA, setDefaultHRA]   = useState('')
  const [hras, setHras]               = useState<string[]>(Array(12).fill(''))
  const [defaultRent, setDefaultRent] = useState('')
  const [rents, setRents]             = useState<string[]>(Array(12).fill(''))

  // ── Yearly mode state ─────────────────────────────────────────────────────
  const [hraAmount, setHRAAmount] = useState('')
  const [hraFreq, setHRAFreq]     = useState<'monthly' | 'yearly'>('yearly')
  const [rentAmount, setRentAmt]  = useState('')
  const [rentFreq, setRentFreq]   = useState<'monthly' | 'yearly'>('yearly')

  // Derived effective monthly values for yearly mode
  const yearlyHRAMonthly  = hraFreq  === 'monthly' ? num(hraAmount)  : num(hraAmount)  / 12
  const yearlyRentMonthly = rentFreq === 'monthly' ? num(rentAmount) : num(rentAmount) / 12
  const yearlyHRAAnnual   = yearlyHRAMonthly  * 12
  const yearlyRentAnnual  = yearlyRentMonthly * 12

  const months = useMemo(() => getMonths(fy), [fy])
  const basic  = num(basicSalary)

  // Forward-fill helpers — monthly mode
  const applyDefaultBasic = (v: string) => { setBasic(v); setBasics(Array(12).fill(v)) }
  const setMonthBasic     = (idx: number, v: string) =>
    setBasics(prev => prev.map((x, i)  => i >= idx ? v : x))
  const applyDefaultHRA   = (v: string) => { setDefaultHRA(v);  setHras(Array(12).fill(v)) }
  const applyDefaultRent  = (v: string) => { setDefaultRent(v); setRents(Array(12).fill(v)) }
  const setMonthHRA       = (idx: number, v: string) =>
    setHras(prev  => prev.map((x, i)  => i >= idx ? v : x))
  const setMonthRent      = (idx: number, v: string) =>
    setRents(prev => prev.map((x, i)  => i >= idx ? v : x))

  const resetAll = () => {
    setBasic(''); setBasics(Array(12).fill(''))
    setDefaultHRA(''); setHras(Array(12).fill(''))
    setDefaultRent(''); setRents(Array(12).fill(''))
    setHRAAmount(''); setRentAmt('')
  }

  // Effective per-month arrays
  const effectiveBasics = useMemo<number[]>(() =>
    inputMode === 'yearly' ? Array(12).fill(basic) : basics.map(num),
    [inputMode, basic, basics],
  )
  const effectiveHRAs = useMemo<number[]>(() =>
    inputMode === 'yearly' ? Array(12).fill(yearlyHRAMonthly) : hras.map(num),
    [inputMode, yearlyHRAMonthly, hras],
  )
  const effectiveRents = useMemo<number[]>(() =>
    inputMode === 'yearly' ? Array(12).fill(yearlyRentMonthly) : rents.map(num),
    [inputMode, yearlyRentMonthly, rents],
  )

  const results = useMemo(
    () => effectiveHRAs.map((h, i) => calcMonth(effectiveBasics[i], h, effectiveRents[i], metro)),
    [effectiveHRAs, effectiveRents, effectiveBasics, metro],
  )

  const totals = useMemo(() => ({
    rent:      effectiveRents.reduce((s, r) => s + r, 0),
    hra:       effectiveHRAs.reduce((s, h) => s + h,  0),
    basic:     effectiveBasics.reduce((s, b) => s + b, 0),
    exemption: results.reduce((s, r) => s + r.exemption, 0),
    taxable:   results.reduce((s, r) => s + r.taxable,   0),
  }), [effectiveRents, effectiveHRAs, effectiveBasics, results])

  const hasAnyData = effectiveBasics.some(b => b > 0) && effectiveHRAs.some(h => h > 0)

  // In yearly mode, use one representative month for 3-component breakdown
  const repResult = inputMode === 'yearly'
    ? calcMonth(basic, yearlyHRAMonthly, yearlyRentMonthly, metro)
    : null

  // For monthly mode analysis — averages across all 12 months
  const monthlyAvgRows = useMemo<BreakdownRow[]>(() => {
    if (!hasAnyData) return []
    const pctLabel  = metro ? '50%' : '40%'
    const avgBasic  = totals.basic / 12
    const avgHRA    = totals.hra   / 12
    const avgRent   = totals.rent  / 12
    const c2Avg     = results.reduce((s, r) => s + r.c2, 0) / 12
    const c3Val     = (metro ? 0.5 : 0.4) * avgBasic
    return [
      {
        label:   'Actual HRA received',
        formula: `avg ${fmtINR(avgHRA)}/month`,
        monthly: avgHRA,
        annual:  totals.hra,
      },
      {
        label:   `${pctLabel} of Basic Salary`,
        formula: `${pctLabel} × avg ${fmtINR(avgBasic)}/month = ${fmtINR(c3Val)}/month`,
        monthly: c3Val,
        annual:  c3Val * 12,
      },
      {
        label:   'Rent paid − 10% of Basic',
        formula: `avg ${fmtINR(avgRent)} − 10% × avg ${fmtINR(avgBasic)} = ${fmtINR(avgRent)} − ${fmtINR(avgBasic * 0.1)} = avg ${fmtINR(c2Avg)}/month`,
        monthly: c2Avg,
        annual:  c2Avg * 12,
      },
    ]
  }, [hasAnyData, metro, totals, results])

  // ── Downloads ─────────────────────────────────────────────────────────────

  const downloadPDF = () => {
    const title  = employeeName ? `HRA Exemption Statement — ${employeeName}` : 'HRA Exemption Statement'
    const fyLabel = `FY ${fy}`
    const cityLabel = metro ? 'Metro city (50% of Basic)' : 'Non-Metro city (40% of Basic)'
    const pct = metro ? 0.5 : 0.4

    const summaryRows = inputMode === 'monthly'
      ? months.map((m, idx) => `
        <tr>
          <td>${m.name} ${m.year}</td>
          <td class="num">${fmtINR(effectiveBasics[idx])}</td>
          <td class="num">${fmtINR(effectiveHRAs[idx])}</td>
          <td class="num">${fmtINR(effectiveRents[idx])}</td>
          <td class="num">${fmtINR(results[idx].c2 < 0 ? 0 : results[idx].c2)}</td>
          <td class="num">${fmtINR(pct * effectiveBasics[idx])}</td>
          <td class="num exempt">${fmtINR(results[idx].exemption)}</td>
          <td class="num">${fmtINR(results[idx].taxable)}</td>
        </tr>`).join('')
      : `<tr>
          <td>Annual (FY ${fy})</td>
          <td class="num">${fmtINR(totals.basic)}</td>
          <td class="num">${fmtINR(totals.hra)}</td>
          <td class="num">${fmtINR(totals.rent)}</td>
          <td class="num">—</td>
          <td class="num">—</td>
          <td class="num exempt">${fmtINR(totals.exemption)}</td>
          <td class="num">${fmtINR(totals.taxable)}</td>
        </tr>`

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 28px 32px; }
  .header { border-bottom: 2px solid #0d9488; padding-bottom: 14px; margin-bottom: 20px; }
  .header h1 { font-size: 20px; font-weight: 700; color: #0d9488; margin-bottom: 4px; }
  .header .meta { font-size: 11px; color: #6b7280; display: flex; gap: 24px; flex-wrap: wrap; }
  .header .meta span { display: flex; align-items: center; gap: 4px; }
  .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; }
  .card.accent { border-color: #99f6e4; background: #f0fdfa; }
  .card .label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .card .value { font-size: 18px; font-weight: 700; color: #111827; }
  .card.accent .value { color: #0d9488; }
  .card .sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #f9fafb; border: 1px solid #e5e7eb; padding: 7px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
  td { border: 1px solid #e5e7eb; padding: 7px 10px; vertical-align: middle; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.exempt { font-weight: 700; color: #0d9488; }
  tfoot td { font-weight: 700; background: #f9fafb; }
  .formula-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; background: #f9fafb; }
  .formula-box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; }
  .formula-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 6px; font-size: 11px; }
  .formula-row .bullet { width: 6px; height: 6px; border-radius: 50%; background: #0d9488; flex-shrink: 0; margin-top: 3px; }
  .suggestions { margin-bottom: 20px; }
  .suggestions h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 10px; }
  .suggestion-card { border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .suggestion-card.actionable { border: 1px solid #bbf7d0; background: #f0fdf4; }
  .suggestion-card.info { border: 1px solid #fde68a; background: #fffbeb; }
  .suggestion-card .s-title { font-size: 12px; font-weight: 700; margin-bottom: 3px; }
  .suggestion-card.actionable .s-title { color: #166534; }
  .suggestion-card.info .s-title { color: #92400e; }
  .suggestion-card .s-detail { font-size: 11px; line-height: 1.5; }
  .suggestion-card.actionable .s-detail { color: #15803d; }
  .suggestion-card.info .s-detail { color: #b45309; }
  .suggestion-card .s-gain { text-align: right; flex-shrink: 0; border-radius: 6px; padding: 6px 10px; }
  .suggestion-card.actionable .s-gain { background: #dcfce7; }
  .suggestion-card.info .s-gain { background: #fef3c7; }
  .suggestion-card .s-gain-val { font-size: 13px; font-weight: 700; }
  .suggestion-card.actionable .s-gain-val { color: #15803d; }
  .suggestion-card.info .s-gain-val { color: #b45309; }
  .suggestion-card .s-gain-sub { font-size: 10px; }
  .suggestion-card.actionable .s-gain-sub { color: #16a34a; }
  .suggestion-card.info .s-gain-sub { color: #d97706; }
  .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
  @media print { body { padding: 16px; } }
</style></head><body>

<div class="header">
  <h1>${title}</h1>
  <div class="meta">
    <span>📅 Financial Year: <strong>${fyLabel}</strong></span>
    <span>🏙 City: <strong>${cityLabel}</strong></span>
    <span>📋 Mode: <strong>${inputMode === 'monthly' ? 'Month-wise entry' : 'Annual entry'}</strong></span>
    <span>🗓 Generated: <strong>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
  </div>
</div>

<div class="summary-cards">
  ${[
    { label: 'Annual Basic',       value: fmtINR(totals.basic),     accent: false, sub: `Avg ${fmtINR(totals.basic/12)}/month` },
    { label: 'HRA Received',       value: fmtINR(totals.hra),       accent: false, sub: `Avg ${fmtINR(totals.hra/12)}/month` },
    { label: 'HRA Exempt',         value: fmtINR(totals.exemption), accent: true,  sub: `${totals.hra > 0 ? Math.round(totals.exemption/totals.hra*100) : 0}% of HRA tax-free` },
    { label: 'Taxable HRA',        value: fmtINR(totals.taxable),   accent: false, sub: `Included in gross salary` },
  ].map(c => `<div class="card ${c.accent ? 'accent' : ''}">
    <div class="label">${c.label}</div>
    <div class="value">${c.value}</div>
    <div class="sub">${c.sub}</div>
  </div>`).join('')}
</div>

<table>
  <thead>
    <tr>
      <th>Month / Period</th>
      <th class="num">Basic Salary</th>
      <th class="num">HRA Received</th>
      <th class="num">Rent Paid</th>
      <th class="num">Rent − 10% Basic</th>
      <th class="num">${metro ? '50%' : '40%'} of Basic</th>
      <th class="num">HRA Exempt</th>
      <th class="num">Taxable HRA</th>
    </tr>
  </thead>
  <tbody>${summaryRows}</tbody>
  <tfoot>
    <tr>
      <td>Annual Total</td>
      <td class="num">${fmtINR(totals.basic)}</td>
      <td class="num">${fmtINR(totals.hra)}</td>
      <td class="num">${fmtINR(totals.rent)}</td>
      <td class="num">—</td><td class="num">—</td>
      <td class="num exempt">${fmtINR(totals.exemption)}</td>
      <td class="num">${fmtINR(totals.taxable)}</td>
    </tr>
  </tfoot>
</table>

<div class="formula-box">
  <h3>HRA Exemption Formula — Minimum of 3 components</h3>
  <div class="formula-row"><div class="bullet"></div><span><strong>Component 1 — Actual HRA received:</strong> ${fmtINR(totals.hra/12)}/month (annual: ${fmtINR(totals.hra)})</span></div>
  <div class="formula-row"><div class="bullet"></div><span><strong>Component 2 — Rent paid − 10% of Basic:</strong> ${fmtINR(totals.rent/12)} − ${fmtINR(totals.basic/12 * 0.1)} = avg ${fmtINR(Math.max(0, totals.rent/12 - totals.basic/12 * 0.1))}/month</span></div>
  <div class="formula-row"><div class="bullet"></div><span><strong>Component 3 — ${metro ? '50%' : '40%'} of Basic:</strong> ${metro ? '50%' : '40%'} × ${fmtINR(totals.basic/12)} = ${fmtINR(pct * totals.basic/12)}/month</span></div>
  <div class="formula-row" style="margin-top:8px; font-weight:600; color:#0d9488;">
    <div class="bullet"></div>
    <span>Exempt = Min(C1, C2, C3) = ${fmtINR(totals.exemption/12)}/month → Annual: ${fmtINR(totals.exemption)}</span>
  </div>
</div>

${(() => {
  const avgBasic = totals.basic / 12
  const avgHRA   = totals.hra   / 12
  const avgRent  = totals.rent  / 12
  const suggs = getMaximizeSuggestions(avgBasic, avgHRA, avgRent, metro)
  if (suggs.length === 0) return ''
  const cards = suggs.map(s => `
    <div class="suggestion-card ${s.actionable ? 'actionable' : 'info'}">
      <div>
        <div class="s-title">${s.type === 'rent' ? '🏠 ' : s.type === 'basic' ? '💼 ' : '📋 '}${s.title}</div>
        <div class="s-detail">${s.detail}</div>
      </div>
      ${s.annualGain > 0 ? `
      <div class="s-gain">
        <div class="s-gain-val">+${fmtINR(s.annualGain)}/yr</div>
        <div class="s-gain-sub">+${fmtINR(s.monthlyGain)}/mo</div>
      </div>` : ''}
    </div>`).join('')
  return `<div class="suggestions"><h3>How to Maximize Your Exemption</h3>${cards}</div>`
})()}

<div class="footer">
  Generated by Conceptra HRA Exemption Calculator. For reference only — verify figures with your employer and CA before ITR filing.
</div>
</body></html>`

    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 500)
  }

  const downloadExcel = () => {
    const fyLabel  = `FY ${fy}`
    const city     = metro ? 'Metro (50%)' : 'Non-Metro (40%)'
    const pct      = metro ? 0.5 : 0.4
    const wb       = XLSX.utils.book_new()

    // ── Sheet 1: Month-wise breakdown ──────────────────────────────────────
    const rows: (string | number)[][] = []
    rows.push(['HRA Exemption Statement'])
    rows.push([employeeName ? `Employee: ${employeeName}` : ''])
    rows.push([`Financial Year: ${fyLabel}`, '', `City: ${city}`])
    rows.push([`Generated: ${new Date().toLocaleDateString('en-IN')}`])
    rows.push([])
    rows.push(['Summary'])
    rows.push(['Annual Basic Salary',      totals.basic])
    rows.push(['Annual HRA Received',      totals.hra])
    rows.push(['Annual Rent Paid',         totals.rent])
    rows.push(['HRA Exempt (Annual)',      totals.exemption])
    rows.push(['Taxable HRA (Annual)',     totals.taxable])
    rows.push([])
    rows.push([
      'Month', 'Year', 'Basic Salary', 'HRA Received', 'Rent Paid',
      'Component 1 (HRA)', `Component 2 (Rent−10%Basic)`, `Component 3 (${metro ? '50%' : '40%'} Basic)`,
      'HRA Exempt', 'Taxable HRA',
    ])

    months.forEach((m, idx) => {
      const b   = effectiveBasics[idx]
      const h   = effectiveHRAs[idx]
      const r   = effectiveRents[idx]
      const c2  = Math.max(0, r - 0.1 * b)
      const c3  = pct * b
      rows.push([m.name, m.year, b, h, r, h, c2, c3, results[idx].exemption, results[idx].taxable])
    })

    rows.push([])
    rows.push(['Annual Total', '', totals.basic, totals.hra, totals.rent, '', '', '', totals.exemption, totals.taxable])

    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
      { wch: 14 }, { wch: 6 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
      { wch: 18 }, { wch: 24 }, { wch: 20 }, { wch: 14 }, { wch: 14 },
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'HRA Breakdown')

    // ── Sheet 2: Formula reference ─────────────────────────────────────────
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['HRA Exemption Formula'],
      [],
      ['HRA exemption = Minimum of the following 3 components:'],
      [],
      ['Component', 'Formula', 'Annual Value'],
      ['1 — Actual HRA Received',       'As paid by employer',                        totals.hra],
      ['2 — Rent paid − 10% of Basic',  `Rent − 10% × Basic`,                         Math.max(0, totals.rent - 0.1 * totals.basic)],
      [`3 — ${metro ? '50%' : '40%'} of Basic`, `${metro ? '50' : '40'}% × Basic`,    pct * totals.basic],
      [],
      ['Exempt (Minimum of C1, C2, C3)', '',                                           totals.exemption],
      ['Taxable HRA',                    'HRA Received − Exempt',                      totals.taxable],
      [],
      ['Notes'],
      ['Metro cities (50%): Mumbai, Delhi, Kolkata, Chennai'],
      ['Non-metro cities (40%): All other cities'],
      ['Only applicable under Old Tax Regime'],
      ['Verify with your employer / CA before filing ITR'],
    ])
    ws2['!cols'] = [{ wch: 34 }, { wch: 28 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Formula Reference')

    const filename = employeeName
      ? `HRA_${employeeName.replace(/\s+/g, '_')}_${fy}.xlsx`
      : `HRA_Exemption_${fy}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Top inputs ── */}
      <Card>
        <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-4">Salary Details</p>
        <div className="mb-4">
          <Input
            label="Employee / Taxpayer Name"
            placeholder="e.g. Rahul Sharma (appears on PDF & Excel)"
            value={employeeName}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <Select label="Financial Year" value={fy} options={FY_OPTIONS} onChange={e => setFy(e.target.value)} />
          <div>
            <p className="label-base mb-2">City Type</p>
            <div className="flex gap-2 h-[42px]">
              {[{ label: 'Metro (50%)', val: true }, { label: 'Non-Metro (40%)', val: false }].map(opt => (
                <button key={String(opt.val)} onClick={() => setMetro(opt.val)}
                  className={`flex-1 rounded-xl border text-xs font-medium transition-all ${
                    metro === opt.val
                      ? 'border-brand-300 bg-brand-50 text-brand-800'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input mode toggle */}
        <div className="pt-4 border-t border-ink-100">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Input Mode</p>
            <div className="flex rounded-xl border border-ink-200 overflow-hidden">
              {([{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }] as const).map(opt => (
                <button key={opt.value} onClick={() => setMode(opt.value)}
                  className={`px-4 py-1.5 text-xs font-semibold transition-all ${
                    inputMode === opt.value ? 'bg-brand-500 text-white' : 'bg-white text-ink-500 hover:bg-ink-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={resetAll}
              className="ml-auto flex items-center gap-1.5 text-xs text-ink-400 hover:text-red-500 transition-colors"
            >
              <RotateCcw size={12} /> Reset all
            </button>
          </div>

          {/* Basic salary — always shown here regardless of mode */}
          <div className="mb-4">
            <Input
              label="Monthly Basic Salary" prefix="₹" type="number" min="0"
              value={basicSalary} onChange={e => applyDefaultBasic(e.target.value)} placeholder="e.g. 50000"
            />
          </div>

          {/* Monthly mode defaults */}
          {inputMode === 'monthly' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Default Monthly HRA Received" prefix="₹" type="number" min="0"
                  value={defaultHRA} onChange={e => applyDefaultHRA(e.target.value)} placeholder="e.g. 20000"
                />
                <p className="mt-1 text-xs text-ink-400">Fills all 12 months — override any month in the table below.</p>
              </div>
              <div>
                <Input
                  label="Default Monthly Rent Paid" prefix="₹" type="number" min="0"
                  value={defaultRent} onChange={e => applyDefaultRent(e.target.value)} placeholder="e.g. 15000"
                />
                <p className="mt-1 text-xs text-ink-400">Fills all 12 months — override any month in the table below.</p>
              </div>
            </div>
          )}

          {/* Yearly mode inputs — each field has its own per-month / per-year toggle */}
          {inputMode === 'yearly' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* HRA field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="label-base">HRA Received</p>
                  <FreqToggle value={hraFreq} onChange={setHRAFreq} />
                </div>
                <Input
                  prefix="₹" type="number" min="0"
                  value={hraAmount} onChange={e => setHRAAmount(e.target.value)}
                  placeholder={hraFreq === 'monthly' ? 'e.g. 3000' : 'e.g. 36000'}
                />
                {num(hraAmount) > 0 && (
                  <p className="text-xs text-ink-500">
                    {hraFreq === 'monthly'
                      ? <>Monthly: <strong className="text-ink-700">{fmtINR(num(hraAmount))}</strong> &nbsp;·&nbsp; Annual: <strong className="text-ink-700">{fmtINR(yearlyHRAAnnual)}</strong></>
                      : <>Annual: <strong className="text-ink-700">{fmtINR(num(hraAmount))}</strong> &nbsp;·&nbsp; Monthly: <strong className="text-ink-700">{fmtINR(yearlyHRAMonthly)}</strong></>
                    }
                  </p>
                )}
              </div>

              {/* Rent field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="label-base">Rent Paid</p>
                  <FreqToggle value={rentFreq} onChange={setRentFreq} />
                </div>
                <Input
                  prefix="₹" type="number" min="0"
                  value={rentAmount} onChange={e => setRentAmt(e.target.value)}
                  placeholder={rentFreq === 'monthly' ? 'e.g. 10000' : 'e.g. 120000'}
                />
                {num(rentAmount) > 0 && (
                  <p className="text-xs text-ink-500">
                    {rentFreq === 'monthly'
                      ? <>Monthly: <strong className="text-ink-700">{fmtINR(num(rentAmount))}</strong> &nbsp;·&nbsp; Annual: <strong className="text-ink-700">{fmtINR(yearlyRentAnnual)}</strong></>
                      : <>Annual: <strong className="text-ink-700">{fmtINR(num(rentAmount))}</strong> &nbsp;·&nbsp; Monthly: <strong className="text-ink-700">{fmtINR(yearlyRentMonthly)}</strong></>
                    }
                  </p>
                )}
              </div>

            </div>
          )}
        </div>
      </Card>

      {/* ── YEARLY MODE: show result directly, no table ── */}
      {inputMode === 'yearly' && (
        hasAnyData ? (
          <>
            {/* Download dropdown */}
            <div className="flex justify-end" ref={dlRef}>
              <div className="relative">
                <button
                  onClick={() => setDlOpen(o => !o)}
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 px-4 py-2 rounded-xl transition-all shadow-sm shadow-brand-200"
                >
                  <Download size={14} /> Download <ChevronDown size={13} className={`transition-transform ${dlOpen ? 'rotate-180' : ''}`} />
                </button>
                {dlOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-ink-100 shadow-lg z-50 overflow-hidden">
                    <button onClick={() => { downloadPDF(); setDlOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 transition-colors">
                      <FileText size={15} className="text-brand-500" /> PDF
                    </button>
                    <button onClick={() => { downloadExcel(); setDlOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 transition-colors border-t border-ink-50">
                      <FileSpreadsheet size={15} className="text-emerald-500" /> Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Annual Basic',        value: totals.basic,     accent: false },
                { label: 'Annual HRA Received', value: totals.hra,       accent: false },
                { label: 'HRA Exempt',          value: totals.exemption, accent: true  },
                { label: 'Taxable HRA',         value: totals.taxable,   accent: false },
              ].map(item => (
                <Card key={item.label} className={`text-center ${item.accent ? 'border-brand-200 bg-brand-50' : ''}`}>
                  <p className={`text-xs mb-1.5 ${item.accent ? 'text-brand-500' : 'text-ink-400'}`}>
                    {item.label}
                  </p>
                  <p className={`text-2xl font-bold ${item.accent ? 'text-brand-700' : 'text-ink-700'}`}>
                    {fmtINR(item.value)}
                  </p>
                  {item.accent && totals.hra > 0 && (
                    <p className="text-xs text-brand-500 mt-1">
                      {Math.round(totals.exemption / totals.hra * 100)}% of HRA tax-free
                    </p>
                  )}
                </Card>
              ))}
            </div>

            {/* 3-component breakdown + suggestions (yearly mode) */}
            {repResult && (() => {
              const pctLabel = metro ? '50%' : '40%'
              const rows: BreakdownRow[] = [
                {
                  label:   'Actual HRA received',
                  formula: `HRA from employer = ${fmtINR(repResult.c1)}/month`,
                  monthly: repResult.c1,
                  annual:  repResult.c1 * 12,
                },
                {
                  label:   `${pctLabel} of Basic Salary`,
                  formula: `${pctLabel} × ${fmtINR(basic)} = ${fmtINR(repResult.c3)}/month`,
                  monthly: repResult.c3,
                  annual:  repResult.c3 * 12,
                },
                {
                  label:   'Rent paid − 10% of Basic',
                  formula: `${fmtINR(yearlyRentMonthly)} − 10% × ${fmtINR(basic)} = ${fmtINR(yearlyRentMonthly)} − ${fmtINR(basic * 0.1)} = ${fmtINR(repResult.c2)}/month`,
                  monthly: repResult.c2,
                  annual:  repResult.c2 * 12,
                },
              ]
              return (
                <>
                  <ComponentBreakdown rows={rows} />
                  <SuggestionCards suggestions={getMaximizeSuggestions(basic, yearlyHRAMonthly, yearlyRentMonthly, metro)} />
                </>
              )
            })()}
          </>
        ) : (
          <Card className="text-center py-12">
            <p className="text-ink-400 text-sm">Enter basic salary and HRA amount to see the result.</p>
          </Card>
        )
      )}

      {/* ── MONTHLY MODE: view toggle + table/summary ── */}
      {inputMode === 'monthly' && (
        <>
          {/* View toggle + download buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['monthly', 'annual'] as const).map(mode => (
              <button key={mode} onClick={() => setView(mode)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  view === mode
                    ? 'border-brand-300 bg-brand-50 text-brand-800'
                    : 'border-ink-200 text-ink-500 hover:border-ink-300 bg-white'
                }`}
              >
                {mode === 'monthly' ? 'Monthly Breakdown' : 'Annual Summary'}
              </button>
            ))}
            {hasAnyData && (
              <div className="ml-auto" ref={dlRef}>
                <div className="relative">
                  <button
                    onClick={() => setDlOpen(o => !o)}
                    className="flex items-center gap-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 px-4 py-2 rounded-xl transition-all shadow-sm shadow-brand-200"
                  >
                    <Download size={14} /> Download <ChevronDown size={13} className={`transition-transform ${dlOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dlOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-ink-100 shadow-lg z-50 overflow-hidden">
                      <button onClick={() => { downloadPDF(); setDlOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 transition-colors">
                        <FileText size={15} className="text-brand-500" /> PDF
                      </button>
                      <button onClick={() => { downloadExcel(); setDlOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 transition-colors border-t border-ink-50">
                        <FileSpreadsheet size={15} className="text-emerald-500" /> Excel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Monthly table */}
          {view === 'monthly' && (
            <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50/50">
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400 w-32">Month</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400 text-left">Basic Salary</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400 text-left">HRA Received</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400 text-left">Rent Paid</th>
                      <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Exempt</th>
                      <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Taxable HRA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((m, idx) => {
                      const r             = results[idx]
                      const basicChanged  = idx > 0 && basics[idx]  !== basics[idx - 1]
                      const hraChanged    = idx > 0 && hras[idx]    !== hras[idx - 1]
                      const rentChanged   = idx > 0 && rents[idx]   !== rents[idx - 1]
                      const anyChanged    = basicChanged || hraChanged || rentChanged

                      return (
                        <tr key={idx}
                          className={`border-b border-ink-50 transition-colors ${anyChanged ? 'bg-amber-50/50' : 'hover:bg-ink-50/50'}`}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${anyChanged ? 'bg-amber-400' : 'invisible'}`} />
                              <span className="font-medium text-ink-700">{m.short}</span>
                              <span className="text-ink-400 text-xs">{m.year}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              {basicChanged && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-violet-400 z-10" />}
                              <CellInput value={basics[idx]} onChange={v => setMonthBasic(idx, v)} />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              {hraChanged && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400 z-10" />}
                              <CellInput value={hras[idx]} onChange={v => setMonthHRA(idx, v)} />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              {rentChanged && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-brand-400 z-10" />}
                              <CellInput value={rents[idx]} onChange={v => setMonthRent(idx, v)} />
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-brand-700">
                            {hasAnyData && effectiveHRAs[idx] > 0 && effectiveRents[idx] > 0 ? fmtINR(r.exemption) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-ink-700">
                            {hasAnyData && effectiveHRAs[idx] > 0 ? fmtINR(r.taxable) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-ink-200 bg-ink-50">
                      <td className="px-4 py-3 font-bold text-ink-800 text-sm">Annual Total</td>
                      <td className="px-4 py-3 font-bold text-ink-700 text-sm">{totals.basic > 0 ? fmtINR(totals.basic) : '—'}</td>
                      <td className="px-4 py-3 font-bold text-ink-700 text-sm">{totals.hra > 0 ? fmtINR(totals.hra) : '—'}</td>
                      <td className="px-4 py-3 font-bold text-ink-700 text-sm">{totals.rent > 0 ? fmtINR(totals.rent) : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-brand-700 text-sm">{hasAnyData ? fmtINR(totals.exemption) : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-ink-700 text-sm">{hasAnyData ? fmtINR(totals.taxable) : '—'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-ink-100 bg-ink-50/30 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                  <p className="text-xs text-ink-400">Basic changed</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <p className="text-xs text-ink-400">HRA changed</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                  <p className="text-xs text-ink-400">Rent changed</p>
                </div>
                <p className="text-xs text-ink-400">All following months update to match when you change a value.</p>
              </div>
            </div>
          )}
          {view === 'monthly' && hasAnyData && monthlyAvgRows.length > 0 && (
            <>
              <ComponentBreakdown rows={monthlyAvgRows} note="Based on your 12-month averages" />
              <SuggestionCards suggestions={getMaximizeSuggestions(totals.basic / 12, totals.hra / 12, totals.rent / 12, metro)} />
            </>
          )}

          {/* Annual summary (monthly mode) */}
          {view === 'annual' && (
            hasAnyData ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Annual Basic',        value: totals.basic,     accent: false },
                    { label: 'Annual HRA Received', value: totals.hra,       accent: false },
                    { label: 'HRA Exempt',          value: totals.exemption, accent: true  },
                    { label: 'Taxable HRA',         value: totals.taxable,   accent: false },
                  ].map(item => (
                    <Card key={item.label} className={`text-center ${item.accent ? 'border-brand-200 bg-brand-50' : ''}`}>
                      <p className={`text-xs mb-1.5 ${item.accent ? 'text-brand-500' : 'text-ink-400'}`}>{item.label}</p>
                      <p className={`text-2xl font-bold ${item.accent ? 'text-brand-700' : 'text-ink-700'}`}>{fmtINR(item.value)}</p>
                      {item.accent && totals.hra > 0 && (
                        <p className="text-xs text-brand-500 mt-1">{Math.round(totals.exemption / totals.hra * 100)}% of HRA tax-free</p>
                      )}
                    </Card>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-ink-100 bg-ink-50/50">
                          <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Month</th>
                          <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Basic Salary</th>
                          <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">HRA Received</th>
                          <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Rent Paid</th>
                          <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Exempt HRA</th>
                          <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Taxable HRA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {months.map((m, idx) => (
                          <tr key={idx} className="border-b border-ink-50 hover:bg-ink-50/40">
                            <td className="px-5 py-2.5 text-ink-700">{m.name} {m.year}</td>
                            <td className="px-5 py-2.5 text-right text-ink-600">{fmtINR(effectiveBasics[idx])}</td>
                            <td className="px-5 py-2.5 text-right text-ink-600">{fmtINR(effectiveHRAs[idx])}</td>
                            <td className="px-5 py-2.5 text-right text-ink-600">{fmtINR(effectiveRents[idx])}</td>
                            <td className="px-5 py-2.5 text-right font-semibold text-brand-700">{fmtINR(results[idx].exemption)}</td>
                            <td className="px-5 py-2.5 text-right text-ink-700">{fmtINR(results[idx].taxable)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-ink-200 bg-ink-50">
                          <td className="px-5 py-3 font-bold text-ink-800">Total</td>
                          <td className="px-5 py-3 text-right font-bold text-ink-700">{fmtINR(totals.basic)}</td>
                          <td className="px-5 py-3 text-right font-bold text-ink-700">{fmtINR(totals.hra)}</td>
                          <td className="px-5 py-3 text-right font-bold text-ink-700">{fmtINR(totals.rent)}</td>
                          <td className="px-5 py-3 text-right font-bold text-brand-700">{fmtINR(totals.exemption)}</td>
                          <td className="px-5 py-3 text-right font-bold text-ink-700">{fmtINR(totals.taxable)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                {monthlyAvgRows.length > 0 && (
                  <>
                    <ComponentBreakdown rows={monthlyAvgRows} note="Based on your 12-month averages" />
                    <SuggestionCards suggestions={getMaximizeSuggestions(totals.basic / 12, totals.hra / 12, totals.rent / 12, metro)} />
                  </>
                )}
              </>
            ) : (
              <Card className="text-center py-12">
                <p className="text-ink-400 text-sm">Enter basic salary and HRA to see the annual summary.</p>
              </Card>
            )
          )}
        </>
      )}

      {/* ── Formula note ── */}
      {hasAnyData && (
        <Card padding="sm">
          <div className="flex gap-2">
            <Info size={14} className="text-ink-400 shrink-0 mt-0.5" />
            <div className="text-xs text-ink-500 space-y-1">
              <p>
                <strong>Exempt HRA = minimum of:</strong>&ensp;
                (1) Actual HRA received &nbsp;·&nbsp;
                (2) Rent paid − 10% of basic &nbsp;·&nbsp;
                (3) {metro ? '50%' : '40%'} of basic ({metro ? 'metro city' : 'non-metro'})
              </p>
              <p>Metro: Mumbai, Delhi, Kolkata, Chennai (50%). All others non-metro (40%). Old Regime only.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
