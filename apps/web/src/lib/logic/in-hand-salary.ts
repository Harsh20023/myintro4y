// CTC → take-home salary breakdown
// Computes the monthly/annual salary structure and deductions

import { computeBasic, type FY, type AgeGroup } from './income-tax'

export type { FY, AgeGroup }

export const EMPLOYER_PF_RATE = 0.12
export const EMPLOYEE_PF_RATE = 0.12
export const GRATUITY_RATE    = 0.0481   // 15/26 * (1/12) per year
export const PROF_TAX_ANNUAL  = 2_400    // ₹200/month — varies by state

export const OLD_DED_CAPS = {
  sec80C:            1_50_000,
  nps80CCD1B:          50_000,
  sec80DBelow60:       25_000,   // self/family, taxpayer < 60
  sec80DSenior:        50_000,   // self/family, taxpayer ≥ 60
  sec80DParents:       25_000,   // parents < 60
  sec80DParentsSenior: 50_000,   // parents ≥ 60
  sec80TTA:            10_000,   // savings interest, taxpayer < 60
  sec80TTB:            50_000,   // all interest, taxpayer ≥ 60 (80TTB)
}

export interface InHandInput {
  fy:                FY
  ageGroup:          AgeGroup
  ctc:               number       // annual CTC
  basicPct:          number       // % of CTC that is basic (e.g. 40)
  hraComponentPct:   number       // % of basic paid as HRA by employer (e.g. 40, 50, 30)
  isMetro:           boolean
  regime:            'old' | 'new'
  applyPF:           boolean    // false for companies exempt from PF or to model no-PF scenarios
  applyGratuity:     boolean    // false for companies not covered by Payment of Gratuity Act
  applyProfTax:      boolean    // false for states with no PT (Delhi, UP, Haryana…)
  // old regime deductions
  rentPaidMonthly:   number    // 0 = skip HRA exemption; otherwise auto-compute
  extraSec80C:       number    // PPF, ELSS, LIC, NSC, home loan principal, etc.
  sec80D:            number    // self + family health insurance
  sec80DParents:     number    // parents health insurance
  parentsSenior:     boolean   // true → parents 80D cap ₹50k
  nps80CCD1B:        number    // extra NPS over 80C
  sec80TTA:          number    // savings/interest income (80TTA < 60; 80TTB ≥ 60)
  otherDed:          number    // any remaining deductions (user's responsibility)
}

export interface SalaryBreakdown {
  // Annual salary structure
  basic:            number
  hra:              number      // HRA component from employer
  specialAllowance: number
  grossSalary:      number
  // Employer-side CTC components
  employerPF:       number
  gratuity:         number
  ctc:              number
  // Employee payroll deductions
  employeePF:       number
  professionalTax:  number
  incomeTaxTDS:     number
  totalDeductions:  number
  // Take-home
  annualTakeHome:   number
  monthlyTakeHome:  number
  // Tax deduction details (old regime)
  standardDeduction:  number
  hraExemption:       number
  sec80CTotal:        number   // EPF + extra, capped at ₹1.5L
  sec80CEPFPortion:   number   // EPF part of 80C
  sec80CRemainingCap: number   // how much room left in 80C after EPF
  nps80CCD1B:         number   // capped at ₹50k
  sec80DEffective:    number   // self/family after cap
  sec80DParentsEff:   number   // parents after cap
  sec80TTAEffective:  number   // 80TTA/80TTB after cap
  totalOldDeductions: number   // all old regime deductions combined
  effectiveTaxRate:   number
}

