// Advance Tax installment calculator
// Uses income tax computation; shows quarterly schedule with due dates

import { computeBasic, FY_OPTIONS, AGE_OPTIONS, type FY, type AgeGroup } from './income-tax'

export { FY_OPTIONS, AGE_OPTIONS, type FY, type AgeGroup }

// ── Quarter schedule ───────────────────────────────────────────────────────

interface Quarter {
  label:       string   // "Q1", "Q2" etc.
  dueDate:     string   // human readable
  dueDateISO:  string   // for Date comparison
  cumulativePct: number // 15, 45, 75, 100
}

const QUARTERS: Record<FY, Quarter[]> = {
  'FY2025-26': [
    { label: 'Q1', dueDate: '15 Jun 2025', dueDateISO: '2025-06-15', cumulativePct: 15 },
    { label: 'Q2', dueDate: '15 Sep 2025', dueDateISO: '2025-09-15', cumulativePct: 45 },
    { label: 'Q3', dueDate: '15 Dec 2025', dueDateISO: '2025-12-15', cumulativePct: 75 },
    { label: 'Q4', dueDate: '15 Mar 2026', dueDateISO: '2026-03-15', cumulativePct: 100 },
  ],
  'FY2024-25': [
    { label: 'Q1', dueDate: '15 Jun 2024', dueDateISO: '2024-06-15', cumulativePct: 15 },
    { label: 'Q2', dueDate: '15 Sep 2024', dueDateISO: '2024-09-15', cumulativePct: 45 },
    { label: 'Q3', dueDate: '15 Dec 2024', dueDateISO: '2024-12-15', cumulativePct: 75 },
    { label: 'Q4', dueDate: '15 Mar 2025', dueDateISO: '2025-03-15', cumulativePct: 100 },
  ],
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface AdvanceTaxInput {
  fy:                  FY
  ageGroup:            AgeGroup
  estimatedIncome:     number
  hasSalary:           boolean
  oldRegimeDeductions: number
  estimatedTDS:        number   // TDS to be deducted by employer/banks during the year
  regime:              'old' | 'new'
}

export interface Instalment {
  label:            string
  dueDate:          string
  cumulativePct:    number
  cumulativeAmount: number
  amount:           number   // this instalment's payment (cumulative - previous)
  isPast:           boolean
}

export interface AdvanceTaxResult {
  estimatedAnnualTax: number
  tdsCredit:          number
  netAdvanceTax:      number
  isApplicable:       boolean   // true if netAdvanceTax > ₹10,000
  instalments:        Instalment[]
}

// ── Compute ────────────────────────────────────────────────────────────────

export function computeAdvanceTax(input: AdvanceTaxInput): AdvanceTaxResult {
  const taxResult = computeBasic({
    fy:                  input.fy,
    ageGroup:            input.ageGroup,
    grossIncome:         input.estimatedIncome,
    hasSalary:           input.hasSalary,
    oldRegimeDeductions: input.regime === 'old' ? input.oldRegimeDeductions : 0,
  })

  const annualTax = input.regime === 'old'
    ? taxResult.old.totalTax
    : taxResult.new.totalTax

  const tds            = Math.max(0, input.estimatedTDS)
  const netAdvanceTax  = Math.max(0, annualTax - tds)
  const isApplicable   = netAdvanceTax > 10_000

  const today     = new Date()
  const quarters  = QUARTERS[input.fy]
  let prevCumAmt  = 0

  const instalments: Instalment[] = quarters.map(q => {
    const cumAmt = isApplicable ? Math.round((q.cumulativePct / 100) * netAdvanceTax) : 0
    const instAmt = cumAmt - prevCumAmt
    prevCumAmt = cumAmt
    return {
      label:            q.label,
      dueDate:          q.dueDate,
      cumulativePct:    q.cumulativePct,
      cumulativeAmount: cumAmt,
      amount:           instAmt,
      isPast:           new Date(q.dueDateISO) < today,
    }
  })

  return {
    estimatedAnnualTax: annualTax,
    tdsCredit:          tds,
    netAdvanceTax,
    isApplicable,
    instalments,
  }
}
