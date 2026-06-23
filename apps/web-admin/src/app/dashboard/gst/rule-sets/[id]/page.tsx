'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ruleSetsApi,
  type RuleSet, type LateFeeRule, type InterestRule, type Waiver,
} from '@/lib/api'
import { ArrowLeft, Plus, Trash2, X, Save } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type LFModal  = 'add-lf' | null
type IRModal  = 'add-ir' | null
type WVModal  = 'add-wv' | null
type AnyModal = LFModal | IRModal | WVModal | 'edit-meta'

const EMPTY_LF: Omit<LateFeeRule, '_id'> = {
  returnTypeCode: '', returnTypeName: '',
  frequency: 'monthly', dueRuleType: 'dayOfFollowingMonth', dueParam: 20,
  turnoverSlab: { label: '', lower: 0, upper: null },
  isNil: false,
  perDayCgst: 25, perDaySgst: 25,
  capType: 'flat', capValue: 2000,
}

const EMPTY_IR: Omit<InterestRule, '_id'> = {
  type: 'latePayment', annualRate: 18, dayBasis: 365,
}

const EMPTY_WV: Omit<Waiver, '_id'> = {
  returnTypeCode: '', periodFrom: '', periodTo: '', fileBy: '',
  overrideType: 'cap', overrideValue: null,
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RuleSetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [rs, setRs]         = useState<RuleSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState<AnyModal>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  // meta edit state
  const [meta, setMeta] = useState({ effectiveFrom: '', effectiveTo: '', number: '', title: '', url: '' })
  // sub-form states
  const [lf, setLf] = useState<Omit<LateFeeRule, '_id'>>(EMPTY_LF)
  const [ir, setIr] = useState<Omit<InterestRule, '_id'>>(EMPTY_IR)
  const [wv, setWv] = useState<Omit<Waiver, '_id'>>(EMPTY_WV)

  async function load() {
    setLoading(true)
    try {
      const data = await ruleSetsApi.get(id)
      setRs(data)
      setMeta({
        effectiveFrom: data.effectiveFrom.slice(0, 10),
        effectiveTo:   data.effectiveTo ? data.effectiveTo.slice(0, 10) : '',
        number: data.notification.number,
        title:  data.notification.title,
        url:    data.notification.url,
      })
    } catch { router.replace('/dashboard/gst/rule-sets') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  function close() { setModal(null); setError('') }

  // ── Meta save ──────────────────────────────────────────────────────────────

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await ruleSetsApi.update(id, {
        effectiveFrom: meta.effectiveFrom,
        effectiveTo:   meta.effectiveTo || null,
        notification:  { number: meta.number, title: meta.title, url: meta.url },
      })
      await load(); close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  // ── Late Fee Rule ──────────────────────────────────────────────────────────

  async function addLateFeeRule(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await ruleSetsApi.pushLateFeeRule(id, lf)
      await load(); close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function deleteLateFeeRule(ruleId: string) {
    if (!confirm('Remove this late fee rule?')) return
    try { await ruleSetsApi.pullLateFeeRule(id, ruleId); await load() }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed') }
  }

  // ── Interest Rule ──────────────────────────────────────────────────────────

  async function addInterestRule(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await ruleSetsApi.pushInterestRule(id, ir)
      await load(); close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function deleteInterestRule(ruleId: string) {
    if (!confirm('Remove this interest rule?')) return
    try { await ruleSetsApi.pullInterestRule(id, ruleId); await load() }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed') }
  }

  // ── Waiver ─────────────────────────────────────────────────────────────────

  async function addWaiver(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await ruleSetsApi.pushWaiver(id, wv)
      await load(); close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  async function deleteWaiver(waiverId: string) {
    if (!confirm('Remove this waiver?')) return
    try { await ruleSetsApi.pullWaiver(id, waiverId); await load() }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed') }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="p-8 text-sm text-gray-400">Loading…</div>
  )
  if (!rs) return null

  return (
    <div className="p-8 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/gst/rule-sets"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft size={14} /> Rule Sets
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-900 font-medium">{rs.notification.number}</span>
      </div>

      {/* Meta card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{rs.notification.number}</h1>
            <p className="text-sm text-gray-600 mt-0.5">{rs.notification.title}</p>
            {rs.notification.url && (
              <a href={rs.notification.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1 block truncate max-w-xl">
                {rs.notification.url}
              </a>
            )}
          </div>
          <button onClick={() => { setError(''); setModal('edit-meta') }}
            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
            <Save size={13} /> Edit
          </button>
        </div>
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Effective From</p>
            <p className="text-sm font-mono text-gray-800 mt-0.5">{rs.effectiveFrom.slice(0, 10)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Effective To</p>
            {rs.effectiveTo
              ? <p className="text-sm font-mono text-gray-800 mt-0.5">{rs.effectiveTo.slice(0, 10)}</p>
              : <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-0.5 inline-block">Currently In Force</span>
            }
          </div>
        </div>
      </div>

      {/* Late Fee Rules */}
      <SectionCard
        title="Late Fee Rules"
        subtitle={`${rs.lateFeeRules.length} rules — one per return × slab × nil/regular`}
        onAdd={() => { setLf(EMPTY_LF); setError(''); setModal('add-lf') }}
        addLabel="Add Rule">
        {rs.lateFeeRules.length === 0
          ? <p className="text-xs text-gray-400 p-4">No rules yet.</p>
          : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Code', 'Name', 'Freq', 'Due Rule', 'Slab', 'NIL?', 'Per Day (C+S)', 'Cap', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rs.lateFeeRules.map((r, i) => (
                  <tr key={r._id ?? i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono font-medium text-slate-900">{r.returnTypeCode}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[140px] truncate">{r.returnTypeName}</td>
                    <td className="px-3 py-2">
                      <Badge color="blue">{r.frequency}</Badge>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{r.dueRuleType}{r.dueParam != null ? `/${r.dueParam}` : ''}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{r.turnoverSlab.label}</td>
                    <td className="px-3 py-2">
                      {r.isNil
                        ? <Badge color="orange">NIL</Badge>
                        : <Badge color="gray">Regular</Badge>}
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-700">
                      ₹{r.perDayCgst}+₹{r.perDaySgst}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {r.capType === 'none'
                        ? '—'
                        : r.capType === 'flat'
                        ? `₹${r.capValue?.toLocaleString()}`
                        : `${((r.capValue ?? 0) * 100).toFixed(4)}%`}
                    </td>
                    <td className="px-3 py-2">
                      {r._id && (
                        <button onClick={() => deleteLateFeeRule(r._id!)}
                          className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </SectionCard>

      {/* Interest Rules */}
      <SectionCard
        title="Interest Rules"
        subtitle="Section 50 — late payment (18%) and excess ITC (24%)"
        onAdd={() => { setIr(EMPTY_IR); setError(''); setModal('add-ir') }}
        addLabel="Add Rule">
        {rs.interestRules.length === 0
          ? <p className="text-xs text-gray-400 p-4">No interest rules yet.</p>
          : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Type', 'Annual Rate', 'Day Basis', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rs.interestRules.map((r, i) => (
                  <tr key={r._id ?? i} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <Badge color={r.type === 'latePayment' ? 'blue' : 'orange'}>{r.type}</Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-700">{r.annualRate}% p.a.</td>
                    <td className="px-3 py-2 text-gray-500">{r.dayBasis} days</td>
                    <td className="px-3 py-2">
                      {r._id && (
                        <button onClick={() => deleteInterestRule(r._id!)}
                          className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </SectionCard>

      {/* Waivers */}
      <SectionCard
        title="Waivers"
        subtitle="Amnesty schemes — override the cap or per-day fee if period + filing date qualify"
        onAdd={() => { setWv(EMPTY_WV); setError(''); setModal('add-wv') }}
        addLabel="Add Waiver">
        {rs.waivers.length === 0
          ? <p className="text-xs text-gray-400 p-4">No waivers configured.</p>
          : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Return', 'Period From', 'Period To', 'File By', 'Override', 'Value', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rs.waivers.map((w, i) => (
                  <tr key={w._id ?? i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono font-medium text-slate-900">{w.returnTypeCode}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">{w.periodFrom.slice(0, 10)}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">{w.periodTo.slice(0, 10)}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">{w.fileBy.slice(0, 10)}</td>
                    <td className="px-3 py-2">
                      <Badge color={w.overrideType === 'full' ? 'green' : 'blue'}>{w.overrideType}</Badge>
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {w.overrideType === 'full' ? '—' : w.overrideValue ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {w._id && (
                        <button onClick={() => deleteWaiver(w._id!)}
                          className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </SectionCard>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* Edit Meta */}
      {modal === 'edit-meta' && (
        <Modal title="Edit Rule Set" onClose={close}>
          <form onSubmit={saveMeta} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Effective From" type="date" value={meta.effectiveFrom}
                onChange={v => setMeta(p => ({ ...p, effectiveFrom: v }))} required />
              <Field label="Effective To (blank = in force)" type="date" value={meta.effectiveTo}
                onChange={v => setMeta(p => ({ ...p, effectiveTo: v }))} />
            </div>
            <Field label="Notification Number" value={meta.number}
              onChange={v => setMeta(p => ({ ...p, number: v }))} required />
            <Field label="Title" value={meta.title}
              onChange={v => setMeta(p => ({ ...p, title: v }))} required />
            <Field label="URL" value={meta.url}
              onChange={v => setMeta(p => ({ ...p, url: v }))} />
            <ModalFooter error={error} saving={saving} onCancel={close} />
          </form>
        </Modal>
      )}

      {/* Add Late Fee Rule */}
      {modal === 'add-lf' && (
        <Modal title="Add Late Fee Rule" wide onClose={close}>
          <form onSubmit={addLateFeeRule} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Return Code" value={lf.returnTypeCode}
                onChange={v => setLf(p => ({ ...p, returnTypeCode: v }))}
                placeholder="GSTR-3B" required />
              <Field label="Return Name" value={lf.returnTypeName}
                onChange={v => setLf(p => ({ ...p, returnTypeName: v }))}
                placeholder="GSTR-3B (Monthly)" required />
              <SelectField label="Frequency" value={lf.frequency}
                onChange={v => setLf(p => ({ ...p, frequency: v as LateFeeRule['frequency'] }))}
                options={['monthly', 'quarterly', 'annual', 'event']} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SelectField label="Due Rule Type" value={lf.dueRuleType}
                onChange={v => setLf(p => ({ ...p, dueRuleType: v as LateFeeRule['dueRuleType'] }))}
                options={['dayOfFollowingMonth', 'quarterly', 'annual', 'eventBased']} />
              <NumField label="Due Param (day / MMDD)" value={lf.dueParam ?? ''}
                onChange={v => setLf(p => ({ ...p, dueParam: v === '' ? null : Number(v) }))} />
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={lf.isNil}
                    onChange={e => setLf(p => ({ ...p, isNil: e.target.checked }))}
                    className="w-4 h-4 rounded accent-slate-900" />
                  <span className="text-sm text-gray-700">NIL return track</span>
                </label>
              </div>
            </div>
            <fieldset className="border border-gray-200 rounded-lg p-3">
              <legend className="text-xs font-semibold text-gray-500 uppercase px-1">Turnover Slab</legend>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Field label="Label" value={lf.turnoverSlab.label}
                  onChange={v => setLf(p => ({ ...p, turnoverSlab: { ...p.turnoverSlab, label: v } }))}
                  placeholder="Up to ₹1.5 Cr" required />
                <NumField label="Lower (₹)" value={lf.turnoverSlab.lower}
                  onChange={v => setLf(p => ({ ...p, turnoverSlab: { ...p.turnoverSlab, lower: Number(v) } }))} />
                <NumField label="Upper (₹, blank = and above)" value={lf.turnoverSlab.upper ?? ''}
                  onChange={v => setLf(p => ({ ...p, turnoverSlab: { ...p.turnoverSlab, upper: v === '' ? null : Number(v) } }))} />
              </div>
            </fieldset>
            <div className="grid grid-cols-4 gap-3">
              <NumField label="Per Day CGST (₹)" value={lf.perDayCgst}
                onChange={v => setLf(p => ({ ...p, perDayCgst: Number(v) }))} required />
              <NumField label="Per Day SGST (₹)" value={lf.perDaySgst}
                onChange={v => setLf(p => ({ ...p, perDaySgst: Number(v) }))} required />
              <SelectField label="Cap Type" value={lf.capType}
                onChange={v => setLf(p => ({ ...p, capType: v as LateFeeRule['capType'] }))}
                options={['flat', 'percentOfTurnover', 'none']} />
              <NumField label="Cap Value (₹ or decimal)" value={lf.capValue ?? ''}
                onChange={v => setLf(p => ({ ...p, capValue: v === '' ? null : Number(v) }))} />
            </div>
            <ModalFooter error={error} saving={saving} onCancel={close} />
          </form>
        </Modal>
      )}

      {/* Add Interest Rule */}
      {modal === 'add-ir' && (
        <Modal title="Add Interest Rule" onClose={close}>
          <form onSubmit={addInterestRule} className="space-y-4">
            <SelectField label="Type" value={ir.type}
              onChange={v => setIr(p => ({ ...p, type: v as InterestRule['type'] }))}
              options={['latePayment', 'excessItc']} />
            <div className="grid grid-cols-2 gap-4">
              <NumField label="Annual Rate (%)" value={ir.annualRate}
                onChange={v => setIr(p => ({ ...p, annualRate: Number(v) }))} required />
              <NumField label="Day Basis" value={ir.dayBasis}
                onChange={v => setIr(p => ({ ...p, dayBasis: Number(v) }))} required />
            </div>
            <ModalFooter error={error} saving={saving} onCancel={close} />
          </form>
        </Modal>
      )}

      {/* Add Waiver */}
      {modal === 'add-wv' && (
        <Modal title="Add Waiver" onClose={close}>
          <form onSubmit={addWaiver} className="space-y-4">
            <Field label="Return Type Code" value={wv.returnTypeCode}
              onChange={v => setWv(p => ({ ...p, returnTypeCode: v }))}
              placeholder="GSTR-3B" required />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Period From" type="date" value={wv.periodFrom}
                onChange={v => setWv(p => ({ ...p, periodFrom: v }))} required />
              <Field label="Period To" type="date" value={wv.periodTo}
                onChange={v => setWv(p => ({ ...p, periodTo: v }))} required />
              <Field label="File By" type="date" value={wv.fileBy}
                onChange={v => setWv(p => ({ ...p, fileBy: v }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Override Type" value={wv.overrideType}
                onChange={v => setWv(p => ({ ...p, overrideType: v as Waiver['overrideType'] }))}
                options={['cap', 'perDay', 'full']} />
              <NumField label="Override Value (blank for full waiver)" value={wv.overrideValue ?? ''}
                onChange={v => setWv(p => ({ ...p, overrideValue: v === '' ? null : Number(v) }))} />
            </div>
            <ModalFooter error={error} saving={saving} onCancel={close} />
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionCard({ title, subtitle, onAdd, addLabel, children }: {
  title: string; subtitle: string; onAdd: () => void; addLabel: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-5 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-1 text-xs font-medium text-slate-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
          <Plus size={12} /> {addLabel}
        </button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function Badge({ color, children }: { color: 'blue' | 'orange' | 'green' | 'gray'; children: React.ReactNode }) {
  const cls = {
    blue:   'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    green:  'bg-green-50 text-green-700',
    gray:   'bg-gray-100 text-gray-600',
  }[color]
  return <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>
}

function Modal({ title, onClose, wide, children }: {
  title: string; onClose: () => void; wide?: boolean; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} mt-12 mb-8`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function ModalFooter({ error, saving, onCancel }: { error: string; saving: boolean; onCancel: () => void }) {
  return (
    <>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </>
  )
}

function Field({ label, value, onChange, required, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  required?: boolean; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
    </div>
  )
}

function NumField({ label, value, onChange, required }: {
  label: string; value: number | string; onChange: (v: string) => void; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
