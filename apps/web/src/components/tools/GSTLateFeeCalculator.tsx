// 'use client'

// import { useState, useEffect } from 'react'
// import { Info, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
// import { Input, Select, Card } from '@/components/ui'
// import {
//   calcLateFee, getDefaultDueDate,
//   RETURN_OPTIONS,
//   type LateFeeInput, type LateFeeResult,
//   type ReturnType, type TaxpayerType,
// } from '@/lib/logic/gst-late-fee'

// // ── Helpers ────────────────────────────────────────────────────────────────
// function fmt(n: number) {
//   return new Intl.NumberFormat('en-IN', {
//     style: 'currency', currency: 'INR',
//     minimumFractionDigits: 2, maximumFractionDigits: 2,
//   }).format(n)
// }

// function fmtDate(iso: string) {
//   return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
// }

// // ── Toggle pills ───────────────────────────────────────────────────────────
// function Pills<T extends string>({
//   label, options, value, onChange,
// }: {
//   label: string
//   options: { value: T; label: string }[]
//   value: T
//   onChange: (v: T) => void
// }) {
//   return (
//     <div>
//       <p className="label-base mb-1.5">{label}</p>
//       <div className="flex bg-ink-100 rounded-xl p-1 gap-1 border border-ink-200">
//         {options.map(o => (
//           <button
//             key={o.value}
//             onClick={() => onChange(o.value)}
//             className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
//               value === o.value
//                 ? 'bg-white text-ink-900 shadow-sm'
//                 : 'text-ink-500 hover:text-ink-700'
//             }`}
//           >
//             {o.label}
//           </button>
//         ))}
//       </div>
//     </div>
//   )
// }

// // ── Result row ─────────────────────────────────────────────────────────────
// function ResultRow({ label, value, sub, highlight = false }: {
//   label: string; value: string; sub?: string; highlight?: boolean
// }) {
//   return (
//     <div className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${highlight ? 'bg-brand-600' : 'bg-ink-50'}`}>
//       <div>
//         <p className={`text-xs font-medium ${highlight ? 'text-brand-100' : 'text-ink-500'}`}>{label}</p>
//         {sub && <p className={`text-xs mt-0.5 ${highlight ? 'text-brand-200' : 'text-ink-400'}`}>{sub}</p>}
//       </div>
//       <p className={`font-mono font-semibold ${highlight ? 'text-white text-base' : 'text-ink-800 text-sm'}`}>{value}</p>
//     </div>
//   )
// }

// // ── Main ───────────────────────────────────────────────────────────────────
// export function GSTLateFeeCalculator() {
//   const today = new Date().toISOString().split('T')[0]

//   const [input, setInput] = useState<LateFeeInput>({
//     returnType:   'GSTR3B',
//     dueDate:      getDefaultDueDate(),
//     filingDate:   today,
//     isNil:        false,
//     taxpayerType: 'regular',
//     taxLiability: 0,
//     itcAvailable: 0,
//     turnover:     0,
//   })

//   const [result, setResult] = useState<LateFeeResult | null>(null)

//   useEffect(() => {
//     if (input.dueDate && input.filingDate) {
//       setResult(calcLateFee(input))
//     }
//   }, [input])

//   const set = <K extends keyof LateFeeInput>(k: K, v: LateFeeInput[K]) =>
//     setInput(prev => ({ ...prev, [k]: v }))

//   const onTime = result && result.daysLate === 0

//   return (
//     <div className="max-w-3xl mx-auto space-y-5">

//       {/* ── Inputs ── */}
//       <Card>
//         <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-4">Return Details</p>

//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
//           <Select
//             label="Return Type"
//             value={input.returnType}
//             options={RETURN_OPTIONS as unknown as { value: string; label: string }[]}
//             onChange={e => set('returnType', e.target.value as ReturnType)}
//           />
//           <Input
//             label="Due Date"
//             type="date"
//             value={input.dueDate}
//             onChange={e => set('dueDate', e.target.value)}
//           />
//           <Input
//             label="Date of Filing"
//             type="date"
//             value={input.filingDate}
//             onChange={e => set('filingDate', e.target.value)}
//           />
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
//           <Pills
//             label="Return Category"
//             value={input.isNil ? 'nil' : 'normal'}
//             options={[
//               { value: 'normal', label: 'Regular' },
//               { value: 'nil',    label: 'NIL Return' },
//             ]}
//             onChange={v => set('isNil', v === 'nil')}
//           />
//           <Pills
//             label="Taxpayer Type"
//             value={input.taxpayerType}
//             options={[
//               { value: 'regular',     label: 'Regular' },
//               { value: 'composition', label: 'Composition' },
//               { value: 'sme',         label: 'SME/MSME' },
//             ]}
//             onChange={v => set('taxpayerType', v as TaxpayerType)}
//           />
//         </div>