export function computeInHandSalary(input: InHandInput): SalaryBreakdown {
  const { ctc, basicPct, isMetro, fy, ageGroup, regime } = input
  const isSenior = ageGroup === 'senior' || ageGroup === 'superSenior'

  // ── Salary structure ──────────────────────────────────────────────────────
  const basic            = (basicPct / 100) * ctc
  const hraPct           = isMetro ? 0.50 : 0.40        // statutory limit for exemption (c3)
  const hra              = (input.hraComponentPct / 100) * basic
  const employerPF       = input.applyPF       ? EMPLOYER_PF_RATE * basic : 0
  const gratuity         = input.applyGratuity ? GRATUITY_RATE    * basic : 0
  const grossSalary      = ctc - employerPF - gratuity
  const specialAllowance = Math.max(0, grossSalary - basic - hra)

  // ── Employee payroll deductions ───────────────────────────────────────────
  const employeePF      = input.applyPF       ? EMPLOYEE_PF_RATE * basic : 0
  const professionalTax = input.applyProfTax  ? PROF_TAX_ANNUAL          : 0

  // ── Old regime deductions ─────────────────────────────────────────────────

  // HRA exemption: min(HRA received, rent − 10% basic, X% of basic)
  let hraExemption = 0
  if (regime === 'old' && input.rentPaidMonthly > 0) {
    const mRent  = input.rentPaidMonthly
    const mBasic = basic / 12
    const mHRA   = hra   / 12
    const c1 = mHRA
    const c2 = Math.max(0, mRent - 0.1 * mBasic)
    const c3 = hraPct * mBasic
    hraExemption = Math.max(0, Math.min(c1, c2, c3)) * 12
  }

  // 80C: EPF (only if PF applied) + additional, capped at ₹1.5L
  const sec80CEPFPortion   = input.applyPF ? employeePF : 0
  const sec80CRemaining    = Math.max(0, OLD_DED_CAPS.sec80C - sec80CEPFPortion)
  const sec80CExtra        = Math.min(Math.max(0, input.extraSec80C), sec80CRemaining)
  const sec80CTotal        = sec80CEPFPortion + sec80CExtra

  // NPS 80CCD(1B): additional NPS over 80C, capped at ₹50k
  const nps80CCD1B = regime === 'old' ? Math.min(Math.max(0, input.nps80CCD1B), OLD_DED_CAPS.nps80CCD1B) : 0

  // 80D self/family: cap depends on taxpayer age
  const sec80DCap      = isSenior ? OLD_DED_CAPS.sec80DSenior : OLD_DED_CAPS.sec80DBelow60
  const sec80DEffective = regime === 'old' ? Math.min(Math.max(0, input.sec80D), sec80DCap) : 0

  // 80D parents: cap depends on parentsSenior flag
  const sec80DParentsCap = input.parentsSenior ? OLD_DED_CAPS.sec80DParentsSenior : OLD_DED_CAPS.sec80DParents
  const sec80DParentsEff = regime === 'old' ? Math.min(Math.max(0, input.sec80DParents), sec80DParentsCap) : 0

  // 80TTA (< 60: savings interest ₹10k) / 80TTB (≥ 60: all interest ₹50k)
  const sec80TTACap       = isSenior ? OLD_DED_CAPS.sec80TTB : OLD_DED_CAPS.sec80TTA
  const sec80TTAEffective = regime === 'old' ? Math.min(Math.max(0, input.sec80TTA), sec80TTACap) : 0

  // Other deductions — no cap enforced (user's responsibility)
  const otherDed = regime === 'old' ? Math.max(0, input.otherDed) : 0

  // Total old regime itemized deductions (standard deduction is applied inside computeBasic)
  const totalOldDeductions = regime === 'old'
    ? sec80CTotal + nps80CCD1B + sec80DEffective + sec80DParentsEff + sec80TTAEffective + hraExemption + otherDed
    : 0

  // ── Tax computation ───────────────────────────────────────────────────────
  const taxResult = computeBasic({
    fy,
    ageGroup,
    grossIncome:         grossSalary,
    hasSalary:           true,          // auto-applies standard deduction (₹50k old / ₹75k new)
    oldRegimeDeductions: totalOldDeductions,
  })
  const annualTax = regime === 'old' ? taxResult.old.totalTax : taxResult.new.totalTax

  // Standard deduction (for display — computeBasic already applies it)
  const standardDeduction = regime === 'old' ? Math.min(50_000, grossSalary) : Math.min(75_000, grossSalary)

  // ── Take-home ─────────────────────────────────────────────────────────────
  const totalDeductions = employeePF + professionalTax + annualTax
  const annualTakeHome  = grossSalary - totalDeductions
  const monthlyTakeHome = annualTakeHome / 12

  return {
    basic, hra, specialAllowance, grossSalary,
    employerPF, gratuity, ctc,
    employeePF, professionalTax,
    incomeTaxTDS: annualTax,
    totalDeductions,
    annualTakeHome, monthlyTakeHome,
    standardDeduction,
    hraExemption,
    sec80CTotal,
    sec80CEPFPortion,
    sec80CRemainingCap: sec80CRemaining,
    nps80CCD1B,
    sec80DEffective,
    sec80DParentsEff,
    sec80TTAEffective,
    totalOldDeductions,
    effectiveTaxRate: grossSalary > 0 ? (annualTax / grossSalary) * 100 : 0,
  }
}
