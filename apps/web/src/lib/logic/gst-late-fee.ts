// // Pure GST late fee & interest logic — no UI dependency
// // Can run on server side too

// export type ReturnType = 'GSTR3B' | 'GSTR1' | 'GSTR1Q' | 'GSTR9' | 'GSTR9A' | 'GSTR10'
// export type TaxpayerType = 'regular' | 'composition' | 'sme'
// export type ReturnCategory = 'nil' | 'normal'

// export interface LateFeeInput {
//   returnType: ReturnType
//   dueDate: string        // ISO date string YYYY-MM-DD
//   filingDate: string     // ISO date string YYYY-MM-DD
//   isNil: boolean
//   taxpayerType: TaxpayerType
//   taxLiability: number
//   itcAvailable: number
//   turnover: number       // annual turnover for cap calculation
// }

// export interface LateFeeResult {
//   daysLate: number
//   cgstFee: number
//   sgstFee: number
//   rawCGST: number
//   rawSGST: number
//   cgstCap: number | null
//   sgstCap: number | null
//   totalFee: number
//   interest: number
//   interestRate: number
//   grandTotal: number
//   isCapped: boolean
//   hasInterest: boolean
//   interestNote: string
//   netCashLiability: number
// }

// interface ReturnRule {
//   label: string
//   cgstPerDay: { normal: number; nil: number }
//   sgstPerDay: { normal: number; nil: number }
//   maxFee: { normal: number; nil: number } | null  // null = use turnoverCap
//   turnoverCap: number | null                       // % per component e.g. 0.0025
//   interestRate: number
//   hasInterest: boolean
// }

// const RULES: Record<ReturnType, ReturnRule> = {
//   GSTR3B: {
//     label: 'GSTR-3B',
//     cgstPerDay:   { normal: 25,  nil: 10 },
//     sgstPerDay:   { normal: 25,  nil: 10 },
//     maxFee:       { normal: 10000, nil: 10000 },
//     turnoverCap:  null,
//     interestRate: 18,
//     hasInterest:  true,
//   },
//   GSTR1: {
//     label: 'GSTR-1 (Monthly)',
//     cgstPerDay:   { normal: 25,  nil: 10 },
//     sgstPerDay:   { normal: 25,  nil: 10 },
//     maxFee:       { normal: 10000, nil: 10000 },
//     turnoverCap:  null,
//     interestRate: 0,
//     hasInterest:  false,
//   },
//   GSTR1Q: {
//     label: 'GSTR-1 (Quarterly)',
//     cgstPerDay:   { normal: 25,  nil: 10 },
//     sgstPerDay:   { normal: 25,  nil: 10 },
//     maxFee:       { normal: 10000, nil: 10000 },
//     turnoverCap:  null,
//     interestRate: 0,
//     hasInterest:  false,
//   },
//   GSTR9: {
//     label: 'GSTR-9 (Annual)',
//     cgstPerDay:   { normal: 100, nil: 100 },
//     sgstPerDay:   { normal: 100, nil: 100 },
//     maxFee:       null,
//     turnoverCap:  0.0025,   // 0.25% of turnover per component
//     interestRate: 18,
//     hasInterest:  true,
//   },
//   GSTR9A: {
//     label: 'GSTR-9A (Composition Annual)',
//     cgstPerDay:   { normal: 100, nil: 100 },
//     sgstPerDay:   { normal: 100, nil: 100 },
//     maxFee:       null,
//     turnoverCap:  0.0025,
//     interestRate: 18,
//     hasInterest:  true,
//   },
//   GSTR10: {
//     label: 'GSTR-10 (Final)',
//     cgstPerDay:   { normal: 100, nil: 100 },
//     sgstPerDay:   { normal: 100, nil: 100 },
//     maxFee:       { normal: Infinity, nil: Infinity },  // no statutory cap
//     turnoverCap:  null,
//     interestRate: 0,
//     hasInterest:  false,
//   },
// }

