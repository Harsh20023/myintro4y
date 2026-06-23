// Capital Gains tax computation — FY 2024-25 and FY 2025-26
// Incorporates Budget 2024 changes effective July 23, 2024

export type AssetType =
  | 'equity_listed'     // Listed equity shares, equity-oriented MF
  | 'property'          // Immovable property (house, land, commercial)
  | 'gold'              // Physical gold, Gold ETF, SGB (non-stock exchange)
  | 'debt_mf'           // Debt MF / bonds (purchased after Apr 1, 2023 — always at slab)
  | 'unlisted_equity'   // Unlisted company shares
  | 'other'             // Any other capital asset

// Holding period (months) to qualify as LTCG
export const HOLDING_PERIOD_MONTHS: Record<AssetType, number> = {
  equity_listed:   12,
  property:        24,
  gold:            24,
  debt_mf:         36,   // But for post-Apr-2023 debt MF, all taxed at slab anyway
  unlisted_equity: 24,
  other:           24,
}

export const ASSET_LABELS: Record<AssetType, string> = {
  equity_listed:   'Listed Equity / Equity MF',
  property:        'Property (House / Land)',
  gold:            'Gold / Jewellery',
  debt_mf:         'Debt MF / Bonds',
  unlisted_equity: 'Unlisted Shares',
  other:           'Other Assets',
}

// LTCG exemption limit for equity (u/s 112A)
export const EQUITY_LTCG_EXEMPT = 1_25_000

// Budget 2024 cutoff — rates changed for transactions on/after this date
const BUDGET_2024_DATE = new Date('2024-07-23')

// Cost Inflation Index — base year FY 2001-02
export const CII: Record<string, number> = {
  '2001-02': 100, '2002-03': 105, '2003-04': 109, '2004-05': 113,
  '2005-06': 117, '2006-07': 122, '2007-08': 129, '2008-09': 137,
  '2009-10': 148, '2010-11': 167, '2011-12': 184, '2012-13': 200,
  '2013-14': 220, '2014-15': 240, '2015-16': 254, '2016-17': 264,
  '2017-18': 272, '2018-19': 280, '2019-20': 289, '2020-21': 301,
  '2021-22': 317, '2022-23': 331, '2023-24': 348, '2024-25': 363,
}

export const CII_FY_OPTIONS = Object.keys(CII).sort().map(fy => ({ value: fy, label: `FY ${fy}` }))

// ── Types ──────────────────────────────────────────────────────────────────

export interface CapitalGainsInput {
  assetType:       AssetType
  purchasePrice:   number
  salePrice:       number
  costs:           number    // brokerage, stamp duty, transfer expenses
  purchaseDate:    string    // YYYY-MM-DD
  saleDate:        string    // YYYY-MM-DD
  // for property indexation
  purchaseFY:      string    // e.g. '2018-19'
  saleFY:          string    // e.g. '2024-25'
}

export interface GainScenario {
  label:         string
  gain:          number
  isLoss:        boolean
  rate:          number | 'slab'
  tax:           number | null   // null = at slab (can't compute without knowing income)
  exemption:     number
  taxableGain:   number
  rateLabel:     string
  notes:         string[]
}

