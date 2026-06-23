// ITR Form selector — decision logic for Individual / HUF taxpayers
// Covers ITR-1 (Sahaj), ITR-2, ITR-3, ITR-4 (Sugam)

export interface ITRAnswers {
  // Who are you
  isHUF:          boolean
  isNRI:          boolean   // Non-Resident or RNOR

  // Income sources
  hasSalary:         boolean
  hasBusinessIncome: boolean   // any business or profession income
  isPresumed:        boolean   // presumptive taxation: 44AD / 44ADA / 44AE
  isPartnerInFirm:   boolean   // partner in a partnership firm

  // Complexity flags
  hasCapitalGains:   boolean   // any STCG or LTCG
  multipleHP:        boolean   // more than one house property, or HP loss carried forward
  hasForeignAssets:  boolean   // foreign income, bank account, or asset abroad

  // Income level / other
  incomeAbove50L:    boolean
  isDirector:        boolean   // director in any company
  holdsUnlisted:     boolean   // holds shares of unlisted company
  hasAgriAbove5K:    boolean   // agricultural income above ₹5,000
}

export interface ITRFormResult {
  form:        'ITR-1' | 'ITR-2' | 'ITR-3' | 'ITR-4'
  name:        string
  desc:        string
  reasons:     string[]   // why this form
  exclusions:  string[]   // which factors ruled out simpler forms
  color:       string     // tailwind color token
}

const FORMS = {
  'ITR-1': {
    name: 'ITR-1 (Sahaj)',
    desc: 'Simplest form for salaried individuals with straightforward income.',
    color: 'brand',
  },
  'ITR-2': {
    name: 'ITR-2',
    desc: 'For individuals/HUF with capital gains, multiple properties, or foreign assets — but no business income.',
    color: 'violet',
  },
  'ITR-3': {
    name: 'ITR-3',
    desc: 'For individuals/HUF with income from business or profession (non-presumptive).',
    color: 'amber',
  },
  'ITR-4': {
    name: 'ITR-4 (Sugam)',
    desc: 'For individuals/HUF/firms with presumptive business income (44AD/44ADA/44AE) and total income ≤ ₹50 lakh.',
    color: 'teal',
  },
} as const

export function selectITRForm(a: ITRAnswers): ITRFormResult {
  const exclusions: string[] = []
  let form: 'ITR-1' | 'ITR-2' | 'ITR-3' | 'ITR-4'

  // ── Business / Profession income branch ──────────────────────────────────
  if (a.hasBusinessIncome) {
    // Partner in firm always → ITR-3
    if (a.isPartnerInFirm) {
      return {
        form: 'ITR-3',
        ...FORMS['ITR-3'],
        reasons: ['Partners in a partnership firm must file ITR-3.'],
        exclusions: ['ITR-4: Partners in firms are excluded.'],
      }
    }

    // Presumptive taxation (44AD/44ADA/44AE)
    if (a.isPresumed) {
      const blockers: string[] = []
      if (a.hasCapitalGains)  blockers.push('Capital gains not allowed in ITR-4.')
      if (a.hasForeignAssets) blockers.push('Foreign income/assets not allowed in ITR-4.')
      if (a.incomeAbove50L)   blockers.push('Total income exceeds ₹50 lakh — ITR-4 limit exceeded.')
      if (a.isDirector)       blockers.push('Directors of companies cannot use ITR-4.')
      if (a.holdsUnlisted)    blockers.push('Holders of unlisted shares cannot use ITR-4.')

      if (blockers.length === 0) {
        return {
          form: 'ITR-4',
          ...FORMS['ITR-4'],
          reasons: [
            'Business income is under presumptive taxation (Section 44AD / 44ADA / 44AE).',
            'Total income is within ₹50 lakh and no disqualifying factors are present.',
          ],
          exclusions: [],
        }
      }
      // Presumptive but blocked from ITR-4 → ITR-3
      return {
        form: 'ITR-3',
        ...FORMS['ITR-3'],
        reasons: ['Business/profession income present.'],
        exclusions: blockers,
      }
    }

    // Non-presumptive business → ITR-3
    return {
      form: 'ITR-3',
      ...FORMS['ITR-3'],
      reasons: [
        'Business or profession income is present and not under presumptive taxation.',
        'Actual income and expenses must be reported under regular accounting.',
      ],
      exclusions: [],
    }
  }

  // ── No business income — salary / other branch ───────────────────────────
  const itr2Triggers: { reason: string; exclusion: string }[] = []

  if (a.isHUF)
    itr2Triggers.push({ reason: 'HUF (Hindu Undivided Family) must use ITR-2 or higher.', exclusion: 'ITR-1 is only for individuals.' })
  if (a.isNRI)
    itr2Triggers.push({ reason: 'NRI / RNOR taxpayers must use ITR-2.', exclusion: 'ITR-1 is only for Resident individuals.' })
  if (a.hasCapitalGains)
    itr2Triggers.push({ reason: 'Capital gains income (STCG or LTCG) requires ITR-2.', exclusion: 'ITR-1 does not have a capital gains schedule.' })
  if (a.multipleHP)
    itr2Triggers.push({ reason: 'More than one house property or carry-forward HP loss requires ITR-2.', exclusion: 'ITR-1 allows only one self-occupied or let-out property with no loss.' })
  if (a.hasForeignAssets)
    itr2Triggers.push({ reason: 'Foreign income, assets, or bank accounts must be reported in ITR-2.', exclusion: 'ITR-1 has no schedule for foreign assets.' })
  if (a.incomeAbove50L)
    itr2Triggers.push({ reason: 'Total income exceeds ₹50 lakh.', exclusion: 'ITR-1 is limited to total income up to ₹50 lakh.' })
  if (a.isDirector)
    itr2Triggers.push({ reason: 'Directors of companies (listed or unlisted) must use ITR-2.', exclusion: 'ITR-1 excludes company directors.' })
  if (a.holdsUnlisted)
    itr2Triggers.push({ reason: 'Holders of shares in unlisted companies must use ITR-2.', exclusion: 'ITR-1 excludes holders of unlisted equity shares.' })
  if (a.hasAgriAbove5K)
    itr2Triggers.push({ reason: 'Agricultural income exceeds ₹5,000.', exclusion: 'ITR-1 allows agricultural income only up to ₹5,000.' })

  if (itr2Triggers.length > 0) {
    form = 'ITR-2'
    return {
      form,
      ...FORMS[form],
      reasons: itr2Triggers.map(t => t.reason),
      exclusions: itr2Triggers.map(t => t.exclusion),
    }
  }

  // Default → ITR-1
  return {
    form: 'ITR-1',
    ...FORMS['ITR-1'],
    reasons: [
      'You are a resident individual with salary/pension income.',
      'Total income is within ₹50 lakh.',
      'No capital gains, multiple properties, foreign assets, or business income.',
    ],
    exclusions: [],
  }
}

