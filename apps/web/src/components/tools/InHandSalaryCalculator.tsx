'use client'

import { useState, useMemo } from 'react'
import { Info, AlertCircle, Download } from 'lucide-react'
import { Input, Select, Card } from '@/components/ui'
import {
  computeInHandSalary,
  EMPLOYER_PF_RATE, EMPLOYEE_PF_RATE, GRATUITY_RATE, PROF_TAX_ANNUAL,
  OLD_DED_CAPS,
  type InHandInput,
} from '@/lib/logic/in-hand-salary'
import { FY_OPTIONS, AGE_OPTIONS, type FY, type AgeGroup } from '@/lib/logic/income-tax'

const fmtINR = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))

const fmtMonthly = (annual: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(annual / 12))

const num = (v: string) => Math.max(0, parseFloat(v) || 0)

function MRow({ label, annual, highlight, sub, note }: {
  label: string; annual: number; highlight?: boolean; sub?: boolean; note?: string
}) {
  return (
    <div className={`flex justify-between items-start py-2 border-b border-ink-50 gap-2 ${sub ? 'pl-3' : ''}`}>
      <div className="min-w-0">
        <span className={`text-sm ${sub ? 'text-xs text-ink-400' : highlight ? 'font-semibold text-ink-800' : 'text-ink-600'}`}>
          {label}
        </span>
        {note && <p className="text-[11px] text-ink-400 mt-0.5">{note}</p>}
      </div>
      <span className={`tabular-nums shrink-0 ${highlight ? 'text-brand-700 font-bold text-base' : 'text-sm font-medium text-ink-700'}`}>
        {fmtMonthly(annual)}
      </span>
    </div>
  )
}

function ARow({ label, annual, highlight, sub, note }: {
  label: string; annual: number; highlight?: boolean; sub?: boolean; note?: string
}) {
  return (
    <div className={`flex justify-between items-start py-2 border-b border-ink-50 gap-2 ${sub ? 'pl-3' : ''}`}>
      <div className="min-w-0">
        <span className={`text-sm ${sub ? 'text-xs text-ink-400' : highlight ? 'font-semibold text-ink-800' : 'text-ink-600'}`}>
          {label}
        </span>
        {note && <p className="text-[11px] text-ink-400 mt-0.5">{note}</p>}
      </div>
      <span className={`tabular-nums shrink-0 ${highlight ? 'text-brand-600 font-bold text-base' : sub ? 'text-xs text-ink-400' : 'text-xs text-ink-500'}`}>
        {fmtINR(annual)}/yr
      </span>
    </div>
  )
}

