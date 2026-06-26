import { TdsCodeYear } from '../models/TdsCodeYear'
import { TdsSchedule } from '../models/TdsSchedule'
import { TaxSurcharge } from '../models/TaxSurcharge'
import { TaxMetaYear } from '../models/TaxMetaYear'

// ── Types (mirrored from frontend tds.ts) ─────────────────────────────────────

interface SlabEntry       { from: number; to: number; rate: number }
interface SurchargeEntry  { income_exceeds: number; income_upto: number | null; surcharge_pct: number }

interface TDSSectionConfig {
  id:            string
  section:       string
  label:         string
  desc:          string
  category:      string
  isSalary:      boolean
  threshold:     number | null
  thresholdNote?: string
  hasPayeeType:  boolean
  rates:         { label: string; rate: number; payeeType?: string }[]
  noPanRate:     number
  notes:         string[]
}

interface IncomeTaxConfig {
  slabs: {
    new:             SlabEntry[]
    old_below_60:    SlabEntry[]
    old_senior:      SlabEntry[]
    old_super_senior: SlabEntry[]
  }
  rebate_87a: {
    new: { max_rebate: number; income_threshold: number }
    old: { max_rebate: number; income_threshold: number }
  }
  std_deduction:   { new: number; old: number }
  surcharge: {
    new_regime: SurchargeEntry[]
    old_regime: SurchargeEntry[]
  }
}

export interface CompiledTaxConfig {
  tax_year:    string
  compiled_at: string
  version:     string
  income_tax:  IncomeTaxConfig
  tds_sections: TDSSectionConfig[]
}

// ── DB code → calculator section mapping ─────────────────────────────────────

// Maps our section IDs to TDS code year codes for rate/threshold lookup
const SECTION_DB_CODES: Record<string, string | { individual_huf: string; other: string }> = {
  // Original 13 sections
  contractor_194C:         { individual_huf: '1023', other: '1024' },
  professional_194J:       '1027',
  technical_194J:          '1026',
  commission_194H:         '1006',
  rent_building_194I:      '1009',
  rent_plant_194I:         '1008',
  bank_interest_194A:      '1021',
  other_interest_194A:     '1021',
  dividend_194:            '1029',
  property_purchase_194IA: '1010',
  // lottery_194B and royalty_194J: no direct DB code — fall back to template
  // Additional sections
  sec_193:                 '1019',  // interest on securities, 10%
  winnings_194BB:          '1062',  // horse race, 30%
  insurance_comm_194D:     '1005',  // insurance commission (2% in new ITA; was 5%)
  life_insurance_194DA:    '1030',  // life insurance policy maturity, 2%
  lottery_comm_194G:       '1063',  // commission on lottery tickets (2% in new ITA; was 5%)
  rent_individual_194IB:   '1007',  // rent by individual/HUF, 2%
  jda_194IC:               '1011',  // joint development agreement, 10%
  payment_indiv_194M:      '1025',  // payment by individual/HUF, 2%
  cash_withdrawal_194N:    '1065',  // cash withdrawal (non-coop), 2%
  ecommerce_194O:          '1035',  // e-commerce operator, 0.1%
  goods_purchase_194Q:     '1031',  // purchase of goods, 0.1%
  benefit_194R:            '1033',  // benefits/perquisites, 10%
  vda_194S:                '1037',  // VDA/crypto, 1%
  partner_payment_194T:    '1067',  // payment to partners, 10%
}