export interface CapitalGainsResult {
  holdingMonths:    number
  isLTCG:           boolean
  gainType:         'STCG' | 'LTCG'
  assetLabel:       string
  scenarios:        GainScenario[]   // usually 1, but 2 for property with indexation option
  indexationApplicable: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────

function monthsBetween(from: string, to: string): number {
  const d1 = new Date(from)
  const d2 = new Date(to)
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
}

function applyTax(gain: number, rate: number | 'slab', exemption: number): { tax: number | null; taxableGain: number } {
  const taxableGain = Math.max(0, gain - exemption)
  if (rate === 'slab') return { tax: null, taxableGain }
  return { tax: Math.max(0, taxableGain * rate / 100), taxableGain }
}

// ── Main compute ───────────────────────────────────────────────────────────

export function computeCapitalGains(input: CapitalGainsInput): CapitalGainsResult | null {
  if (!input.purchaseDate || !input.saleDate) return null
  if (new Date(input.saleDate) <= new Date(input.purchaseDate)) return null

  const { assetType, purchasePrice, salePrice, costs, purchaseDate, saleDate } = input
  const holdingMonths = monthsBetween(purchaseDate, saleDate)
  const isLTCG        = holdingMonths >= HOLDING_PERIOD_MONTHS[assetType]
  const gainType      = isLTCG ? 'LTCG' : 'STCG'
  const netGain       = salePrice - purchasePrice - costs
  const saleAfterBudget2024 = new Date(saleDate) >= BUDGET_2024_DATE
  const buyBeforeBudget2024 = new Date(purchaseDate) < BUDGET_2024_DATE

  const scenarios: GainScenario[] = []

  if (assetType === 'equity_listed') {
    if (!isLTCG) {
      // STCG u/s 111A — 20% (post July 23, 2024); 15% before
      const rate  = saleAfterBudget2024 ? 20 : 15
      const { tax, taxableGain } = applyTax(netGain, rate, 0)
      scenarios.push({
        label: 'STCG u/s 111A',
        gain: netGain, isLoss: netGain < 0,
        rate, tax, exemption: 0, taxableGain,
        rateLabel: `${rate}%`,
        notes: [
          `Short-term gains on listed equity taxed at ${rate}% (STT must have been paid).`,
          'Add 4% Health & Education Cess on the tax amount.',
          saleAfterBudget2024
            ? 'Rate increased from 15% to 20% effective July 23, 2024 (Budget 2024).'
            : 'Pre-Budget 2024 rate of 15% applies (sale before July 23, 2024).',
        ],
      })
    } else {
      // LTCG u/s 112A — 12.5% above ₹1,25,000
      const rate  = saleAfterBudget2024 ? 12.5 : 10
      const exemptLimit = saleAfterBudget2024 ? 1_25_000 : 1_00_000
      const { tax, taxableGain } = applyTax(netGain, rate, exemptLimit)
      scenarios.push({
        label: 'LTCG u/s 112A',
        gain: netGain, isLoss: netGain < 0,
        rate, tax, exemption: exemptLimit, taxableGain,
        rateLabel: `${rate}%`,
        notes: [
          `Long-term equity gains exempt up to ₹${exemptLimit.toLocaleString('en-IN')} per year.`,
          `Gains above the exemption taxed at ${rate}%.`,
          'Add 4% cess. Max surcharge for 112A gains is capped at 15%.',
          saleAfterBudget2024
            ? 'Rate increased from 10% to 12.5% and exemption from ₹1L to ₹1.25L effective July 23, 2024.'
            : 'Pre-Budget 2024 rate of 10% with ₹1,00,000 exemption applies.',
        ],
      })
    }
  }

  else if (assetType === 'property') {
    if (!isLTCG) {
      const { tax, taxableGain } = applyTax(netGain, 'slab', 0)
      scenarios.push({
        label: 'STCG — at slab rates',
        gain: netGain, isLoss: netGain < 0,
        rate: 'slab', tax, exemption: 0, taxableGain,
        rateLabel: 'Slab rate',
        notes: [
          'Property held ≤ 24 months — taxed at your applicable income tax slab rate.',
          'Add this gain to your total income and apply the relevant slab rate.',
        ],
      })
    } else {
      // Without indexation — 12.5% (standard post-July 23, 2024)
      const { tax: taxWO, taxableGain: tgWO } = applyTax(netGain, 12.5, 0)
      scenarios.push({
        label: 'LTCG — 12.5% (without indexation)',
        gain: netGain, isLoss: netGain < 0,
        rate: 12.5, tax: taxWO, exemption: 0, taxableGain: tgWO,
        rateLabel: '12.5%',
        notes: ['Default rate for property sold on/after July 23, 2024 (Budget 2024).'],
      })

      // Indexation option — only for property BOUGHT before July 23, 2024 AND SOLD after
      if (saleAfterBudget2024 && buyBeforeBudget2024) {
        const purchaseCII = CII[input.purchaseFY]
        const saleCII     = CII[input.saleFY]
        if (purchaseCII && saleCII) {
          const indexedCost    = purchasePrice * (saleCII / purchaseCII)
          const gainWithIndex  = salePrice - indexedCost - costs
          const { tax: taxWI, taxableGain: tgWI } = applyTax(gainWithIndex, 20, 0)
          scenarios.push({
            label: 'LTCG — 20% (with indexation)',
            gain: gainWithIndex, isLoss: gainWithIndex < 0,
            rate: 20, tax: taxWI, exemption: 0, taxableGain: tgWI,
            rateLabel: '20% with indexation',
            notes: [
              `Indexed cost = ₹${purchasePrice.toLocaleString('en-IN')} × (${saleCII}/${purchaseCII}) = ₹${Math.round(indexedCost).toLocaleString('en-IN')}`,
              `CII: Purchase FY ${input.purchaseFY} = ${purchaseCII}, Sale FY ${input.saleFY} = ${saleCII}.`,
              'Available only for property acquired before July 23, 2024.',
              'Choose whichever option results in lower tax.',
            ],
          })
        }
      }
    }
  }

  else if (assetType === 'gold') {
    if (!isLTCG) {
      const { tax, taxableGain } = applyTax(netGain, 'slab', 0)
      scenarios.push({
        label: 'STCG — at slab rates',
        gain: netGain, isLoss: netGain < 0,
        rate: 'slab', tax, exemption: 0, taxableGain,
        rateLabel: 'Slab rate',
        notes: ['Gold held ≤ 24 months — added to total income and taxed at slab rate.'],
      })
    } else {
      const { tax, taxableGain } = applyTax(netGain, 12.5, 0)
      scenarios.push({
        label: 'LTCG — 12.5% (without indexation)',
        gain: netGain, isLoss: netGain < 0,
        rate: 12.5, tax, exemption: 0, taxableGain,
        rateLabel: '12.5%',
        notes: [
          'Post-Budget 2024: indexation removed for gold. Rate is 12.5% without indexation.',
          'Add 4% cess on tax amount.',
        ],
      })
    }
  }

  else {
    // debt_mf, unlisted_equity, other — all at slab for STCG; 12.5% LTCG
    if (!isLTCG) {
      scenarios.push({
        label: 'STCG — at slab rates',
        gain: netGain, isLoss: netGain < 0,
        rate: 'slab', tax: null, exemption: 0, taxableGain: Math.max(0, netGain),
        rateLabel: 'Slab rate',
        notes: [
          assetType === 'debt_mf'
            ? 'Debt MF purchased after April 1, 2023 are always taxed at slab rate regardless of holding period.'
            : 'Short-term gains taxed at applicable income tax slab rate.',
        ],
      })
    } else {
      if (assetType === 'debt_mf') {
        // All debt MF post-Apr 2023 at slab always
        scenarios.push({
          label: 'At slab rates (debt MF special rule)',
          gain: netGain, isLoss: netGain < 0,
          rate: 'slab', tax: null, exemption: 0, taxableGain: Math.max(0, netGain),
          rateLabel: 'Slab rate',
          notes: [
            'Debt MF purchased after April 1, 2023: no LTCG benefit. All gains taxed at slab rate.',
            'Debt MF purchased before April 1, 2023: LTCG @ 12.5% without indexation (post-Budget 2024).',
          ],
        })
      } else {
        const { tax, taxableGain } = applyTax(netGain, 12.5, 0)
        scenarios.push({
          label: 'LTCG — 12.5%',
          gain: netGain, isLoss: netGain < 0,
          rate: 12.5, tax, exemption: 0, taxableGain,
          rateLabel: '12.5%',
          notes: ['Post-Budget 2024: LTCG on unlisted shares / other assets taxed at 12.5%.'],
        })
      }
    }
  }

  return {
    holdingMonths,
    isLTCG,
    gainType,
    assetLabel: ASSET_LABELS[assetType],
    scenarios,
    indexationApplicable: assetType === 'property' && isLTCG && saleAfterBudget2024 && buyBeforeBudget2024,
  }
}
