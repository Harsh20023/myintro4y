// Pure income tax computation — FY 2024-25 and FY 2025-26
// Both old and new regime, with surcharge and cess

export type AgeGroup = 'below60' | 'senior' | 'superSenior'
export type FY = 'FY2025-26' | 'FY2024-25'

interface Slab { from: number; to: number; rate: number }

// ── Constants ──────────────────────────────────────────────────────────────

const SURCHARGE: { above: number; oldRate: number; newRate: number }[] = [
  { above: 5_00_00_000, oldRate: 0.37, newRate: 0.25 },
  { above: 2_00_00_000, oldRate: 0.25, newRate: 0.25 },
  { above: 1_00_00_000, oldRate: 0.15, newRate: 0.15 },
  { above:   50_00_000, oldRate: 0.10, newRate: 0.10 },
]

const CESS = 0.04

const STCG_EQUITY_RATE   = 0.20
const LTCG_EQUITY_RATE   = 0.125
const LTCG_EQUITY_EXEMPT = 1_25_000   // ₹1.25L exemption per FY
const LOTTERY_RATE        = 0.30
const FAMILY_PENSION_MAX_DED = 15_000 // min(1/3 of family pension, ₹15k)

// ── Slab data ──────────────────────────────────────────────────────────────

const OLD_SLABS: Record<FY, Record<AgeGroup, Slab[]>> = {
  'FY2025-26': {
    below60: [
      { from:          0, to:  2_50_000, rate: 0.00 },
      { from:  2_50_000, to:  5_00_000, rate: 0.05 },
      { from:  5_00_000, to: 10_00_000, rate: 0.20 },
      { from: 10_00_000, to:   Infinity, rate: 0.30 },
    ],
    senior: [
      { from:          0, to:  3_00_000, rate: 0.00 },
      { from:  3_00_000, to:  5_00_000, rate: 0.05 },
      { from:  5_00_000, to: 10_00_000, rate: 0.20 },
      { from: 10_00_000, to:   Infinity, rate: 0.30 },
    ],
    superSenior: [
      { from:          0, to:  5_00_000, rate: 0.00 },
      { from:  5_00_000, to: 10_00_000, rate: 0.20 },
      { from: 10_00_000, to:   Infinity, rate: 0.30 },
    ],
  },
  'FY2024-25': {
    below60: [
      { from:          0, to:  2_50_000, rate: 0.00 },
      { from:  2_50_000, to:  5_00_000, rate: 0.05 },
      { from:  5_00_000, to: 10_00_000, rate: 0.20 },
      { from: 10_00_000, to:   Infinity, rate: 0.30 },
    ],
    senior: [
      { from:          0, to:  3_00_000, rate: 0.00 },
      { from:  3_00_000, to:  5_00_000, rate: 0.05 },
      { from:  5_00_000, to: 10_00_000, rate: 0.20 },
      { from: 10_00_000, to:   Infinity, rate: 0.30 },
    ],
    superSenior: [
      { from:          0, to:  5_00_000, rate: 0.00 },
      { from:  5_00_000, to: 10_00_000, rate: 0.20 },
      { from: 10_00_000, to:   Infinity, rate: 0.30 },
    ],
  },
}

const NEW_SLABS: Record<FY, Slab[]> = {
  'FY2025-26': [
    { from:          0, to:  4_00_000, rate: 0.00 },
    { from:  4_00_000, to:  8_00_000, rate: 0.05 },
    { from:  8_00_000, to: 12_00_000, rate: 0.10 },
    { from: 12_00_000, to: 16_00_000, rate: 0.15 },
    { from: 16_00_000, to: 20_00_000, rate: 0.20 },
    { from: 20_00_000, to: 24_00_000, rate: 0.25 },
    { from: 24_00_000, to:   Infinity, rate: 0.30 },
  ],
  'FY2024-25': [
    { from:          0, to:  3_00_000, rate: 0.00 },
    { from:  3_00_000, to:  7_00_000, rate: 0.05 },
    { from:  7_00_000, to: 10_00_000, rate: 0.10 },
    { from: 10_00_000, to: 12_00_000, rate: 0.15 },
    { from: 12_00_000, to: 15_00_000, rate: 0.20 },
    { from: 15_00_000, to:   Infinity, rate: 0.30 },
  ],
}