//         <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 transition-opacity ${input.isNil ? 'opacity-40 pointer-events-none' : ''}`}>
//           <Input
//             label="Tax Liability (₹)"
//             type="number" min="0" step="0.01" prefix="₹"
//             value={input.taxLiability || ''}
//             placeholder="0.00"
//             onChange={e => set('taxLiability', parseFloat(e.target.value) || 0)}
//           />
//           <Input
//             label="ITC Available (₹)"
//             type="number" min="0" step="0.01" prefix="₹"
//             value={input.itcAvailable || ''}
//             placeholder="0.00"
//             onChange={e => set('itcAvailable', parseFloat(e.target.value) || 0)}
//           />
//           <Input
//             label="Annual Turnover (₹)"
//             type="number" min="0" prefix="₹"
//             value={input.turnover || ''}
//             placeholder="For cap calc"
//             onChange={e => set('turnover', parseFloat(e.target.value) || 0)}
//           />
//         </div>
//       </Card>

//       {/* ── Result ── */}
//       {result && (
//         <div className="space-y-4 animate-fade-up">

//           {/* On time */}
//           {onTime && (
//             <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
//               <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
//               <div>
//                 <p className="font-semibold text-green-800 text-sm">Filed on time!</p>
//                 <p className="text-green-600 text-xs mt-0.5">No late fees or interest applicable.</p>
//               </div>
//             </div>
//           )}

//           {/* Late */}
//           {!onTime && (
//             <>
//               {/* Days late badge + date range */}
//               <div className="flex items-center gap-3 flex-wrap">
//                 <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
//                   <Clock size={12} className="text-orange-600" />
//                   <span className="text-orange-700 text-xs font-semibold">{result.daysLate} day{result.daysLate !== 1 ? 's' : ''} late</span>
//                 </div>
//                 <span className="text-ink-400 text-xs">
//                   Due {fmtDate(input.dueDate)} → Filed {fmtDate(input.filingDate)}
//                 </span>
//                 {result.isCapped && (
//                   <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-medium">
//                     Fee capped
//                   </span>
//                 )}
//               </div>

//               {/* Summary cards */}
//               <div className="grid grid-cols-2 gap-3">
//                 <Card padding="sm" className="border-brand-100 bg-brand-50">
//                   <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">Total Late Fee</p>
//                   <p className="font-mono text-lg font-semibold text-brand-800">{fmt(result.totalFee)}</p>
//                   <p className="text-xs text-brand-500 mt-0.5">
//                     {result.daysLate} days × ₹{(result.cgstFee + result.sgstFee > 0 ? (result.rawCGST + result.rawSGST) / result.daysLate : 0).toFixed(0)}/day
//                     {result.isCapped ? ' (capped)' : ''}
//                   </p>
//                 </Card>
//                 <Card padding="sm" className="border-orange-100 bg-orange-50">
//                   <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1">Interest @ {result.interestRate}% p.a.</p>
//                   <p className="font-mono text-lg font-semibold text-orange-800">{fmt(result.interest)}</p>
//                   <p className="text-xs text-orange-500 mt-0.5 truncate">{result.interestNote}</p>
//                 </Card>
//               </div>

