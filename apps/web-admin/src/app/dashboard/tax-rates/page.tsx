'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Pencil, X, AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { tdsCodeYearsApi, tdsSchedulesApi, taxMetaApi, taxConfigApi, type TdsCodeYear, type TdsSchedule } from '@/lib/api'

// ── Section definitions ───────────────────────────────────────────────────────

type CodeRef = string | { individual_huf: string; other: string } | null

interface SectionDef {
  id: string
  section: string
  label: string
  desc: string
  category: string
  isSalary: boolean
  codeRef: CodeRef
  defaultRate: number
  defaultRates?: { label: string; rate: number }[]
  threshold: number | null
  thresholdLabel?: string
  noPanRate: number
}

const CATEGORY_ORDER = [
  'Salary', 'Business Payments', 'Rent', 'Interest & Dividends',
  'Property', 'Insurance', 'Winnings', 'Banking & Finance', 'Digital Assets', 'Other',
]

const SECTIONS: SectionDef[] = [
  { id: 'salary_192',            section: '192',   label: 'Salary',                          desc: 'TDS on salary by employer — rate is based on employee income tax slab',            category: 'Salary',             isSalary: true,  codeRef: null,                                threshold: null,       noPanRate: 0,  defaultRate: 0   },
  { id: 'contractor_194C',       section: '194C',  label: 'Contractor / Sub-contractor',     desc: 'Works contract, supply, transport, advertising, catering',                        category: 'Business Payments',  isSalary: false, codeRef: { individual_huf: '1023', other: '1024' }, threshold: 30000,  thresholdLabel: '₹30,000 per payment or ₹1,00,000/year', noPanRate: 20, defaultRate: 1, defaultRates: [{ label: 'Individual / HUF', rate: 1 }, { label: 'Company / Firm', rate: 2 }] },
  { id: 'professional_194J',     section: '194J',  label: 'Professional Fees',               desc: 'Doctors, CA, lawyers, architects, consultants',                                   category: 'Business Payments',  isSalary: false, codeRef: '1027', threshold: 30000,   noPanRate: 20, defaultRate: 10  },
  { id: 'technical_194J',        section: '194J',  label: 'Technical Services / Royalty',    desc: 'IT services, manpower supply, call centres, certain royalties',                   category: 'Business Payments',  isSalary: false, codeRef: '1026', threshold: 30000,   noPanRate: 20, defaultRate: 2   },
  { id: 'commission_194H',       section: '194H',  label: 'Commission / Brokerage',          desc: 'Commission or brokerage paid (not on securities)',                                category: 'Business Payments',  isSalary: false, codeRef: '1006', threshold: 15000,   noPanRate: 20, defaultRate: 5   },
  { id: 'payment_indiv_194M',    section: '194M',  label: 'Payment by Individual / HUF',     desc: 'Contractor/professional/commission paid by individual or HUF not liable to audit',category: 'Business Payments',  isSalary: false, codeRef: '1025', threshold: 5000000, thresholdLabel: '₹50,00,000 aggregate/year', noPanRate: 20, defaultRate: 5 },
  { id: 'ecommerce_194O',        section: '194O',  label: 'E-commerce Payments',             desc: 'Payment by e-commerce operator to seller / service provider on platform',         category: 'Business Payments',  isSalary: false, codeRef: '1035', threshold: 500000,  thresholdLabel: '₹5,00,000 aggregate/year per participant', noPanRate: 5, defaultRate: 0.1 },
  { id: 'goods_purchase_194Q',   section: '194Q',  label: 'Purchase of Goods',               desc: 'Buyer deducts TDS on goods purchase from resident seller above ₹50L',             category: 'Business Payments',  isSalary: false, codeRef: '1031', threshold: 5000000, thresholdLabel: '₹50,00,000 aggregate per seller/year', noPanRate: 5, defaultRate: 0.1 },
  { id: 'benefit_194R',          section: '194R',  label: 'Benefits / Perquisites',          desc: 'Gifts, samples, hospitality given to doctors, influencers, distributors',         category: 'Business Payments',  isSalary: false, codeRef: '1033', threshold: 20000,   noPanRate: 20, defaultRate: 10  },
  { id: 'partner_payment_194T',  section: '194T',  label: 'Payment to Partners of Firm',     desc: 'Salary, remuneration, commission, bonus or interest paid to partners',            category: 'Business Payments',  isSalary: false, codeRef: '1067', threshold: 20000,   noPanRate: 20, defaultRate: 10  },
  { id: 'rent_building_194I',    section: '194I',  label: 'Rent — Land / Building',          desc: 'Rent for land, building, furniture',                                              category: 'Rent',               isSalary: false, codeRef: '1009', threshold: 240000,  thresholdLabel: '₹2,40,000/year (₹20,000/month)', noPanRate: 20, defaultRate: 10 },
  { id: 'rent_plant_194I',       section: '194I',  label: 'Rent — Plant / Machinery',        desc: 'Rent for plant, machinery or equipment',                                          category: 'Rent',               isSalary: false, codeRef: '1008', threshold: 240000,  thresholdLabel: '₹2,40,000/year', noPanRate: 20, defaultRate: 2 },
  { id: 'rent_individual_194IB', section: '194IB', label: 'Rent by Individual / HUF',        desc: 'Rent paid by individual/HUF not liable to tax audit — threshold per month',       category: 'Rent',               isSalary: false, codeRef: '1007', threshold: 50000,   thresholdLabel: '₹50,000/month', noPanRate: 20, defaultRate: 5 },
  { id: 'sec_193',               section: '193',   label: 'Interest on Securities',          desc: 'Interest on debentures, bonds, government securities',                            category: 'Interest & Dividends',isSalary: false, codeRef: '1019', threshold: 5000,    noPanRate: 20, defaultRate: 10 },
  { id: 'dividend_194',          section: '194',   label: 'Dividend',                        desc: 'Dividend paid by domestic companies to resident shareholders',                    category: 'Interest & Dividends',isSalary: false, codeRef: '1029', threshold: 5000,    noPanRate: 20, defaultRate: 10 },
  { id: 'bank_interest_194A',    section: '194A',  label: 'Bank / FD / RD Interest',         desc: 'Interest paid by banks, post offices, cooperative banks',                         category: 'Interest & Dividends',isSalary: false, codeRef: '1021', threshold: 40000,   thresholdLabel: '₹40,000/year (₹50,000 for senior citizens)', noPanRate: 20, defaultRate: 10 },
  { id: 'other_interest_194A',   section: '194A',  label: 'Other Interest (non-bank)',       desc: 'Interest paid by companies, firms (not banks)',                                   category: 'Interest & Dividends',isSalary: false, codeRef: '1021', threshold: 5000,    noPanRate: 20, defaultRate: 10 },
  { id: 'property_purchase_194IA',section: '194IA',label: 'Immovable Property Purchase',     desc: 'Buyer deducts TDS on property purchase from seller above ₹50L',                  category: 'Property',           isSalary: false, codeRef: '1010', threshold: 5000000, thresholdLabel: '₹50,00,000 (full consideration)', noPanRate: 1, defaultRate: 1 },
  { id: 'jda_194IC',             section: '194IC', label: 'Joint Development Agreement',     desc: 'Cash or kind payment under joint development agreement for land/building',         category: 'Property',           isSalary: false, codeRef: '1011', threshold: null,    noPanRate: 20, defaultRate: 10 },
  { id: 'insurance_comm_194D',   section: '194D',  label: 'Insurance Commission',            desc: 'Commission paid to insurance agents or surveyors',                                category: 'Insurance',          isSalary: false, codeRef: '1005', threshold: 15000,   noPanRate: 20, defaultRate: 5 },
  { id: 'life_insurance_194DA',  section: '194DA', label: 'Life Insurance Maturity',         desc: 'Sum received under life insurance policy on maturity',                            category: 'Insurance',          isSalary: false, codeRef: '1030', threshold: 100000,  thresholdLabel: '₹1,00,000 total proceeds', noPanRate: 20, defaultRate: 2 },
  { id: 'lottery_194B',          section: '194B',  label: 'Lottery / Crossword / Betting',   desc: 'Winnings from lottery, puzzle, betting, card games, online gaming',               category: 'Winnings',           isSalary: false, codeRef: null,   threshold: 10000,   noPanRate: 30, defaultRate: 30 },
  { id: 'winnings_194BB',        section: '194BB', label: 'Horse Race Winnings',             desc: 'Winnings from horse race from any race club or bookmaker',                        category: 'Winnings',           isSalary: false, codeRef: '1062', threshold: 10000,   noPanRate: 30, defaultRate: 30 },
  { id: 'lottery_comm_194G',     section: '194G',  label: 'Commission on Lottery Tickets',   desc: 'Commission to lottery ticket sellers and stocking agents',                        category: 'Winnings',           isSalary: false, codeRef: '1063', threshold: 15000,   noPanRate: 20, defaultRate: 5 },
  { id: 'cash_withdrawal_194N',  section: '194N',  label: 'Cash Withdrawal (Bank)',           desc: 'Cash withdrawal from bank / cooperative bank / post office above ₹1 Cr',         category: 'Banking & Finance',  isSalary: false, codeRef: '1065', threshold: 10000000,thresholdLabel: '₹1,00,00,000 (₹1 Cr) for ITR filers', noPanRate: 20, defaultRate: 2 },
  { id: 'vda_194S',              section: '194S',  label: 'VDA / Crypto (Digital Assets)',   desc: 'Payment for transfer of virtual digital asset — crypto, NFTs etc.',               category: 'Digital Assets',     isSalary: false, codeRef: '1037', threshold: 50000,   thresholdLabel: '₹50,000/year (₹10,000 for certain persons)', noPanRate: 20, defaultRate: 1 },
  { id: 'royalty_194J',          section: '194J',  label: 'Royalty (full rate)',             desc: 'Royalty for patent, copyright, trademark, franchise',                             category: 'Other',              isSalary: false, codeRef: null,   threshold: 30000,   noPanRate: 20, defaultRate: 10 },
]

