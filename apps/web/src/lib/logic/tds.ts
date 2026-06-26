// TDS computation for common sections under Income Tax Act

export type TDSSectionId =
  | 'salary_192'
  | 'sec_193'
  | 'dividend_194'
  | 'bank_interest_194A'
  | 'other_interest_194A'
  | 'lottery_194B'
  | 'winnings_194BB'
  | 'contractor_194C'
  | 'insurance_comm_194D'
  | 'life_insurance_194DA'
  | 'lottery_comm_194G'
  | 'commission_194H'
  | 'rent_building_194I'
  | 'rent_plant_194I'
  | 'rent_individual_194IB'
  | 'jda_194IC'
  | 'property_purchase_194IA'
  | 'professional_194J'
  | 'technical_194J'
  | 'royalty_194J'
  | 'payment_indiv_194M'
  | 'cash_withdrawal_194N'
  | 'ecommerce_194O'
  | 'goods_purchase_194Q'
  | 'benefit_194R'
  | 'vda_194S'
  | 'partner_payment_194T'

export interface TDSSectionMeta {
  id:           TDSSectionId
  section:      string
  label:        string
  desc:         string
  category:     string
  isSalary:     boolean
  threshold:    number | null
  thresholdNote?: string
  hasPayeeType: boolean
  rates:        { label: string; rate: number; payeeType?: 'individual_huf' | 'other' }[]
  noPanRate:    number
  notes:        string[]
}

