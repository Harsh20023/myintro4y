'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Check, Info, Download } from 'lucide-react'
import { Input, Select, Card } from '@/components/ui'
import {
  computeBasic, computeAdvanced,
  FY_OPTIONS, AGE_OPTIONS, OLD_DED_CAPS,
  type FY, type AgeGroup, type RegimeTax, type TaxComparison, type SpecialRateItem,
} from '@/lib/logic/income-tax'

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtINR = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))

const num = (v: string) => Math.max(0, parseFloat(v) || 0)

// ── PDF download ───────────────────────────────────────────────────────────

function downloadPDF(
  result: TaxComparison,
  taxpayerName: string,
  fy: FY,
  ageGroup: AgeGroup,
  adv: AdvState | null,
) {
  const fyLabel = FY_OPTIONS.find(o => o.value === fy)?.label ?? fy
  const ageLabel = AGE_OPTIONS.find(o => o.value === ageGroup)?.label ?? ageGroup
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))

  const inr = (n: number) => `&#8377;${fmt(n)}`

  // Income rows for summary
  type IncomeRow = { label: string; value: number }
  const incomeRows: IncomeRow[] = []
  if (adv) {
    if (num(adv.salary) > 0)         incomeRows.push({ label: 'Salary',                        value: num(adv.salary) })
    if (num(adv.pension) > 0)        incomeRows.push({ label: 'Pension',                       value: num(adv.pension) })
    if (num(adv.familyPension) > 0)  incomeRows.push({ label: 'Family Pension',                value: num(adv.familyPension) })
    if (num(adv.businessIncome) > 0) incomeRows.push({ label: 'Business / Professional',       value: num(adv.businessIncome) })
    const hp = parseFloat(adv.housePropertyIncome) || 0
    if (hp !== 0)                    incomeRows.push({ label: 'House Property',                value: hp })
    if (num(adv.stcgEquity) > 0)     incomeRows.push({ label: 'STCG — Equity / MF (20%)',     value: num(adv.stcgEquity) })
    if (num(adv.ltcgEquity) > 0)     incomeRows.push({ label: 'LTCG — Equity / MF (12.5%)',   value: num(adv.ltcgEquity) })
    if (num(adv.capitalGainsAtSlab) > 0) incomeRows.push({ label: 'Capital Gains at Slab',    value: num(adv.capitalGainsAtSlab) })
    if (num(adv.lotteryIncome) > 0)  incomeRows.push({ label: 'Lottery / Gambling (30%)',     value: num(adv.lotteryIncome) })
    if (num(adv.interestIncome) > 0) incomeRows.push({ label: 'Interest Income',              value: num(adv.interestIncome) })
    if (num(adv.dividendIncome) > 0) incomeRows.push({ label: 'Dividend Income',              value: num(adv.dividendIncome) })
    if (num(adv.otherIncome) > 0)    incomeRows.push({ label: 'Other Sources',                value: num(adv.otherIncome) })
  }

  const specialItems = result.old.specialRateItems

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Income Tax Estimate${taxpayerName ? ' — ' + taxpayerName : ''}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 32px; max-width: 820px; margin: 0 auto; }
  h1 { font-size: 22px; font-weight: 700; color: #1e3a5f; margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: #555; margin-bottom: 24px; }
  h2 { font-size: 14px; font-weight: 700; color: #1e3a5f; margin: 24px 0 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #f0f4f8; text-align: left; padding: 7px 10px; font-size: 12px; color: #555; }
  th.right, td.right { text-align: right; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:last-child td { border-bottom: none; }
  .total-row td { font-weight: 700; background: #f8fafc; border-top: 2px solid #cbd5e1; }
  .highlight { background: #eff6ff; }
  .green { color: #16a34a; }
  .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600; margin-left: 8px; }
  .disclaimer { margin-top: 32px; padding: 12px 16px; background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; font-size: 11px; color: #78350f; line-height: 1.6; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<h1>Income Tax Estimate${taxpayerName ? ` — ${taxpayerName}` : ''}</h1>
<div class="subtitle">${fyLabel} &nbsp;|&nbsp; ${ageLabel} &nbsp;|&nbsp; Generated: ${today}</div>

${incomeRows.length > 0 ? `
<h2>Income Summary</h2>
<table>
  <thead><tr><th>Income Head</th><th class="right">Amount</th></tr></thead>
  <tbody>
    ${incomeRows.map(r => `<tr><td>${r.label}</td><td class="right">${inr(r.value)}</td></tr>`).join('')}
    <tr class="total-row"><td>Total Gross Income</td><td class="right">${inr(result.old.grossIncome)}</td></tr>
  </tbody>
</table>` : ''}

<h2>Regime Comparison</h2>
<table>
  <thead>
    <tr>
      <th>Particulars</th>
      <th class="right">Old Regime</th>
      <th class="right">New Regime</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Gross Income</td><td class="right">${inr(result.old.grossIncome)}</td><td class="right">${inr(result.new.grossIncome)}</td></tr>
    <tr><td>Standard Deduction</td><td class="right">${result.old.standardDeduction > 0 ? `(${inr(result.old.standardDeduction)})` : '—'}</td><td class="right">${result.new.standardDeduction > 0 ? `(${inr(result.new.standardDeduction)})` : '—'}</td></tr>
    <tr><td>Other Deductions</td><td class="right">${result.old.otherDeductions > 0 ? `(${inr(result.old.otherDeductions)})` : '—'}</td><td class="right">${result.new.otherDeductions > 0 ? `(${inr(result.new.otherDeductions)})` : '—'}</td></tr>
    <tr><td>Taxable Income (Slab)</td><td class="right">${inr(result.old.taxableIncome)}</td><td class="right">${inr(result.new.taxableIncome)}</td></tr>
    <tr><td>Tax on Slabs</td><td class="right">${inr(result.old.taxBeforeRebate)}</td><td class="right">${inr(result.new.taxBeforeRebate)}</td></tr>
    ${result.old.specialRateTax > 0 || result.new.specialRateTax > 0 ? `<tr><td>Special Rate Tax (STCG/LTCG/Lottery)</td><td class="right">${inr(result.old.specialRateTax)}</td><td class="right">${inr(result.new.specialRateTax)}</td></tr>` : ''}
    ${result.old.rebate87A > 0 || result.new.rebate87A > 0 ? `<tr class="green"><td>Rebate u/s 87A</td><td class="right green">${result.old.rebate87A > 0 ? `(${inr(result.old.rebate87A)})` : '—'}</td><td class="right green">${result.new.rebate87A > 0 ? `(${inr(result.new.rebate87A)})` : '—'}</td></tr>` : ''}
    ${result.old.surcharge > 0 || result.new.surcharge > 0 ? `<tr><td>Surcharge</td><td class="right">${result.old.surcharge > 0 ? inr(result.old.surcharge) : '—'}</td><td class="right">${result.new.surcharge > 0 ? inr(result.new.surcharge) : '—'}</td></tr>` : ''}
    <tr><td>H&amp;E Cess (4%)</td><td class="right">${inr(result.old.cess)}</td><td class="right">${inr(result.new.cess)}</td></tr>
    <tr class="total-row ${result.savedBy === 'old' ? 'highlight' : ''}"><td>Total Tax Liability — Old Regime ${result.savedBy === 'old' ? '<span class="badge">Recommended</span>' : ''}</td><td class="right">${inr(result.old.totalTax)}</td><td class="right">—</td></tr>
    <tr class="total-row ${result.savedBy === 'new' ? 'highlight' : ''}"><td>Total Tax Liability — New Regime ${result.savedBy === 'new' ? '<span class="badge">Recommended</span>' : ''}</td><td class="right">—</td><td class="right">${inr(result.new.totalTax)}</td></tr>
    <tr><td>Effective Rate</td><td class="right">${result.old.effectiveRate.toFixed(2)}%</td><td class="right">${result.new.effectiveRate.toFixed(2)}%</td></tr>
  </tbody>
</table>

${specialItems.length > 0 ? `
<h2>Special Rate Tax Breakdown</h2>
<table>
  <thead><tr><th>Income Type</th><th class="right">Gross Income</th><th class="right">Exempt</th><th class="right">Rate</th><th class="right">Tax</th></tr></thead>
  <tbody>
    ${specialItems.map(item => `<tr><td>${item.label}</td><td class="right">${inr(item.income)}</td><td class="right">${item.exempt > 0 ? inr(item.exempt) : '—'}</td><td class="right">${item.rate}%</td><td class="right">${inr(item.tax)}</td></tr>`).join('')}
    <tr class="total-row"><td colspan="4">Total Special Rate Tax</td><td class="right">${inr(result.old.specialRateTax)}</td></tr>
  </tbody>
</table>` : ''}

<div class="disclaimer">
  <strong>Disclaimer:</strong> This estimate is for informational purposes only and is based on the figures entered. It does not constitute professional tax advice.
  Actual tax liability may differ based on exemptions, surcharge marginal relief, TDS credits, advance tax, and other factors.
  Please consult a qualified Chartered Accountant for a precise computation and filing.
</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 300)
}

// ── Regime result card ─────────────────────────────────────────────────────

function RegimeCard({
  label, result, isBetter, savings,
}: {
  label: string
  result: RegimeTax
  isBetter: boolean
  savings: number
}) {
  return (
    <div className={`rounded-2xl border p-5 transition-all ${
      isBetter
        ? 'border-brand-300 bg-brand-50 ring-2 ring-brand-200'
        : 'border-ink-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-ink-500">{label}</span>
        {isBetter && savings > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-100 border border-brand-200 px-2 py-0.5 rounded-full">
            <Check size={10} strokeWidth={3} /> Recommended
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-500">Gross Income</span>
          <span className="font-medium text-ink-700">{fmtINR(result.grossIncome)}</span>
        </div>
        {result.standardDeduction > 0 && (
          <div className="flex justify-between text-xs text-ink-400">
            <span>Standard deduction</span>
            <span>− {fmtINR(result.standardDeduction)}</span>
          </div>
        )}
        {result.otherDeductions > 0 && (
          <div className="flex justify-between text-xs text-ink-400">
            <span>Other deductions</span>
            <span>− {fmtINR(result.otherDeductions)}</span>
          </div>
        )}
        <div className="flex justify-between font-medium pt-1 border-t border-ink-100">
          <span className="text-ink-700">Taxable Income</span>
          <span className="text-ink-900">{fmtINR(result.taxableIncome)}</span>
        </div>
        <div className="flex justify-between text-xs text-ink-500">
          <span>Tax (on slabs)</span>
          <span>{fmtINR(result.taxBeforeRebate)}</span>
        </div>

        {/* Special rate items */}
        {result.specialRateItems.map((item: SpecialRateItem, i: number) => (
          <div key={i} className="flex justify-between text-xs text-ink-500">
            <span>{item.label} ({item.rate}%)</span>
            <span>{fmtINR(item.tax)}</span>
          </div>
        ))}
        {result.specialRateTax > 0 && (
          <div className="flex justify-between text-xs font-medium text-ink-600 border-t border-ink-100 pt-1">
            <span>Special rate tax subtotal</span>
            <span>{fmtINR(result.specialRateTax)}</span>
          </div>
        )}

        {result.rebate87A > 0 && (
          <div className="flex justify-between text-xs text-green-600">
            <span>Rebate u/s 87A</span>
            <span>− {fmtINR(result.rebate87A)}</span>
          </div>
        )}
        {result.surcharge > 0 && (
          <div className="flex justify-between text-xs text-ink-500">
            <span>Surcharge</span>
            <span>+ {fmtINR(result.surcharge)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-ink-500">
          <span>H&amp;E Cess (4%)</span>
          <span>+ {fmtINR(result.cess)}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-ink-200">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-semibold text-ink-700">Total Tax</span>
          <span className={`text-2xl font-bold ${isBetter ? 'text-brand-700' : 'text-ink-900'}`}>
            {fmtINR(result.totalTax)}
          </span>
        </div>
        <div className="text-right text-xs text-ink-400 mt-0.5">
          Effective rate: {result.effectiveRate.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

// ── Slab breakdown table ───────────────────────────────────────────────────

function SlabTable({ result, label }: { result: RegimeTax; label: string }) {
  if (result.slabRows.length === 0) {
    return (
      <div className="text-xs text-ink-400 text-center py-3">
        Nil tax — income within basic exemption / fully covered by rebate
      </div>
    )
  }
  return (
    <div>
      <p className="text-xs font-semibold text-ink-600 mb-2">{label}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-ink-400 border-b border-ink-100">
            <th className="text-left pb-1.5 font-medium">Slab</th>
            <th className="text-right pb-1.5 font-medium">Rate</th>
            <th className="text-right pb-1.5 font-medium">Taxable</th>
            <th className="text-right pb-1.5 font-medium">Tax</th>
          </tr>
        </thead>
        <tbody>
          {result.slabRows.map((row, i) => (
            <tr key={i} className="border-b border-ink-50">
              <td className="py-1.5 text-ink-600">{row.label}</td>
              <td className="py-1.5 text-right text-ink-500">{row.rate}%</td>
              <td className="py-1.5 text-right text-ink-600">{fmtINR(row.taxable)}</td>
              <td className="py-1.5 text-right font-medium text-ink-800">{fmtINR(row.tax)}</td>
            </tr>
          ))}
          {result.rebate87A > 0 && (
            <tr className="border-b border-ink-50 text-green-600">
              <td className="py-1.5" colSpan={3}>Rebate u/s 87A</td>
              <td className="py-1.5 text-right font-medium">− {fmtINR(result.rebate87A)}</td>
            </tr>
          )}
          {result.surcharge > 0 && (
            <tr className="border-b border-ink-50 text-ink-500">
              <td className="py-1.5" colSpan={3}>Surcharge</td>
              <td className="py-1.5 text-right font-medium">+ {fmtINR(result.surcharge)}</td>
            </tr>
          )}
          <tr className="text-ink-500">
            <td className="py-1.5" colSpan={3}>H&amp;E Cess (4%)</td>
            <td className="py-1.5 text-right font-medium">+ {fmtINR(result.cess)}</td>
          </tr>
          <tr className="font-semibold border-t border-ink-200">
            <td className="pt-2" colSpan={3}>Total Tax</td>
            <td className="pt-2 text-right text-ink-900">{fmtINR(result.totalTax)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ── Results panel ──────────────────────────────────────────────────────────

function ResultsPanel({ result }: { result: TaxComparison | null }) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  if (!result) {
    return (
      <Card className="text-center py-12">
        <p className="text-ink-400 text-sm">Enter your income details to see the comparison</p>
      </Card>
    )
  }

  const oldIsBetter  = result.savedBy === 'old'
  const newIsBetter  = result.savedBy === 'new'
  const isEqual      = result.savedBy === 'equal'

  return (
    <div className="space-y-4">
      {/* Savings banner */}
      {!isEqual && result.savings > 0 && (
        <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-800 font-medium">
          {result.savedBy === 'new' ? 'New' : 'Old'} Regime saves you{' '}
          <span className="font-bold">{fmtINR(result.savings)}</span>
        </div>
      )}
      {isEqual && (
        <div className="rounded-xl bg-ink-50 border border-ink-200 px-4 py-3 text-sm text-ink-600">
          Both regimes result in the same tax liability
        </div>
      )}

      {/* Regime cards */}
      <RegimeCard label="Old Regime" result={result.old} isBetter={oldIsBetter} savings={result.savings} />
      <RegimeCard label="New Regime" result={result.new} isBetter={newIsBetter} savings={result.savings} />

      {/* Breakdown toggle */}
      <button
        onClick={() => setShowBreakdown(v => !v)}
        className="w-full flex items-center justify-between text-xs font-medium text-ink-500 hover:text-ink-700 px-1 py-2"
      >
        <span>Slab-wise breakdown</span>
        {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showBreakdown && (
        <Card padding="sm" className="space-y-6">
          <SlabTable result={result.old} label="Old Regime — slab computation" />
          <div className="border-t border-ink-100" />
          <SlabTable result={result.new} label="New Regime — slab computation" />
        </Card>
      )}
    </div>
  )
}

// ── Basic mode form ────────────────────────────────────────────────────────

interface BasicState {
  grossIncome: string
  deductions:  string
  hasSalary:   boolean
}

function BasicForm({
  state, onChange, fy, ageGroup,
}: {
  state:    BasicState
  onChange: (s: BasicState) => void
  fy:       FY
  ageGroup: AgeGroup
}) {
  const stdOld = state.hasSalary ? 50_000 : 0
  const stdNew = state.hasSalary ? 75_000 : 0

  return (
    <Card>
      <div className="space-y-5">
        <div>
          <Input
            label="Annual Income (from all sources)"
            prefix="₹"
            type="number"
            min="0"
            placeholder="e.g. 1200000"
            value={state.grossIncome}
            onChange={e => onChange({ ...state, grossIncome: e.target.value })}
          />
          <p className="mt-1 text-xs text-ink-400">
            Enter your total gross income — salary, interest, rent, business, etc.
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl border border-ink-100 bg-ink-50">
          <input
            type="checkbox"
            id="hasSalary"
            checked={state.hasSalary}
            onChange={e => onChange({ ...state, hasSalary: e.target.checked })}
            className="mt-0.5 accent-brand-600"
          />
          <label htmlFor="hasSalary" className="text-sm text-ink-700 cursor-pointer">
            <span className="font-medium">Salary / Pension income</span>
            <span className="text-xs text-ink-400 block mt-0.5">
              Auto-applies standard deduction — ₹50,000 (old) / ₹75,000 (new)
            </span>
          </label>
        </div>

        <div>
          <Input
            label="Total Deductions (Old Regime only)"
            prefix="₹"
            type="number"
            min="0"
            placeholder="e.g. 150000"
            value={state.deductions}
            onChange={e => onChange({ ...state, deductions: e.target.value })}
          />
          <p className="mt-1 text-xs text-ink-400">
            Enter your total Chapter VI-A deductions — 80C, 80D, NPS, etc.
            Do not include standard deduction (auto-applied above).
            New Regime ignores this field.
          </p>
        </div>

        <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 flex gap-2">
          <Info size={14} className="text-ink-400 mt-0.5 shrink-0" />
          <p className="text-xs text-ink-500">
            Standard deduction included: <strong className="text-ink-700">Old ₹{(stdOld / 1000).toFixed(0)}K</strong> ·{' '}
            <strong className="text-ink-700">New ₹{(stdNew / 1000).toFixed(0)}K</strong>.
            Equity capital gains (STCG/LTCG) are taxed at special rates — use Advanced mode or the Capital Gains Calculator.
          </p>
        </div>
      </div>
    </Card>
  )
}

// ── Advanced mode form ─────────────────────────────────────────────────────

interface AdvState {
  salary:              string
  pension:             string
  familyPension:       string
  businessIncome:      string
  housePropertyIncome: string
  stcgEquity:          string
  ltcgEquity:          string
  capitalGainsAtSlab:  string
  lotteryIncome:       string
  interestIncome:      string
  dividendIncome:      string
  otherIncome:         string
  sec80C:              string
  sec80D:              string
  sec80CCD1B:          string
  sec80TTA:            string
  section24b:          string
  otherDed:            string
}

function SectionHeading({ title }: { title: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-4">{title}</p>
  )
}

function AdvancedForm({
  state, onChange, ageGroup,
}: {
  state:    AdvState
  onChange: (s: AdvState) => void
  ageGroup: AgeGroup
}) {
  const ttaCap = (ageGroup === 'senior' || ageGroup === 'superSenior')
    ? OLD_DED_CAPS.sec80TTAsenior
    : OLD_DED_CAPS.sec80TTAbelow60

  return (
    <div className="space-y-5">

      {/* Salary & Pension */}
      <Card>
        <SectionHeading title="Salary & Pension" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Salary"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.salary}
              onChange={e => onChange({ ...state, salary: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">Standard deduction auto-applied</p>
          </div>
          <div>
            <Input
              label="Pension"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.pension}
              onChange={e => onChange({ ...state, pension: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">Combined with salary for standard deduction</p>
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Family Pension"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.familyPension}
              onChange={e => onChange({ ...state, familyPension: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">
              Deduction of min(1/3 of family pension, ₹15,000) auto-applied — allowed in both regimes (Sec 57(iia))
            </p>
          </div>
        </div>
      </Card>

      {/* Business & Profession */}
      <Card>
        <SectionHeading title="Business & Profession" />
        <div>
          <Input
            label="Business / Professional Income"
            prefix="₹"
            type="number"
            min="0"
            placeholder="0"
            value={state.businessIncome}
            onChange={e => onChange({ ...state, businessIncome: e.target.value })}
          />
          <p className="mt-1 text-xs text-ink-400">Net profit after business expenses. Taxed at slab rates.</p>
        </div>
      </Card>

      {/* House Property */}
      <Card>
        <SectionHeading title="House Property" />
        <div>
          <Input
            label="House Property Income"
            prefix="₹"
            type="number"
            placeholder="0 (negative = loss)"
            value={state.housePropertyIncome}
            onChange={e => onChange({ ...state, housePropertyIncome: e.target.value })}
          />
          <p className="mt-1 text-xs text-ink-400">
            Enter negative for loss. Old regime caps set-off at ₹2L. Loss not allowed in new regime.
          </p>
        </div>
      </Card>

      {/* Capital Gains */}
      <Card>
        <SectionHeading title="Capital Gains" />
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 flex gap-2">
          <Info size={14} className="text-teal-600 mt-0.5 shrink-0" />
          <p className="text-xs text-teal-700">
            <strong>Special rates apply:</strong> STCG on equity is taxed at a flat <strong>20%</strong>; LTCG on equity above ₹1.25L is taxed at <strong>12.5%</strong>.
            These are taxed separately from slab income and shown as a special rate subtotal in the results.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="STCG — Equity / Equity MF"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.stcgEquity}
              onChange={e => onChange({ ...state, stcgEquity: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">Short-term capital gain — flat 20% tax rate (Sec 111A)</p>
          </div>
          <div>
            <Input
              label="LTCG — Equity / Equity MF"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.ltcgEquity}
              onChange={e => onChange({ ...state, ltcgEquity: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">Long-term — 12.5% above ₹1.25L exemption (Sec 112A)</p>
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Capital Gains at Slab Rate"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.capitalGainsAtSlab}
              onChange={e => onChange({ ...state, capitalGainsAtSlab: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">
              Debt MF, Gold, Property, etc. taxed at normal slab rates.
            </p>
          </div>
        </div>
      </Card>

      {/* Other Income Sources */}
      <Card>
        <SectionHeading title="Other Income Sources" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Lottery / Gambling / Special Income"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.lotteryIncome}
              onChange={e => onChange({ ...state, lotteryIncome: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">Flat 30% tax rate — Section 115BB (no deductions allowed)</p>
          </div>
          <div>
            <Input
              label="Interest Income"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.interestIncome}
              onChange={e => onChange({ ...state, interestIncome: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">FD interest, savings account, RD, etc.</p>
          </div>
          <div>
            <Input
              label="Dividend Income"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.dividendIncome}
              onChange={e => onChange({ ...state, dividendIncome: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">Dividends from shares, mutual funds (taxable in hands of recipient)</p>
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Other Sources"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.otherIncome}
              onChange={e => onChange({ ...state, otherIncome: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">Any other taxable income not covered above</p>
          </div>
        </div>
      </Card>

      {/* Deductions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Deductions (Old Regime only)</p>
          <span className="text-[10px] text-ink-400 bg-ink-100 px-2 py-0.5 rounded-full">New regime ignores these</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label={`Section 80C (max ₹${(OLD_DED_CAPS.sec80C / 1_00_000).toFixed(1)}L)`}
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.sec80C}
              onChange={e => onChange({ ...state, sec80C: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">PF, PPF, ELSS, LIC, NSC, home loan principal</p>
          </div>
          <div>
            <Input
              label="Section 80D — Health Insurance"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.sec80D}
              onChange={e => onChange({ ...state, sec80D: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">Premium for self, family, parents</p>
          </div>
          <div>
            <Input
              label={`NPS 80CCD(1B) (max ₹${(OLD_DED_CAPS.sec80CCD1B / 1_000).toFixed(0)}K)`}
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.sec80CCD1B}
              onChange={e => onChange({ ...state, sec80CCD1B: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">Additional NPS contribution — over and above 80C</p>
          </div>
          <div>
            <Input
              label={`80TTA / 80TTB (max ₹${(ttaCap / 1_000).toFixed(0)}K)`}
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.sec80TTA}
              onChange={e => onChange({ ...state, sec80TTA: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">
              {ageGroup === 'senior' || ageGroup === 'superSenior'
                ? '80TTB — interest from savings, FD, RD (senior citizens)'
                : '80TTA — savings account interest only'}
            </p>
          </div>
          <div>
            <Input
              label={`Home Loan Interest — Sec 24(b) (max ₹${(OLD_DED_CAPS.section24b / 1_00_000).toFixed(0)}L)`}
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.section24b}
              onChange={e => onChange({ ...state, section24b: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">Self-occupied property only. Let-out: enter in HP income row.</p>
          </div>
          <div>
            <Input
              label="Other Deductions"
              prefix="₹"
              type="number"
              min="0"
              placeholder="0"
              value={state.otherDed}
              onChange={e => onChange({ ...state, otherDed: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-400">80G, 80E, HRA exemption, etc.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

const defaultBasic: BasicState  = { grossIncome: '', deductions: '', hasSalary: true }
const defaultAdv: AdvState = {
  salary: '', pension: '', familyPension: '', businessIncome: '',
  housePropertyIncome: '', stcgEquity: '', ltcgEquity: '',
  capitalGainsAtSlab: '', lotteryIncome: '', interestIncome: '',
  dividendIncome: '', otherIncome: '',
  sec80C: '', sec80D: '', sec80CCD1B: '', sec80TTA: '', section24b: '', otherDed: '',
}

export function IncomeTaxCalculator() {
  const [mode, setMode]               = useState<'basic' | 'advanced'>('basic')
  const [fy, setFY]                   = useState<FY>('FY2025-26')
  const [ageGroup, setAgeGroup]       = useState<AgeGroup>('below60')
  const [taxpayerName, setTaxpayerName] = useState<string>('')
  const [basic, setBasic]             = useState<BasicState>(defaultBasic)
  const [adv, setAdv]                 = useState<AdvState>(defaultAdv)

  const result = useMemo<TaxComparison | null>(() => {
    if (mode === 'basic') {
      const income = num(basic.grossIncome)
      if (income === 0) return null
      return computeBasic({
        fy,
        ageGroup,
        grossIncome:         income,
        hasSalary:           basic.hasSalary,
        oldRegimeDeductions: num(basic.deductions),
      })
    } else {
      const salary        = num(adv.salary)
      const pension       = num(adv.pension)
      const familyPension = num(adv.familyPension)
      const business      = num(adv.businessIncome)
      const hp            = parseFloat(adv.housePropertyIncome) || 0
      const stcg          = num(adv.stcgEquity)
      const ltcg          = num(adv.ltcgEquity)
      const cg            = num(adv.capitalGainsAtSlab)
      const lottery       = num(adv.lotteryIncome)
      const interest      = num(adv.interestIncome)
      const dividend      = num(adv.dividendIncome)
      const other         = num(adv.otherIncome)

      const totalIncome = salary + pension + familyPension + business + Math.max(0, hp) +
        stcg + ltcg + cg + lottery + interest + dividend + other
      if (totalIncome === 0) return null

      return computeAdvanced({
        fy,
        ageGroup,
        salary,
        pension,
        familyPension,
        businessIncome:      business,
        housePropertyIncome: hp,
        stcgEquity:          stcg,
        ltcgEquity:          ltcg,
        capitalGainsAtSlab:  cg,
        lotteryIncome:       lottery,
        interestIncome:      interest,
        dividendIncome:      dividend,
        otherIncome:         other,
        sec80C:      num(adv.sec80C),
        sec80D:      num(adv.sec80D),
        sec80CCD1B:  num(adv.sec80CCD1B),
        sec80TTA:    num(adv.sec80TTA),
        section24b:  num(adv.section24b),
        otherDed:    num(adv.otherDed),
      })
    }
  }, [mode, fy, ageGroup, basic, adv])

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-48">
            <Input
              label="Taxpayer Name"
              type="text"
              placeholder="Optional"
              value={taxpayerName}
              onChange={e => setTaxpayerName(e.target.value)}
            />
          </div>
          <div className="w-56">
            <Select
              label="Financial Year"
              value={fy}
              options={FY_OPTIONS}
              onChange={e => setFY(e.target.value as FY)}
            />
          </div>
          <div className="w-56">
            <Select
              label="Age Group"
              value={ageGroup}
              options={AGE_OPTIONS}
              onChange={e => setAgeGroup(e.target.value as AgeGroup)}
            />
          </div>
          <div className="flex items-end gap-3 ml-auto">
            {/* Download PDF button */}
            <button
              onClick={() => result && downloadPDF(result, taxpayerName, fy, ageGroup, mode === 'advanced' ? adv : null)}
              disabled={!result}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Download size={15} />
              Download PDF
            </button>
            {/* Mode toggle */}
            <div className="flex items-center rounded-xl border border-ink-200 overflow-hidden text-sm">
              {(['basic', 'advanced'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 font-medium capitalize transition-colors ${
                    mode === m
                      ? 'bg-ink-900 text-white'
                      : 'bg-white text-ink-500 hover:text-ink-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Input form */}
        <div>
          {mode === 'basic'
            ? <BasicForm state={basic} onChange={setBasic} fy={fy} ageGroup={ageGroup} />
            : <AdvancedForm state={adv} onChange={setAdv} ageGroup={ageGroup} />
          }
        </div>

        {/* Results */}
        <div className="lg:sticky lg:top-6">
          <ResultsPanel result={result} />
        </div>
      </div>
    </div>
  )
}