// Standard deduction, rebate limits
const STD_DED  = { old: 50_000, new: 75_000 }
const REBATE: Record<FY, { old: { limit: number; max: number }; new: { limit: number; max: number } }> = {
  'FY2025-26': { old: { limit: 5_00_000, max: 12_500 }, new: { limit: 12_00_000, max: 60_000 } },
  'FY2024-25': { old: { limit: 5_00_000, max: 12_500 }, new: { limit:  7_00_000, max: 25_000 } },
}

export const OLD_DED_CAPS = {
  sec80C:     1_50_000,
  sec80CCD1B:   50_000,
  sec80TTAbelow60: 10_000,
  sec80TTAsenior:  50_000,
  section24b: 2_00_000,
}

// ── Public types ───────────────────────────────────────────────────────────

export interface SlabRow {
  label:   string
  rate:    number   // percentage, e.g. 5
  taxable: number
  tax:     number
}

export interface SpecialRateItem {
  label:   string
  income:  number
  exempt:  number
  rate:    number   // e.g. 20
  tax:     number
}

export interface RegimeTax {
  grossIncome:       number
  standardDeduction: number
  otherDeductions:   number
  taxableIncome:     number
  slabRows:          SlabRow[]
  taxBeforeRebate:   number
  rebate87A:         number
  taxAfterRebate:    number
  surcharge:         number
  cess:              number
  totalTax:          number
  effectiveRate:     number
  specialRateItems:  SpecialRateItem[]
  specialRateTax:    number
}

export interface TaxComparison {
  old:     RegimeTax
  new:     RegimeTax
  savedBy: 'old' | 'new' | 'equal'
  savings: number
}

// Basic mode: single income + single deduction total
export interface BasicTaxInput {
  fy:                  FY
  ageGroup:            AgeGroup
  grossIncome:         number
  hasSalary:           boolean
  oldRegimeDeductions: number
}

// Advanced mode: itemised income heads + deductions
export interface AdvancedTaxInput {
  fy:       FY
  ageGroup: AgeGroup
  // income
  salary:               number
  pension:              number   // regular pension, standard deduction applied jointly with salary
  familyPension:        number   // taxed as other sources; deduction = min(1/3, ₹15k)
  businessIncome:       number   // business / professional income
  housePropertyIncome:  number   // negative = loss (old regime caps at ₹2L)
  capitalGainsAtSlab:   number   // gains taxed at normal slab rates
  interestIncome:       number   // FD interest, savings interest
  dividendIncome:       number   // dividend income
  stcgEquity:           number   // short term equity/MF — 20% flat
  ltcgEquity:           number   // long term equity/MF — 12.5% above ₹1.25L
  lotteryIncome:        number   // lottery, gambling, online gaming — 30% flat
  otherIncome:          number
  // old regime deductions
  sec80C:       number
  sec80D:       number
  sec80CCD1B:   number
  sec80TTA:     number
  section24b:   number
  otherDed:     number
}

// ── Internal helpers ───────────────────────────────────────────────────────

function fmtSlabLabel(from: number, to: number): string {
  const fmt = (n: number) => {
    if (n >= 1_00_00_000) { const v = n / 1_00_00_000; return `${Number.isInteger(v) ? v : v.toFixed(1)}Cr` }
    if (n >= 1_00_000)    { const v = n / 1_00_000;    return `${Number.isInteger(v) ? v : v.toFixed(1)}L`  }
    return String(n)
  }
  return to === Infinity ? `Above ₹${fmt(from)}` : `₹${fmt(from)} – ₹${fmt(to)}`
}