export const TDS_SECTIONS: TDSSectionMeta[] = [
  {
    id: 'salary_192', section: '192', label: 'Salary', category: 'Salary',
    desc: 'TDS on salary income by employer',
    isSalary: true, threshold: null, hasPayeeType: false,
    rates: [{ label: 'Based on income tax slab', rate: 0 }],
    noPanRate: 0,
    notes: [
      'No fixed rate — employer computes estimated annual tax and deducts 1/12th each month.',
      'Use the Income Tax Calculator to find annual tax, then divide by 12 for monthly TDS.',
    ],
  },
  {
    id: 'contractor_194C', section: '194C', label: 'Contractor / Sub-contractor', category: 'Business Payments',
    desc: 'Works contract, supply, transport, catering etc.',
    isSalary: false, threshold: 30_000,
    thresholdNote: '₹30,000 per payment OR ₹1,00,000 aggregate in a year',
    hasPayeeType: true,
    rates: [
      { label: 'Individual / HUF', rate: 1, payeeType: 'individual_huf' },
      { label: 'Company / Firm / AOP', rate: 2, payeeType: 'other' },
    ],
    noPanRate: 20,
    notes: ['TDS triggered if single payment > ₹30,000 or aggregate > ₹1,00,000.'],
  },
  {
    id: 'professional_194J', section: '194J', label: 'Professional Fees', category: 'Business Payments',
    desc: 'Fees to doctors, CA, lawyers, architects, consultants',
    isSalary: false, threshold: 30_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 10 }],
    noPanRate: 20,
    notes: ['Covers professional services: medical, legal, engineering, accounting, etc.', 'Threshold ₹30,000 per payee per year.'],
  },
  {
    id: 'technical_194J', section: '194J', label: 'Technical Services / Royalty (lower)', category: 'Business Payments',
    desc: 'IT services, manpower supply, call centers, royalty payments (not professional)',
    isSalary: false, threshold: 30_000, hasPayeeType: false,
    rates: [{ label: 'Reduced rate', rate: 2 }],
    noPanRate: 20,
    notes: ['2% applies for technical services, certain royalties, call center payments.', 'Threshold ₹30,000 per payee per year.'],
  },
  {
    id: 'commission_194H', section: '194H', label: 'Commission / Brokerage', category: 'Business Payments',
    desc: 'Commission or brokerage paid (excluding securities)',
    isSalary: false, threshold: 15_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 5 }],
    noPanRate: 20,
    notes: ['Threshold ₹15,000 in a financial year.'],
  },
  {
    id: 'rent_building_194I', section: '194I', label: 'Rent — Land / Building / Furniture', category: 'Rent',
    desc: 'Rent paid for land, building, or furniture',
    isSalary: false, threshold: 2_40_000,
    thresholdNote: '₹2,40,000 per year (₹20,000/month)',
    hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 10 }],
    noPanRate: 20,
    notes: ['Applicable when annual rent exceeds ₹2,40,000.'],
  },
  {
    id: 'rent_plant_194I', section: '194I', label: 'Rent — Plant / Machinery / Equipment', category: 'Rent',
    desc: 'Rent paid for plant, machinery or equipment',
    isSalary: false, threshold: 2_40_000, hasPayeeType: false,
    rates: [{ label: 'Reduced rate', rate: 2 }],
    noPanRate: 20,
    notes: ['Lower 2% rate applies for plant, machinery and equipment.'],
  },
  {
    id: 'bank_interest_194A', section: '194A', label: 'Bank / FD / RD Interest', category: 'Interest & Dividends',
    desc: 'Interest paid by banks, post offices, cooperative banks',
    isSalary: false, threshold: 40_000,
    thresholdNote: '₹40,000/year; ₹50,000 for senior citizens (60+)',
    hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 10 }],
    noPanRate: 20,
    notes: ['₹50,000 threshold for senior citizens.', 'TDS deducted only when annual interest crosses threshold.'],
  },
  {
    id: 'other_interest_194A', section: '194A', label: 'Other Interest (non-bank)', category: 'Interest & Dividends',
    desc: 'Interest paid by companies, firms (not banks/post offices)',
    isSalary: false, threshold: 5_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 10 }],
    noPanRate: 20,
    notes: ['Threshold ₹5,000 per year.'],
  },
  {
    id: 'dividend_194', section: '194', label: 'Dividend', category: 'Interest & Dividends',
    desc: 'Dividend paid by domestic companies to residents',
    isSalary: false, threshold: 5_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 10 }],
    noPanRate: 20,
    notes: ['Threshold ₹5,000 per financial year per shareholder.'],
  },
  {
    id: 'property_purchase_194IA', section: '194IA', label: 'Immovable Property Purchase', category: 'Property',
    desc: 'Buyer deducts TDS on purchase of property above ₹50 lakh',
    isSalary: false, threshold: 50_00_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 1 }],
    noPanRate: 1,
    notes: [
      'Deducted by buyer at time of payment to seller.',
      'Applied on full consideration (not just amount above ₹50L).',
      'Deposit via Form 26QB within 30 days of end of month of deduction.',
    ],
  },
  {
    id: 'lottery_194B', section: '194B', label: 'Lottery / Crossword / Betting / Online Gaming', category: 'Other',
    desc: 'Winnings from lottery, puzzle, betting, card games',
    isSalary: false, threshold: 10_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 30 }],
    noPanRate: 30,
    notes: ['TDS at 30% on entire winning amount.', 'For online gaming (194BA since FY 2023-24): 30% on net winnings at year-end or withdrawal.'],
  },
  {
    id: 'royalty_194J', section: '194J', label: 'Royalty (full rate)', category: 'Other',
    desc: 'Royalty for use of patent, copyright, trademark, franchise',
    isSalary: false, threshold: 30_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 10 }],
    noPanRate: 20,
    notes: ['10% applies for royalty not covered by the 2% technical services carve-out.'],
  },
  // ── Additional sections ───────────────────────────────────────────────────
  {
    id: 'sec_193', section: '193', label: 'Interest on Securities', category: 'Interest & Dividends',
    desc: 'Interest on debentures, bonds, government securities paid by company or government',
    isSalary: false, threshold: 5_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 10 }],
    noPanRate: 20,
    notes: ['Threshold ₹5,000 per year.', 'No TDS on certain government securities paid to residents.'],
  },
  {
    id: 'winnings_194BB', section: '194BB', label: 'Horse Race Winnings', category: 'Winnings',
    desc: 'Winnings from horse race from any race club or bookmaker',
    isSalary: false, threshold: 10_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 30 }],
    noPanRate: 30,
    notes: ['TDS at 30% on entire winning amount.'],
  },
  {
    id: 'insurance_comm_194D', section: '194D', label: 'Insurance Commission', category: 'Insurance',
    desc: 'Commission or remuneration paid to insurance agents or surveyors',
    isSalary: false, threshold: 15_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 5 }],
    noPanRate: 20,
    notes: ['Threshold ₹15,000 per financial year.'],
  },
  {
    id: 'life_insurance_194DA', section: '194DA', label: 'Life Insurance Policy Maturity', category: 'Insurance',
    desc: 'Sum received under a life insurance policy (including bonus) on maturity',
    isSalary: false, threshold: 1_00_000, hasPayeeType: false,
    rates: [{ label: 'Rate on income portion', rate: 2 }],
    noPanRate: 20,
    notes: ['TDS at 2% only on the income component (proceeds minus premiums paid).', 'Threshold ₹1,00,000 total proceeds per year.'],
  },
  {
    id: 'lottery_comm_194G', section: '194G', label: 'Commission on Lottery Tickets', category: 'Winnings',
    desc: 'Commission, remuneration or prize paid to lottery ticket sellers / stocking agents',
    isSalary: false, threshold: 15_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 5 }],
    noPanRate: 20,
    notes: ['Threshold ₹15,000 per financial year.', 'Different from 194B (winnings) — this is for agents selling tickets.'],
  },
  {
    id: 'rent_individual_194IB', section: '194IB', label: 'Rent by Individual / HUF (non-audit)', category: 'Rent',
    desc: 'Rent paid by individual or HUF not subject to tax audit',
    isSalary: false, threshold: 50_000, thresholdNote: '₹50,000 per month', hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 5 }],
    noPanRate: 20,
    notes: ['For individuals/HUF not liable to tax audit under 44AB.', 'TDS triggered when monthly rent exceeds ₹50,000.', 'Deducted once at year-end or tenancy end.'],
  },
  {
    id: 'jda_194IC', section: '194IC', label: 'Joint Development Agreement', category: 'Property',
    desc: 'Payment in cash or kind under joint development agreement for land / building',
    isSalary: false, threshold: null, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 10 }],
    noPanRate: 20,
    notes: ['No threshold — TDS on all payments made under JDA.'],
  },
  {
    id: 'payment_indiv_194M', section: '194M', label: 'Payment by Individual / HUF (contract / professional)', category: 'Business Payments',
    desc: 'Payments for contractor, professional fees, commission by individual/HUF not liable to audit',
    isSalary: false, threshold: 50_00_000, thresholdNote: '₹50,00,000 aggregate in a year', hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 5 }],
    noPanRate: 20,
    notes: ['Applies when individual/HUF is not liable to deduct under 194C/194H/194J (not subject to audit).', 'Threshold ₹50 lakh aggregate per year.'],
  },
  {
    id: 'cash_withdrawal_194N', section: '194N', label: 'Cash Withdrawal (Bank)', category: 'Banking & Finance',
    desc: 'Cash withdrawal from bank, cooperative bank or post office above threshold',
    isSalary: false, threshold: 1_00_00_000, thresholdNote: '₹1,00,00,000 (₹1 Cr) for regular filers; ₹20,00,000 for non-ITR filers', hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 2 }],
    noPanRate: 20,
    notes: ['2% on amount exceeding ₹1 Cr for regular ITR filers.', 'Non-ITR filers: 2% above ₹20L, 5% on amount above ₹1 Cr.'],
  },
  {
    id: 'ecommerce_194O', section: '194O', label: 'E-commerce Payments', category: 'Business Payments',
    desc: 'Payment by e-commerce operator to participant (seller/service provider on platform)',
    isSalary: false, threshold: 5_00_000, thresholdNote: '₹5,00,000 aggregate sales per participant per year', hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 0.1 }],
    noPanRate: 5,
    notes: ['0.1% on gross amount credited/paid to e-commerce participant.', 'No PAN: 5% rate applies.'],
  },
  {
    id: 'goods_purchase_194Q', section: '194Q', label: 'Purchase of Goods', category: 'Business Payments',
    desc: 'TDS by buyer on purchase of goods from resident seller above ₹50 lakh',
    isSalary: false, threshold: 50_00_000, thresholdNote: '₹50,00,000 aggregate per seller per year', hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 0.1 }],
    noPanRate: 5,
    notes: ['Applies to buyers with turnover > ₹10 Cr in previous year.', 'Not applicable if seller is already liable for TCS under 206C.', 'No PAN: 5% rate applies.'],
  },
  {
    id: 'benefit_194R', section: '194R', label: 'Benefits / Perquisites', category: 'Business Payments',
    desc: 'Benefits or perquisites (cash or kind) given in course of business or profession',
    isSalary: false, threshold: 20_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 10 }],
    noPanRate: 20,
    notes: ['Threshold ₹20,000 aggregate per recipient per year.', 'Covers gifts, samples, hospitality to doctors, influencers, distributors etc.'],
  },
  {
    id: 'vda_194S', section: '194S', label: 'VDA / Crypto (Digital Assets)', category: 'Digital Assets',
    desc: 'TDS on payment for transfer of Virtual Digital Asset (crypto, NFT etc.)',
    isSalary: false, threshold: 50_000, thresholdNote: '₹50,000/year; ₹10,000 for specified persons', hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 1 }],
    noPanRate: 20,
    notes: ['Buyer deducts 1% on consideration paid for VDA.', 'Specified persons (individual/HUF not in business): ₹10,000 threshold.'],
  },
  {
    id: 'partner_payment_194T', section: '194T', label: 'Payment to Partners of Firm', category: 'Business Payments',
    desc: 'Salary, remuneration, commission, bonus or interest paid to partners of a firm',
    isSalary: false, threshold: 20_000, hasPayeeType: false,
    rates: [{ label: 'Standard rate', rate: 10 }],
    noPanRate: 20,
    notes: ['Applicable from FY 2024-25.', 'Threshold ₹20,000 aggregate per partner per year.'],
  },
]

