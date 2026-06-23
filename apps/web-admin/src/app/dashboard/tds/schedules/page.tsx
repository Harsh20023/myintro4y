'use client'

import { useEffect, useState } from 'react'
import { tdsSchedulesApi, type TdsSchedule } from '@/lib/api'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

type Kind = 'slab' | 'rates_in_force'
type Regime = '' | 'new' | 'old'

const EMPTY_FORM = {
  ref: '', kind: 'slab' as Kind, regime: '' as Regime,
  tax_year: '', legal_ref: '', rebate_note: '', surcharge_note: '',
  brackets_json: '[]',
}

export default function SchedulesPage() {
  const [rows, setRows]           = useState<TdsSchedule[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterKind, setFilterKind] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [modal, setModal]         = useState<'create' | 'edit' | null>(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editRef, setEditRef]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function load() {
    setLoading(true)
    try {
      setRows(await tdsSchedulesApi.list({
        kind:     filterKind || undefined,
        tax_year: filterYear || undefined,
      }))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterKind, filterYear])

  function openCreate() { setForm(EMPTY_FORM); setError(''); setModal('create') }
  function openEdit(row: TdsSchedule) {
    setForm({
      ref: row.ref, kind: row.kind, regime: row.regime ?? '',
      tax_year: row.tax_year, legal_ref: row.legal_ref,
      rebate_note: row.rebate_note, surcharge_note: row.surcharge_note,
      brackets_json: JSON.stringify(row.brackets_json, null, 2),
    })
    setEditRef(row.ref); setError(''); setModal('edit')
  }
  function close() { setModal(null) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const body = {
        ref: form.ref, kind: form.kind,
        regime: form.regime || null,
        tax_year: form.tax_year, legal_ref: form.legal_ref,
        rebate_note: form.rebate_note, surcharge_note: form.surcharge_note,
        brackets_json: JSON.parse(form.brackets_json),
      }
      if (modal === 'create') await tdsSchedulesApi.create(body)
      else                    await tdsSchedulesApi.update(editRef, body)
      await load(); close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function remove(ref: string) {
    if (!confirm(`Delete schedule "${ref}"?`)) return
    try { await tdsSchedulesApi.remove(ref); await load() }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed') }
  }

  const f = <K extends keyof typeof EMPTY_FORM>(k: K, v: typeof EMPTY_FORM[K]) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Schedules</h1>
          <p className="text-sm text-gray-500 mt-0.5">Shared slab / rates-in-force tables referenced by code years.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition">
          <Plus size={14} /> Add Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={filterKind} onChange={e => setFilterKind(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-44 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900">
          <option value="">All kinds</option>
          <option value="slab">Slab</option>
          <option value="rates_in_force">Rates in Force</option>
        </select>
        <input placeholder="Filter by tax year" value={filterYear} onChange={e => setFilterYear(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No schedules found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Ref', 'Kind', 'Regime', 'Tax Year', 'Legal Ref', 'Brackets', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(row => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-slate-900 text-xs">{row.ref}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      row.kind === 'slab' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                    }`}>{row.kind}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{row.regime ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{row.tax_year}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate">{row.legal_ref}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{Array.isArray(row.brackets_json) ? `${row.brackets_json.length} slabs` : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={14} /></button>
                      <button onClick={() => remove(row.ref)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
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
              <h2 className="font-semibold text-gray-900">{modal === 'create' ? 'Add Schedule' : `Edit ${editRef}`}</h2>
              <button onClick={close} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SField label="Ref (unique key)" value={form.ref} onChange={v => f('ref', v)} required disabled={modal === 'edit'} />
                <SField label="Tax Year (e.g. 2026-27)" value={form.tax_year} onChange={v => f('tax_year', v)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kind</label>
                  <select value={form.kind} onChange={e => f('kind', e.target.value as Kind)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="slab">Slab</option>
                    <option value="rates_in_force">Rates in Force</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Regime</label>
                  <select value={form.regime} onChange={e => f('regime', e.target.value as Regime)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">None</option>
                    <option value="new">New</option>
                    <option value="old">Old</option>
                  </select>
                </div>
              </div>
              <SField label="Legal Ref" value={form.legal_ref} onChange={v => f('legal_ref', v)} />
              <SField label="Rebate Note" value={form.rebate_note} onChange={v => f('rebate_note', v)} />
              <SField label="Surcharge Note" value={form.surcharge_note} onChange={v => f('surcharge_note', v)} />
              <SJsonField label="brackets_json" value={form.brackets_json} onChange={v => f('brackets_json', v)} />
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

function SField({ label, value, onChange, required, disabled }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} required={required} disabled={disabled}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-gray-50 disabled:text-gray-400" />
    </div>
  )
}

function SJsonField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [err, setErr] = useState('')
  function check(v: string) {
    onChange(v)
    try { JSON.parse(v); setErr('') } catch { setErr('Invalid JSON') }
  }
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea value={value} onChange={e => check(e.target.value)} rows={7}
        className={`w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 ${err ? 'border-red-300' : 'border-gray-200'}`} />
      {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
    </div>
  )
}
