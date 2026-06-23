'use client'

import { useState, useMemo, useRef, useEffect, useId } from 'react'
import { Plus, Trash2, Download, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, FileText, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Input, Select, Card } from '@/components/ui'
import {
  TDS_SECTIONS, computeTDS, computeLateFees, fmtDate,
  getTDSDepositDueDate, getTDSReturnDueDate,
  type TDSSectionId,
} from '@/lib/logic/tds'

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

const CATEGORY_ORDER = ['Salary', 'Business Payments', 'Rent', 'Interest & Dividends', 'Property', 'Other']

const SECTION_OPTIONS = (() => {
  const grouped: Record<string, { value: string; label: string }[]> = {}
  for (const s of TDS_SECTIONS) {
    if (!grouped[s.category]) grouped[s.category] = []
    grouped[s.category].push({ value: s.id, label: `Sec. ${s.section} — ${s.label}` })
  }
  return CATEGORY_ORDER.flatMap(cat =>
    (grouped[cat] ?? []).map((opt, i) => ({
      ...opt,
      label: i === 0 && grouped[cat].length > 1 ? `── ${cat} ── ${opt.label}` : opt.label,
    }))
  )
})()

const FY_OPTIONS = [
  { value: 'FY2025-26', label: 'FY 2025-26' },
  { value: 'FY2024-25', label: 'FY 2024-25' },
  { value: 'FY2023-24', label: 'FY 2023-24' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface TDSEntry {
  id:               string
  partyName:        string
  partyPAN:         string   // optional — auto-implies panAvailable when filled
  sectionId:        TDSSectionId
  amount:           string
  payeeType:        'individual_huf' | 'other'
  panAvailable:     boolean  // used only when partyPAN is empty
  deductionDate:    string   // YYYY-MM-DD  (date of payment / credit)
  depositDate:      string   // YYYY-MM-DD
  returnFilingDate: string   // YYYY-MM-DD
  expanded:         boolean
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

function computeAllResults(entries: TDSEntry[]) {
  const perEntry = entries.map(e => {
    const amt = num(e.amount)
    const effectivePAN = e.partyPAN.trim().length > 0 ? true : e.panAvailable
    const tds = amt > 0
      ? computeTDS({ sectionId: e.sectionId, amount: amt, payeeType: e.payeeType, panAvailable: effectivePAN })
      : null

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

// ── Entry card ────────────────────────────────────────────────────────────────

function EntryCard({
  entry, index, result,
  onChange, onDelete,
}: {
  entry:    TDSEntry
  index:    number
  result:   ReturnType<typeof computeAllResults>['perEntry'][number]
  onChange: (id: string, patch: Partial<TDSEntry>) => void
  onDelete: (id: string) => void
}) {
  const { tds, lateFees } = result
  const section = TDS_SECTIONS.find(s => s.id === entry.sectionId)!
  const isBelowThreshold = tds !== null && !tds.isAboveThreshold
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
          placeholder="Party / Vendor name"
          value={entry.partyName}
          onChange={e => set({ partyName: e.target.value })}
          className="flex-1 text-sm font-semibold bg-transparent outline-none text-ink-800 placeholder:text-ink-300 min-w-0"
        />
        {isBelowThreshold && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
            <AlertCircle size={10} /> Below threshold — TDS not applicable
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
          {/* Party name + PAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Party / Vendor Name"
              placeholder="e.g. ABC Consultants Pvt Ltd"
              value={entry.partyName}
              onChange={e => set({ partyName: e.target.value })}
            />
            <Input
              label="PAN of Party (optional)"
              placeholder="AAAAA0000A"
              value={entry.partyPAN}
              onChange={e => set({ partyPAN: e.target.value.toUpperCase() })}
            />
          </div>

          {/* Row 1: Section + Amount + Payee type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Select
                label="TDS Section"
                value={entry.sectionId}
                options={SECTION_OPTIONS}
                onChange={e => set({ sectionId: e.target.value as TDSSectionId })}
              />
            </div>
            <div>
              <Input
                label="Payment / Invoice Amount"
                prefix="₹" type="number" min="0"
                placeholder="e.g. 50000"
                value={entry.amount}
                onChange={e => set({ amount: e.target.value })}
              />
            </div>
            <div>
              <p className="label-base mb-2">Payee Type</p>
              <div className="flex gap-2 h-[42px]">
                {([
                  { value: 'individual_huf', label: 'Ind / HUF' },
                  { value: 'other',           label: 'Co / Firm' },
                ] as const).map(opt => (
                  <button key={opt.value}
                    onClick={() => set({ payeeType: opt.value })}
                    className={`flex-1 rounded-xl border text-xs font-medium transition-all ${
                      entry.payeeType === opt.value
                        ? 'border-brand-300 bg-brand-50 text-brand-800'
                        : 'border-ink-200 text-ink-500 hover:border-ink-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section info + PAN row */}
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0 rounded-xl border border-ink-100 bg-ink-50 px-3 py-2">
              <p className="text-xs font-semibold text-ink-700">{section.label}</p>
              <p className="text-xs text-ink-400 mt-0.5">{section.desc}</p>
              {section.thresholdNote && (
                <p className="text-xs text-amber-600 mt-1">ℹ {section.thresholdNote}</p>
              )}
            </div>
            {hasPAN ? (
              <div className="flex items-end pb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <CheckCircle size={13} /> PAN on record
                </span>
              </div>
            ) : (
              <div className="shrink-0">
                <p className="label-base mb-2">PAN Furnished</p>
                <div className="flex h-[42px]">
                  {([
                    { value: true,  label: 'Yes — PAN given' },
                    { value: false, label: 'No PAN (Sec. 206AA)' },
                  ] as const).map(opt => (
                    <button key={String(opt.value)}
                      onClick={() => set({ panAvailable: opt.value })}
                      className={`px-3 text-xs font-medium border transition-all first:rounded-l-xl last:rounded-r-xl ${
                        entry.panAvailable === opt.value
                          ? opt.value
                            ? 'border-brand-300 bg-brand-50 text-brand-800 z-10'
                            : 'border-red-300 bg-red-50 text-red-700 z-10'
                          : 'border-ink-200 text-ink-500 hover:border-ink-300 bg-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label-base block mb-1.5">Date of Paid / Credited</label>
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

          {/* Result row */}
          {tds && (
            <div className={`rounded-xl border overflow-hidden ${tds.isAboveThreshold ? '' : 'opacity-60'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-ink-100 border-b border-ink-100 bg-ink-50/50">
                {[
                  { label: 'TDS Rate',    value: `${tds.applicableRate}%`,       sub: tds.isAboveThreshold ? 'Applicable' : 'Below threshold' },
                  { label: 'TDS Amount',  value: fmtINR(tds.tdsAmount),          sub: `Net to payee: ${fmtINR(tds.netToPayee)}` },
                  { label: 'Interest Sec. 201(1A)', value: lateFees?.interest201Amount ? fmtINR(lateFees.interest201Amount) : '—',
                    sub: lateFees?.interest201Amount ? `${lateFees.interest201Months} month(s) × 1.5%` : 'No late deposit', warn: lateFees?.isDepositLate },
                  { label: 'Late Fee Sec. 234E', value: lateFees?.fee234EAmount ? fmtINR(lateFees.fee234EAmount) : '—',
                    sub: lateFees?.fee234EAmount ? `${lateFees.fee234EDays} day(s) × ₹200` : 'Return filed on time', warn: lateFees?.isReturnLate },
                  { label: 'Total Liability', value: fmtINR(result.totalLiability), sub: 'TDS + Interest + Fee', total: true },
                ].map((col, i) => (
                  <div key={i} className="px-3 py-2.5 text-center">
                    <p className="text-[11px] text-ink-400 mb-0.5">{col.label}</p>
                    <p className={`text-sm font-bold ${col.total ? 'text-brand-700' : col.warn ? 'text-amber-600' : 'text-ink-800'}`}>
                      {col.value}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${col.warn ? 'text-amber-500' : 'text-ink-400'}`}>{col.sub}</p>
                  </div>
                ))}
              </div>

              {/* Threshold + PAN alerts */}
              <div className="px-3 py-2 flex flex-wrap gap-2">
                {!tds.isAboveThreshold && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-2 py-0.5">
                    <CheckCircle size={10} /> Below threshold — TDS not applicable
                  </span>
                )}
                {!entry.panAvailable && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                    <AlertCircle size={10} /> No PAN — TDS @ {tds.noPanRate}% (Sec. 206AA)
                  </span>
                )}
                {entry.panAvailable && tds.tdsAmountNoPan > tds.tdsAmount && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    <AlertCircle size={10} /> Without PAN would be {fmtINR(tds.tdsAmountNoPan)} @ {tds.noPanRate}%
                  </span>
                )}
              </div>
            </div>
          )}

          {!tds && num(entry.amount) === 0 && (
            <div className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-xs text-ink-400 text-center">
              Enter payment amount to compute TDS
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TDSCalculator() {
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

  const results = useMemo(() => computeAllResults(entries), [entries])

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
