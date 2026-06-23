'use client'

import { useState, useMemo } from 'react'
import { Info, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Input, Select, Card } from '@/components/ui'
import { computeAdvanceTax, FY_OPTIONS, AGE_OPTIONS, type FY, type AgeGroup, type Instalment } from '@/lib/logic/advance-tax'

const fmtINR = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))

const num = (v: string) => Math.max(0, parseFloat(v) || 0)

function InstalmentRow({ inst }: { inst: Instalment }) {
  const statusIcon = inst.isPast
    ? <CheckCircle size={14} className="text-ink-400 shrink-0" />
    : <Clock size={14} className="text-brand-500 shrink-0" />

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
      !inst.isPast ? 'border-brand-200 bg-brand-50' : 'border-ink-100 bg-white'
    }`}>
      {statusIcon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink-800">{inst.label}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            inst.isPast
              ? 'bg-ink-100 text-ink-500'
              : 'bg-brand-100 text-brand-700'
          }`}>
            {inst.isPast ? 'Past due' : 'Upcoming'}
          </span>
        </div>
        <p className="text-xs text-ink-400 mt-0.5">
          Due: {inst.dueDate} · Cumulative {inst.cumulativePct}%
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-ink-900">{fmtINR(inst.amount)}</p>
        <p className="text-xs text-ink-400">this quarter</p>
      </div>
    </div>
  )
}

export function AdvanceTaxCalculator() {
  const [fy, setFY]             = useState<FY>('FY2025-26')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('below60')
  const [regime, setRegime]     = useState<'old' | 'new'>('new')
  const [income, setIncome]     = useState('')
  const [hasSalary, setHasSalary] = useState(true)
  const [oldDed, setOldDed]     = useState('')
  const [tds, setTDS]           = useState('')

  const result = useMemo(() => {
    const inc = num(income)
    if (inc === 0) return null
    return computeAdvanceTax({
      fy,
      ageGroup,
      estimatedIncome:     inc,
      hasSalary,
      oldRegimeDeductions: regime === 'old' ? num(oldDed) : 0,
      estimatedTDS:        num(tds),
      regime,
    })
  }, [fy, ageGroup, regime, income, hasSalary, oldDed, tds])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <Select label="Financial Year" value={fy} options={FY_OPTIONS}
              onChange={e => setFY(e.target.value as FY)} />
          </div>
          <div className="w-56">
            <Select label="Age Group" value={ageGroup} options={AGE_OPTIONS}
              onChange={e => setAgeGroup(e.target.value as AgeGroup)} />
          </div>
          <div className="ml-auto flex items-center rounded-xl border border-ink-200 overflow-hidden text-sm">
            {(['new', 'old'] as const).map(r => (
              <button key={r} onClick={() => setRegime(r)}
                className={`px-4 py-2 font-medium transition-colors ${
                  regime === r ? 'bg-ink-900 text-white' : 'bg-white text-ink-500 hover:text-ink-700'
                }`}>
                {r === 'new' ? 'New Regime' : 'Old Regime'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Inputs */}
        <div className="space-y-5">
          <Card>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-4">Income & TDS</p>
            <div className="space-y-5">
              <div>
                <Input label="Estimated Annual Income" prefix="₹" type="number" min="0"
                  placeholder="e.g. 1500000" value={income}
                  onChange={e => setIncome(e.target.value)} />
                <p className="mt-1 text-xs text-ink-400">
                  Include all income — salary, business, freelance, interest, capital gains etc.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-ink-100 bg-ink-50">
                <input type="checkbox" id="hasSalaryCB" checked={hasSalary}
                  onChange={e => setHasSalary(e.target.checked)}
                  className="mt-0.5 accent-brand-600" />
                <label htmlFor="hasSalaryCB" className="text-sm text-ink-700 cursor-pointer">
                  <span className="font-medium">Includes salary / pension income</span>
                  <span className="text-xs text-ink-400 block mt-0.5">
                    Auto-applies standard deduction (₹50K old / ₹75K new)
                  </span>
                </label>
              </div>

              {regime === 'old' && (
                <div>
                  <Input label="Total Deductions (Old Regime)" prefix="₹" type="number" min="0"
                    placeholder="e.g. 200000" value={oldDed}
                    onChange={e => setOldDed(e.target.value)} />
                  <p className="mt-1 text-xs text-ink-400">80C, 80D, NPS, HRA, home loan etc. (excluding standard deduction)</p>
                </div>
              )}

              <div>
                <Input label="Estimated TDS for the Year" prefix="₹" type="number" min="0"
                  placeholder="0" value={tds}
                  onChange={e => setTDS(e.target.value)} />
                <p className="mt-1 text-xs text-ink-400">
                  TDS your employer / bank will deduct during the year. Advance tax is required only on the remaining liability.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex gap-2 rounded-xl bg-ink-50 border border-ink-100 px-4 py-3">
            <Info size={14} className="text-ink-400 shrink-0 mt-0.5" />
            <p className="text-xs text-ink-500">
              <strong className="text-ink-700">Senior citizens (60+) with no business income</strong> are exempt from
              paying advance tax. They can pay the full tax as self-assessment tax before filing ITR.
              Interest u/s 234B/234C may apply if advance tax is underpaid.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:sticky lg:top-6 space-y-4">
          {result ? (
            <>
              {/* Tax summary */}
              <Card>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">Tax Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-500">Estimated annual tax</span>
                    <span className="font-medium text-ink-700">{fmtINR(result.estimatedAnnualTax)}</span>
                  </div>
                  {result.tdsCredit > 0 && (
                    <div className="flex justify-between text-xs text-ink-400">
                      <span>Less: TDS credit</span>
                      <span>− {fmtINR(result.tdsCredit)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t border-ink-100 pt-2">
                    <span className="text-ink-700">Net advance tax payable</span>
                    <span className="text-ink-900">{fmtINR(result.netAdvanceTax)}</span>
                  </div>
                </div>

                <div className={`mt-4 rounded-xl border px-4 py-3 flex gap-2 ${
                  result.isApplicable
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-brand-50 border-brand-200'
                }`}>
                  {result.isApplicable
                    ? <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    : <CheckCircle size={14} className="text-brand-500 shrink-0 mt-0.5" />
                  }
                  <p className={`text-xs font-medium ${result.isApplicable ? 'text-amber-700' : 'text-brand-700'}`}>
                    {result.isApplicable
                      ? `Advance tax applicable. Pay in 4 instalments as shown below.`
                      : `Advance tax not applicable — liability (${fmtINR(result.netAdvanceTax)}) is below ₹10,000 threshold.`
                    }
                  </p>
                </div>
              </Card>

              {/* Instalment schedule */}
              {result.isApplicable && (
                <Card padding="sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-3">
                    Instalment Schedule
                  </p>
                  <div className="space-y-2">
                    {result.instalments.map(inst => (
                      <InstalmentRow key={inst.label} inst={inst} />
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-ink-100 flex justify-between text-sm font-semibold">
                    <span className="text-ink-700">Total advance tax</span>
                    <span className="text-ink-900">{fmtINR(result.netAdvanceTax)}</span>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="text-center py-12">
              <p className="text-ink-400 text-sm">Enter your estimated income to see the advance tax schedule</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