// // SME/MSME reduced cap per CBIC amnesty notifications
// const SME_MAX_FEE = { normal: 5000, nil: 2000 }

// export function calcLateFee(input: LateFeeInput): LateFeeResult {
//   const due    = new Date(input.dueDate)
//   const filed  = new Date(input.filingDate)
//   const daysLate = Math.max(0, Math.floor((filed.getTime() - due.getTime()) / 86400000))

//   const rules = RULES[input.returnType]
//   const cat: ReturnCategory = input.isNil ? 'nil' : 'normal'

//   const netCashLiability = Math.max(0, input.taxLiability - input.itcAvailable)

//   // ── Late fee ──────────────────────────────────────────────────────────────
//   const rawCGST = rules.cgstPerDay[cat] * daysLate
//   const rawSGST = rules.sgstPerDay[cat] * daysLate

//   let cgstCap: number | null = null
//   let sgstCap: number | null = null

//   if (rules.turnoverCap !== null && input.turnover > 0) {
//     cgstCap = rules.turnoverCap * input.turnover
//     sgstCap = rules.turnoverCap * input.turnover
//   } else if (rules.maxFee !== null) {
//     const effectiveMax = input.taxpayerType === 'sme'
//       ? SME_MAX_FEE[cat]
//       : rules.maxFee[cat]
//     cgstCap = effectiveMax / 2
//     sgstCap = effectiveMax / 2
//   }

//   const cgstFee = cgstCap !== null ? Math.min(rawCGST, cgstCap) : rawCGST
//   const sgstFee = sgstCap !== null ? Math.min(rawSGST, sgstCap) : rawSGST
//   const totalFee = cgstFee + sgstFee
//   const isCapped = (cgstCap !== null && rawCGST > cgstCap) || (sgstCap !== null && rawSGST > sgstCap)

//   // ── Interest (Section 50, CGST Act) ───────────────────────────────────────
//   let interest = 0
//   let interestNote = ''

//   if (rules.hasInterest && rules.interestRate > 0) {
//     if (netCashLiability > 0) {
//       interest = (netCashLiability * rules.interestRate * daysLate) / (100 * 365)
//       interestNote = `${rules.interestRate}% p.a. on ₹${netCashLiability.toLocaleString('en-IN')} × ${daysLate} days`
//     } else {
//       interestNote = 'No net cash liability after ITC'
//     }
//   } else {
//     interestNote = `Not applicable for ${rules.label}`
//   }

//   return {
//     daysLate,
//     cgstFee,    sgstFee,
//     rawCGST,    rawSGST,
//     cgstCap,    sgstCap,
//     totalFee,
//     interest,
//     interestRate: rules.interestRate,
//     grandTotal: totalFee + interest,
//     isCapped,
//     hasInterest: rules.hasInterest,
//     interestNote,
//     netCashLiability,
//   }
// }

// export const RETURN_OPTIONS = [
//   { value: 'GSTR3B',  label: 'GSTR-3B (Monthly)' },
//   { value: 'GSTR1',   label: 'GSTR-1 (Monthly)' },
//   { value: 'GSTR1Q',  label: 'GSTR-1 (Quarterly)' },
//   { value: 'GSTR9',   label: 'GSTR-9 (Annual)' },
//   { value: 'GSTR9A',  label: 'GSTR-9A (Composition Annual)' },
//   { value: 'GSTR10',  label: 'GSTR-10 (Final)' },
// ] as const

// export function getDefaultDueDate(): string {
//   const d = new Date()
//   d.setMonth(d.getMonth() - 1)
//   d.setDate(20)
//   return d.toISOString().split('T')[0]
// }
// Pure GST late fee & interest logic — per CBIC rules
// Flat per-day rate; statutory caps are turnover-based (CBIC 19/2021, 20/2021, 07/2023)
// Interest formula per Section 50 CGST Act: (tax − ITC − cash balance) × rate × days / 365

