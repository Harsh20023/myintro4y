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
// Pure GST late fee & interest logic — updated per CBIC rules
// Tiered system: up to 90 days vs beyond 90 days

export type ReturnType = 'GSTR3B' | 'GSTR1' | 'GSTR1Q' | 'GSTR9' | 'GSTR9A' | 'GSTR10'
export type TaxpayerType = 'regular' | 'composition' | 'sme'

export interface LateFeeInput {
  returnType:   ReturnType
  dueDate:      string   // YYYY-MM-DD
  filingDate:   string   // YYYY-MM-DD
  isNil:        boolean
  taxpayerType: TaxpayerType
  taxLiability: number
  itcAvailable: number
  turnover:     number
}

export interface LateFeeResult {
  daysLate:          number
  // Tier breakdown
  daysInTier1:       number   // days 1–90
  daysInTier2:       number   // days 91+
  // Late fee
  cgstFee:           number
  sgstFee:           number
  totalFee:          number
  rawFeeBeforeCap:   number
  isCapped:          boolean
  maxFeeApplied:     number
  // Additional penalty (>90 days + unpaid tax)
  additionalPenalty: number
  // Interest
  interest:          number
  interestRate:      number
  netCashLiability:  number
  // Total
  grandTotal:        number
  hasInterest:       boolean
  interestNote:      string
}

interface TierRate {
  cgstPerDay: number
  sgstPerDay: number
  maxCap:     number   // total (cgst+sgst) — Infinity = no cap
}

interface ReturnRule {
  label:         string
  tier1:         TierRate   // 0–90 days
  tier2:         TierRate   // 91+ days
  nilRate:       TierRate   // NIL returns (same tier1/tier2 structure but lower)
  nilTier2:      TierRate
  turnoverCap:   number | null  // for annual returns: % per component
  interestRate:  number
  hasInterest:   boolean
  hasAdditionalPenalty: boolean // additional penalty for >90 days unpaid
}

