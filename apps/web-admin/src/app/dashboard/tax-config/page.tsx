'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { taxConfigApi, type TaxConfigStatus } from '@/lib/api'

const TAX_YEARS = ['2026-27', '2025-26', '2024-25']

export default function TaxConfigPage() {
  const [taxYear, setTaxYear]   = useState('2026-27')
  const [status, setStatus]     = useState<TaxConfigStatus | null>(null)
  const [loading, setLoading]   = useState(false)
  const [syncing, setSyncing]   = useState(false)
  const [result, setResult]     = useState<{ ok: boolean; message: string } | null>(null)

  // Load current cache status on mount or year change
  useEffect(() => {
    setLoading(true)
    setStatus(null)
    setResult(null)
    taxConfigApi.getLatest(taxYear)
      .then(doc => {
        if (doc && 'data' in doc) setStatus(doc.data as TaxConfigStatus)
        else setStatus(null)
      })
      .finally(() => setLoading(false))
  }, [taxYear])

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    try {
      const res = await taxConfigApi.sync(taxYear)
      setResult({ ok: true, message: `Synced successfully — version ${res.version}` })
      setStatus({ tax_year: res.tax_year, version: res.version, compiled_at: res.compiled_at })
    } catch (err: any) {
      setResult({ ok: false, message: err.message ?? 'Sync failed' })
    } finally {
      setSyncing(false)
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Tax Config Sync</h1>
      <p className="text-sm text-gray-500 mb-6">
        Compile income-tax slabs, surcharge, rebate, and TDS rates from the database and push
        them live to the frontend calculator.
      </p>

      {/* Tax year selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Assessment Year</label>
        <select
          value={taxYear}
          onChange={e => setTaxYear(e.target.value)}
          className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TAX_YEARS.map(y => (
            <option key={y} value={y}>AY {y}</option>
          ))}
        </select>
      </div>

      {/* Status card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Current Live Config</p>

        {loading ? (
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Clock size={14} className="animate-spin" /> Loading…
          </p>
        ) : status ? (
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Tax Year</dt>
              <dd className="font-medium text-gray-800">{status.tax_year}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Version</dt>
              <dd className="font-mono text-xs text-gray-600">{status.version}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Last Synced</dt>
              <dd className="text-gray-800">{fmtDate(status.compiled_at)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-amber-600 flex items-center gap-2">
            <AlertCircle size={14} />
            Not synced yet — frontend is using hardcoded values for {taxYear}
          </p>
        )}
      </div>

      {/* What gets synced */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 mb-5 text-sm text-blue-800">
        <p className="font-semibold mb-2">What this syncs:</p>
        <ul className="space-y-1 list-disc list-inside text-blue-700">
          <li>Income-tax slabs (new & old regime) from <span className="font-mono text-xs">TdsSchedule</span></li>
          <li>Surcharge brackets (individual / HUF) from <span className="font-mono text-xs">TaxSurcharge</span></li>
          <li>87A rebate limits &amp; standard deduction from <span className="font-mono text-xs">TaxMetaYear</span></li>
          <li>TDS section rates &amp; thresholds (194C, 194J, etc.) from <span className="font-mono text-xs">TdsCodeYear</span></li>
        </ul>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-sm ${
          result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {result.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {result.message}
        </div>
      )}

      {/* Sync button */}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
        {syncing ? 'Syncing…' : 'Sync to Live'}
      </button>
    </div>
  )
}