// ── Due date helpers ───────────────────────────────────────────────────────

// TDS deposit due date: 7th of following month (30th April for March payments)
export function getTDSDepositDueDate(deductionDate: Date): Date {
  const m = deductionDate.getMonth() // 0-11
  const y = deductionDate.getFullYear()
  if (m === 2) return new Date(y, 3, 30)  // March → 30 April
  return new Date(y, m + 1, 7)             // others → 7th of next month
}

// TDS return (quarterly) due dates
export function getTDSReturnDueDate(deductionDate: Date): Date {
  const m = deductionDate.getMonth()
  const y = deductionDate.getFullYear()
  if (m >= 3 && m <= 5)  return new Date(y, 6, 31)      // Q1 Apr-Jun → 31 Jul
  if (m >= 6 && m <= 8)  return new Date(y, 9, 31)      // Q2 Jul-Sep → 31 Oct
  if (m >= 9 && m <= 11) return new Date(y + 1, 0, 31)  // Q3 Oct-Dec → 31 Jan
  return new Date(y, 4, 31)                               // Q4 Jan-Mar → 31 May
}

// Count months (or part thereof) between two dates — per Section 201(1A) rule
function countMonthsOrPart(from: Date, to: Date): number {
  if (to <= from) return 0
  let months = (to.getFullYear() - from.getFullYear()) * 12
              + (to.getMonth() - from.getMonth())
  if (to.getDate() > from.getDate()) months++
  return Math.max(1, months)
}

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

