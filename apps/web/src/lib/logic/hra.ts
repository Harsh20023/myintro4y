// HRA exemption logic — Section 10(13A)
// Exemption = minimum of three components

export interface HRAInput {
  basicSalary:  number   // annual
  hraReceived:  number   // annual, from employer
  rentPaid:     number   // annual, actual rent paid
  isMetro:      boolean  // Delhi, Mumbai, Kolkata, Chennai = metro (50%); others = 40%
}

export interface HRAResult {
  component1_actualHRA:      number   // actual HRA received
  component2_rentMinusTen:   number   // rent paid - 10% of basic
  component3_percentBasic:   number   // 50% or 40% of basic
  exemption:                 number   // min of above three
  taxableHRA:                number   // HRA received - exemption
  metroPercent:              number   // 50 or 40
}

export function computeHRA(input: HRAInput): HRAResult {
  const { basicSalary, hraReceived, rentPaid, isMetro } = input
  const metroPercent  = isMetro ? 50 : 40

  const c1 = Math.max(0, hraReceived)
  const c2 = Math.max(0, rentPaid - 0.10 * basicSalary)
  const c3 = (metroPercent / 100) * basicSalary

  const exemption  = rentPaid > 0 ? Math.max(0, Math.min(c1, c2, c3)) : 0
  const taxableHRA = Math.max(0, hraReceived - exemption)

  return {
    component1_actualHRA:    c1,
    component2_rentMinusTen: c2,
    component3_percentBasic: c3,
    exemption,
    taxableHRA,
    metroPercent,
  }
}