export type ReturnType = 'GSTR3B' | 'GSTR1' | 'GSTR1Q' | 'GSTR4' | 'GSTR7' | 'GSTR9' | 'GSTR9A' | 'GSTR10'
export type InterestType = 'late_payment' | 'excess_itc'

export interface LateFeeInput {
  returnType:      ReturnType
  dueDate:         string        // YYYY-MM-DD
  filingDate:      string        // YYYY-MM-DD
  isNil:           boolean
  taxLiability:    number
  itcAvailable:    number
  minCashBalance:  number        // existing cash ledger balance (reduces interest base)
  turnover:        number        // annual aggregate turnover for cap calculation
  interestType:    InterestType  // 18% (late payment) or 24% (excess ITC / reduced output)
}

export interface LateFeeResult {
  daysLate:        number
  cgstFee:         number
  sgstFee:         number
  totalFee:        number
  rawFeeBeforeCap: number
  isCapped:        boolean
  maxFeeApplied:   number        // 0 when no statutory cap
  capReason:       string
  interest:        number
  interestRate:    number
  netTaxBase:      number        // base amount used for interest (after ITC & cash balance)
  grandTotal:      number
  hasInterest:     boolean
  interestNote:    string
  cgstPerDay:      number        // actual per-day rate used for CGST
  sgstPerDay:      number        // actual per-day rate used for SGST
}

const CR = 10_000_000  // 1 crore

// GSTR-9/9A per CBIC notification 07/2023 — AATO-slab based rates & 0.04% cap
function gstr9Rates(turnover: number) {
  if (turnover > 0 && turnover <= 5 * CR)  return { cgstPerDay: 25,  sgstPerDay: 25,  cap: turnover * 0.0004, capLabel: '0.04% of turnover' }
  if (turnover > 5 * CR && turnover <= 20 * CR) return { cgstPerDay: 50,  sgstPerDay: 50,  cap: turnover * 0.0004, capLabel: '0.04% of turnover' }
  if (turnover > 20 * CR) return { cgstPerDay: 100, sgstPerDay: 100, cap: turnover * 0.005, capLabel: '0.50% of turnover' }
  // turnover not entered → use statutory default, no cap
  return { cgstPerDay: 100, sgstPerDay: 100, cap: Infinity, capLabel: 'Enter turnover for cap' }
}

// GSTR-1/3B/4 turnover-slab caps per CBIC notifications 19-21/2021
function standardCap(turnover: number, isNil: boolean): { cap: number; reason: string } {
  if (isNil) return { cap: 500,   reason: 'NIL return — max ₹500 (₹250 CGST + ₹250 SGST)' }
  if (turnover <= 0)        return { cap: 10000, reason: 'No turnover entered — default cap ₹10,000' }
  if (turnover <= 1.5 * CR) return { cap: 2000,  reason: 'Turnover ≤ ₹1.5 cr — max ₹2,000' }
  if (turnover <= 5 * CR)   return { cap: 5000,  reason: 'Turnover ₹1.5–5 cr — max ₹5,000' }
  return { cap: 10000, reason: 'Turnover > ₹5 cr — max ₹10,000' }
}