// ── Income Tax on Salary — Section 192 ────────────────────────────────────

export type AgeCategory = 'below_60' | 'senior_60_79' | 'super_senior_80'
export type ITaxRegime  = 'new' | 'old'

interface Slab { from: number; to: number; rate: number }

const SLABS: Record<string, Slab[]> = {
  new: [
    { from: 0,           to: 400_000,   rate: 0  },
    { from: 400_000,     to: 800_000,   rate: 5  },
    { from: 800_000,     to: 1_200_000, rate: 10 },
    { from: 1_200_000,   to: 1_600_000, rate: 15 },
    { from: 1_600_000,   to: 2_000_000, rate: 20 },
    { from: 2_000_000,   to: 2_400_000, rate: 25 },
    { from: 2_400_000,   to: Infinity,  rate: 30 },
  ],
  old_below_60: [
    { from: 0,           to: 250_000,   rate: 0  },
    { from: 250_000,     to: 500_000,   rate: 5  },
    { from: 500_000,     to: 1_000_000, rate: 20 },
    { from: 1_000_000,   to: Infinity,  rate: 30 },
  ],
  old_senior: [
    { from: 0,           to: 300_000,   rate: 0  },
    { from: 300_000,     to: 500_000,   rate: 5  },
    { from: 500_000,     to: 1_000_000, rate: 20 },
    { from: 1_000_000,   to: Infinity,  rate: 30 },
  ],
  old_super_senior: [
    { from: 0,           to: 500_000,   rate: 0  },
    { from: 500_000,     to: 1_000_000, rate: 20 },
    { from: 1_000_000,   to: Infinity,  rate: 30 },
  ],
}