// Static section templates (metadata doesn't change, rates/thresholds come from DB)
const SECTION_TEMPLATES: TDSSectionConfig[] = [
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
    notes: ['Applies when individual/HUF is not liable to deduct under 194C/194H/194J.', 'Threshold ₹50 lakh aggregate per year.'],
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
    notes: ['Applies to buyers with turnover > ₹10 Cr in previous year.', 'Not applicable if seller is liable for TCS under 206C.', 'No PAN: 5% rate applies.'],
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

// ── Compiler ─────────────────────────────────────────────────────────────────

async function getRate(code: string, taxYear: string): Promise<number | null> {
  const yr = await TdsCodeYear.findOne({ code, tax_year: taxYear }).lean() as any
  if (!yr) return null
  const r = yr.rates_json?.find((r: any) => r.applies_to === 'resident')
  return typeof r?.value === 'number' ? r.value : null
}

async function getThreshold(code: string, taxYear: string): Promise<number | null> {
  const yr = await TdsCodeYear.findOne({ code, tax_year: taxYear }).lean() as any
  if (!yr) return null
  const t = yr.thresholds_json?.[0]
  return typeof t?.amount === 'number' ? t.amount : null
}

async function compileSections(taxYear: string): Promise<TDSSectionConfig[]> {
  const result: TDSSectionConfig[] = []

  for (const tpl of SECTION_TEMPLATES) {
    if (tpl.isSalary) { result.push({ ...tpl }); continue }

    const codes = SECTION_DB_CODES[tpl.id]
    if (!codes) { result.push({ ...tpl }); continue }

    if (typeof codes === 'string') {
      // single code — override all rates and optionally threshold
      const rate = await getRate(codes, taxYear)
      const thr  = (tpl.id === 'bank_interest_194A' || tpl.id === 'other_interest_194A')
        ? tpl.threshold   // keep original: 40k / 5k (DB code 1021 covers both)
        : await getThreshold(codes, taxYear)

      result.push({
        ...tpl,
        rates: rate !== null
          ? tpl.rates.map(r => ({ ...r, rate }))
          : tpl.rates,
        threshold: thr !== null ? thr : tpl.threshold,
        // Preserve special noPanRate (e.g. 194IA=1, 194O/194Q=5, 194B=30); only apply 206AA formula when template uses the standard 20
        noPanRate: tpl.noPanRate === 20 && rate !== null ? Math.max(rate, 20) : tpl.noPanRate,
      })
    } else {
      // dual code (contractor_194C) — one rate per payee type
      const rateInd  = await getRate(codes.individual_huf, taxYear)
      const rateComp = await getRate(codes.other, taxYear)
      const thr      = await getThreshold(codes.individual_huf, taxYear)

      result.push({
        ...tpl,
        rates: [
          { ...tpl.rates[0], rate: rateInd  ?? tpl.rates[0].rate },
          { ...tpl.rates[1], rate: rateComp ?? tpl.rates[1].rate },
        ],
        threshold: thr !== null ? thr : tpl.threshold,
      })
    }
  }

  return result
}

function fixSlabs(brackets: any[]): SlabEntry[] {
  return brackets.map((b: any, i: number, arr: any[]) => ({
    from: Number(b.from),
    to:   b.to != null ? Number(b.to) : Infinity,
    rate: Number(b.rate),
  }))
}

async function compileIncomeTax(taxYear: string): Promise<IncomeTaxConfig> {
  const yearTag = taxYear.replace('-', '_')

  // Slabs from TdsSchedule
  const schedRefs = {
    new:             `new_regime_individual_huf_${yearTag}`,
    old_below_60:    `old_regime_standard_${yearTag}`,
    old_senior:      `old_regime_senior_${yearTag}`,
    old_super_senior: `old_regime_super_senior_${yearTag}`,
  }

  const slabs: IncomeTaxConfig['slabs'] = {
    new:             [],
    old_below_60:    [],
    old_senior:      [],
    old_super_senior: [],
  }

  for (const [key, ref] of Object.entries(schedRefs)) {
    const s = await TdsSchedule.findOne({ ref }).lean() as any
    if (s?.brackets_json) slabs[key as keyof typeof slabs] = fixSlabs(s.brackets_json)
  }

  // Rebate 87A and std deduction from TaxMetaYear
  const meta = await TaxMetaYear.findOne({ tax_year: taxYear }).lean() as any

  const rebate_87a: IncomeTaxConfig['rebate_87a'] = {
    new: {
      max_rebate:       meta?.rebate_87a?.new_regime?.max_rebate_amount ?? 60_000,
      income_threshold: meta?.rebate_87a?.new_regime?.income_threshold  ?? 1_200_000,
    },
    old: {
      max_rebate:       meta?.rebate_87a?.old_regime?.max_rebate_amount ?? 12_500,
      income_threshold: meta?.rebate_87a?.old_regime?.income_threshold  ?? 500_000,
    },
  }

  const std_deduction: IncomeTaxConfig['std_deduction'] = {
    new: meta?.standard_deduction?.salaried_new_regime?.amount ?? 75_000,
    old: meta?.standard_deduction?.salaried_old_regime?.amount ?? 50_000,
  }

  // Surcharge from TaxSurcharge (individual_huf_aop_boi)
  const sur = await TaxSurcharge.findOne({
    tax_year: taxYear,
    entity_class: 'individual_huf_aop_boi',
  }).lean() as any

  const surcharge: IncomeTaxConfig['surcharge'] = {
    new_regime: sur?.brackets_json?.new_regime ?? [],
    old_regime: sur?.brackets_json?.old_regime ?? [],
  }

  return { slabs, rebate_87a, std_deduction, surcharge }
}

export async function compileTaxConfig(taxYear: string): Promise<CompiledTaxConfig> {
  const [income_tax, tds_sections] = await Promise.all([
    compileIncomeTax(taxYear),
    compileSections(taxYear),
  ])

  return {
    tax_year:    taxYear,
    compiled_at: new Date().toISOString(),
    version:     `${taxYear}-${Date.now()}`,
    income_tax,
    tds_sections,
  }
}