const fmtINR = (n: number | null) => n === null ? '—' : '₹' + new Intl.NumberFormat('en-IN').format(n)

// ── Regime labels ─────────────────────────────────────────────────────────────

const SLAB_REFS: { ref: string; label: string; sub: string }[] = [
  { ref: 'new_regime_individual_huf_2026_27',  label: 'New Regime', sub: 'All individuals / HUF — AY 2026-27' },
  { ref: 'old_regime_standard_2026_27',        label: 'Old Regime (Under 60)', sub: 'Individuals below 60 years — AY 2026-27' },
  { ref: 'old_regime_senior_2026_27',          label: 'Old Regime (Senior 60–79)', sub: 'Senior citizens aged 60–79 — AY 2026-27' },
  { ref: 'old_regime_super_senior_2026_27',    label: 'Old Regime (Super Senior 80+)', sub: 'Super senior citizens aged 80+ — AY 2026-27' },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TaxRatesPage() {
  const [tab, setTab]           = useState<'tds' | 'slabs' | 'surcharge'>('tds')
  const [taxYear]               = useState('2026-27')
  const [syncBanner, setSyncBanner] = useState(false)

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tax Rates — AY {taxYear}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Edit TDS section rates, income tax slabs, and surcharge — then Sync to Live.</p>
        </div>
        {syncBanner && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-3 py-2 rounded-lg">
            <AlertTriangle size={13} />
            Changes saved — go to <a href="/dashboard/tax-config" className="underline ml-1">Sync to Live</a> to push to frontend
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {([['tds', 'TDS Section Rates'], ['slabs', 'Income Tax Slabs'], ['surcharge', 'Surcharge & Rebate']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'tds'       && <TDSRatesTab taxYear={taxYear} onSaved={() => setSyncBanner(true)} onTabSwitch={setTab} />}
      {tab === 'slabs'     && <SlabsTab    taxYear={taxYear} onSaved={() => setSyncBanner(true)} />}
      {tab === 'surcharge' && <SurchargeTab taxYear={taxYear} onSaved={() => setSyncBanner(true)} />}
    </div>
  )
}

// ── TDS Rates Tab ─────────────────────────────────────────────────────────────

function TDSRatesTab({ taxYear, onSaved, onTabSwitch }: { taxYear: string; onSaved: () => void; onTabSwitch: (tab: 'slabs') => void }) {
  const [codeYears, setCodeYears] = useState<TdsCodeYear[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [editing, setEditing]     = useState<SectionDef | null>(null)

  useEffect(() => {
    tdsCodeYearsApi.list({ tax_year: taxYear }).then(setCodeYears).finally(() => setLoading(false))
  }, [taxYear])

  const cyMap = useMemo(() => {
    const m: Record<string, TdsCodeYear> = {}
    for (const cy of codeYears) m[cy.code] = cy
    return m
  }, [codeYears])

  const getRateFromDB = (sec: SectionDef): string => {
    if (sec.isSalary) return 'Slab rate'
    if (!sec.codeRef) return `${sec.defaultRate}% (hardcoded)`
    if (typeof sec.codeRef === 'string') {
      const cy = cyMap[sec.codeRef]
      if (!cy) return `${sec.defaultRate}%`
      return cy.display_rate || `${sec.defaultRate}%`
    }
    // dual code
    const cyInd  = cyMap[sec.codeRef.individual_huf]
    const cyComp = cyMap[sec.codeRef.other]
    const rInd  = (cyInd?.rates_json as any[])?.find((r: any) => r.applies_to === 'resident')?.value ?? sec.defaultRates?.[0]?.rate ?? 1
    const rComp = (cyComp?.rates_json as any[])?.find((r: any) => r.applies_to === 'resident')?.value ?? sec.defaultRates?.[1]?.rate ?? 2
    return `${rInd}% Indiv / ${rComp}% Company`
  }

  const getThresholdFromDB = (sec: SectionDef): string => {
    if (sec.threshold === null) return '—'
    if (!sec.codeRef || typeof sec.codeRef !== 'string') return fmtINR(sec.threshold)
    const cy = cyMap[sec.codeRef]
    return (cy?.display_threshold && cy.display_threshold !== '') ? cy.display_threshold : fmtINR(sec.threshold)
  }

  const filtered = useMemo(() => {
    if (!search) return SECTIONS
    const q = search.toLowerCase()
    return SECTIONS.filter(s =>
      s.section.toLowerCase().includes(q) ||
      s.label.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    )
  }, [search])

  const grouped = useMemo(() => {
    const m: Record<string, SectionDef[]> = {}
    for (const s of filtered) {
      if (!m[s.category]) m[s.category] = []
      m[s.category].push(s)
    }
    return CATEGORY_ORDER.filter(c => m[c]).map(c => ({ cat: c, items: m[c] }))
  }, [filtered])

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by section number, name or type (e.g. 194C, salary, contractor)…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
      </div>

      {loading ? <p className="text-sm text-gray-400 py-4">Loading rates…</p> : (
        <div className="space-y-4">
          {grouped.map(({ cat, items }) => (
            <CategoryCard key={cat} cat={cat} items={items} getRateFromDB={getRateFromDB} getThresholdFromDB={getThresholdFromDB} onEdit={setEditing} onTabSwitch={onTabSwitch} />
          ))}
          {grouped.length === 0 && <p className="text-sm text-gray-400 py-4">No sections match "{search}"</p>}
        </div>
      )}

      {editing && (
        <EditRateModal
          sec={editing}
          cyMap={cyMap}
          taxYear={taxYear}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            setCodeYears(await tdsCodeYearsApi.list({ tax_year: taxYear }))
            onSaved()
          }}
        />
      )}
    </>
  )
}

function CategoryCard({ cat, items, getRateFromDB, getThresholdFromDB, onEdit, onTabSwitch }: {
  cat: string
  items: SectionDef[]
  getRateFromDB: (s: SectionDef) => string
  getThresholdFromDB: (s: SectionDef) => string
  onEdit: (s: SectionDef) => void
  onTabSwitch: (tab: 'slabs') => void
}) {
  const [open, setOpen] = useState(true)

  const catColors: Record<string, string> = {
    'Salary': 'bg-purple-50 text-purple-700',
    'Business Payments': 'bg-blue-50 text-blue-700',
    'Rent': 'bg-green-50 text-green-700',
    'Interest & Dividends': 'bg-cyan-50 text-cyan-700',
    'Property': 'bg-orange-50 text-orange-700',
    'Insurance': 'bg-pink-50 text-pink-700',
    'Winnings': 'bg-yellow-50 text-yellow-700',
    'Banking & Finance': 'bg-indigo-50 text-indigo-700',
    'Digital Assets': 'bg-violet-50 text-violet-700',
    'Other': 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition text-left">
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${catColors[cat] ?? 'bg-gray-100 text-gray-600'}`}>{cat}</span>
        <span className="text-xs text-gray-400">{items.length} section{items.length !== 1 ? 's' : ''}</span>
      </button>

      {open && (
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100">
            <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <th className="px-4 py-2.5 text-left w-24">Section</th>
              <th className="px-4 py-2.5 text-left">What it taxes</th>
              <th className="px-4 py-2.5 text-right w-36">Rate</th>
              <th className="px-4 py-2.5 text-right w-48 hidden md:table-cell">TDS starts at</th>
              <th className="px-4 py-2.5 text-right w-28 hidden lg:table-cell">No-PAN rate</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(s => (
              <tr key={s.id} className="hover:bg-blue-50/30 group">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Sec {s.section}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800 text-sm">{s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  {s.isSalary ? (
                    <div>
                      <span className="text-xs text-purple-600 font-medium">Slab rate</span>
                      <div className="mt-1 flex flex-col items-end gap-0.5">
                        {['New Regime', 'Old Regime (Under 60)', 'Old Regime (Senior)', 'Old Regime (Super Senior)'].map(name => (
                          <button key={name} onClick={() => onTabSwitch('slabs')}
                            className="text-xs text-blue-500 hover:text-blue-700 hover:underline leading-tight">
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="font-semibold text-gray-800">{getRateFromDB(s)}</span>
                  )}
                  {!s.codeRef && !s.isSalary && (
                    <p className="text-xs text-gray-400">hardcoded</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell">
                  {s.isSalary ? '—' : (
                    <span className="text-xs">{getThresholdFromDB(s)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs hidden lg:table-cell">
                  {s.noPanRate === 0 ? '—' : `${s.noPanRate}%`}
                </td>
                <td className="px-4 py-3 text-right">
                  {!s.isSalary && s.codeRef && (
                    <button onClick={() => onEdit(s)}
                      className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition">
                      <Pencil size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Edit Rate Modal ────────────────────────────────────────────────────────────

function EditRateModal({ sec, cyMap, taxYear, onClose, onSaved }: {
  sec: SectionDef
  cyMap: Record<string, TdsCodeYear>
  taxYear: string
  onClose: () => void
  onSaved: () => void
}) {
  const isDual = typeof sec.codeRef === 'object' && sec.codeRef !== null

  const getInitialRate = (code: string, fallback: number) => {
    const cy = cyMap[code]
    if (!cy) return String(fallback)
    const r = (cy.rates_json as any[])?.find((r: any) => r.applies_to === 'resident')?.value
    return String(r ?? fallback)
  }

  const getInitialThreshold = (code: string, fallback: number | null) => {
    const cy = cyMap[code]
    if (!cy) return String(fallback ?? '')
    const t = (cy.thresholds_json as any[])?.[0]?.amount
    return String(t ?? fallback ?? '')
  }

  const mainCode = isDual ? (sec.codeRef as any).individual_huf : (sec.codeRef as string)

  const [rateA,     setRateA]     = useState(getInitialRate(mainCode, isDual ? (sec.defaultRates?.[0]?.rate ?? 1) : sec.defaultRate))
  const [rateB,     setRateB]     = useState(isDual ? getInitialRate((sec.codeRef as any).other, sec.defaultRates?.[1]?.rate ?? 2) : '')
  const [threshold, setThreshold] = useState(getInitialThreshold(mainCode, sec.threshold))
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function save() {
    setSaving(true); setError('')
    try {
      const buildUpdate = (code: string, rate: number) => {
        const cy = cyMap[code]
        if (!cy) throw new Error(`Code ${code} not found for year ${taxYear}`)
        const rates_json = (cy.rates_json as any[]).map((r: any) =>
          r.applies_to === 'resident' ? { ...r, value: rate } : r
        )
        const thresholds_json = threshold
          ? (cy.thresholds_json as any[]).map((t: any, i: number) => i === 0 ? { ...t, amount: Number(threshold) } : t)
          : cy.thresholds_json
        const displayRate = rate < 1 ? `${rate}%` : `${rate}%`
        return tdsCodeYearsApi.update(cy._id, { rates_json, thresholds_json, display_rate: displayRate })
      }

      if (isDual) {
        await buildUpdate((sec.codeRef as any).individual_huf, Number(rateA))
        await buildUpdate((sec.codeRef as any).other, Number(rateB))
      } else {
        await buildUpdate(sec.codeRef as string, Number(rateA))
      }
      onSaved()
    } catch (e: any) {
      setError(e.message ?? 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Edit — Sec {sec.section}: {sec.label}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{sec.desc}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15} /></button>
        </div>

        <div className="p-6 space-y-4">
          {isDual ? (
            <div className="grid grid-cols-2 gap-4">
              <NumberField label="Rate — Individual / HUF (%)" value={rateA} onChange={setRateA} min={0} max={100} step={0.1} />
              <NumberField label="Rate — Company / Firm (%)" value={rateB} onChange={setRateB} min={0} max={100} step={0.1} />
            </div>
          ) : (
            <NumberField label="TDS Rate (%)" value={rateA} onChange={setRateA} min={0} max={100} step={0.1} />
          )}

          <NumberField
            label={`TDS starts at (₹) — ${sec.thresholdLabel ?? 'per payment'}`}
            value={threshold}
            onChange={setThreshold}
            min={0}
            note="Leave blank to keep existing threshold"
          />

          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <strong>Note:</strong> After saving, go to <a href="/dashboard/tax-config" className="underline font-medium">Sync to Live</a> to push changes to the frontend calculator.
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button onClick={save} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Rate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Income Tax Slabs Tab ──────────────────────────────────────────────────────

function SlabsTab({ taxYear, onSaved }: { taxYear: string; onSaved: () => void }) {
  const yearTag = taxYear.replace('-', '_')
  const refs = useMemo(() => SLAB_REFS.map(r => ({ ...r, ref: r.ref.replace('2026_27', yearTag) })), [yearTag])

  const [schedules, setSchedules] = useState<Record<string, TdsSchedule>>({})
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState<string | null>(null)

  async function load() {
    const all = await tdsSchedulesApi.list({ tax_year: taxYear })
    const m: Record<string, TdsSchedule> = {}
    for (const s of all) m[s.ref] = s
    setSchedules(m); setLoading(false)
  }

  useEffect(() => { load() }, [taxYear])

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading slabs…</p>

  return (
    <div className="space-y-4">
      {refs.map(({ ref, label, sub }) => {
        const s = schedules[ref]
        if (!s) return (
          <div key={ref} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-red-500 mt-1">Schedule not found in DB for ref: {ref}</p>
          </div>
        )
        return (
          <SlabCard key={ref} schedule={s} label={label} sub={sub}
            editing={editing === ref}
            onEditToggle={() => setEditing(p => p === ref ? null : ref)}
            onSaved={async (brackets) => {
              await tdsSchedulesApi.update(ref, { brackets_json: brackets })
              await load(); setEditing(null); onSaved()
            }}
          />
        )
      })}
    </div>
  )
}

function SlabCard({ schedule, label, sub, editing, onEditToggle, onSaved }: {
  schedule: TdsSchedule; label: string; sub: string
  editing: boolean; onEditToggle: () => void
  onSaved: (brackets: any[]) => Promise<void>
}) {
  const brackets: any[] = Array.isArray(schedule.brackets_json) ? schedule.brackets_json : []
  const [rows, setRows]     = useState(brackets.map(b => ({ ...b })))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing) setRows(brackets.map(b => ({ ...b })))
  }, [editing])

  async function save() {
    setSaving(true)
    try { await onSaved(rows) } finally { setSaving(false) }
  }

  const fmt = (n: number) => n === null || n === undefined ? '—' : '₹' + new Intl.NumberFormat('en-IN').format(n)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div>
          <p className="font-medium text-gray-800 text-sm">{label}</p>
          <p className="text-xs text-gray-400">{sub}</p>
        </div>
        <button onClick={onEditToggle}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
            editing ? 'bg-white border-gray-300 text-gray-600' : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
          }`}>
          {editing ? <><X size={11} /> Cancel</> : <><Pencil size={11} /> Edit Slabs</>}
        </button>
      </div>

      <table className="w-full text-sm">
        <thead className="border-b border-gray-100">
          <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <th className="px-4 py-2.5 text-left">Income Range</th>
            <th className="px-4 py-2.5 text-right w-32">Tax Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {(editing ? rows : brackets).map((b: any, i: number) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className="px-4 py-2.5 text-gray-700">
                {fmt(b.from)} – {b.to == null ? 'and above' : fmt(b.to)}
              </td>
              <td className="px-4 py-2.5 text-right">
                {editing ? (
                  <div className="flex items-center justify-end gap-1">
                    <input type="number" value={rows[i].rate} min={0} max={100} step={0.5}
                      onChange={e => setRows(prev => prev.map((r, j) => j === i ? { ...r, rate: Number(e.target.value) } : r))}
                      className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500 text-xs">%</span>
                  </div>
                ) : (
                  <span className={`font-semibold ${b.rate === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {b.rate}%
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : <><CheckCircle size={13} /> Save Slabs</>}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Surcharge & Rebate Tab ────────────────────────────────────────────────────

function SurchargeTab({ taxYear, onSaved }: { taxYear: string; onSaved: () => void }) {
  const [sur, setSur]   = useState<any>(null)
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [editSur, setEditSur] = useState(false)
  const [surRows, setSurRows] = useState<{ regime: 'new' | 'old'; i: number; pct: number } | null>(null)

  async function load() {
    const [s, m] = await Promise.all([
      taxMetaApi.getSurcharge(taxYear, 'individual_huf_aop_boi'),
      taxMetaApi.getYear(taxYear),
    ])
    setSur(s); setMeta(m); setLoading(false)
  }

  useEffect(() => { load() }, [taxYear])

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading…</p>

  const rebateNew = meta?.rebate_87a?.new_regime
  const rebateOld = meta?.rebate_87a?.old_regime
  const stdNew    = meta?.standard_deduction?.salaried_new_regime?.amount
  const stdOld    = meta?.standard_deduction?.salaried_old_regime?.amount

  return (
    <div className="space-y-5">
      {/* Surcharge */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="font-medium text-gray-800 text-sm">Surcharge — Individual / HUF / AOP / BOI</p>
          <p className="text-xs text-gray-400">Extra tax on top of income tax, for higher incomes</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          {(['new', 'old'] as const).map(regime => {
            const brackets: any[] = sur?.brackets_json?.[`${regime}_regime`] ?? []
            return (
              <div key={regime}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 border-b border-gray-100">
                  {regime === 'new' ? 'New Regime' : 'Old Regime'}
                </p>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {brackets.filter(b => b.surcharge_pct > 0).map((b: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 text-gray-600 text-xs">
                          Above {fmtINR(b.income_exceeds)}{b.income_upto ? ` – ${fmtINR(b.income_upto)}` : '+'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{b.surcharge_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-100">To edit surcharge brackets, use the Code Years page (advanced). After changes, Sync to Live.</p>
      </div>

      {/* 87A Rebate */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="font-medium text-gray-800 text-sm">Section 87A Rebate</p>
          <p className="text-xs text-gray-400">Rebate available to individuals — effectively makes income below threshold tax-free</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">New Regime</p>
            <p className="text-sm text-gray-700">Income up to <strong>₹{(rebateNew?.income_threshold / 100000)?.toFixed(0)} lakh</strong> → tax is zero</p>
            <p className="text-xs text-gray-400 mt-1">Max rebate: ₹{new Intl.NumberFormat('en-IN').format(rebateNew?.max_rebate_amount ?? 60000)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Old Regime</p>
            <p className="text-sm text-gray-700">Income up to <strong>₹{(rebateOld?.income_threshold / 100000)?.toFixed(1)} lakh</strong> → tax is zero</p>
            <p className="text-xs text-gray-400 mt-1">Max rebate: ₹{new Intl.NumberFormat('en-IN').format(rebateOld?.max_rebate_amount ?? 12500)}</p>
          </div>
        </div>
      </div>

      {/* Standard Deduction */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="font-medium text-gray-800 text-sm">Standard Deduction (Salaried)</p>
          <p className="text-xs text-gray-400">Fixed deduction from salary income before computing tax</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">New Regime</p>
            <p className="text-2xl font-bold text-gray-800">₹{new Intl.NumberFormat('en-IN').format(stdNew ?? 75000)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">Old Regime</p>
            <p className="text-2xl font-bold text-gray-800">₹{new Intl.NumberFormat('en-IN').format(stdOld ?? 50000)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared field components ───────────────────────────────────────────────────

function NumberField({ label, value, onChange, min, max, step, note }: {
  label: string; value: string; onChange: (v: string) => void
  min?: number; max?: number; step?: number; note?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        min={min} max={max} step={step ?? 1}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
    </div>
  )
}
