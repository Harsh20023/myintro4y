'use client'

import { useState, useMemo } from 'react'
import { Info, TrendingDown, TrendingUp } from 'lucide-react'
import { Input, Select, Card } from '@/components/ui'
import {
  computeCapitalGains, ASSET_LABELS, HOLDING_PERIOD_MONTHS, CII_FY_OPTIONS,
  type AssetType, type CapitalGainsInput, type GainScenario,
} from '@/lib/logic/capital-gains'

const ASSET_TYPES: AssetType[] = [
  'equity_listed', 'property', 'gold', 'debt_mf', 'unlisted_equity', 'other',
]

const ASSET_DESCS: Record<AssetType, string> = {
  equity_listed:   'Listed shares, equity MF, ETF',
  property:        'House, land, commercial property',
  gold:            'Physical gold, Gold ETF, SGB',
  debt_mf:         'Debt MF, bonds, debentures',
  unlisted_equity: 'Private company shares',
  other:           'Any other capital asset',
}

const fmtINR = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))

const num = (v: string) => Math.max(0, parseFloat(v) || 0)

function ScenarioCard({ s, isBetter, total }: { s: GainScenario; isBetter?: boolean; total: number }) {
  const withCess = s.tax !== null ? s.tax * 1.04 : null

  return (
    <div className={`rounded-2xl border p-5 ${
      isBetter === true ? 'border-brand-300 bg-brand-50 ring-2 ring-brand-200' : 'border-ink-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-ink-500">{s.label}</span>
        {isBetter && (
          <span className="text-[10px] font-bold text-brand-700 bg-brand-100 border border-brand-200 px-2 py-0.5 rounded-full">
            Lower Tax
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-500">Capital Gain</span>
          <span className={`font-medium ${s.gain < 0 ? 'text-red-600' : 'text-ink-700'}`}>
            {s.gain < 0 ? '−' : ''}{fmtINR(Math.abs(s.gain))}
          </span>
        </div>
        {s.exemption > 0 && (
          <div className="flex justify-between text-xs text-ink-400">
            <span>Exemption</span>
            <span>−{fmtINR(s.exemption)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-ink-500">Taxable Gain</span>
          <span className="font-medium text-ink-700">{fmtINR(s.taxableGain)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Rate</span>
          <span className="font-medium text-ink-700">{s.rateLabel}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-ink-200">
        {s.tax !== null ? (
          <>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-ink-700">Tax (before cess)</span>
              <span className={`text-xl font-bold ${isBetter ? 'text-brand-700' : 'text-ink-900'}`}>
                {fmtINR(s.tax)}
              </span>
            </div>
            {withCess !== null && (
              <div className="flex justify-between text-xs text-ink-400 mt-0.5">
                <span>Including 4% cess</span>
                <span className="font-medium">{fmtINR(withCess)}</span>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-ink-50 border border-ink-100 px-3 py-2 text-xs text-ink-600">
            Taxed at your income tax slab rate — add {fmtINR(s.taxableGain)} to total income.
          </div>
        )}
      </div>

      {s.notes.length > 0 && (
        <div className="mt-3 space-y-1">
          {s.notes.map((n, i) => (
            <div key={i} className="flex gap-1.5">
              <Info size={11} className="text-ink-300 shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink-400">{n}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CapitalGainsCalculator() {
  const [assetType, setAssetType] = useState<AssetType>('equity_listed')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [salePrice, setSalePrice]         = useState('')
  const [costs, setCosts]                 = useState('')
  const [purchaseDate, setPurchaseDate]   = useState('')
  const [saleDate, setSaleDate]           = useState('')
  const [purchaseFY, setPurchaseFY]       = useState('2018-19')
  const [saleFY, setSaleFY]               = useState('2024-25')

  const input: CapitalGainsInput = useMemo(() => ({
    assetType,
    purchasePrice: num(purchasePrice),
    salePrice:     num(salePrice),
    costs:         num(costs),
    purchaseDate,
    saleDate,
    purchaseFY,
    saleFY,
  }), [assetType, purchasePrice, salePrice, costs, purchaseDate, saleDate, purchaseFY, saleFY])

  const result = useMemo(() => {
    if (!input.purchaseDate || !input.saleDate || input.purchasePrice === 0 || input.salePrice === 0) return null
    return computeCapitalGains(input)
  }, [input])

  const holdingMonths = HOLDING_PERIOD_MONTHS[assetType]
  const betterIdx = result && result.scenarios.length === 2
    ? (result.scenarios[0].tax !== null && result.scenarios[1].tax !== null
        ? (result.scenarios[0].tax <= result.scenarios[1].tax ? 0 : 1)
        : null)
    : null

  return (
    <div className="space-y-6">
      {/* Asset type selector */}
      <Card padding="sm">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">Asset Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ASSET_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setAssetType(t)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                assetType === t
                  ? 'border-brand-300 bg-brand-50'
                  : 'border-ink-200 bg-white hover:border-ink-300'
              }`}
            >
              <p className={`text-sm font-semibold ${assetType === t ? 'text-brand-800' : 'text-ink-700'}`}>
                {ASSET_LABELS[t]}
              </p>
              <p className="text-xs text-ink-400 mt-0.5">{ASSET_DESCS[t]}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-400 mt-3">
          LTCG holding period for <strong>{ASSET_LABELS[assetType]}</strong>: &gt;{holdingMonths} months
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Inputs */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-4">Transaction Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Purchase / Acquisition Price"
                prefix="₹"
                type="number"
                min="0"
                placeholder="0"
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value)}
              />
              <p className="mt-1 text-xs text-ink-400">Include stamp duty, brokerage paid at purchase</p>
            </div>
            <div>
              <Input
                label="Sale / Transfer Price"
                prefix="₹"
                type="number"
                min="0"
                placeholder="0"
                value={salePrice}
                onChange={e => setSalePrice(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Date of Purchase"
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Date of Sale"
                type="date"
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Transfer / Selling Costs (brokerage, registration, legal fees)"
                prefix="₹"
                type="number"
                min="0"
                placeholder="0"
                value={costs}
                onChange={e => setCosts(e.target.value)}
              />
              <p className="mt-1 text-xs text-ink-400">Deducted from sale consideration to reduce the gain</p>
            </div>

            {/* Indexation FY selectors — property only */}
            {assetType === 'property' && (
              <>
                <Select
                  label="Purchase FY (for indexation)"
                  value={purchaseFY}
                  options={CII_FY_OPTIONS}
                  onChange={e => setPurchaseFY(e.target.value)}
                />
                <Select
                  label="Sale FY (for indexation)"
                  value={saleFY}
                  options={CII_FY_OPTIONS}
                  onChange={e => setSaleFY(e.target.value)}
                />
              </>
            )}
          </div>
        </Card>

        {/* Results */}
        <div className="lg:sticky lg:top-6 space-y-4">
          {result ? (
            <>
              {/* Gain type badge */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${
                  result.scenarios[0].gain < 0
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : result.isLTCG
                    ? 'border-brand-200 bg-brand-50 text-brand-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}>
                  {result.scenarios[0].gain < 0
                    ? <TrendingDown size={16} />
                    : <TrendingUp size={16} />
                  }
                  {result.scenarios[0].gain < 0 ? 'Capital Loss' : result.gainType}
                </div>
                <span className="text-sm text-ink-500">
                  Held for <strong>{result.holdingMonths} months</strong>
                </span>
              </div>

              {/* Compare if multiple scenarios */}
              {result.indexationApplicable && result.scenarios.length === 2 && (
                <div className="rounded-xl bg-ink-50 border border-ink-100 px-4 py-3">
                  <p className="text-xs font-semibold text-ink-700 mb-0.5">You have a choice</p>
                  <p className="text-xs text-ink-500">
                    Property bought before July 23, 2024 — you can choose between <strong>12.5% without indexation</strong>{' '}
                    or <strong>20% with indexation</strong>. Pick whichever gives lower tax.
                  </p>
                </div>
              )}

              {result.scenarios.map((s, i) => (
                <ScenarioCard
                  key={i}
                  s={s}
                  isBetter={betterIdx === i}
                  total={result.scenarios.length}
                />
              ))}

              <div className="flex gap-2 rounded-xl bg-ink-50 border border-ink-100 px-4 py-3">
                <Info size={14} className="text-ink-400 shrink-0 mt-0.5" />
                <p className="text-xs text-ink-500">
                  Tax shown is before surcharge. Add 4% Health &amp; Education Cess on the final tax.
                  Surcharge applies for total income above ₹50L (max 15% for equity 111A/112A).
                </p>
              </div>
            </>
          ) : (
            <Card className="text-center py-12">
              <p className="text-ink-400 text-sm">Enter purchase and sale details to compute capital gains</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
