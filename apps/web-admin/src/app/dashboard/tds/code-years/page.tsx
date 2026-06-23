'use client'

import { useEffect, useState } from 'react'
import { tdsCodeYearsApi, type TdsCodeYear } from '@/lib/api'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const EMPTY_FORM = {
  code: '', tax_year: '', form: '', source_note: '',
  effective_from: '', effective_to: '',
  display_rate: '', display_threshold: '',
  rates_json: '[]', thresholds_json: '[]',
}

export default function CodeYearsPage() {
  const [rows, setRows]           = useState<TdsCodeYear[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterCode, setFilterCode] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [modal, setModal]         = useState<'create' | 'edit' | null>(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editId, setEditId]       = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function load() {
    setLoading(true)
    try {
      setRows(await tdsCodeYearsApi.list({
        code:     filterCode || undefined,
        tax_year: filterYear || undefined,
      }))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterCode, filterYear])

  function openCreate() { setForm(EMPTY_FORM); setError(''); setModal('create') }
  function openEdit(row: TdsCodeYear) {
    setForm({
      code: row.code, tax_year: row.tax_year, form: row.form, source_note: row.source_note,
      effective_from: row.effective_from?.slice(0, 10) ?? '',
      effective_to:   row.effective_to?.slice(0, 10) ?? '',
      display_rate: row.display_rate, display_threshold: row.display_threshold,
      rates_json:      JSON.stringify(row.rates_json, null, 2),
      thresholds_json: JSON.stringify(row.thresholds_json, null, 2),
    })
    setEditId(row._id); setError(''); setModal('edit')
  }
  function close() { setModal(null) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const body = {
        code: form.code, tax_year: form.tax_year, form: form.form, source_note: form.source_note,
        effective_from: new Date(form.effective_from).toISOString(),
        effective_to:   form.effective_to ? new Date(form.effective_to).toISOString() : null,
        display_rate: form.display_rate, display_threshold: form.display_threshold,
        rates_json:      JSON.parse(form.rates_json),
        thresholds_json: JSON.parse(form.thresholds_json),
      }
      if (modal === 'create') await tdsCodeYearsApi.create(body)
      else                    await tdsCodeYearsApi.update(editId, body)
      await load(); close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Delete ${label}?`)) return
    try { await tdsCodeYearsApi.remove(id); await load() }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed') }
  }

  const f = (k: keyof typeof EMPTY_FORM, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Code Years</h1>
          <p className="text-sm text-gray-500 mt-0.5">Versioned yearly facts — one row per code × tax year.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition">
          <Plus size={14} /> Add Row
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input placeholder="Filter by code (e.g. 1004)" value={filterCode} onChange={e => setFilterCode(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white" />
        <input placeholder="Filter by tax year (e.g. 2026-27)" value={filterYear} onChange={e => setFilterYear(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No records found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Code', 'Tax Year', 'Display Rate', 'Threshold', 'Form', 'Effective From', 'To', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(row => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{row.code}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{row.tax_year}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{row.display_rate}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{row.display_threshold}</td>
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">{row.form}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.effective_from?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.effective_to?.slice(0, 10) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={14} /></button>
                      <button onClick={() => remove(row._id, `${row.code} / ${row.tax_year}`)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mt-8 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{modal === 'create' ? 'Add Code Year' : 'Edit Code Year'}</h2>
              <button onClick={close} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <LField label="Code" value={form.code} onChange={v => f('code', v)} required disabled={modal === 'edit'} />
                <LField label="Tax Year (e.g. 2026-27)" value={form.tax_year} onChange={v => f('tax_year', v)} required disabled={modal === 'edit'} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <LField label="Effective From" type="date" value={form.effective_from} onChange={v => f('effective_from', v)} required />
                <LField label="Effective To (blank = in force)" type="date" value={form.effective_to} onChange={v => f('effective_to', v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <LField label="Display Rate" value={form.display_rate} onChange={v => f('display_rate', v)} />
                <LField label="Display Threshold" value={form.display_threshold} onChange={v => f('display_threshold', v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <LField label="Form" value={form.form} onChange={v => f('form', v)} />
                <LField label="Source Note" value={form.source_note} onChange={v => f('source_note', v)} />
              </div>
              <JsonField label="rates_json" value={form.rates_json} onChange={v => f('rates_json', v)} />
              <JsonField label="thresholds_json" value={form.thresholds_json} onChange={v => f('thresholds_json', v)} />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={close} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function LField({ label, value, onChange, required, disabled, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; disabled?: boolean; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} disabled={disabled}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-gray-50 disabled:text-gray-400" />
    </div>
  )
}

function JsonField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [err, setErr] = useState('')
  function check(v: string) {
    onChange(v)
    try { JSON.parse(v); setErr('') } catch { setErr('Invalid JSON') }
  }
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea value={value} onChange={e => check(e.target.value)} rows={5}
        className={`w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 ${err ? 'border-red-300' : 'border-gray-200'}`} />
      {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
    </div>
  )
}
