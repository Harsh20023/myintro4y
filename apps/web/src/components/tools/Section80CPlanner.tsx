'use client'

import { useState, useMemo } from 'react'
import { Info, TrendingUp } from 'lucide-react'
import { Input, Card } from '@/components/ui'

const SEC80C_LIMIT = 1_50_000
const NPS_EXTRA_LIMIT = 50_000   // 80CCD(1B) — outside 80C

const ITEMS = [
  { id: 'epf',     label: 'EPF / VPF',              desc: 'Provident Fund deducted by employer + voluntary contribution' },
  { id: 'ppf',     label: 'PPF',                    desc: 'Public Provident Fund (max ₹1.5L/year)' },
  { id: 'elss',    label: 'ELSS Mutual Funds',      desc: '3-year lock-in; tax-saving equity mutual funds' },
  { id: 'lic',     label: 'Life Insurance Premium', desc: 'LIC or any life insurance policy premium' },
  { id: 'nsc',     label: 'NSC',                    desc: 'National Savings Certificate' },
  { id: 'fd',      label: '5-Year Tax Saving FD',   desc: 'Bank or Post Office 5-year FD' },
  { id: 'hlprin',  label: 'Home Loan Principal',    desc: 'Principal repayment on home loan' },
  { id: 'ssy',     label: 'Sukanya Samriddhi',      desc: 'For girl child below 10 years' },
  { id: 'tuition', label: 'Tuition Fees',           desc: 'Full-time education, up to 2 children' },
  { id: 'ulip',    label: 'ULIP',                   desc: 'Unit Linked Insurance Plan' },
  { id: 'scss',    label: 'SCSS',                   desc: 'Senior Citizens Savings Scheme' },
]

const SUGGESTIONS = [
  { id: 'ppf',    label: 'PPF',             note: 'Guaranteed 7.1% returns, tax-free' },
  { id: 'elss',   label: 'ELSS Funds',      note: 'Market-linked, shortest lock-in (3 yrs)' },
  { id: 'nsc',    label: 'NSC',             note: 'Fixed returns, risk-free' },
  { id: 'fd',     label: '5-Year Tax FD',   note: 'Flexible tenure, bank guaranteed' },
]

const fmtINR = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))

type Investments = Record<string, string>

export function Section80CPlanner() {
  const [investments, setInvestments] = useState<Investments>(
    Object.fromEntries(ITEMS.map(i => [i.id, '']))
  )
  const [npsExtra, setNpsExtra] = useState('')

  const total80C = useMemo(() =>
    ITEMS.reduce((sum, item) => sum + (parseFloat(investments[item.id]) || 0), 0),
    [investments]
  )

  const utilized    = Math.min(total80C, SEC80C_LIMIT)
  const remaining   = Math.max(0, SEC80C_LIMIT - total80C)
  const overflow    = Math.max(0, total80C - SEC80C_LIMIT)
  const pct         = Math.min(100, (utilized / SEC80C_LIMIT) * 100)
  const npsExtraAmt = Math.min(parseFloat(npsExtra) || 0, NPS_EXTRA_LIMIT)
  const totalSavings = utilized + npsExtraAmt

  const barColor = pct >= 100
    ? 'bg-brand-500'
    : pct >= 75
    ? 'bg-amber-400'
    : 'bg-brand-400'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
      {/* Investment inputs */}
      <div className="space-y-5">
        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-4">
            Section 80C Investments
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ITEMS.map(item => (
              <div key={item.id}>
                <Input
                  label={item.label}
                  prefix="₹"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={investments[item.id]}
                  onChange={e =>
                    setInvestments(prev => ({ ...prev, [item.id]: e.target.value }))
                  }
                />
                <p className="mt-1 text-xs text-ink-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-1">
            NPS — Section 80CCD(1B)
          </p>
          <p className="text-xs text-ink-400 mb-4">
            Additional NPS contribution — separate ₹50,000 deduction <em>over and above</em> the ₹1.5L 80C limit
          </p>
          <Input
            label={`Additional NPS Contribution (max ₹${(NPS_EXTRA_LIMIT / 1_000).toFixed(0)}K)`}
            prefix="₹"
            type="number"
            min="0"
            placeholder="0"
            value={npsExtra}
            onChange={e => setNpsExtra(e.target.value)}
          />
        </Card>
      </div>

      {/* Results panel */}
      <div className="lg:sticky lg:top-6 space-y-4">
        {/* Progress card */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">80C Utilisation</p>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-ink-500 mb-1">
              <span>{fmtINR(utilized)} used</span>
              <span>Limit: {fmtINR(SEC80C_LIMIT)}</span>
            </div>
            <div className="h-3 bg-ink-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Status */}
          {overflow > 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              <strong>Over the limit by {fmtINR(overflow)}</strong> — only ₹1,50,000 will be deducted.
              The extra ₹{new Intl.NumberFormat('en-IN').format(overflow)} won't give additional tax benefit under 80C.
            </div>
          ) : remaining > 0 ? (
            <div className="rounded-xl bg-ink-50 border border-ink-100 p-3 text-xs text-ink-600">
              <strong className="text-ink-800">{fmtINR(remaining)} still available</strong> under 80C.
              Consider topping up your investments before March 31.
            </div>
          ) : (
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-3 text-xs text-brand-700">
              <strong>80C fully utilised!</strong> You're claiming the maximum deduction of ₹1,50,000.
            </div>
          )}
        </Card>

        {/* Summary card */}
        <Card padding="sm">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Total 80C investments</span>
              <span className="font-medium text-ink-700">{fmtINR(total80C)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Effective 80C deduction</span>
              <span className="font-medium text-ink-800">{fmtINR(utilized)}</span>
            </div>
            {npsExtraAmt > 0 && (
              <div className="flex justify-between text-xs text-ink-400 border-t border-ink-100 pt-2">
                <span>NPS 80CCD(1B)</span>
                <span>{fmtINR(npsExtraAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t border-ink-100 pt-2">
              <span className="text-ink-700">Total deduction from income</span>
              <span className="text-brand-700">{fmtINR(totalSavings)}</span>
            </div>
          </div>
        </Card>

        {/* Suggestions */}
        {remaining > 0 && (
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-brand-600" />
              <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
                Options to fill remaining {fmtINR(remaining)}
              </p>
            </div>
            <div className="space-y-2">
              {SUGGESTIONS.map(s => (
                <div key={s.id} className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink-700">{s.label}</p>
                    <p className="text-xs text-ink-400">{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {pct >= 100 && (
          <div className="flex gap-2 rounded-xl bg-ink-50 border border-ink-100 px-4 py-3">
            <Info size={14} className="text-ink-400 shrink-0 mt-0.5" />
            <p className="text-xs text-ink-500">
              80C is maxed out. For additional savings, consider{' '}
              <strong className="text-ink-700">NPS 80CCD(1B)</strong> for ₹50,000 more, or{' '}
              <strong className="text-ink-700">80D</strong> for health insurance premiums.
            </p>
          </div>
        )}

        <div className="flex gap-2 rounded-xl bg-ink-50 border border-ink-100 px-4 py-3">
          <Info size={14} className="text-ink-400 shrink-0 mt-0.5" />
          <p className="text-xs text-ink-500">
            80C deductions are available under the <strong className="text-ink-700">Old Regime only</strong>.
            New Regime does not allow Chapter VI-A deductions.
          </p>
        </div>
      </div>
    </div>
  )
}
