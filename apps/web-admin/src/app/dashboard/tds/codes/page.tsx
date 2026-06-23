'use client'

import { useEffect, useState } from 'react'
import { tdsCodesApi, type TdsCode } from '@/lib/api'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const EMPTY: Omit<TdsCode, '_id'> = {
  code: '', tax_type: 'TDS', description: '', deductor: '', payee_type: '', old_section: '', new_section: '',
}

export default function TdsCodesPage() {
  const [rows, setRows]         = useState<TdsCode[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState<'create' | 'edit' | null>(null)
  const [form, setForm]         = useState<Omit<TdsCode, '_id'>>(EMPTY)
  const [editCode, setEditCode] = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function load() {
    setLoading(true)
    try { setRows(await tdsCodesApi.list()) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() { setForm(EMPTY); setError(''); setModal('create') }
  function openEdit(row: TdsCode) {
    const { _id, ...rest } = row
    void _id
    setForm(rest); setEditCode(row.code); setError(''); setModal('edit')
  }
  function close() { setModal(null) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (modal === 'create') await tdsCodesApi.create(form)
      else                    await tdsCodesApi.update(editCode, form)
      await load(); close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function remove(code: string) {
    if (!confirm(`Delete code ${code}?`)) return
    try { await tdsCodesApi.remove(code); await load() }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed') }
  }

  const f = (key: keyof typeof form, val: string) => setForm(p => ({ ...p, [key]: val }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">TDS / TCS Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stable code identities — no year-specific data here.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition">
          <Plus size={14} /> Add Code
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No codes yet. Add one to get started.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Code', 'Type', 'Description', 'Old Section', 'New Section', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(row => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{row.code}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      row.tax_type === 'TDS' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>{row.tax_type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{row.description}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{row.old_section}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{row.new_section}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(row.code)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{modal === 'create' ? 'Add Code' : `Edit Code ${editCode}`}</h2>
              <button onClick={close} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Code" value={form.code} onChange={v => f('code', v)} disabled={modal === 'edit'} required />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tax Type</label>
                  <select value={form.tax_type} onChange={e => f('tax_type', e.target.value as 'TDS' | 'TCS')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="TDS">TDS</option>
                    <option value="TCS">TCS</option>
                  </select>
                </div>
              </div>
              <Field label="Description" value={form.description} onChange={v => f('description', v)} required />
              <Field label="Deductor" value={form.deductor} onChange={v => f('deductor', v)} required />
              <Field label="Payee Type" value={form.payee_type} onChange={v => f('payee_type', v)} required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Old Section (IT Act 1961)" value={form.old_section} onChange={v => f('old_section', v)} required />
                <Field label="New Section (IT Act 2025)" value={form.new_section} onChange={v => f('new_section', v)} required />
              </div>
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

function Field({ label, value, onChange, required, disabled }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        required={required} disabled={disabled}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  )
}
