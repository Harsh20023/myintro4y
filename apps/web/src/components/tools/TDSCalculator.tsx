'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Trash2, Download, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, FileText, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Input, Select, Card } from '@/components/ui'
// Select is used in the global controls (FY dropdown)
import {
  TDS_SECTIONS, computeTDS, computeSalaryTax, computeLateFees, fmtDate,
  getTDSDepositDueDate, getTDSReturnDueDate,
  type TDSSectionId, type TDSSectionMeta, type AgeCategory, type ITaxRegime, type SalaryTaxResult,
} from '@/lib/logic/tds'
import { useTaxConfig } from '@/lib/hooks/useTaxConfig'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtINR = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)

const num = (v: string) => Math.max(0, parseFloat(v) || 0)

const parseDate = (s: string): Date | null => {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

let _id = 0
const nextId = () => `entry-${++_id}`

const CATEGORY_ORDER = [
  'Salary', 'Business Payments', 'Rent', 'Interest & Dividends',
  'Property', 'Insurance', 'Winnings', 'Banking & Finance', 'Digital Assets', 'Other',
]

// New ITA 2025 section numbers + DB codes per section ID
const SECTION_EXTRA: Record<string, { newSection: string; code: string }> = {
  salary_192:              { newSection: '392',     code: '1001–1003' },
  contractor_194C:         { newSection: '393(1)',  code: '1023, 1024' },
  professional_194J:       { newSection: '393(1)',  code: '1027' },
  technical_194J:          { newSection: '393(1)',  code: '1026' },
  commission_194H:         { newSection: '393(1)',  code: '1006' },
  payment_indiv_194M:      { newSection: '393(1)',  code: '1025' },
  ecommerce_194O:          { newSection: '394(1)',  code: '1035' },
  goods_purchase_194Q:     { newSection: '394(1)',  code: '1031' },
  benefit_194R:            { newSection: '394(1)',  code: '1033' },
  partner_payment_194T:    { newSection: '394(1)',  code: '1067' },
  rent_building_194I:      { newSection: '393(1)',  code: '1009' },
  rent_plant_194I:         { newSection: '393(1)',  code: '1008' },
  rent_individual_194IB:   { newSection: '393(1)',  code: '1007' },
  sec_193:                 { newSection: '392(1)',  code: '1019' },
  dividend_194:            { newSection: '392(1)',  code: '1029' },
  bank_interest_194A:      { newSection: '393(1)',  code: '1021' },
  other_interest_194A:     { newSection: '393(1)',  code: '1021' },
  property_purchase_194IA: { newSection: '393(1)',  code: '1010' },
  jda_194IC:               { newSection: '393(1)',  code: '1011' },
  insurance_comm_194D:     { newSection: '393(1)',  code: '1005' },
  life_insurance_194DA:    { newSection: '393(1)',  code: '1030' },
  lottery_194B:            { newSection: '392(1)',  code: '1060' },
  winnings_194BB:          { newSection: '392(1)',  code: '1062' },
  lottery_comm_194G:       { newSection: '393(1)',  code: '1063' },
  cash_withdrawal_194N:    { newSection: '394(1)',  code: '1065' },
  vda_194S:                { newSection: '394(1)',  code: '1037' },
  royalty_194J:            { newSection: '393(1)',  code: '1027' },
}

const FY_OPTIONS = [
  { value: 'FY2025-26', label: 'FY 2025-26' },
  { value: 'FY2024-25', label: 'FY 2024-25' },
  { value: 'FY2023-24', label: 'FY 2023-24' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface TDSEntry {
  id:               string
  partyName:        string
  partyPAN:         string
  sectionId:        TDSSectionId
  amount:           string
  payeeType:        'individual_huf' | 'other'
  panAvailable:     boolean
  deductionDate:    string
  depositDate:      string
  returnFilingDate: string
  expanded:         boolean
  // Salary-specific (only used when sectionId === 'salary_192')
  salaryRegime:        ITaxRegime
  salaryAge:           AgeCategory
  salaryOtherIncome:   string
  salaryHRA:           string
  salaryLTA:           string
  salaryOtherExempt:   string
  salary80C:           string
  salary80D:           string
  salary80CCD1B:       string
  salary80CCD2:        string
  salaryOtherDed:      string
}

function blankEntry(): TDSEntry {
  return {
    id: nextId(),
    partyName: '',
    partyPAN: '',
    sectionId: 'professional_194J',
    amount: '',
    payeeType: 'individual_huf',
    panAvailable: true,
    deductionDate: '',
    depositDate: '',
    returnFilingDate: '',
    expanded: true,
    salaryRegime:      'new',
    salaryAge:         'below_60',
    salaryOtherIncome: '',
    salaryHRA:         '',
    salaryLTA:         '',
    salaryOtherExempt: '',
    salary80C:         '',
    salary80D:         '',
    salary80CCD1B:     '',
    salary80CCD2:      '',
    salaryOtherDed:    '',
  }
}

// ── PDF generation ────────────────────────────────────────────────────────────

function downloadPDF(
  deductorName: string,
  deductorTAN: string,
  fy: string,
  entries: TDSEntry[],
  results: ReturnType<typeof computeAllResults>,
) {
  const totals = results.totals
  const rows = entries.map((e, i) => {
    const r = results.perEntry[i]
    if (!r.tds) return ''
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${e.partyName || '—'}${e.partyPAN ? `<br/><small>PAN: ${e.partyPAN}</small>` : ''}</td>
        <td>Sec. ${r.tds.section.section}<br/><small>${r.tds.section.label}</small></td>
        <td class="num">${fmtINR(r.tds.amount)}</td>
        <td class="num">${r.tds.applicableRate}%</td>
        <td class="num">${fmtINR(r.tds.tdsAmount)}</td>
        <td class="num ${r.lateFees?.isDepositLate ? 'warn' : ''}">${(r.lateFees?.interest201Amount ?? 0) > 0 ? fmtINR(r.lateFees!.interest201Amount) : '—'}</td>
        <td class="num ${r.lateFees?.isReturnLate ? 'warn' : ''}">${(r.lateFees?.fee234EAmount ?? 0) > 0 ? fmtINR(r.lateFees!.fee234EAmount) : '—'}</td>
        <td class="num total">${fmtINR(r.totalLiability)}</td>
      </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>TDS Summary — ${deductorName || 'Statement'} — ${fy}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; margin: 24px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .sub { color: #666; font-size: 11px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #f5f5f5; border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 11px; }
  td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
  td.num { text-align: right; }
  td.warn { color: #d97706; font-weight: 600; }
  td.total { font-weight: 700; }
  tr:hover { background: #fafafa; }
  .summary { margin-top: 20px; background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 12px 16px; }
  .summary-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .summary-row.grand { font-weight: 700; font-size: 14px; border-top: 1px solid #c7d2fe; padding-top: 6px; margin-top: 6px; }
  small { color: #888; font-size: 10px; }
  @media print { body { margin: 10px; } }
</style></head><body>
<h1>TDS Statement — ${deductorName || 'Deductor'}</h1>
<div class="sub">Financial Year: ${fy}${deductorTAN ? ` &nbsp;|&nbsp; TAN: ${deductorTAN}` : ''} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-IN')}</div>
<table>
  <thead>
    <tr>
      <th>#</th><th>Party / Payee</th><th>Section</th><th>Amount</th>
      <th>Rate</th><th>TDS</th><th>Interest Sec. 201</th><th>Fee Sec. 234E</th><th>Total</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="summary">
  <div class="summary-row"><span>Total Payment Amount</span><span>${fmtINR(totals.amount)}</span></div>
  <div class="summary-row"><span>Total TDS</span><span>${fmtINR(totals.tds)}</span></div>
  <div class="summary-row"><span>Interest u/s 201(1A)</span><span>${fmtINR(totals.interest)}</span></div>
  <div class="summary-row"><span>Late Fee u/s 234E</span><span>${fmtINR(totals.lateFee)}</span></div>
  <div class="summary-row grand"><span>Grand Total Liability</span><span>${fmtINR(totals.total)}</span></div>
</div>
<p style="margin-top:24px; font-size:10px; color:#999;">Generated by Conceptra TDS Calculator. For reference only — verify with a qualified CA.</p>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print() }, 500)
}

// ── Excel download ────────────────────────────────────────────────────────────

function downloadExcel(
  deductorName: string,
  deductorTAN: string,
  fy: string,
  entries: TDSEntry[],
  results: ReturnType<typeof computeAllResults>,
) {
  const { totals } = results
  const headerMeta = [
    ['TDS Statement'],
    ['Deductor', deductorName || '—'],
    deductorTAN ? ['TAN', deductorTAN] : ['TAN', '—'],
    ['Financial Year', fy],
    ['Generated', new Date().toLocaleDateString('en-IN')],
    [],
  ]

  const colHeaders = [
    '#', 'Party / Payee', 'PAN', 'Section', 'Amount (₹)', 'Rate (%)', 'TDS Amount (₹)',
    'Interest Sec. 201(1A) (₹)', 'Late Fee Sec. 234E (₹)', 'Total Liability (₹)',
    'Date of Paid/Credited', 'TDS Deposit Date', 'Return Filing Date', 'Below Threshold?',
  ]

  const dataRows = entries.map((e, i) => {
    const r = results.perEntry[i]
    return [
      i + 1,
      e.partyName || '—',
      e.partyPAN || '—',
      r.tds ? `Sec. ${r.tds.section.section} — ${r.tds.section.label}` : '—',
      r.tds?.amount ?? 0,
      r.tds ? r.tds.applicableRate : '—',
      r.tds?.tdsAmount ?? 0,
      r.lateFees?.interest201Amount ?? 0,
      r.lateFees?.fee234EAmount ?? 0,
      r.totalLiability,
      e.deductionDate || '—',
      e.depositDate || '—',
      e.returnFilingDate || '—',
      r.tds && !r.tds.isAboveThreshold ? 'Yes — TDS not applicable' : '',
    ]
  })

  const totalsRow = [
    '', 'TOTAL', '', '', totals.amount, '', totals.tds,
    totals.interest, totals.lateFee, totals.total,
    '', '', '', '',
  ]

  const aoa = [...headerMeta, colHeaders, ...dataRows, [], totalsRow]

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [
    { wch: 4 }, { wch: 28 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 8 }, { wch: 14 },
    { wch: 22 }, { wch: 20 }, { wch: 16 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 24 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'TDS Statement')
  XLSX.writeFile(wb, `TDS_Statement_${fy.replace(/\//g, '-')}.xlsx`)
}

// ── Compute all results ───────────────────────────────────────────────────────

function computeAllResults(
  entries: TDSEntry[],
  sections: TDSSectionMeta[] = TDS_SECTIONS,
  itOverride?: Parameters<typeof computeSalaryTax>[1],
) {
  const perEntry = entries.map(e => {
    const amt = num(e.amount)
    const isSalary = e.sectionId === 'salary_192'
    const section  = sections.find(s => s.id === e.sectionId)!

    let tds: ReturnType<typeof computeTDS> = null

    if (isSalary && amt > 0) {
      const st = computeSalaryTax({
        regime:          e.salaryRegime,
        ageCategory:     e.salaryAge,
        grossSalary:     amt,
        otherIncome:     num(e.salaryOtherIncome),
        hraExemption:    num(e.salaryHRA),
        ltaExemption:    num(e.salaryLTA),
        otherExemptions: num(e.salaryOtherExempt),
        d80C:            num(e.salary80C),
        d80D:            num(e.salary80D),
        d80CCD1B:        num(e.salary80CCD1B),
        d80CCD2:         num(e.salary80CCD2),
        dOther:          num(e.salaryOtherDed),
      }, itOverride)
      tds = {
        section,
        amount:           amt,
        threshold:        null,
        isAboveThreshold: true,
        applicableRate:   st.effectiveRate,
        tdsAmount:        st.annualTax,
        noPanRate:        0,
        tdsAmountNoPan:   0,
        netToPayee:       amt - st.annualTax,
        salaryTax:        st,
      }
    } else if (!isSalary && amt > 0) {
      const effectivePAN = e.partyPAN.trim().length > 0 ? true : e.panAvailable
      tds = computeTDS({ sectionId: e.sectionId, amount: amt, payeeType: e.payeeType, panAvailable: effectivePAN }, sections)
    }

    const deductDate  = parseDate(e.deductionDate)
    const depositDate = parseDate(e.depositDate)
    const returnDate  = parseDate(e.returnFilingDate)

    const lateFees = deductDate && tds
      ? computeLateFees(tds.tdsAmount, deductDate, depositDate, returnDate)
      : null

    const totalLiability = (tds?.tdsAmount ?? 0) + (lateFees?.totalPenalty ?? 0)

    return { tds, lateFees, totalLiability }
  })

  const totals = perEntry.reduce(
    (acc, r) => ({
      amount:   acc.amount   + (r.tds?.amount    ?? 0),
      tds:      acc.tds      + (r.tds?.tdsAmount ?? 0),
      interest: acc.interest + (r.lateFees?.interest201Amount ?? 0),
      lateFee:  acc.lateFee  + (r.lateFees?.fee234EAmount     ?? 0),
      total:    acc.total    + r.totalLiability,
    }),
    { amount: 0, tds: 0, interest: 0, lateFee: 0, total: 0 },
  )

  return { perEntry, totals }
}

// ── Salary Form ───────────────────────────────────────────────────────────────

function SalaryForm({
  entry, st, onChange,
}: {
  entry:    TDSEntry
  st:       SalaryTaxResult | null
  onChange: (patch: Partial<TDSEntry>) => void
}) {
  const isOld = entry.salaryRegime === 'old'

  const ROW = 'grid grid-cols-1 sm:grid-cols-2 gap-3'
  const ROW3 = 'grid grid-cols-1 sm:grid-cols-3 gap-3'

  return (
    <div className="space-y-4">
      {/* Annual gross salary */}
      <Input
        label="Annual Gross Salary"
        prefix="₹" type="number" min="0"
        placeholder="e.g. 1200000"
        value={entry.amount}
        onChange={e => onChange({ amount: e.target.value })}
      />

      {/* Regime + Age */}
      <div className={ROW}>
        <div>
          <p className="label-base mb-2">Tax Regime</p>
          <div className="flex h-[42px]">
            {(['new', 'old'] as const).map(r => (
              <button key={r}
                onClick={() => onChange({ salaryRegime: r })}
                className={`flex-1 rounded-xl border text-xs font-medium transition-all first:rounded-r-none last:rounded-l-none ${
                  entry.salaryRegime === r
                    ? 'border-brand-300 bg-brand-50 text-brand-800 z-10'
                    : 'border-ink-200 text-ink-500 hover:border-ink-300 bg-white'
                }`}
              >
                {r === 'new' ? 'New Regime (Default)' : 'Old Regime'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label-base mb-2">Employee Age</p>
          <select
            value={entry.salaryAge}
            onChange={e => onChange({ salaryAge: e.target.value as AgeCategory })}
            className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-700 bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
          >
            <option value="below_60">Below 60 years</option>
            <option value="senior_60_79">Senior Citizen (60–79 years)</option>
            <option value="super_senior_80">Super Senior (80+ years)</option>
          </select>
        </div>
      </div>

      {/* Other income */}
      <Input
        label="Other Annual Income (interest, rent, etc.)"
        prefix="₹" type="number" min="0" placeholder="0"
        value={entry.salaryOtherIncome}
        onChange={e => onChange({ salaryOtherIncome: e.target.value })}
      />

      {/* Old regime exemptions */}
      {isOld && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Old Regime — Allowance Exemptions</p>
          <div className={ROW3}>
            <Input label="HRA Exemption" prefix="₹" type="number" min="0" placeholder="0"
              value={entry.salaryHRA} onChange={e => onChange({ salaryHRA: e.target.value })} />
            <Input label="LTA Exemption" prefix="₹" type="number" min="0" placeholder="0"
              value={entry.salaryLTA} onChange={e => onChange({ salaryLTA: e.target.value })} />
            <Input label="Other Exemptions" prefix="₹" type="number" min="0" placeholder="0"
              value={entry.salaryOtherExempt} onChange={e => onChange({ salaryOtherExempt: e.target.value })} />
          </div>
        </div>
      )}

      {/* Deductions */}
      <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-4 space-y-3">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest">Deductions</p>
        <div className={ROW}>
          <Input label="Extra NPS 80CCD(1B) — max ₹50,000" prefix="₹" type="number" min="0" placeholder="0"
            value={entry.salary80CCD1B} onChange={e => onChange({ salary80CCD1B: e.target.value })} />
          <Input
            label={`Employer NPS 80CCD(2) — ${entry.salaryRegime === 'new' ? '14%' : '10%'} of basic`}
            prefix="₹" type="number" min="0" placeholder="0"
            value={entry.salary80CCD2} onChange={e => onChange({ salary80CCD2: e.target.value })} />
        </div>
        {isOld && (
          <div className={ROW3}>
            <Input label="80C / 80CCC / 80CCD(1) — max ₹1,50,000" prefix="₹" type="number" min="0" placeholder="0"
              value={entry.salary80C} onChange={e => onChange({ salary80C: e.target.value })} />
            <Input label="80D — Health Insurance" prefix="₹" type="number" min="0" placeholder="0"
              value={entry.salary80D} onChange={e => onChange({ salary80D: e.target.value })} />
            <Input label="Other Chapter VI-A" prefix="₹" type="number" min="0" placeholder="0"
              value={entry.salaryOtherDed} onChange={e => onChange({ salaryOtherDed: e.target.value })} />
          </div>
        )}
      </div>

      {/* Tax Breakdown */}
      {st && num(entry.amount) > 0 && (
        <div className="rounded-xl border border-brand-100 bg-brand-50/20 overflow-hidden">
          <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-700 border-b border-brand-100 bg-brand-50/40">
            Tax Computation Breakdown — AY 2026-27
          </p>
          <div className="divide-y divide-brand-50 text-sm">
            {[
              { label: 'Gross Salary',            value: st.grossSalary,       indent: false },
              { label: `Less: Standard Deduction (${entry.salaryRegime === 'new' ? '₹75,000' : '₹50,000'})`, value: -st.stdDeduction, indent: true },
              ...(isOld && st.totalExemptions > 0
                ? [{ label: 'Less: HRA / LTA / Other Exemptions', value: -st.totalExemptions, indent: true }]
                : []),
              ...(num(entry.salaryOtherIncome) > 0
                ? [{ label: 'Add: Other Income', value: num(entry.salaryOtherIncome), indent: false }]
                : []),
              ...(st.totalDeductions > 0
                ? [{ label: 'Less: Chapter VI-A Deductions', value: -st.totalDeductions, indent: true }]
                : []),
              { label: 'Net Taxable Income', value: st.taxableIncome, indent: false, strong: true },
              { label: 'Income Tax on Slabs', value: st.slabTax, indent: false },
              ...(st.rebate87A > 0
                ? [{ label: 'Less: Rebate u/s 87A', value: -st.rebate87A, indent: true }]
                : []),
              ...(st.surcharge > 0
                ? [{ label: 'Add: Surcharge', value: st.surcharge, indent: false }]
                : []),
              { label: 'Add: 4% Health & Education Cess', value: st.cess, indent: false },
              { label: 'Annual Tax Payable', value: st.annualTax, indent: false, strong: true, highlight: true },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-2 ${row.highlight ? 'bg-brand-50' : ''}`}>
                <span className={`${row.indent ? 'pl-4 text-ink-500' : 'text-ink-700'} ${row.strong ? 'font-semibold text-ink-800' : ''}`}>
                  {row.label}
                </span>
                <span className={`font-mono text-sm tabular-nums ${
                  row.value < 0 ? 'text-teal-700' :
                  row.highlight ? 'font-bold text-brand-700 text-base' :
                  row.strong ? 'font-semibold text-ink-800' : 'text-ink-700'
                }`}>
                  {row.value < 0 ? `(${fmtINR(-row.value)})` : fmtINR(row.value)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-brand-100/50 border-t border-brand-200">
            <span className="text-sm font-bold text-brand-800">Monthly TDS (÷ 12)</span>
            <span className="text-xl font-bold text-brand-700 font-mono">{fmtINR(st.monthlyTDS)}</span>
          </div>
          {st.rebate87A > 0 && (
            <div className="px-4 py-2 bg-teal-50 border-t border-teal-100">
              <p className="text-xs text-teal-700">
                <CheckCircle className="inline-block mr-1 mb-0.5" size={11} />
                Rebate u/s 87A applied — {fmtINR(st.rebate87A)} deducted from tax.
                {entry.salaryRegime === 'new' && ' Effective zero-tax up to ₹12,00,000 taxable income.'}
              </p>
            </div>
          )}
        </div>
      )}

      {num(entry.amount) === 0 && (
        <div className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-xs text-ink-400 text-center">
          Enter annual gross salary above to compute income tax
        </div>
      )}
    </div>
  )
}

// ── Section Picker ────────────────────────────────────────────────────────────

function SectionPicker({
  value, sections, onChange,
}: {
  value: TDSSectionId
  sections: TDSSectionMeta[]
  onChange: (id: TDSSectionId) => void
}) {
  const current = sections.find(s => s.id === value)
  const extra   = SECTION_EXTRA[value]

  const [focus,  setFocus]  = useState<'old' | 'new' | 'code' | null>(null)
  const [query,  setQuery]  = useState('')
  const [hiIdx,  setHiIdx]  = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setFocus(null); setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    if (!focus) return sections
    const q = query.toLowerCase().trim()
    if (!q) return sections
    return sections.filter(s => {
      const ex = SECTION_EXTRA[s.id]
      if (focus === 'old')  return s.section.toLowerCase().includes(q)
      if (focus === 'new')  return (ex?.newSection ?? '').toLowerCase().includes(q)
      return (ex?.code ?? '').includes(q) || s.label.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
    })
  }, [focus, query, sections])

  useEffect(() => setHiIdx(0), [filtered])

  function pick(sec: TDSSectionMeta) {
    onChange(sec.id as TDSSectionId)
    setFocus(null); setQuery('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!focus) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHiIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHiIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[hiIdx]) pick(filtered[hiIdx])
    if (e.key === 'Escape')    { setFocus(null); setQuery('') }
  }

  const oldDisplay  = focus === 'old'  ? query : (current?.section ?? '')
  const newDisplay  = focus === 'new'  ? query : (extra?.newSection ?? '—')
  const codeDisplay = focus === 'code' ? query : (extra?.code ?? '—')

  const inputCls = (f: 'old' | 'new' | 'code') =>
    `w-full rounded-xl border px-3 py-2.5 text-sm transition-all focus:outline-none cursor-pointer ${
      focus === f
        ? 'border-brand-400 ring-1 ring-brand-100 bg-white cursor-text'
        : 'border-ink-200 bg-white hover:border-ink-300 text-ink-700'
    }`

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <p className="label-base mb-2">TDS Section</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-1">Old Section</p>
          <input value={oldDisplay} readOnly={focus !== 'old'}
            onClick={() => { setFocus('old'); setQuery('') }}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. 194J"
            className={inputCls('old')} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-1">New Section (ITA 2025)</p>
          <input value={newDisplay} readOnly={focus !== 'new'}
            onClick={() => { setFocus('new'); setQuery('') }}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. 393"
            className={inputCls('new')} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-1">Code / Description</p>
          <input value={codeDisplay} readOnly={focus !== 'code'}
            onClick={() => { setFocus('code'); setQuery('') }}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. 1027 or 'contractor'"
            className={inputCls('code')} />
        </div>
      </div>

      {focus && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl border border-ink-200 shadow-xl max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-400">No sections match "{query}"</p>
          ) : filtered.map((s, i) => {
            const ex = SECTION_EXTRA[s.id]
            return (
              <button key={s.id} type="button"
                onMouseEnter={() => setHiIdx(i)}
                onClick={() => pick(s)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  i === hiIdx ? 'bg-brand-50' : 'hover:bg-ink-50'
                } ${i > 0 ? 'border-t border-ink-50' : ''}`}
              >
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                  {s.section}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{s.label}</p>
                  <p className="text-xs text-ink-400 truncate">{s.desc}</p>
                </div>
                <div className="shrink-0 text-right space-y-0.5">
                  {ex && <p className="text-xs text-ink-400 font-mono">{ex.newSection}</p>}
                  {ex && <p className="text-[10px] text-ink-300">#{ex.code}</p>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Entry card ────────────────────────────────────────────────────────────────

function EntryCard({
  entry, index, result, sections,
  onChange, onDelete,
}: {
  entry:    TDSEntry
  index:    number
  result:   ReturnType<typeof computeAllResults>['perEntry'][number]
  sections: TDSSectionMeta[]
  onChange: (id: string, patch: Partial<TDSEntry>) => void
  onDelete: (id: string) => void
}) {
  const { tds, lateFees } = result
  const section = sections.find(s => s.id === entry.sectionId)!
  const isSalary = entry.sectionId === 'salary_192'
  const isBelowThreshold = tds !== null && !tds.isAboveThreshold && !isSalary
  const hasPAN = entry.partyPAN.trim().length > 0

  const deductDate = parseDate(entry.deductionDate)
  const depositDue  = deductDate ? getTDSDepositDueDate(deductDate) : null
  const returnDue   = deductDate ? getTDSReturnDueDate(deductDate) : null

  const set = (patch: Partial<TDSEntry>) => onChange(entry.id, patch)

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isBelowThreshold ? 'border-amber-200' : 'border-ink-100'}`}>
      {/* Card header */}
      <div className={`flex items-center gap-3 px-5 py-3 border-b ${isBelowThreshold ? 'bg-amber-50/60 border-amber-100' : 'bg-ink-50/60 border-ink-100'}`}>
        <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <input
          type="text"
          placeholder={isSalary ? 'Employee name' : 'Party / Vendor name'}
          value={entry.partyName}
          onChange={e => set({ partyName: e.target.value })}
          className="flex-1 text-sm font-semibold bg-transparent outline-none text-ink-800 placeholder:text-ink-300 min-w-0"
        />
        {isBelowThreshold && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
            <AlertCircle size={10} /> Below threshold — TDS not applicable
          </span>
        )}
        {isSalary && tds?.salaryTax && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-2 py-0.5 shrink-0">
            Monthly TDS: {fmtINR(tds.salaryTax.monthlyTDS)}
          </span>
        )}
        <button
          onClick={() => set({ expanded: !entry.expanded })}
          className="p-1 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
          title={entry.expanded ? 'Collapse' : 'Expand'}
        >
          {entry.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-1 rounded-lg text-ink-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Remove entry"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {entry.expanded && (
        <div className="p-5 space-y-4">
          {/* Employee / Party name + PAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isSalary ? 'Employee Name' : 'Party / Vendor Name'}
              placeholder={isSalary ? 'e.g. Rahul Sharma' : 'e.g. ABC Consultants Pvt Ltd'}
              value={entry.partyName}
              onChange={e => set({ partyName: e.target.value })}
            />
            <Input
              label="PAN (optional)"
              placeholder="AAAAA0000A"
              value={entry.partyPAN}
              onChange={e => set({ partyPAN: e.target.value.toUpperCase() })}
            />
          </div>

          {/* Section picker — 3-way lookup */}
          <SectionPicker
            value={entry.sectionId}
            sections={sections}
            onChange={id => set({ sectionId: id, amount: '' })}
          />

          {/* ── SALARY branch ── */}
          {isSalary ? (
            <SalaryForm entry={entry} st={tds?.salaryTax ?? null} onChange={set} />
          ) : (
            <div className="space-y-4">
              {/* Auto-populated section info + rates panel */}
              <div className="rounded-xl border border-ink-100 overflow-hidden">
                {/* Header: section description + threshold */}
                <div className="flex items-start gap-4 px-4 py-3 bg-ink-50/70 border-b border-ink-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-800">Sec. {section.section} — {section.label}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{section.desc}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {section.threshold !== null ? (
                      <>
                        <p className="text-[10px] uppercase tracking-widest text-ink-400">Threshold</p>
                        <p className="text-xs font-semibold text-amber-700 max-w-[200px] text-right leading-snug mt-0.5">
                          {section.thresholdNote ?? `₹${section.threshold.toLocaleString('en-IN')}`}
                        </p>
                      </>
                    ) : (
                      <span className="text-[11px] text-ink-400 border border-ink-200 bg-white rounded-full px-2 py-0.5">
                        No fixed threshold
                      </span>
                    )}
                  </div>
                </div>

                {/* Rate cards — click to switch payee type for Sec. 194C */}
                <div className="px-4 py-3 flex flex-wrap items-center gap-2">
                  {section.rates.map((r, i) => {
                    const isActive = !section.hasPayeeType || r.payeeType === entry.payeeType
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          section.hasPayeeType && r.payeeType &&
                          set({ payeeType: r.payeeType as 'individual_huf' | 'other' })
                        }
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all
                          ${section.hasPayeeType ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
                          ${isActive
                            ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-100 shadow-sm'
                            : 'border-ink-200 bg-white opacity-50 hover:opacity-70'
                          }`}
                      >
                        <span className="text-xs text-ink-500 whitespace-nowrap">{r.label}</span>
                        <span className={`text-xl font-black tabular-nums ${isActive ? 'text-brand-700' : 'text-ink-400'}`}>
                          {r.rate}%
                        </span>
                        {isActive && section.hasPayeeType && <CheckCircle size={13} className="text-brand-500 shrink-0" />}
                      </button>
                    )
                  })}

                  {/* No PAN rate */}
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/60 px-3 py-2">
                    <span className="text-xs text-red-400 whitespace-nowrap">No PAN (Sec. 206AA)</span>
                    <span className="text-xl font-black text-red-500">{section.noPanRate}%</span>
                  </div>
                </div>

                {/* Notes */}
                {section.notes.length > 0 && (
                  <div className="px-4 pb-3 border-t border-ink-50 pt-2 space-y-0.5">
                    {section.notes.map((n, i) => (
                      <p key={i} className="text-[11px] text-ink-400">• {n}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount + PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Payment / Invoice Amount"
                  prefix="₹" type="number" min="0"
                  placeholder="e.g. 50000"
                  value={entry.amount}
                  onChange={e => set({ amount: e.target.value })}
                />

                {hasPAN ? (
                  <div className="flex flex-col justify-end pb-0.5">
                    <p className="label-base mb-2">PAN Status</p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                      <CheckCircle size={14} /> PAN on record — {entry.partyPAN}
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="label-base mb-2">PAN Furnished?</p>
                    <div className="flex h-[42px]">
                      {([
                        { value: true,  label: 'Yes — PAN given' },
                        { value: false, label: 'No PAN (Sec. 206AA)' },
                      ] as const).map(opt => (
                        <button key={String(opt.value)}
                          type="button"
                          onClick={() => set({ panAvailable: opt.value })}
                          className={`flex-1 px-3 text-xs font-medium border transition-all first:rounded-l-xl last:rounded-r-xl ${
                            entry.panAvailable === opt.value
                              ? opt.value
                                ? 'border-brand-400 bg-brand-50 text-brand-800 z-10 shadow-sm'
                                : 'border-red-400 bg-red-50 text-red-700 z-10 shadow-sm'
                              : 'border-ink-200 text-ink-500 bg-white hover:border-ink-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Live TDS result */}
              {num(entry.amount) > 0 && tds ? (
                tds.isAboveThreshold ? (
                  <div className="rounded-xl border border-brand-100 overflow-hidden">
                    {/* Core numbers */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-brand-50 border-b border-brand-100">
                      {([
                        { label: 'Taxable Amount', value: fmtINR(tds.amount), cls: '' },
                        { label: 'TDS Rate Applied', value: `${tds.applicableRate}%`, cls: '' },
                        { label: 'TDS Deducted', value: fmtINR(tds.tdsAmount), cls: 'bg-brand-50' },
                        { label: 'Net to Payee', value: fmtINR(tds.netToPayee), cls: '' },
                      ] as { label: string; value: string; cls: string }[]).map((col, i) => (
                        <div key={i} className={`px-3 py-3 text-center ${col.cls}`}>
                          <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-1">{col.label}</p>
                          <p className={`font-bold ${i === 2 ? 'text-brand-700 text-xl' : 'text-ink-700 text-sm'}`}>{col.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Late fees — only if dates entered and late */}
                    {(lateFees?.totalPenalty ?? 0) > 0 && (
                      <>
                        <div className="grid grid-cols-2 divide-x divide-amber-100 bg-amber-50/40 border-b border-amber-100">
                          <div className="px-3 py-2.5 text-center">
                            <p className="text-[10px] uppercase tracking-widest text-amber-500 mb-0.5">Interest Sec. 201(1A)</p>
                            <p className="text-sm font-bold text-amber-700">{fmtINR(lateFees!.interest201Amount)}</p>
                            <p className="text-[10px] text-amber-400">{lateFees!.interest201Months} month(s) × 1.5%</p>
                          </div>
                          <div className="px-3 py-2.5 text-center">
                            <p className="text-[10px] uppercase tracking-widest text-red-400 mb-0.5">Late Fee Sec. 234E</p>
                            <p className="text-sm font-bold text-red-600">{fmtINR(lateFees!.fee234EAmount)}</p>
                            <p className="text-[10px] text-red-400">{lateFees!.fee234EDays} day(s) × ₹200</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5 bg-ink-50">
                          <span className="text-xs font-semibold text-ink-600">Grand Total Payable</span>
                          <span className="text-lg font-bold text-brand-700">{fmtINR(result.totalLiability)}</span>
                        </div>
                      </>
                    )}

                    {/* Alerts */}
                    {((!hasPAN && !entry.panAvailable) || ((hasPAN || entry.panAvailable) && tds.noPanRate > tds.applicableRate)) && (
                      <div className="px-3 py-2 border-t border-ink-50 flex flex-wrap gap-2">
                        {!hasPAN && !entry.panAvailable && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                            <AlertCircle size={10} /> No PAN — deducting at {tds.noPanRate}% u/s 206AA instead of {tds.applicableRate}%
                          </span>
                        )}
                        {(hasPAN || entry.panAvailable) && tds.noPanRate > tds.applicableRate && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-ink-500 bg-ink-50 border border-ink-200 rounded-full px-2 py-0.5">
                            <Info size={10} /> Without PAN this would be {fmtINR(tds.tdsAmountNoPan)} @ {tds.noPanRate}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Below threshold */
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 flex items-start gap-3">
                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Below Threshold — TDS Not Applicable</p>
                      <p className="text-xs text-amber-600 mt-1">
                        {fmtINR(tds.amount)} is below the threshold of{' '}
                        {section.thresholdNote ?? fmtINR(section.threshold ?? 0)}.
                        TDS becomes applicable once the threshold is crossed.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-xs text-ink-400 text-center">
                  Enter payment amount above — TDS will be computed instantly
                </div>
              )}
            </div>
          )}

          {/* Date row — common to both salary and non-salary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label-base block mb-1.5">{isSalary ? 'Month of Salary' : 'Date of Paid / Credited'}</label>
              <input type="date" value={entry.deductionDate}
                onChange={e => set({ deductionDate: e.target.value })}
                className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-700 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 bg-white" />
              {depositDue && (
                <p className="mt-1 text-[11px] text-ink-400">Deposit due: <span className="font-medium">{fmtDate(depositDue)}</span></p>
              )}
            </div>
            <div>
              <label className="label-base block mb-1.5">Date of TDS Deposit</label>
              <input type="date" value={entry.depositDate}
                onChange={e => set({ depositDate: e.target.value })}
                className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-1 bg-white ${
                  lateFees?.isDepositLate
                    ? 'border-amber-300 text-amber-700 focus:border-amber-400 focus:ring-amber-100'
                    : 'border-ink-200 text-ink-700 focus:border-brand-400 focus:ring-brand-100'
                }`} />
              {lateFees?.isDepositLate && (
                <p className="mt-1 text-[11px] text-amber-600 font-medium">Late by {lateFees.interest201Months} month(s)</p>
              )}
            </div>
            <div>
              <label className="label-base block mb-1.5">TDS Return Filing Date</label>
              <input type="date" value={entry.returnFilingDate}
                onChange={e => set({ returnFilingDate: e.target.value })}
                className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-1 bg-white ${
                  lateFees?.isReturnLate
                    ? 'border-red-300 text-red-700 focus:border-red-400 focus:ring-red-100'
                    : 'border-ink-200 text-ink-700 focus:border-brand-400 focus:ring-brand-100'
                }`} />
              {returnDue && (
                <p className="mt-1 text-[11px] text-ink-400">Return due: <span className="font-medium">{fmtDate(returnDue)}</span></p>
              )}
              {lateFees?.isReturnLate && (
                <p className="mt-1 text-[11px] text-red-600 font-medium">Late by {lateFees.fee234EDays} day(s)</p>
              )}
            </div>
          </div>

          {/* Late-fee summary for salary entries */}
          {isSalary && (lateFees?.totalPenalty ?? 0) > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {lateFees?.isDepositLate && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-center">
                  <p className="text-[11px] text-amber-600 mb-0.5">Interest Sec. 201(1A)</p>
                  <p className="text-sm font-bold text-amber-700">{fmtINR(lateFees.interest201Amount)}</p>
                  <p className="text-[10px] text-amber-500">{lateFees.interest201Months} month(s) × 1.5%</p>
                </div>
              )}
              {lateFees?.isReturnLate && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-center">
                  <p className="text-[11px] text-red-600 mb-0.5">Late Fee Sec. 234E</p>
                  <p className="text-sm font-bold text-red-700">{fmtINR(lateFees.fee234EAmount)}</p>
                  <p className="text-[10px] text-red-400">{lateFees.fee234EDays} day(s) × ₹200</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TDSCalculator() {
  const taxConfig                = useTaxConfig()
  const liveSections: TDSSectionMeta[] = taxConfig?.tds_sections ?? TDS_SECTIONS

  const [fy, setFY]             = useState('FY2025-26')
  const [deductorName, setName] = useState('')
  const [deductorTAN, setTAN]   = useState('')
  const [entries, setEntries]   = useState<TDSEntry[]>([blankEntry()])
  const [dlOpen, setDlOpen]     = useState(false)
  const dlRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dlRef.current && !dlRef.current.contains(e.target as Node)) setDlOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const results = useMemo(
    () => computeAllResults(entries, liveSections, taxConfig?.income_tax),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, liveSections],
  )

  const addEntry = () =>
    setEntries(prev => [...prev, blankEntry()])

  const deleteEntry = (id: string) =>
    setEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev)

  const updateEntry = (id: string, patch: Partial<TDSEntry>) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))

  const collapseAll = () =>
    setEntries(prev => prev.map(e => ({ ...e, expanded: false })))

  const expandAll = () =>
    setEntries(prev => prev.map(e => ({ ...e, expanded: true })))

  const { totals } = results
  const hasData = totals.amount > 0

  return (
    <div className="space-y-5">

      {/* Global controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-48">
            <Select label="Financial Year" value={fy} options={FY_OPTIONS}
              onChange={e => setFY(e.target.value)} />
          </div>
          <div className="flex-1 min-w-48">
            <Input label="Deductor Name (optional)" placeholder="Your company / firm name"
              value={deductorName} onChange={e => setName(e.target.value)} />
          </div>
          <div className="w-44">
            <Input label="TAN of Deductor (optional)" placeholder="AAAA00000A"
              value={deductorTAN} onChange={e => setTAN(e.target.value.toUpperCase())} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={collapseAll}
              className="px-3 py-2 text-xs font-medium text-ink-500 border border-ink-200 rounded-xl hover:border-ink-300 transition-colors">
              Collapse all
            </button>
            <button onClick={expandAll}
              className="px-3 py-2 text-xs font-medium text-ink-500 border border-ink-200 rounded-xl hover:border-ink-300 transition-colors">
              Expand all
            </button>
            <div ref={dlRef} className="relative">
              <button
                onClick={() => hasData && setDlOpen(o => !o)}
                disabled={!hasData}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all active:scale-95
                  disabled:opacity-40 disabled:cursor-not-allowed
                  bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-200"
              >
                <Download size={15} /> Download <ChevronDown size={14} />
              </button>
              {dlOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-20 w-44 bg-white rounded-xl border border-ink-100 shadow-lg overflow-hidden">
                  <button
                    onClick={() => { downloadPDF(deductorName, deductorTAN, fy, entries, results); setDlOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
                  >
                    <FileText size={15} className="text-brand-500" /> PDF
                  </button>
                  <button
                    onClick={() => { downloadExcel(deductorName, deductorTAN, fy, entries, results); setDlOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 transition-colors border-t border-ink-50"
                  >
                    <FileSpreadsheet size={15} className="text-teal-500" /> Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Entries */}
      <div className="space-y-4">
        {entries.map((entry, i) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            index={i}
            result={results.perEntry[i]}
            sections={liveSections}
            onChange={updateEntry}
            onDelete={deleteEntry}
          />
        ))}
      </div>

      {/* Add entry button */}
      <button
        onClick={addEntry}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-ink-200
          text-sm font-medium text-ink-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
      >
        <Plus size={16} /> Add Another Entry
      </button>

      {/* Summary */}
      {hasData && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
              Summary — {entries.filter((_, i) => results.perEntry[i].tds?.isAboveThreshold).length} of {entries.length} entries have TDS
            </p>
          </div>

          {/* Summary table */}
          <div className="bg-white rounded-xl border border-ink-100 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50">
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Party</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Section</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">TDS</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Interest</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Late Fee</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-widest text-ink-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => {
                  const r = results.perEntry[i]
                  if (!r.tds) return (
                    <tr key={e.id} className="border-b border-ink-50 opacity-40">
                      <td className="px-4 py-2.5 text-ink-400">{i + 1}</td>
                      <td className="px-4 py-2.5 text-ink-400">{e.partyName || '—'}</td>
                      <td className="px-4 py-2.5 text-ink-400" colSpan={6}>No amount entered</td>
                    </tr>
                  )
                  return (
                    <tr key={e.id} className="border-b border-ink-50 hover:bg-ink-50/40">
                      <td className="px-4 py-2.5 text-ink-500">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-ink-700">{e.partyName || <span className="text-ink-300 italic">Unnamed</span>}</td>
                      <td className="px-4 py-2.5 text-ink-500 text-xs">Sec. {r.tds.section.section} — {r.tds.section.label.split(' (')[0]}</td>
                      <td className="px-4 py-2.5 text-right text-ink-700">{fmtINR(r.tds.amount)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-ink-800">{fmtINR(r.tds.tdsAmount)}</td>
                      <td className={`px-4 py-2.5 text-right text-sm font-medium ${r.lateFees?.interest201Amount ? 'text-amber-600' : 'text-ink-300'}`}>
                        {r.lateFees?.interest201Amount ? fmtINR(r.lateFees.interest201Amount) : '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-right text-sm font-medium ${r.lateFees?.fee234EAmount ? 'text-red-500' : 'text-ink-300'}`}>
                        {r.lateFees?.fee234EAmount ? fmtINR(r.lateFees.fee234EAmount) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-brand-700">{fmtINR(r.totalLiability)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink-200 bg-ink-50">
                  <td colSpan={3} className="px-4 py-3 font-bold text-ink-800">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-ink-700">{fmtINR(totals.amount)}</td>
                  <td className="px-4 py-3 text-right font-bold text-ink-800">{fmtINR(totals.tds)}</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-600">{totals.interest > 0 ? fmtINR(totals.interest) : '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-500">{totals.lateFee > 0 ? fmtINR(totals.lateFee) : '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-brand-700 text-base">{fmtINR(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Totals cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total TDS',         value: totals.tds,      color: 'text-ink-800',   bg: '' },
              { label: 'Net to Payees',      value: totals.amount - totals.tds, color: 'text-ink-700', bg: '' },
              { label: 'Interest Sec. 201(1A)', value: totals.interest, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
              { label: 'Late Fee Sec. 234E',    value: totals.lateFee,  color: 'text-red-600',   bg: 'bg-red-50 border-red-200' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl border px-4 py-3 ${item.bg || 'border-ink-100'}`}>
                <p className="text-xs text-ink-400 mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{fmtINR(item.value)}</p>
              </div>
            ))}
          </div>

          {(totals.interest > 0 || totals.lateFee > 0) && (
            <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <strong>Grand total payable to government: {fmtINR(totals.total)}</strong>
                {' '}(TDS {fmtINR(totals.tds)} + Interest {fmtINR(totals.interest)} + Late fee {fmtINR(totals.lateFee)})
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Footnotes */}
      <Card padding="sm">
        <div className="flex gap-2">
          <Info size={13} className="text-ink-400 shrink-0 mt-0.5" />
          <div className="text-xs text-ink-400 space-y-1">
            <p><strong>Interest Sec. 201(1A):</strong> 1.5% per month (part month = full month) from deduction date to deposit date for late deposit.</p>
            <p><strong>Late fee Sec. 234E:</strong> ₹200/day from TDS return due date to actual filing date, capped at TDS amount for the period.</p>
            <p><strong>Cess & surcharge:</strong> Not applicable on TDS for domestic residents under Sections 194C/H/I/J. Only applies under Sec. 192 (salary) and for non-residents (Sec. 195).</p>
            <p><strong>Deposit due dates:</strong> 7th of next month for most sections; 30th April for March deductions.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
