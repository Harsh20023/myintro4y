// TDS computation for common sections under Income Tax Act

export type TDSSectionId =
  | 'salary_192'
  | 'bank_interest_194A'
  | 'other_interest_194A'
  | 'contractor_194C'
  | 'commission_194H'
  | 'rent_building_194I'
  | 'rent_plant_194I'
  | 'property_purchase_194IA'
  | 'professional_194J'
  | 'technical_194J'
  | 'lottery_194B'
  | 'dividend_194'
  | 'royalty_194J'

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
}

export function computeTDS(input: TDSInput): TDSResult | null {
  const section = TDS_SECTIONS.find(s => s.id === input.sectionId)
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