//               {/* Breakdown */}
//               <Card padding="sm">
//                 <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Breakdown</p>
//                 <div className="space-y-1.5">
//                   <ResultRow
//                     label="CGST Late Fee"
//                     value={fmt(result.cgstFee)}
//                     sub={result.cgstCap !== null && result.rawCGST > result.cgstCap
//                       ? `Capped at ${fmt(result.cgstCap)} (raw: ${fmt(result.rawCGST)})`
//                       : `₹${result.cgstFee / result.daysLate}/day × ${result.daysLate} days`
//                     }
//                   />
//                   <ResultRow
//                     label="SGST Late Fee"
//                     value={fmt(result.sgstFee)}
//                     sub={result.sgstCap !== null && result.rawSGST > result.sgstCap
//                       ? `Capped at ${fmt(result.sgstCap)} (raw: ${fmt(result.rawSGST)})`
//                       : `₹${result.sgstFee / result.daysLate}/day × ${result.daysLate} days`
//                     }
//                   />
//                   {result.hasInterest && (
//                     <ResultRow
//                       label="Interest (Sec. 50 CGST Act)"
//                       value={fmt(result.interest)}
//                       sub={result.interestNote}
//                     />
//                   )}
//                   <div className="pt-1">
//                     <ResultRow
//                       label="Grand Total Payable"
//                       value={fmt(result.grandTotal)}
//                       highlight
//                     />
//                   </div>
//                 </div>
//               </Card>

//               {/* Info */}
//               <div className="flex gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
//                 <Info size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
//                 <p className="text-xs text-amber-700 leading-relaxed">
//                   Late fees capped per CBIC notifications.
//                   Interest runs from the day after due date to the date of payment at {result.interestRate}% p.a.
//                   SME/MSME cap: ₹5,000 (regular) / ₹2,000 (NIL). Does not account for government filing extensions or COVID-19 waivers.
//                 </p>
//               </div>
//             </>
//           )}
//         </div>
//       )}

//       {/* SEO content */}
//       <div className="mt-6 pt-6 border-t border-ink-100">
//         <h2 className="font-display font-bold text-base text-ink-800 mb-2">GST Late Fee Rules (India)</h2>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-ink-500 leading-relaxed">
//           <div>
//             <p className="font-semibold text-ink-700 mb-1">GSTR-3B / GSTR-1</p>
//             <p>₹50/day (regular) · ₹20/day (NIL) · Max ₹10,000 per return. SME max ₹5,000.</p>
//           </div>
//           <div>
//             <p className="font-semibold text-ink-700 mb-1">GSTR-9 / GSTR-9A (Annual)</p>
//             <p>₹200/day · Capped at 0.25% of turnover per component (CGST + SGST separately).</p>
//           </div>
//           <div>
//             <p className="font-semibold text-ink-700 mb-1">Interest on Tax</p>
//             <p>18% p.a. on net cash liability (tax − ITC) under Section 50, CGST Act 2017.</p>
//           </div>
//           <div>
//             <p className="font-semibold text-ink-700 mb-1">GSTR-10 (Final Return)</p>
//             <p>₹200/day · No statutory cap. Filing deadline: 3 months from cancellation order.</p>
//           </div>
//         </div>
//       </div>

//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import { Info, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Input, Select, Card } from '@/components/ui'
import {
  calcLateFee, getDefaultDueDate, RETURN_OPTIONS,
  type LateFeeInput, type LateFeeResult,
  type ReturnType, type TaxpayerType,
} from '@/lib/logic/gst-late-fee'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Pills<T extends string>({
  label, options, value, onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="label-base mb-1.5">{label}</p>
      <div className="flex bg-ink-100 rounded-xl p-1 gap-1 border border-ink-200">
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              value === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
            }`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value, sub, highlight, warn }: {
  label: string; value: string; sub?: string; highlight?: boolean; warn?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${
      highlight ? 'bg-ink-900' : warn ? 'bg-orange-50 border border-orange-100' : 'bg-ink-50'
    }`}>
      <div>
        <p className={`text-xs font-medium ${highlight ? 'text-ink-300' : warn ? 'text-orange-600' : 'text-ink-500'}`}>{label}</p>
        {sub && <p className={`text-xs mt-0.5 ${highlight ? 'text-ink-400' : 'text-ink-400'}`}>{sub}</p>}
      </div>
      <p className={`font-mono font-semibold ${highlight ? 'text-white text-base' : warn ? 'text-orange-700' : 'text-ink-800'} text-sm`}>{value}</p>
    </div>
  )
}