// All questions with labels for the UI
export interface ITRQuestion {
  key:     keyof ITRAnswers
  label:   string
  desc:    string
  group:   string
}

export const ITR_QUESTIONS: ITRQuestion[] = [
  // Who are you
  { key: 'isHUF',           group: 'Who is filing',      label: 'I am filing as a Hindu Undivided Family (HUF)',               desc: 'Not an individual — the return is for the HUF as an entity' },
  { key: 'isNRI',           group: 'Who is filing',      label: 'I am an NRI / RNOR (Non-Resident or Resident Not Ordinarily Resident)', desc: 'You stayed outside India for more than the prescribed period' },

  // Income sources
  { key: 'hasSalary',          group: 'Income sources',  label: 'Salary or pension income',                        desc: 'From an employer, including government pension' },
  { key: 'hasBusinessIncome',  group: 'Income sources',  label: 'Business or profession income',                   desc: 'Any trade, freelance, consulting, shop, practice etc.' },
  { key: 'isPresumed',         group: 'Income sources',  label: 'Presumptive taxation — Sec 44AD / 44ADA / 44AE', desc: 'Business turnover ≤ ₹3Cr (44AD), professional receipts ≤ ₹75L (44ADA), or transport (44AE)' },
  { key: 'isPartnerInFirm',    group: 'Income sources',  label: 'Partner in a partnership firm',                   desc: 'Includes LLP partners' },
  { key: 'hasCapitalGains',    group: 'Income sources',  label: 'Capital gains — any STCG or LTCG',                desc: 'Shares, mutual funds, property, gold, etc.' },
  { key: 'multipleHP',         group: 'Income sources',  label: 'More than one house property, or HP loss carried forward', desc: 'Let-out second property, or interest loss from a previous year' },
  { key: 'hasForeignAssets',   group: 'Income sources',  label: 'Foreign income, foreign bank account, or assets abroad', desc: 'Salary earned abroad, NRE/FCNR deposits, overseas property, foreign investments' },

  // Other situations
  { key: 'incomeAbove50L',  group: 'Other situations', label: 'Total income exceeds ₹50 lakh',              desc: 'Before deductions under Chapter VI-A' },
  { key: 'isDirector',      group: 'Other situations', label: 'Director in any company',                    desc: 'Listed or unlisted — even if no remuneration was received' },
  { key: 'holdsUnlisted',   group: 'Other situations', label: 'Holds shares of an unlisted company',        desc: 'Private limited company shares (not traded on any stock exchange)' },
  { key: 'hasAgriAbove5K',  group: 'Other situations', label: 'Agricultural income above ₹5,000',           desc: 'Income from farming, plantation etc.' },
]
