'use client'

import { useState } from 'react'
import { ArrowLeftRight, Info } from 'lucide-react'
import { Input, Select, Card } from '@/components/ui'
import { calcGST, GST_SLABS, type GSTCalcMode, type TransactionType } from '@/lib/logic/gst'

function ResultRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${highlight ? 'bg-brand-600' : 'bg-ink-50'}`}>
      <span className={`text-sm ${highlight ? 'text-brand-100 font-medium' : 'text-ink-500'}`}>{label}</span>
      <span className={`font-mono font-semibold ${highlight ? 'text-white text-base' : 'text-ink-800 text-sm'}`}>{value}</span>
    </div>
  )
}

export function GSTCalculator() {
  const [amount, setAmount]     = useState<string>('10000')
  const [gstRate, setGSTRate]   = useState<number>(18)
  const [mode, setMode]         = useState<GSTCalcMode>('exclusive')
  const [txType, setTxType]     = useState<TransactionType>('intra')

  const numericAmount = parseFloat(amount) || 0
  const result = calcGST(numericAmount, gstRate, mode, txType)

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            prefix="₹"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
          <Select
            label="GST Rate"
            value={String(gstRate)}
            options={GST_SLABS.map(s => ({ value: String(s.value), label: s.label }))}
            onChange={e => setGSTRate(parseInt(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Exclusive / Inclusive toggle */}
          <div>
            <p className="label-base">Calculation Mode</p>
            <div className="flex rounded-xl border border-ink-200 overflow-hidden">
              {(['exclusive', 'inclusive'] as GSTCalcMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    mode === m ? 'bg-brand-600 text-white' : 'bg-white text-ink-500 hover:bg-ink-50'
                  }`}
                >
                  {m === 'exclusive' ? 'Add GST' : 'Extract GST'}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400 mt-1">
              {mode === 'exclusive' ? 'GST added on top of amount' : 'GST extracted from amount'}
            </p>
          </div>

          {/* Intra / Inter toggle */}
          <div>
            <p className="label-base">Transaction Type</p>
            <div className="flex rounded-xl border border-ink-200 overflow-hidden">
              {([['intra', 'Intra-state'], ['inter', 'Inter-state']] as [TransactionType, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTxType(t)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    txType === t ? 'bg-brand-600 text-white' : 'bg-white text-ink-500 hover:bg-ink-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400 mt-1">
              {txType === 'intra' ? 'CGST + SGST applies' : 'IGST applies'}
            </p>
          </div>
        </div>
      </Card>

      {/* Results */}
      {numericAmount > 0 && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Breakdown</p>
          <div className="space-y-1.5">
            <ResultRow label="Base Amount (taxable)" value={fmt(result.baseAmount)} />
            {txType === 'intra' ? <>
              <ResultRow label={`CGST @ ${gstRate / 2}%`} value={fmt(result.cgst)} />
              <ResultRow label={`SGST @ ${gstRate / 2}%`} value={fmt(result.sgst)} />
            </> : (
              <ResultRow label={`IGST @ ${gstRate}%`} value={fmt(result.igst)} />
            )}
            <ResultRow label="Total GST" value={fmt(result.totalGST)} />
            <div className="pt-1">
              <ResultRow label="Total Amount" value={fmt(result.totalAmount)} highlight />
            </div>
          </div>
        </Card>
      )}

      {/* Info */}
      <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
        <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Intra-state</strong> (same state): CGST + SGST, each at half the GST rate. &nbsp;
          <strong>Inter-state</strong> (different states): full IGST applies.
          GST rates: 0%, 5%, 12%, 18%, 28%.
        </p>
      </div>
    </div>
  )
}