export function GSTLateFeeCalculator() {
  const today = new Date().toISOString().split('T')[0]
  const [input, setInput] = useState<LateFeeInput>({
    returnType: 'GSTR3B', dueDate: getDefaultDueDate('GSTR3B'), filingDate: today,
    isNil: false, taxpayerType: 'regular',
    taxLiability: 0, itcAvailable: 0, turnover: 0,
  })
  const [result, setResult] = useState<LateFeeResult | null>(null)

  useEffect(() => {
    if (input.dueDate && input.filingDate) setResult(calcLateFee(input))
  }, [input])

  const set = <K extends keyof LateFeeInput>(k: K, v: LateFeeInput[K]) =>
    setInput(prev => ({ ...prev, [k]: v }))

  const onTime = result?.daysLate === 0

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Inputs */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-4">Return Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <Select label="Return Type"
            value={input.returnType}
            options={RETURN_OPTIONS as unknown as { value: string; label: string }[]}
            onChange={e => {
              const rt = e.target.value as ReturnType
              set('returnType', rt)
              set('dueDate', getDefaultDueDate(rt))
            }}
          />
          <Input label="Due Date" type="date" value={input.dueDate}
            onChange={e => set('dueDate', e.target.value)} />
          <Input label="Date of Filing" type="date" value={input.filingDate}
            onChange={e => set('filingDate', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Pills label="Return Category" value={input.isNil ? 'nil' : 'normal'}
            options={[{ value: 'normal', label: 'Regular' }, { value: 'nil', label: 'NIL Return' }]}
            onChange={v => set('isNil', v === 'nil')} />
          <Pills label="Taxpayer Type" value={input.taxpayerType}
            options={[
              { value: 'regular', label: 'Regular' },
              { value: 'composition', label: 'Composition' },
              { value: 'sme', label: 'SME/MSME' },
            ]}
            onChange={v => set('taxpayerType', v as TaxpayerType)} />
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 transition-opacity ${input.isNil ? 'opacity-40 pointer-events-none' : ''}`}>
          <Input label="Tax Liability (₹)" type="number" min="0" step="0.01" prefix="₹"
            value={input.taxLiability || ''} placeholder="0.00"
            onChange={e => set('taxLiability', parseFloat(e.target.value) || 0)} />
          <Input label="ITC Available (₹)" type="number" min="0" step="0.01" prefix="₹"
            value={input.itcAvailable || ''} placeholder="0.00"
            onChange={e => set('itcAvailable', parseFloat(e.target.value) || 0)} />
          <Input label="Annual Turnover (₹)" type="number" min="0" prefix="₹"
            value={input.turnover || ''} placeholder="For cap calc"
            onChange={e => set('turnover', parseFloat(e.target.value) || 0)} />
        </div>
      </Card>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-fade-up">

          {onTime ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
              <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Filed on time — no penalties!</p>
                <p className="text-green-600 text-xs mt-0.5">No late fees or interest applicable.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
                  <Clock size={12} className="text-orange-600" />
                  <span className="text-orange-700 text-xs font-semibold">{result.daysLate} day{result.daysLate !== 1 ? 's' : ''} late</span>
                </div>
                <span className="text-ink-400 text-xs">Due {fmtDate(input.dueDate)} → Filed {fmtDate(input.filingDate)}</span>
                {result.isCapped && (
                  <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-medium">
                    Capped at {fmt(result.maxFeeApplied)}
                  </span>
                )}
                {result.daysInTier2 > 0 && (
                  <span className="px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-red-700 text-xs font-medium">
                    ⚠ &gt;90 days — higher rate applies
                  </span>
                )}
              </div>

              {/* Tier breakdown — only shown if crossed 90 days */}
              {result.daysInTier2 > 0 && (
                <Card padding="sm" className="border-red-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-3">Tier Breakdown</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="font-semibold text-amber-800 mb-1">Days 1–90 ({result.daysInTier1} days)</p>
                      <p className="text-amber-700">₹50/day (₹25 CGST + ₹25 SGST)</p>
                      <p className="text-amber-600 font-mono mt-1">Max: ₹5,000</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                      <p className="font-semibold text-red-800 mb-1">Days 91+ ({result.daysInTier2} days)</p>
                      <p className="text-red-700">₹100/day (₹50 CGST + ₹50 SGST)</p>
                      <p className="text-red-600 font-mono mt-1">Max: ₹10,000</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card padding="sm" className="border-brand-100 bg-brand-50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">Total Late Fee</p>
                  <p className="font-mono text-lg font-semibold text-brand-800">{fmt(result.totalFee)}</p>
                  <p className="text-xs text-brand-500 mt-0.5">
                    {result.isCapped ? `Capped (raw: ${fmt(result.rawFeeBeforeCap)})` : `${result.daysLate} days calculated`}
                  </p>
                </Card>
                <Card padding="sm" className="border-orange-100 bg-orange-50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1">Interest @ {result.interestRate}% p.a.</p>
                  <p className="font-mono text-lg font-semibold text-orange-800">{fmt(result.interest)}</p>
                  <p className="text-xs text-orange-500 mt-0.5 line-clamp-1">{result.interestNote}</p>
                </Card>
              </div>

              {/* Breakdown */}
              <Card padding="sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Full Breakdown</p>
                <div className="space-y-1.5">
                  <Row label="CGST Late Fee" value={fmt(result.cgstFee)}
                    sub={`₹${result.cgstFee > 0 && result.daysLate > 0 ? (result.cgstFee / result.daysLate).toFixed(2) : 0}/day avg`} />
                  <Row label="SGST Late Fee" value={fmt(result.sgstFee)}
                    sub={`₹${result.sgstFee > 0 && result.daysLate > 0 ? (result.sgstFee / result.daysLate).toFixed(2) : 0}/day avg`} />
                  {result.hasInterest && (
                    <Row label="Interest (Sec. 50 CGST Act)" value={fmt(result.interest)} sub={result.interestNote} />
                  )}
                  {result.additionalPenalty > 0 && (
                    <Row
                      label="Additional Penalty (>90 days)"
                      value={fmt(result.additionalPenalty)}
                      sub={`₹10,000 or 10% of tax due — whichever higher`}
                      warn
                    />
                  )}
                  <div className="pt-1">
                    <Row label="Grand Total Payable" value={fmt(result.grandTotal)} highlight />
                  </div>
                </div>
              </Card>

              {/* Additional penalty warning */}
              {result.daysInTier2 > 0 && result.additionalPenalty === 0 && input.taxLiability === 0 && (
                <div className="flex gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600 leading-relaxed">
                    <strong>Filing is more than 90 days late.</strong> If there is unpaid tax liability, an additional penalty of ₹10,000 or 10% of tax due (whichever is higher) may apply. Enter your tax liability above to calculate it.
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="flex gap-2.5 p-3.5 bg-ink-50 border border-ink-100 rounded-xl">
                <Info size={13} className="text-ink-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-ink-500 leading-relaxed">
                  Rates per CBIC: ₹50/day (up to 90 days), ₹100/day (beyond 90 days). NIL returns: ₹20/day flat.
                  Interest at 18% p.a. on net cash liability under Section 50, CGST Act 2017.
                  SME/MSME caps: ₹2,500 (≤90 days) / ₹5,000 (beyond 90 days) per component.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Reference table */}
      <div className="mt-6 pt-6 border-t border-ink-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Quick Reference — GSTR-1 &amp; GSTR-3B</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-ink-900 text-white">
                <th className="text-left p-2.5 rounded-tl-lg font-medium"></th>
                <th className="text-center p-2.5 font-medium" colSpan={2}>Up to 3 Months</th>
                <th className="text-center p-2.5 rounded-tr-lg font-medium" colSpan={2}>More than 3 Months</th>
              </tr>
              <tr className="bg-ink-100 text-ink-600">
                <th className="text-left p-2 font-medium">Return</th>
                <th className="text-center p-2 font-medium">Per Day</th>
                <th className="text-center p-2 font-medium">Max Fee</th>
                <th className="text-center p-2 font-medium">Per Day</th>
                <th className="text-center p-2 font-medium">Max Fee</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['GSTR-1', '₹50 (₹25+₹25)', '₹5,000', '₹100 (₹50+₹50)', '₹10,000'],
                ['GSTR-3B', '₹50 (₹25+₹25)', '₹5,000', '₹100 (₹50+₹50)', '₹10,000'],
                ['NIL Return', '₹20 (₹10+₹10)', '₹5,000', '₹20 (₹10+₹10)', '₹10,000'],
              ].map(([ret, ...cols], i) => (
                <tr key={ret} className={i % 2 === 0 ? 'bg-white' : 'bg-ink-50'}>
                  <td className="p-2 font-medium text-ink-700">{ret}</td>
                  {cols.map((c, j) => (
                    <td key={j} className="p-2 text-center text-ink-600 font-mono">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-400 mt-2">Due dates: GSTR-1 → 11th of next month · GSTR-3B → 20th of next month</p>
      </div>

    </div>
  )
}