export function calcLateFee(input: LateFeeInput): LateFeeResult {
  const daysLate = Math.max(
    0,
    Math.floor((new Date(input.filingDate).getTime() - new Date(input.dueDate).getTime()) / 86400000),
  )

  // Net base for interest: outstanding tax minus ITC and any existing cash balance
  const netTaxBase = Math.max(0, input.taxLiability - input.itcAvailable - input.minCashBalance)

  let cgstPerDay: number
  let sgstPerDay: number
  let effectiveCap: number
  let capReason: string
  let hasInterest: boolean

  const rt = input.returnType

  if (rt === 'GSTR9' || rt === 'GSTR9A') {
    const r = gstr9Rates(input.turnover)
    cgstPerDay  = r.cgstPerDay
    sgstPerDay  = r.sgstPerDay
    effectiveCap = r.cap
    capReason   = r.capLabel + ' (CBIC 07/2023)'
    hasInterest = true
  } else if (rt === 'GSTR10') {
    cgstPerDay  = 100
    sgstPerDay  = 100
    effectiveCap = Infinity
    capReason   = 'No statutory cap'
    hasInterest = false
  } else if (rt === 'GSTR7') {
    // ₹50/day per act per return, max ₹2,000 — CBIC 22/2021
    cgstPerDay  = 25
    sgstPerDay  = 25
    effectiveCap = 2000
    capReason   = 'Max ₹2,000 (CBIC 22/2021)'
    hasInterest = false
  } else if (rt === 'GSTR4') {
    cgstPerDay  = input.isNil ? 10 : 25
    sgstPerDay  = input.isNil ? 10 : 25
    effectiveCap = input.isNil ? 500 : 2000
    capReason   = input.isNil ? 'NIL cap ₹500' : 'Max ₹2,000'
    hasInterest = false
  } else {
    // GSTR-1 (monthly/quarterly) and GSTR-3B
    const std   = standardCap(input.turnover, input.isNil)
    cgstPerDay  = input.isNil ? 10 : 25
    sgstPerDay  = input.isNil ? 10 : 25
    effectiveCap = std.cap
    capReason   = std.reason + ' (CBIC 19-21/2021)'
    hasInterest = rt === 'GSTR3B'
  }

  const rawCGST = cgstPerDay * daysLate
  const rawSGST = sgstPerDay * daysLate
  const rawTotal = rawCGST + rawSGST

  const cappedTotal = effectiveCap === Infinity ? rawTotal : Math.min(rawTotal, effectiveCap)
  const isCapped    = rawTotal > effectiveCap && effectiveCap !== Infinity

  const interestRate = input.interestType === 'excess_itc' ? 24 : 18
  let interest    = 0
  let interestNote = ''

  if (hasInterest) {
    if (netTaxBase > 0) {
      interest = (netTaxBase * interestRate * daysLate) / (100 * 365)
      interestNote = `${interestRate}% p.a. on ₹${netTaxBase.toLocaleString('en-IN')} × ${daysLate} days ÷ 365`
    } else {
      interestNote = 'No net cash liability after ITC & cash ledger balance'
    }
  } else {
    interestNote = 'Interest not applicable for this return type'
  }

  return {
    daysLate,
    cgstFee: cappedTotal / 2,
    sgstFee: cappedTotal / 2,
    totalFee: cappedTotal,
    rawFeeBeforeCap: rawTotal,
    isCapped,
    maxFeeApplied: effectiveCap === Infinity ? 0 : effectiveCap,
    capReason,
    interest,
    interestRate,
    netTaxBase,
    grandTotal: cappedTotal + interest,
    hasInterest,
    interestNote,
    cgstPerDay,
    sgstPerDay,
  }
}

export const RETURN_OPTIONS = [
  { value: 'GSTR3B',  label: 'GSTR-3B (Monthly) — Due 20th' },
  { value: 'GSTR1',   label: 'GSTR-1 (Monthly) — Due 11th' },
  { value: 'GSTR1Q',  label: 'GSTR-1 (Quarterly)' },
  { value: 'GSTR4',   label: 'GSTR-4 (Composition Annual)' },
  { value: 'GSTR7',   label: 'GSTR-7 (TDS Return)' },
  { value: 'GSTR9',   label: 'GSTR-9 (Annual)' },
  { value: 'GSTR9A',  label: 'GSTR-9A (Composition Annual)' },
  { value: 'GSTR10',  label: 'GSTR-10 (Final Return)' },
] as const

export function getDefaultDueDate(returnType: ReturnType = 'GSTR3B'): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  if (returnType === 'GSTR1') d.setDate(11)
  else d.setDate(20)
  return d.toISOString().split('T')[0]
}
