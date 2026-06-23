'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ruleSetsApi, type RuleSet } from '@/lib/api'
import { Plus, Pencil, Trash2, X, ExternalLink } from 'lucide-react'

const EMPTY_FORM = {
  effectiveFrom: '',
  effectiveTo: '',
  notificationNumber: '',
  notificationTitle: '',
  notificationUrl: '',
}

export default function RuleSetsPage() {
  const [rows, setRows]       = useState<RuleSet[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<'create' | null>(null)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function load() {
    setLoading(true)
    try { setRows(await ruleSetsApi.list()) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() { setForm(EMPTY_FORM); setError(''); setModal('create') }
  function close() { setModal(null) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await ruleSetsApi.create({
        effectiveFrom: form.effectiveFrom,
        effectiveTo:   form.effectiveTo || null,
        notification: {
          number: form.notificationNumber,
          title:  form.notificationTitle,
          url:    form.notificationUrl,
        },
        lateFeeRules:  [],
        interestRules: [],
        waivers:       [],
      })
      await load(); close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Delete rule set "${label}"?`)) return
    try { await ruleSetsApi.remove(id); await load() }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed') }
  }

  const f = <K extends keyof typeof EMPTY_FORM>(k: K, v: string) =>
    setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">GST Rule Sets</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            One document per CBIC notification period — governs late fees, interest and waivers.
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition">
          <Plus size={14} /> New Rule Set
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">
            No rule sets found. Run the seed script or create one above.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Notification', 'Effective From', 'Effective To', 'Late Fee Rules', 'Waivers', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(row => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 text-xs">{row.notification.number}</p>
                    <p className="text-gray-500 text-xs mt-0.5 max-w-[260px] truncate">{row.notification.title}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600 text-xs">
                    {row.effectiveFrom.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {row.effectiveTo
                      ? <span className="font-mono text-gray-600">{row.effectiveTo.slice(0, 10)}</span>
                      : <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">In Force</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{row.lateFeeRules.length} rules</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{row.waivers.length} waivers</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/dashboard/gst/rule-sets/${row._id}`}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-slate-700"
                        title="Edit rules">
                        <Pencil size={14} />
                      </Link>
                      {row.notification.url && (
                        <a href={row.notification.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                          title="View notification">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button onClick={() => remove(row._id, row.notification.number)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
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

      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mt-16">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">New Rule Set</h2>
              <button onClick={close} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Effective From" type="date" value={form.effectiveFrom}
                  onChange={v => f('effectiveFrom', v)} required />
                <Field label="Effective To (blank = in force)" type="date" value={form.effectiveTo}
                  onChange={v => f('effectiveTo', v)} />
              </div>
              <Field label="Notification Number" value={form.notificationNumber}
                onChange={v => f('notificationNumber', v)} required
                placeholder="e.g. 19-21/2021-CT" />
              <Field label="Title" value={form.notificationTitle}
                onChange={v => f('notificationTitle', v)} required />
              <Field label="Notification URL" value={form.notificationUrl}
                onChange={v => f('notificationUrl', v)}
                placeholder="https://cbic-gst.gov.in/…" />
              <p className="text-xs text-gray-400">
                You'll add late fee rules, interest rules and waivers from the detail page after creating.
              </p>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={close}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50">
                  {saving ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, required, type = 'text', placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void
  required?: boolean; type?: string; placeholder?: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder} disabled={disabled}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-gray-50 disabled:text-gray-400" />
    </div>
  )
}