function slabKey(regime: ITaxRegime, age: AgeCategory): string {
  if (regime === 'new') return 'new'
  if (age === 'senior_60_79')   return 'old_senior'
  if (age === 'super_senior_80') return 'old_super_senior'
  return 'old_below_60'
}

function calcSlabTax(income: number, slabs: Slab[]): number {
  let tax = 0
  for (const s of slabs) {
    if (income <= s.from) break
    const taxable = Math.min(income, s.to) - s.from
    tax += (taxable * s.rate) / 100
  }
  return Math.round(tax)
}

type Rebate87AConfig = { new: { max_rebate: number; income_threshold: number }; old: { max_rebate: number; income_threshold: number } }

function calcRebate87AWithConfig(slabTax: number, taxableIncome: number, regime: ITaxRegime, cfg?: Rebate87AConfig): number {
  if (regime === 'new') {
    const threshold  = cfg?.new.income_threshold ?? 1_200_000
    const maxRebate  = cfg?.new.max_rebate       ?? 60_000
    return taxableIncome <= threshold ? Math.min(slabTax, maxRebate) : 0
  }
  const threshold = cfg?.old.income_threshold ?? 500_000
  const maxRebate = cfg?.old.max_rebate       ?? 12_500
  return taxableIncome <= threshold ? Math.min(slabTax, maxRebate) : 0
}

type SurchargeConfig = { new_regime: { income_exceeds: number; income_upto: number | null; surcharge_pct: number }[]; old_regime: { income_exceeds: number; income_upto: number | null; surcharge_pct: number }[] }

// Surcharge with marginal relief — for individual / HUF / salaried employees
function calcSurchargeWithConfig(
  taxAfterRebate: number,
  taxableIncome: number,
  regime: ITaxRegime,
  slabs: Slab[],
  surCfg?: SurchargeConfig,
): number {
  // Build tiers from DB config if available, else use hardcoded
  let TIERS: { above: number; pct: number; prevPct: number }[]

  if (surCfg) {
    const brackets = regime === 'new' ? surCfg.new_regime : surCfg.old_regime
    TIERS = brackets
      .filter(b => b.surcharge_pct > 0)
      .map((b, i, arr) => ({
        above:   b.income_exceeds,
        pct:     b.surcharge_pct,
        prevPct: i > 0 ? arr[i - 1].surcharge_pct : 0,
      }))
  } else {
    TIERS = [
      { above: 5_000_000,  pct: 10, prevPct: 0  },
      { above: 10_000_000, pct: 15, prevPct: 10 },
      { above: 20_000_000, pct: 25, prevPct: 15 },
      { above: 50_000_000, pct: regime === 'new' ? 25 : 37, prevPct: 25 },
    ]
  }

  let activeTier: (typeof TIERS)[0] | null = null
  for (const t of TIERS) if (taxableIncome > t.above) activeTier = t
  if (!activeTier) return 0

  const rawSurcharge = Math.round((taxAfterRebate * activeTier.pct) / 100)

  // Marginal relief: (tax + surcharge) ≤ (total at threshold) + (income − threshold)
  const threshold = activeTier.above
  const taxAtThr  = calcSlabTax(threshold, slabs)
  const rebateThr = calcRebate87AWithConfig(taxAtThr, threshold, regime)
  const tAfterThr = Math.max(0, taxAtThr - rebateThr)
  const sThr      = Math.round((tAfterThr * activeTier.prevPct) / 100)
  const totalAtThr = tAfterThr + sThr

  const maxTotal = totalAtThr + (taxableIncome - threshold)
  const relief   = Math.max(0, (taxAfterRebate + rawSurcharge) - maxTotal)

  return Math.max(0, rawSurcharge - relief)
}