function computeSlabTax(income: number, slabs: Slab[]): { tax: number; rows: SlabRow[] } {
  let tax = 0
  const rows: SlabRow[] = []
  for (const s of slabs) {
    if (income <= s.from) break
    const amt = Math.min(income, s.to) - s.from
    const t   = amt * s.rate
    tax += t
    if (amt > 0 && s.rate > 0) {
      rows.push({ label: fmtSlabLabel(s.from, s.to), rate: s.rate * 100, taxable: amt, tax: t })
    }
  }
  return { tax, rows }
}

function getSurchargeRate(income: number, regime: 'old' | 'new'): number {
  for (const s of SURCHARGE) {
    if (income > s.above) return regime === 'new' ? s.newRate : s.oldRate
  }
  return 0
}

function buildResult(
  grossIncome:   number,
  stdDed:        number,
  otherDed:      number,
  taxableIncome: number,
  slabs:         Slab[],
  rebateLimit:   number,
  rebateMax:     number,
  regime:        'old' | 'new',
): RegimeTax {
  const { tax: rawTax, rows } = computeSlabTax(taxableIncome, slabs)

  // Section 87A: full rebate if income ≤ limit; marginal relief if just above
  // Marginal relief ensures tax never exceeds the income above the rebate limit
  let rebate = 0
  if (taxableIncome <= rebateLimit) {
    rebate = Math.min(rawTax, rebateMax)
  } else {
    const excess = taxableIncome - rebateLimit
    if (rawTax > excess) rebate = rawTax - excess
  }
  const afterRebate  = Math.max(0, rawTax - rebate)
  const sc           = afterRebate * getSurchargeRate(taxableIncome, regime)
  const cess         = (afterRebate + sc) * CESS
  const totalTax     = afterRebate + sc + cess
  return {
    grossIncome,
    standardDeduction: stdDed,
    otherDeductions:   otherDed,
    taxableIncome,
    slabRows:          rows,
    taxBeforeRebate:   rawTax,
    rebate87A:         rebate,
    taxAfterRebate:    afterRebate,
    surcharge:         sc,
    cess,
    totalTax,
    effectiveRate: grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0,
    specialRateItems: [],
    specialRateTax:   0,
  }
}

function compare(old: RegimeTax, newR: RegimeTax): TaxComparison {
  const diff = old.totalTax - newR.totalTax
  return {
    old,
    new: newR,
    savedBy: diff > 1 ? 'new' : diff < -1 ? 'old' : 'equal',
    savings: Math.abs(diff),
  }
}

// ── Public compute functions ───────────────────────────────────────────────

export function computeBasic(input: BasicTaxInput): TaxComparison {
  const gross = Math.max(0, input.grossIncome)
  const r     = REBATE[input.fy]

  // Old regime
  const oldStd     = input.hasSalary ? Math.min(STD_DED.old, gross) : 0
  const oldOtherDed = Math.max(0, input.oldRegimeDeductions)
  const oldTaxable = Math.max(0, gross - oldStd - oldOtherDed)
  const old = buildResult(gross, oldStd, oldOtherDed, oldTaxable, OLD_SLABS[input.fy][input.ageGroup], r.old.limit, r.old.max, 'old')

  // New regime (only standard deduction)
  const newStd     = input.hasSalary ? Math.min(STD_DED.new, gross) : 0
  const newTaxable = Math.max(0, gross - newStd)
  const newR = buildResult(gross, newStd, 0, newTaxable, NEW_SLABS[input.fy], r.new.limit, r.new.max, 'new')

  return compare(old, newR)
}