function CapBadge({ used, cap, label }: { used: number; cap: number; label: string }) {
  const pct = Math.min(100, Math.round((used / cap) * 100))
  const full = used >= cap
  return (
    <div className={`mt-1.5 rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between gap-2 ${full ? 'bg-amber-50 border border-amber-200' : 'bg-ink-50 border border-ink-100'}`}>
      <span className={full ? 'text-amber-700 font-medium' : 'text-ink-500'}>
        {label}: {fmtINR(used)} / {fmtINR(cap)}
        {full && ' — cap reached'}
      </span>
      <div className="w-16 h-1.5 rounded-full bg-ink-200 overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full transition-all ${full ? 'bg-amber-400' : 'bg-brand-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function InHandSalaryCalculator() {
  const [fy, setFY]             = useState<FY>('FY2025-26')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('below60')
  const [ctc, setCtc]                     = useState('')
  const [basicPct, setBasicPct]           = useState('40')
  const [hraComponentPct, setHraPct]      = useState('50')
  const [isMetro, setIsMetro]             = useState(true)
  const [regime, setRegime]     = useState<'old' | 'new'>('new')
  const [applyPF, setApplyPF]           = useState(true)
  const [applyGratuity, setApplyGratuity] = useState(true)
  const [applyProfTax, setApplyProfTax] = useState(true)

  // Old regime deductions
  const [rentPaidMonthly, setRent]       = useState('')
  const [extraSec80C, setExtraSec80C]   = useState('')
  const [sec80D, setSec80D]             = useState('')
  const [sec80DParents, setSec80DParents] = useState('')
  const [parentsSenior, setParentsSenior] = useState(false)
  const [nps80CCD1B, setNPS]             = useState('')
  const [sec80TTA, setSec80TTA]          = useState('')
  const [otherDed, setOtherDed]          = useState('')

  const isSenior = ageGroup === 'senior' || ageGroup === 'superSenior'

  const result = useMemo(() => {
    const ctcAmt = num(ctc)
    if (ctcAmt === 0) return null
    const bPct    = Math.min(Math.max(num(basicPct), 10), 80)
    const hraPct  = Math.min(Math.max(num(hraComponentPct), 0), 100)
    const input: InHandInput = {
      fy, ageGroup,
      ctc: ctcAmt, basicPct: bPct, hraComponentPct: hraPct, isMetro, regime,
      applyPF, applyGratuity, applyProfTax,
      rentPaidMonthly: num(rentPaidMonthly),
      extraSec80C:     num(extraSec80C),
      sec80D:          num(sec80D),
      sec80DParents:   num(sec80DParents),
      parentsSenior,
      nps80CCD1B:      num(nps80CCD1B),
      sec80TTA:        num(sec80TTA),
      otherDed:        num(otherDed),
    }
    return computeInHandSalary(input)
  }, [fy, ageGroup, ctc, basicPct, hraComponentPct, isMetro, regime, applyPF, applyGratuity, applyProfTax,
      rentPaidMonthly, extraSec80C, sec80D, sec80DParents, parentsSenior,
      nps80CCD1B, sec80TTA, otherDed])

  const sec80DCap      = isSenior ? OLD_DED_CAPS.sec80DSenior       : OLD_DED_CAPS.sec80DBelow60
  const sec80DParentsCap = parentsSenior ? OLD_DED_CAPS.sec80DParentsSenior : OLD_DED_CAPS.sec80DParents
  const sec80TTACap    = isSenior ? OLD_DED_CAPS.sec80TTB            : OLD_DED_CAPS.sec80TTA

  const [employeeName, setEmployeeName] = useState('')

  const downloadPDF = () => {
    if (!result) return
    const title   = employeeName ? `In-Hand Salary Statement — ${employeeName}` : 'In-Hand Salary Statement'
    const fyLabel = FY_OPTIONS.find(o => o.value === fy)?.label ?? fy
    const ageLabel = AGE_OPTIONS.find(o => o.value === ageGroup)?.label ?? ageGroup
    const regimeLabel = regime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'

    const row = (label: string, monthly: number, annual: number, bold = false, indent = false) => `
      <tr class="${bold ? 'total-row' : ''} ${indent ? 'sub-row' : ''}">
        <td>${indent ? '&nbsp;&nbsp;&nbsp;' : ''}${label}</td>
        <td class="num">${fmtMonthly(annual)}</td>
        <td class="num">${fmtINR(annual)}</td>
      </tr>`

    const deductionRows = regime === 'old' ? `
      ${row('Standard Deduction', result.standardDeduction / 12, result.standardDeduction)}
      ${result.hraExemption > 0 ? row('HRA Exemption', result.hraExemption / 12, result.hraExemption) : ''}
      ${row(`Section 80C (EPF + investments)`, result.sec80CTotal / 12, result.sec80CTotal)}
      ${result.nps80CCD1B > 0 ? row('NPS 80CCD(1B)', result.nps80CCD1B / 12, result.nps80CCD1B) : ''}
      ${result.sec80DEffective > 0 ? row('80D Self + Family', result.sec80DEffective / 12, result.sec80DEffective) : ''}
      ${result.sec80DParentsEff > 0 ? row(`80D Parents${parentsSenior ? ' (senior)' : ''}`, result.sec80DParentsEff / 12, result.sec80DParentsEff) : ''}
      ${result.sec80TTAEffective > 0 ? row(isSenior ? '80TTB Interest Income' : '80TTA Savings Interest', result.sec80TTAEffective / 12, result.sec80TTAEffective) : ''}
      ${num(otherDed) > 0 ? row('Other Deductions', num(otherDed) / 12, num(otherDed)) : ''}
      ${row('Total Exemptions', (result.standardDeduction + result.totalOldDeductions) / 12, result.standardDeduction + result.totalOldDeductions, true)}
    ` : ''

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 28px 32px; }
  .header { border-bottom: 2px solid #0d9488; padding-bottom: 14px; margin-bottom: 20px; }
  .header h1 { font-size: 20px; font-weight: 700; color: #0d9488; margin-bottom: 6px; }
  .header .meta { font-size: 11px; color: #6b7280; display: flex; gap: 24px; flex-wrap: wrap; }
  .take-home { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 22px; }
  .th-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; text-align: center; }
  .th-card.accent { border-color: #99f6e4; background: #f0fdfa; }
  .th-card .label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .th-card .value { font-size: 22px; font-weight: 700; color: #111827; }
  .th-card.accent .value { color: #0d9488; font-size: 26px; }
  .th-card .sub { font-size: 11px; color: #6b7280; margin-top: 4px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin: 18px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; table-layout: fixed; }
  col.col-label { width: 56%; }
  col.col-monthly { width: 22%; }
  col.col-annual { width: 22%; }
  th { background: #f9fafb; border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; overflow: hidden; }
  th.num { text-align: right; }
  td { border: 1px solid #e5e7eb; padding: 6px 10px; overflow: hidden; white-space: nowrap; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tr.total-row td { font-weight: 700; background: #f9fafb; }
  tr.total-row td.num { color: #0d9488; }
  tr.sub-row td { color: #6b7280; font-size: 11px; }
  .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
  @media print { body { padding: 16px; } }
</style></head><body>

<div class="header">
  <h1>${title}</h1>
  <div class="meta">
    <span>📅 ${fyLabel}</span>
    <span>👤 ${ageLabel}</span>
    <span>📋 ${regimeLabel}</span>
    <span>🏙 ${isMetro ? 'Metro city' : 'Non-Metro city'}</span>
    <span>🗓 Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
  </div>
</div>

<div class="take-home">
  <div class="th-card accent">
    <div class="label">Monthly Take-Home</div>
    <div class="value">${fmtMonthly(result.annualTakeHome)}</div>
    <div class="sub">${fmtINR(result.annualTakeHome)}/year</div>
  </div>
  <div class="th-card">
    <div class="label">Gross Salary</div>
    <div class="value">${fmtMonthly(result.grossSalary)}</div>
    <div class="sub">${fmtINR(result.grossSalary)}/year</div>
  </div>
  <div class="th-card">
    <div class="label">Effective Tax Rate</div>
    <div class="value">${result.effectiveTaxRate.toFixed(2)}%</div>
    <div class="sub">Income tax on gross salary</div>
  </div>
</div>

<p class="section-title">Salary Structure</p>
<table>
  <colgroup><col class="col-label"/><col class="col-monthly"/><col class="col-annual"/></colgroup>
  <thead><tr><th>Component</th><th class="num">Monthly</th><th class="num">Annual</th></tr></thead>
  <tbody>
    ${row('Basic Salary', result.basic / 12, result.basic)}
    ${row('HRA', result.hra / 12, result.hra)}
    ${row('Special Allowance', result.specialAllowance / 12, result.specialAllowance)}
    ${row('Gross Salary', result.grossSalary / 12, result.grossSalary, true)}
  </tbody>
</table>

<p class="section-title">Monthly Exemptions</p>
<table>
  <colgroup><col class="col-label"/><col class="col-monthly"/><col class="col-annual"/></colgroup>
  <thead><tr><th>Component</th><th class="num">Monthly</th><th class="num">Annual</th></tr></thead>
  <tbody>
    ${row('Employee PF (12% of basic)', result.employeePF / 12, result.employeePF)}
    ${result.professionalTax > 0 ? row('Professional Tax', result.professionalTax / 12, result.professionalTax) : ''}
    ${row('Income Tax (TDS)', result.incomeTaxTDS / 12, result.incomeTaxTDS)}
    ${row('Total Deductions', result.totalDeductions / 12, result.totalDeductions, true)}
  </tbody>
</table>

${regime === 'old' ? `
<p class="section-title">Tax Exemptions (Old Regime)</p>
<table>
  <colgroup><col class="col-label"/><col class="col-monthly"/><col class="col-annual"/></colgroup>
  <thead><tr><th>Deduction</th><th class="num">Monthly</th><th class="num">Annual</th></tr></thead>
  <tbody>${deductionRows}</tbody>
</table>` : ''}

<p class="section-title">Employer Cost Breakup</p>
<table>
  <colgroup><col class="col-label"/><col class="col-monthly"/><col class="col-annual"/></colgroup>
  <thead><tr><th>Component</th><th class="num">Monthly</th><th class="num">Annual</th></tr></thead>
  <tbody>
    ${row('Gross Salary', result.grossSalary / 12, result.grossSalary)}
    ${row('Employer PF (12% of basic)', result.employerPF / 12, result.employerPF)}
    ${row('Gratuity (4.81% of basic)', result.gratuity / 12, result.gratuity)}
    ${row('Total CTC', result.ctc / 12, result.ctc, true)}
  </tbody>
</table>

<div class="footer">
  Generated by Conceptra In-Hand Salary Calculator. For reference only — actual figures may vary. Verify with your HR / CA before filing ITR.
</div>
</body></html>`

    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 500)
  }

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <Select label="Financial Year" value={fy} options={FY_OPTIONS}
              onChange={e => setFY(e.target.value as FY)} />
          </div>
          <div className="w-56">
            <Select label="Age Group" value={ageGroup} options={AGE_OPTIONS}
              onChange={e => setAgeGroup(e.target.value as AgeGroup)} />
          </div>
          <div className="flex-1 min-w-48">
            <Input label="Employee / Taxpayer Name (optional)"
              placeholder="e.g. Rahul Sharma"
              value={employeeName}
              onChange={e => setEmployeeName(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center rounded-xl border border-ink-200 overflow-hidden text-sm">
              {(['new', 'old'] as const).map(r => (
                <button key={r} onClick={() => setRegime(r)}
                  className={`px-4 py-2 font-medium capitalize transition-colors ${
                    regime === r ? 'bg-ink-900 text-white' : 'bg-white text-ink-500 hover:text-ink-700'
                  }`}>
                  {r === 'new' ? 'New Regime' : 'Old Regime'}
                </button>
              ))}
            </div>
            <button
              onClick={downloadPDF}
              disabled={!result}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 px-4 py-2 rounded-xl transition-all shadow-sm shadow-brand-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_540px] gap-6 items-start">
        {/* ── Inputs ── */}
        <div className="space-y-5">

          {/* CTC + basic + city */}
          <Card>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-4">Salary Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Input label="Annual CTC" prefix="₹" type="number" min="0"
                  placeholder="e.g. 12,00,000" value={ctc}
                  onChange={e => setCtc(e.target.value)} />
                <p className="mt-1 text-xs text-ink-400">Total Cost to Company (annual)</p>
              </div>
              <div>
                <Input label="Basic Salary %" suffix="%" type="number" min="10" max="80"
                  placeholder="40" value={basicPct}
                  onChange={e => setBasicPct(e.target.value)} />
                <p className="mt-1 text-xs text-ink-400">% of CTC. Typically 40–50%.</p>
              </div>
              <div>
                <Input label="HRA % of Basic" suffix="%" type="number" min="0" max="100"
                  placeholder={isMetro ? '50' : '40'} value={hraComponentPct}
                  onChange={e => setHraPct(e.target.value)} />
                <p className="mt-1 text-xs text-ink-400">
                  Employer-paid HRA as % of basic. Standard: {isMetro ? '50%' : '40%'}.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="label-base mb-2">City Type <span className="text-ink-400 font-normal">(affects HRA exemption limit)</span></p>
              <div className="flex gap-3">
                {([true, false] as const).map(metro => (
                  <button key={String(metro)}
                    onClick={() => { setIsMetro(metro); setHraPct(metro ? '50' : '40') }}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                      isMetro === metro
                        ? 'border-brand-300 bg-brand-50 text-brand-800'
                        : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                    }`}>
                    {metro ? 'Metro (50% cap)' : 'Non-Metro (40% cap)'}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Old regime deductions */}
          {regime === 'old' && (
            <Card>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-1">
                Old Regime Deductions
              </p>
              <p className="text-xs text-ink-400 mb-5">EPF and Standard Deduction (₹50,000) are applied automatically.</p>

              <div className="space-y-5">

                {/* HRA */}
                <div>
                  <p className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-3">HRA Exemption</p>
                  <Input label="Monthly Rent Paid (optional)" prefix="₹" type="number" min="0"
                    placeholder="Leave blank if not claiming HRA" value={rentPaidMonthly}
                    onChange={e => setRent(e.target.value)} />
                  {result && result.hraExemption > 0 && (
                    <div className="mt-1.5 rounded-lg px-2.5 py-1.5 text-xs bg-brand-50 border border-brand-200 text-brand-700">
                      Auto-computed HRA exemption: <strong>{fmtINR(result.hraExemption)}/year</strong>
                      {' '}(min of HRA received / Rent − 10% Basic / {isMetro ? '50%' : '40%'} of Basic)
                    </div>
                  )}
                  {num(rentPaidMonthly) > 0 && result && result.hraExemption === 0 && (
                    <p className="mt-1 text-xs text-amber-600">Rent entered but no HRA exemption applies — check that basic salary is set.</p>
                  )}
                </div>

                {/* 80C */}
                <div>
                  <p className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-3">Section 80C — cap ₹1,50,000</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input label="Additional 80C" prefix="₹" type="number" min="0"
                        placeholder="PPF, ELSS, LIC, NSC…" value={extraSec80C}
                        onChange={e => setExtraSec80C(e.target.value)} />
                      <p className="mt-1 text-xs text-ink-400">EPF is already counted automatically.</p>
                    </div>
                    {result && (
                      <div className="pt-5">
                        <CapBadge
                          used={result.sec80CTotal}
                          cap={OLD_DED_CAPS.sec80C}
                          label="80C used"
                        />
                        {result.sec80CEPFPortion >= OLD_DED_CAPS.sec80C && (
                          <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                            <AlertCircle size={12} /> EPF alone fills the entire ₹1.5L cap — additional 80C has no tax benefit.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 80D */}
                <div>
                  <p className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-3">Section 80D — Health Insurance</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label={`Self + Family (cap ${fmtINR(sec80DCap)})`}
                        prefix="₹" type="number" min="0"
                        placeholder="0" value={sec80D}
                        onChange={e => setSec80D(e.target.value)} />
                      <p className="mt-1 text-xs text-ink-400">
                        {isSenior ? 'Senior citizen — cap ₹50,000' : 'Cap ₹25,000. Preventive checkup (₹5k) included within this.'}
                      </p>
                    </div>
                    <div>
                      <Input
                        label={`Parents (cap ${fmtINR(sec80DParentsCap)})`}
                        prefix="₹" type="number" min="0"
                        placeholder="0" value={sec80DParents}
                        onChange={e => setSec80DParents(e.target.value)} />
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setParentsSenior(p => !p)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${parentsSenior ? 'bg-brand-500' : 'bg-ink-200'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${parentsSenior ? 'translate-x-4' : ''}`} />
                        </button>
                        <span className="text-xs text-ink-500">Parents are senior citizens (cap ₹50,000)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NPS 80CCD(1B) + 80TTA */}
                <div>
                  <p className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-3">Other Deductions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input label="NPS — 80CCD(1B) (cap ₹50,000)" prefix="₹" type="number" min="0"
                        placeholder="0" value={nps80CCD1B}
                        onChange={e => setNPS(e.target.value)} />
                      <p className="mt-1 text-xs text-ink-400">Extra NPS contribution over and above 80C — separate ₹50k deduction.</p>
                      {num(nps80CCD1B) > OLD_DED_CAPS.nps80CCD1B && (
                        <p className="mt-1 text-xs text-amber-600">Capped at ₹50,000.</p>
                      )}
                    </div>
                    <div>
                      <Input
                        label={isSenior ? '80TTB — Interest Income (cap ₹50,000)' : '80TTA — Savings Interest (cap ₹10,000)'}
                        prefix="₹" type="number" min="0"
                        placeholder="0" value={sec80TTA}
                        onChange={e => setSec80TTA(e.target.value)} />
                      <p className="mt-1 text-xs text-ink-400">
                        {isSenior
                          ? 'Senior citizens: all interest income (FD, savings, etc.) up to ₹50,000.'
                          : 'Savings account interest only. FD/RD interest not eligible.'}
                      </p>
                      {num(sec80TTA) > sec80TTACap && (
                        <p className="mt-1 text-xs text-amber-600">Capped at {fmtINR(sec80TTACap)}.</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <Input label="Any other deductions" prefix="₹" type="number" min="0"
                        placeholder="0" value={otherDed}
                        onChange={e => setOtherDed(e.target.value)} />
                      <p className="mt-1 text-xs text-ink-400">Section 24(b) home loan interest, 80G donations, etc.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* PF / Gratuity / Prof Tax toggles */}
          <Card padding="sm">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">Statutory Components</p>
            <div className="space-y-2.5">
              {([
                {
                  on: applyPF, set: setApplyPF,
                  label: 'Provident Fund (PF)',
                  desc: applyPF
                    ? `Employee ${(EMPLOYEE_PF_RATE*100).toFixed(0)}% + Employer ${(EMPLOYER_PF_RATE*100).toFixed(0)}% of basic deducted`
                    : 'Not applicable — PF not deducted',
                  warn: !applyPF,
                },
                {
                  on: applyGratuity, set: setApplyGratuity,
                  label: 'Gratuity',
                  desc: applyGratuity
                    ? `${(GRATUITY_RATE*100).toFixed(2)}% of basic/year reserved by employer (excluded from monthly take-home)`
                    : 'Not applicable — full CTC goes to gross salary',
                  warn: false,
                },
                {
                  on: applyProfTax, set: setApplyProfTax,
                  label: 'Professional Tax',
                  desc: applyProfTax
                    ? `₹${PROF_TAX_ANNUAL.toLocaleString('en-IN')}/year deducted`
                    : 'Not applicable — Delhi, UP, Haryana, Rajasthan etc. do not levy PT',
                  warn: !applyProfTax,
                },
              ]).map(item => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-700">{item.label}</p>
                    <p className={`text-xs mt-0.5 ${item.warn ? 'text-amber-600' : 'text-ink-400'}`}>{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.set(p => !p)}
                    className={`relative shrink-0 w-10 h-5.5 h-[22px] rounded-full transition-colors ${item.on ? 'bg-brand-500' : 'bg-ink-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.on ? 'translate-x-[22px]' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Results ── */}
        <div className="lg:sticky lg:top-6">
          {result ? (
            <div className="space-y-4">

              {/* Combined take-home — kept as one card */}
              <Card>
                <div className="grid grid-cols-2 divide-x divide-ink-100 py-3">
                  <div className="text-center pr-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-1">Monthly Take-Home</p>
                    <p className="text-3xl font-bold text-brand-700 tabular-nums">{fmtMonthly(result.annualTakeHome)}</p>
                  </div>
                  <div className="text-center pl-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-1">Annual Take-Home</p>
                    <p className="text-3xl font-bold text-brand-700 tabular-nums">{fmtINR(result.annualTakeHome)}</p>
                  </div>
                </div>
                <div className="text-center mt-3 pt-3 border-t border-ink-50">
                  <span className="text-xs text-ink-500">Effective tax rate: </span>
                  <span className="text-sm font-semibold text-ink-700">{result.effectiveTaxRate.toFixed(2)}%</span>
                </div>
              </Card>

              {/* Column labels */}
              <div className="grid grid-cols-2 gap-3 px-1">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-500">Monthly Breakdown</p>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-500">Yearly Breakdown</p>
              </div>

              {/* Section cards — monthly and annual in separate side-by-side cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card padding="sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">Salary Structure</p>
                  <MRow label="Basic Salary"      annual={result.basic} />
                  <MRow label="HRA"               annual={result.hra} />
                  <MRow label="Special Allowance" annual={result.specialAllowance} />
                  <MRow label="Gross Salary"       annual={result.grossSalary} highlight />
                </Card>
                <Card padding="sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">Salary Structure</p>
                  <ARow label="Basic Salary"      annual={result.basic} />
                  <ARow label="HRA"               annual={result.hra} />
                  <ARow label="Special Allowance" annual={result.specialAllowance} />
                  <ARow label="Gross Salary"       annual={result.grossSalary} highlight />
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Card padding="sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">Exemptions</p>
                  {result.employeePF > 0 && <MRow label={`Employee PF (${(EMPLOYEE_PF_RATE*100).toFixed(0)}%)`} annual={result.employeePF} />}
                  {result.professionalTax > 0 && <MRow label="Professional Tax" annual={result.professionalTax} />}
                  <MRow label="Income Tax (TDS)" annual={result.incomeTaxTDS} />
                  <MRow label="Total Deductions" annual={result.totalDeductions} highlight />
                </Card>
                <Card padding="sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">Exemptions</p>
                  {result.employeePF > 0 && <ARow label={`Employee PF (${(EMPLOYEE_PF_RATE*100).toFixed(0)}%)`} annual={result.employeePF} />}
                  {result.professionalTax > 0 && <ARow label="Professional Tax" annual={result.professionalTax} />}
                  <ARow label="Income Tax (TDS)" annual={result.incomeTaxTDS} />
                  <ARow label="Total Deductions" annual={result.totalDeductions} highlight />
                </Card>
              </div>

              {regime === 'old' && (
                <div className="grid grid-cols-2 gap-3">
                  <Card padding="sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">Tax Exemptions</p>
                    <MRow label="Standard Deduction" annual={result.standardDeduction} note="Flat ₹50,000" />
                    {result.hraExemption > 0 && <MRow label="HRA Exemption" annual={result.hraExemption} />}
                    <MRow label="Section 80C" annual={result.sec80CTotal}
                      note={result.sec80CEPFPortion >= OLD_DED_CAPS.sec80C ? '⚠ EPF fills ₹1.5L cap' : 'Cap ₹1,50,000'} />
                    {result.nps80CCD1B > 0 && <MRow label="NPS 80CCD(1B)" annual={result.nps80CCD1B} />}
                    {result.sec80DEffective > 0 && <MRow label="80D Self + Family" annual={result.sec80DEffective} />}
                    {result.sec80DParentsEff > 0 && <MRow label={`80D Parents${parentsSenior ? ' (sr)' : ''}`} annual={result.sec80DParentsEff} />}
                    {result.sec80TTAEffective > 0 && <MRow label={isSenior ? '80TTB' : '80TTA'} annual={result.sec80TTAEffective} />}
                    {num(otherDed) > 0 && <MRow label="Other Deductions" annual={Math.max(0, num(otherDed))} />}
                    <MRow label="Total Exemptions" annual={result.standardDeduction + result.totalOldDeductions} highlight />
                  </Card>
                  <Card padding="sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">Tax Exemptions</p>
                    <ARow label="Standard Deduction" annual={result.standardDeduction} note="Flat ₹50,000" />
                    {result.hraExemption > 0 && <ARow label="HRA Exemption" annual={result.hraExemption} />}
                    <ARow label="Section 80C" annual={result.sec80CTotal}
                      note={result.sec80CEPFPortion >= OLD_DED_CAPS.sec80C ? '⚠ EPF fills ₹1.5L cap' : 'Cap ₹1,50,000'} />
                    {result.nps80CCD1B > 0 && <ARow label="NPS 80CCD(1B)" annual={result.nps80CCD1B} />}
                    {result.sec80DEffective > 0 && <ARow label="80D Self + Family" annual={result.sec80DEffective} />}
                    {result.sec80DParentsEff > 0 && <ARow label={`80D Parents${parentsSenior ? ' (sr)' : ''}`} annual={result.sec80DParentsEff} />}
                    {result.sec80TTAEffective > 0 && <ARow label={isSenior ? '80TTB' : '80TTA'} annual={result.sec80TTAEffective} />}
                    {num(otherDed) > 0 && <ARow label="Other Deductions" annual={Math.max(0, num(otherDed))} />}
                    <ARow label="Total Exemptions" annual={result.standardDeduction + result.totalOldDeductions} highlight />
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Card padding="sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">Employer Cost</p>
                  <MRow label="Gross Salary" annual={result.grossSalary} sub />
                  {result.employerPF > 0 && <MRow label={`Employer PF (${(EMPLOYER_PF_RATE*100).toFixed(0)}%)`} annual={result.employerPF} sub />}
                  {result.gratuity > 0 && <MRow label={`Gratuity (${(GRATUITY_RATE*100).toFixed(2)}%)`} annual={result.gratuity} sub />}
                  <MRow label="Total CTC" annual={result.ctc} highlight />
                </Card>
                <Card padding="sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-2">Employer Cost</p>
                  <ARow label="Gross Salary" annual={result.grossSalary} sub />
                  {result.employerPF > 0 && <ARow label={`Employer PF (${(EMPLOYER_PF_RATE*100).toFixed(0)}%)`} annual={result.employerPF} sub />}
                  {result.gratuity > 0 && <ARow label={`Gratuity (${(GRATUITY_RATE*100).toFixed(2)}%)`} annual={result.gratuity} sub />}
                  <ARow label="Total CTC" annual={result.ctc} highlight />
                </Card>
              </div>

            </div>
          ) : (
            <Card className="text-center py-12">
              <p className="text-ink-400 text-sm">Enter your CTC to see the take-home breakdown</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