export interface SalaryTaxInput {
  regime:          ITaxRegime
  ageCategory:     AgeCategory
  grossSalary:     number
  otherIncome:     number   // any other annual income
  hraExemption:    number   // old regime: HRA exempt amount
  ltaExemption:    number   // old regime: LTA exempt amount
  otherExemptions: number   // old regime: other allowance exemptions
  d80C:            number   // old regime, max 1,50,000
  d80D:            number   // old regime
  d80CCD1B:        number   // both regimes, max 50,000
  d80CCD2:         number   // both regimes: employer NPS contribution (14% new / 10% old)
  dOther:          number   // old regime: other Chapter VI-A deductions
}

export interface SalaryTaxResult {
  grossSalary:      number
  stdDeduction:     number
  totalExemptions:  number
  totalDeductions:  number
  taxableIncome:    number
  slabTax:          number
  rebate87A:        number
  taxAfterRebate:   number
  surcharge:        number
  cess:             number
  annualTax:        number
  monthlyTDS:       number
  effectiveRate:    number
}

export interface IncomeTaxOverride {
  slabs?:        Record<string, Slab[]>
  stdDeduction?: { new: number; old: number }
  rebate87A?:    { new: { max_rebate: number; income_threshold: number }; old: { max_rebate: number; income_threshold: number } }
  surcharge?:    { new_regime: { income_exceeds: number; income_upto: number | null; surcharge_pct: number }[]; old_regime: { income_exceeds: number; income_upto: number | null; surcharge_pct: number }[] }
}

export function computeSalaryTax(input: SalaryTaxInput, override?: IncomeTaxOverride): SalaryTaxResult {
  const { regime, ageCategory, grossSalary, otherIncome } = input
  const stdDedConfig = override?.stdDeduction ?? { new: 75_000, old: 50_000 }
  const stdDeduction = regime === 'new' ? stdDedConfig.new : stdDedConfig.old

  // Old regime: HRA + LTA + other exemptions (capped at gross salary)
  const totalExemptions = regime === 'old'
    ? Math.min(grossSalary - stdDeduction, input.hraExemption + input.ltaExemption + input.otherExemptions)
    : 0

  const salaryAfterDeductions = Math.max(0, grossSalary - stdDeduction - totalExemptions)
  const grossTotal = salaryAfterDeductions + Math.max(0, otherIncome)

  // Chapter VI-A deductions
  const d80C_capped     = Math.min(input.d80C, 150_000)
  const d80CCD1B_capped = Math.min(input.d80CCD1B, 50_000)
  let totalDeductions = d80CCD1B_capped + Math.max(0, input.d80CCD2)
  if (regime === 'old') totalDeductions += d80C_capped + Math.max(0, input.d80D) + Math.max(0, input.dOther)
  totalDeductions = Math.min(totalDeductions, grossTotal)

  const taxableIncome = Math.max(0, grossTotal - totalDeductions)

  const slabsMap      = override?.slabs ?? SLABS
  const slabs         = slabsMap[slabKey(regime, ageCategory)] ?? SLABS[slabKey(regime, ageCategory)]
  const slabTax       = calcSlabTax(taxableIncome, slabs)
  const rebate87A     = calcRebate87AWithConfig(slabTax, taxableIncome, regime, override?.rebate87A)
  const taxAfterRebate = Math.max(0, slabTax - rebate87A)
  const surcharge     = calcSurchargeWithConfig(taxAfterRebate, taxableIncome, regime, slabs, override?.surcharge)
  const cess          = Math.round((taxAfterRebate + surcharge) * 0.04)
  const annualTax     = taxAfterRebate + surcharge + cess
  const monthlyTDS    = Math.round(annualTax / 12)
  const effectiveRate = grossSalary > 0 ? Math.round((annualTax / grossSalary) * 10000) / 100 : 0

  return {
    grossSalary, stdDeduction, totalExemptions, totalDeductions,
    taxableIncome, slabTax, rebate87A, taxAfterRebate,
    surcharge, cess, annualTax, monthlyTDS, effectiveRate,
  }
}