export function computeAdvanced(input: AdvancedTaxInput): TaxComparison {
  const r = REBATE[input.fy]

  // Family pension deduction (BOTH regimes — Section 57(iia) is allowed in new regime too)
  const fpDed = input.familyPension > 0
    ? Math.min(input.familyPension / 3, FAMILY_PENSION_MAX_DED)
    : 0

  // HP
  const hpIncome = Math.max(0, input.housePropertyIncome)
  const hpLoss   = input.housePropertyIncome < 0
    ? Math.min(-input.housePropertyIncome, 2_00_000)
    : 0  // OLD only

  // Normal income (taxed at slab in both regimes)
  const normalGross =
    input.salary +
    input.pension +
    input.familyPension +
    input.businessIncome +
    hpIncome +
    input.interestIncome +
    input.dividendIncome +
    input.capitalGainsAtSlab +
    input.otherIncome

  // Build specialRateItems array
  const items: SpecialRateItem[] = []

  if (input.stcgEquity > 0) {
    items.push({
      label:  'STCG — Equity / Equity MF',
      income: input.stcgEquity,
      exempt: 0,
      rate:   20,
      tax:    input.stcgEquity * STCG_EQUITY_RATE,
    })
  }

  if (input.ltcgEquity > 0) {
    const taxableLTCG = Math.max(0, input.ltcgEquity - LTCG_EQUITY_EXEMPT)
    items.push({
      label:  'LTCG — Equity / Equity MF',
      income: input.ltcgEquity,
      exempt: LTCG_EQUITY_EXEMPT,
      rate:   12.5,
      tax:    taxableLTCG * LTCG_EQUITY_RATE,
    })
  }

  if (input.lotteryIncome > 0) {
    items.push({
      label:  'Lottery / Gambling / Special Income',
      income: input.lotteryIncome,
      exempt: 0,
      rate:   30,
      tax:    input.lotteryIncome * LOTTERY_RATE,
    })
  }

  const specialTax = items.reduce((sum, item) => sum + item.tax, 0)

  const totalGross = normalGross + input.stcgEquity + input.ltcgEquity + input.lotteryIncome

  // ── Old regime ──
  const hasSalaryOld = input.salary > 0 || input.pension > 0
  const oldStd = hasSalaryOld ? Math.min(50_000, input.salary + input.pension) : 0

  const ttaCap = (input.ageGroup === 'senior' || input.ageGroup === 'superSenior')
    ? OLD_DED_CAPS.sec80TTAsenior
    : OLD_DED_CAPS.sec80TTAbelow60

  const sec80C    = Math.min(Math.max(0, input.sec80C),    OLD_DED_CAPS.sec80C)
  const sec80CCD1B = Math.min(Math.max(0, input.sec80CCD1B), OLD_DED_CAPS.sec80CCD1B)
  const sec80TTA  = Math.min(Math.max(0, input.sec80TTA), ttaCap)
  const sec24b    = Math.min(Math.max(0, input.section24b), OLD_DED_CAPS.section24b)

  const oldOtherDed =
    sec80C +
    Math.max(0, input.sec80D) +
    sec80CCD1B +
    sec80TTA +
    sec24b +
    Math.max(0, input.otherDed) +
    hpLoss +
    fpDed

  const oldNormalTaxable = Math.max(0, normalGross - oldStd - oldOtherDed)

  const { tax: oldSlabTax, rows: oldRows } = computeSlabTax(oldNormalTaxable, OLD_SLABS[input.fy][input.ageGroup])

  // OLD regime 87A: check total income; rebate applies to slab + special combined
  const oldTotalForRebate = oldNormalTaxable + input.stcgEquity + input.ltcgEquity + input.lotteryIncome
  const oldTaxBeforeRebate = oldSlabTax + specialTax
  let oldRebate = 0
  if (oldTotalForRebate <= r.old.limit) {
    oldRebate = Math.min(oldTaxBeforeRebate, r.old.max)
  } else {
    const excess = oldTotalForRebate - r.old.limit
    if (oldTaxBeforeRebate > excess) oldRebate = oldTaxBeforeRebate - excess
  }

  // Apply rebate to slab first, then special
  const oldRebateToSlab    = Math.min(oldSlabTax, oldRebate)
  const oldRebateToSpecial = Math.max(0, oldRebate - oldRebateToSlab)
  const oldSlabAfterRebate    = Math.max(0, oldSlabTax - oldRebateToSlab)
  const oldSpecialAfterRebate = Math.max(0, specialTax - oldRebateToSpecial)

  const oldSurcharge = (oldSlabAfterRebate + oldSpecialAfterRebate) * getSurchargeRate(oldTotalForRebate, 'old')
  const oldCess      = (oldSlabAfterRebate + oldSpecialAfterRebate + oldSurcharge) * 0.04
  const oldTotalTax  = oldSlabAfterRebate + oldSpecialAfterRebate + oldSurcharge + oldCess

  const old: RegimeTax = {
    grossIncome:       totalGross,
    standardDeduction: oldStd,
    otherDeductions:   oldOtherDed,
    taxableIncome:     oldNormalTaxable,
    slabRows:          oldRows,
    taxBeforeRebate:   oldSlabTax,
    rebate87A:         oldRebate,
    taxAfterRebate:    oldSlabAfterRebate,
    surcharge:         oldSurcharge,
    cess:              oldCess,
    totalTax:          oldTotalTax,
    effectiveRate:     totalGross > 0 ? (oldTotalTax / totalGross) * 100 : 0,
    specialRateItems:  items,
    specialRateTax:    specialTax,
  }

  // ── New regime ──
  const hasSalaryNew = input.salary > 0 || input.pension > 0
  const newStd = hasSalaryNew ? Math.min(75_000, input.salary + input.pension) : 0

  // new regime: no 80C/80D etc., HP loss not allowed, but fpDed still applies
  const newNormalTaxable = Math.max(0, normalGross - newStd - fpDed)

  const { tax: newSlabTax, rows: newRows } = computeSlabTax(newNormalTaxable, NEW_SLABS[input.fy])

  // NEW regime 87A: check against total income but rebate applies to SLAB ONLY (not STCG/LTCG/lottery)
  const newTotalForRebate = newNormalTaxable + input.stcgEquity + input.ltcgEquity + input.lotteryIncome
  let newRebate = 0
  if (newTotalForRebate <= r.new.limit) {
    newRebate = Math.min(newSlabTax, r.new.max)
  } else {
    const excess = newTotalForRebate - r.new.limit
    if (newSlabTax > excess) newRebate = newSlabTax - excess
  }

  const newSlabAfterRebate = Math.max(0, newSlabTax - newRebate)

  const newSurcharge = (newSlabAfterRebate + specialTax) * getSurchargeRate(newTotalForRebate, 'new')
  const newCess      = (newSlabAfterRebate + specialTax + newSurcharge) * 0.04
  const newTotalTax  = newSlabAfterRebate + specialTax + newSurcharge + newCess

  const newR: RegimeTax = {
    grossIncome:       totalGross,
    standardDeduction: newStd,
    otherDeductions:   fpDed,
    taxableIncome:     newNormalTaxable,
    slabRows:          newRows,
    taxBeforeRebate:   newSlabTax,
    rebate87A:         newRebate,
    taxAfterRebate:    newSlabAfterRebate,
    surcharge:         newSurcharge,
    cess:              newCess,
    totalTax:          newTotalTax,
    effectiveRate:     totalGross > 0 ? (newTotalTax / totalGross) * 100 : 0,
    specialRateItems:  items,
    specialRateTax:    specialTax,
  }

  return compare(old, newR)
}

// ── Select options (for UI) ────────────────────────────────────────────────

export const FY_OPTIONS: { value: FY; label: string }[] = [
  { value: 'FY2025-26', label: 'FY 2025–26 (AY 2026–27)' },
  { value: 'FY2024-25', label: 'FY 2024–25 (AY 2025–26)' },
]

export const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: 'below60',     label: 'Below 60 years' },
  { value: 'senior',      label: 'Senior Citizen (60–79)' },
  { value: 'superSenior', label: 'Super Senior (80+)' },
]