const RULES: Record<ReturnType, ReturnRule> = {
  GSTR3B: {
    label: 'GSTR-3B',
    tier1:    { cgstPerDay: 25, sgstPerDay: 25, maxCap: 5000  },
    tier2:    { cgstPerDay: 50, sgstPerDay: 50, maxCap: 10000 },
    nilRate:  { cgstPerDay: 10, sgstPerDay: 10, maxCap: 5000  },
    nilTier2: { cgstPerDay: 10, sgstPerDay: 10, maxCap: 10000 },
    turnoverCap: null,
    interestRate: 18,
    hasInterest: true,
    hasAdditionalPenalty: true,
  },
  GSTR1: {
    label: 'GSTR-1 (Monthly)',
    tier1:    { cgstPerDay: 25, sgstPerDay: 25, maxCap: 5000  },
    tier2:    { cgstPerDay: 50, sgstPerDay: 50, maxCap: 10000 },
    nilRate:  { cgstPerDay: 10, sgstPerDay: 10, maxCap: 5000  },
    nilTier2: { cgstPerDay: 10, sgstPerDay: 10, maxCap: 10000 },
    turnoverCap: null,
    interestRate: 0,
    hasInterest: false,
    hasAdditionalPenalty: false,
  },
  GSTR1Q: {
    label: 'GSTR-1 (Quarterly)',
    tier1:    { cgstPerDay: 25, sgstPerDay: 25, maxCap: 5000  },
    tier2:    { cgstPerDay: 50, sgstPerDay: 50, maxCap: 10000 },
    nilRate:  { cgstPerDay: 10, sgstPerDay: 10, maxCap: 5000  },
    nilTier2: { cgstPerDay: 10, sgstPerDay: 10, maxCap: 10000 },
    turnoverCap: null,
    interestRate: 0,
    hasInterest: false,
    hasAdditionalPenalty: false,
  },
  GSTR9: {
    label: 'GSTR-9 (Annual)',
    tier1:    { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    tier2:    { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    nilRate:  { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    nilTier2: { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    turnoverCap: 0.0025, // 0.25% of turnover per component
    interestRate: 18,
    hasInterest: true,
    hasAdditionalPenalty: false,
  },
  GSTR9A: {
    label: 'GSTR-9A (Composition Annual)',
    tier1:    { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    tier2:    { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    nilRate:  { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    nilTier2: { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    turnoverCap: 0.0025,
    interestRate: 18,
    hasInterest: true,
    hasAdditionalPenalty: false,
  },
  GSTR10: {
    label: 'GSTR-10 (Final)',
    tier1:    { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    tier2:    { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    nilRate:  { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    nilTier2: { cgstPerDay: 100, sgstPerDay: 100, maxCap: Infinity },
    turnoverCap: null,
    interestRate: 0,
    hasInterest: false,
    hasAdditionalPenalty: false,
  },
}

// SME/MSME reduced cap
const SME_CAP = { tier1: 2500, tier2: 5000, nilTier1: 2500, nilTier2: 5000 }

export function calcLateFee(input: LateFeeInput): LateFeeResult {
  const due    = new Date(input.dueDate)
  const filed  = new Date(input.filingDate)
  const daysLate = Math.max(0, Math.floor((filed.getTime() - due.getTime()) / 86400000))

  const rules = RULES[input.returnType]
  const netCashLiability = Math.max(0, input.taxLiability - input.itcAvailable)

  // Split days into two tiers
  const TIER_THRESHOLD = 90
  const daysInTier1 = Math.min(daysLate, TIER_THRESHOLD)
  const daysInTier2 = Math.max(0, daysLate - TIER_THRESHOLD)

  // Pick rate based on nil / regular
  const t1Rate = input.isNil ? rules.nilRate  : rules.tier1
  const t2Rate = input.isNil ? rules.nilTier2 : rules.tier2

  // Raw fees per tier
  const rawCGST = (t1Rate.cgstPerDay * daysInTier1) + (t2Rate.cgstPerDay * daysInTier2)
  const rawSGST = (t1Rate.sgstPerDay * daysInTier1) + (t2Rate.sgstPerDay * daysInTier2)
  const rawTotal = rawCGST + rawSGST

  // Determine effective cap
  let effectiveCap: number

  if (rules.turnoverCap !== null && input.turnover > 0) {
    // Annual returns: 0.25% of turnover per component × 2
    effectiveCap = rules.turnoverCap * input.turnover * 2
  } else if (input.taxpayerType === 'sme') {
    effectiveCap = daysLate <= TIER_THRESHOLD
      ? (input.isNil ? SME_CAP.nilTier1 : SME_CAP.tier1)
      : (input.isNil ? SME_CAP.nilTier2 : SME_CAP.tier2)
  } else {
    // Use the higher cap (tier2) if any days crossed 90
    effectiveCap = daysInTier2 > 0 ? t2Rate.maxCap : t1Rate.maxCap
  }

  const cappedTotal = Math.min(rawTotal, effectiveCap)
  const cgstFee = cappedTotal / 2
  const sgstFee = cappedTotal / 2
  const isCapped = rawTotal > effectiveCap

  // Additional penalty: only for >90 days AND tax is unpaid (GSTR-3B)
  // ₹10,000 or 10% of tax due — whichever is higher
  let additionalPenalty = 0
  if (rules.hasAdditionalPenalty && daysInTier2 > 0 && input.taxLiability > 0) {
    additionalPenalty = Math.max(10000, input.taxLiability * 0.10)
  }

  // Interest: 18% p.a. on net cash liability
  let interest = 0
  let interestNote = ''
  if (rules.hasInterest && rules.interestRate > 0) {
    if (netCashLiability > 0) {
      interest = (netCashLiability * rules.interestRate * daysLate) / (100 * 365)
      interestNote = `${rules.interestRate}% p.a. on ₹${netCashLiability.toLocaleString('en-IN')} × ${daysLate} days ÷ 365`
    } else {
      interestNote = 'No net cash liability after ITC'
    }
  } else {
    interestNote = `Not applicable for ${rules.label}`
  }

  return {
    daysLate, daysInTier1, daysInTier2,
    cgstFee, sgstFee, totalFee: cappedTotal,
    rawFeeBeforeCap: rawTotal,
    isCapped, maxFeeApplied: effectiveCap,
    additionalPenalty,
    interest, interestRate: rules.interestRate,
    netCashLiability,
    grandTotal: cappedTotal + additionalPenalty + interest,
    hasInterest: rules.hasInterest,
    interestNote,
  }
}

export const RETURN_OPTIONS = [
  { value: 'GSTR3B',  label: 'GSTR-3B (Monthly) — Due 20th' },
  { value: 'GSTR1',   label: 'GSTR-1 (Monthly) — Due 11th' },
  { value: 'GSTR1Q',  label: 'GSTR-1 (Quarterly)' },
  { value: 'GSTR9',   label: 'GSTR-9 (Annual)' },
  { value: 'GSTR9A',  label: 'GSTR-9A (Composition Annual)' },
  { value: 'GSTR10',  label: 'GSTR-10 (Final)' },
] as const

// Smart default due dates based on return type
export function getDefaultDueDate(returnType: ReturnType = 'GSTR3B'): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  if (returnType === 'GSTR1') d.setDate(11)
  else d.setDate(20)
  return d.toISOString().split('T')[0]
}