// ── Core TDS compute ───────────────────────────────────────────────────────

export interface TDSInput {
  sectionId:    TDSSectionId
  amount:       number
  payeeType:    'individual_huf' | 'other'
  panAvailable: boolean
}

export interface TDSResult {
  section:          TDSSectionMeta
  amount:           number
  threshold:        number | null
  isAboveThreshold: boolean
  applicableRate:   number
  tdsAmount:        number
  noPanRate:        number
  tdsAmountNoPan:   number
  netToPayee:       number
  salaryTax?:       SalaryTaxResult  // only present for salary_192 entries
}

export function computeTDS(input: TDSInput, sectionsOverride?: TDSSectionMeta[]): TDSResult | null {
  const sections = sectionsOverride ?? TDS_SECTIONS
  const section = sections.find(s => s.id === input.sectionId)
  if (!section || section.isSalary) return null

  const amount = Math.max(0, input.amount)
  const isAboveThreshold = section.threshold === null ? true : amount > section.threshold

  const applicableRate = section.hasPayeeType
    ? (section.rates.find(r => r.payeeType === input.payeeType)?.rate ?? section.rates[0].rate)
    : section.rates[0].rate

  const effectiveRate   = !input.panAvailable ? section.noPanRate : applicableRate
  const tdsAmount       = isAboveThreshold ? (amount * effectiveRate) / 100 : 0
  const tdsAmountNoPan  = isAboveThreshold ? (amount * section.noPanRate) / 100 : 0

  return {
    section,
    amount,
    threshold:        section.threshold,
    isAboveThreshold,
    applicableRate,
    tdsAmount:        Math.round(tdsAmount * 100) / 100,
    noPanRate:        section.noPanRate,
    tdsAmountNoPan:   Math.round(tdsAmountNoPan * 100) / 100,
    netToPayee:       Math.round((amount - tdsAmount) * 100) / 100,
  }
}

// ── Late fees & interest ───────────────────────────────────────────────────

export interface LateFeesResult {
  // 201(1A) — interest on late deposit
  interest201Months:  number
  interest201Amount:  number
  depositDueDate:     Date
  isDepositLate:      boolean
  // 234E — late filing fee
  fee234EDays:        number
  fee234EAmount:      number
  returnDueDate:      Date
  isReturnLate:       boolean
  // totals
  totalPenalty:       number
}

export function computeLateFees(
  tdsAmount:        number,
  deductionDate:    Date,
  depositDate:      Date | null,
  returnFilingDate: Date | null,
): LateFeesResult {
  const depositDue = getTDSDepositDueDate(deductionDate)
  const returnDue  = getTDSReturnDueDate(deductionDate)

  let interest201Months = 0
  let interest201Amount = 0
  let isDepositLate = false

  if (depositDate && depositDate > depositDue) {
    isDepositLate = true
    interest201Months = countMonthsOrPart(deductionDate, depositDate)
    interest201Amount = Math.round(tdsAmount * 0.015 * interest201Months * 100) / 100
  }

  let fee234EDays = 0
  let fee234EAmount = 0
  let isReturnLate = false

  if (returnFilingDate && returnFilingDate > returnDue) {
    isReturnLate = true
    fee234EDays = Math.floor((returnFilingDate.getTime() - returnDue.getTime()) / (24 * 60 * 60 * 1000))
    fee234EAmount = Math.min(fee234EDays * 200, tdsAmount)
  }

  return {
    interest201Months,
    interest201Amount,
    depositDueDate: depositDue,
    isDepositLate,
    fee234EDays,
    fee234EAmount,
    returnDueDate: returnDue,
    isReturnLate,
    totalPenalty: interest201Amount + fee234EAmount,
  }
}
