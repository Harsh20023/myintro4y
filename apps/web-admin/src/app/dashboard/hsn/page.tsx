'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Search, Filter, RefreshCw, ChevronLeft, ChevronRight, X,
  Plus, Pencil, Trash2, RotateCcw, AlertTriangle, History,
  CheckCircle2, PenLine, Trash, Undo2, ChevronDown,
} from 'lucide-react'
import { hsnApi, HsnCodeRecord, HsnTaxDetail, CreateHsnPayload, HsnHistoryEntry, HsnAction } from '@/lib/api'

const LIMIT_OPTIONS = [200, 300, 500] as const
type TypeFilter = '' | 'HSN' | 'SAC'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function TypeBadge({ type }: { type: 'HSN' | 'SAC' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wide ${
      type === 'HSN' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
    }`}>
      {type}
    </span>
  )
}

// ── Description popup (double-click) ─────────────────────────────────────────

interface PopupState { text: string; code: string; cellTop: number; cellLeft: number; cellWidth: number }

function DescriptionPopup({ popup, onClose }: { popup: PopupState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: popup.cellTop, left: popup.cellLeft, width: popup.cellWidth })

  useEffect(() => {
    if (!ref.current) return
    const h = ref.current.getBoundingClientRect().height
    const vh = window.innerHeight
    let top = popup.cellTop
    if (top + h > vh - 12) top = popup.cellTop - h + 36
    setPos({ top, left: popup.cellLeft, width: popup.cellWidth })
  }, [popup.cellTop, popup.cellLeft, popup.cellWidth])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div ref={ref} style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 50,
        boxShadow: '0 4px 24px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.07)',
        animation: 'hsn-popup-in 150ms cubic-bezier(0.22,1,0.36,1) forwards' }}
        className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800">
          <span className="font-mono font-bold text-white text-sm tracking-widest">{popup.code}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition ml-4"><X size={14} /></button>
        </div>
        <div className="px-4 py-4"><p className="text-gray-800 text-sm leading-relaxed">{popup.text}</p></div>
      </div>
      <style>{`@keyframes hsn-popup-in { from { opacity:0; transform:scale(0.93) translateY(6px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>
    </>
  )
}

// ── Confirm Delete Modal ───────────────────────────────────────────────────────

function ConfirmDeleteModal({
  code, onCancel, onConfirm, loading,
}: { code: string; onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Soft-delete HSN/SAC code</p>
            <p className="text-xs text-gray-500 mt-0.5">Code: <span className="font-mono font-bold">{code}</span></p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          This will mark the code as deleted and set it to inactive. It can be restored later.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-60">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tax Details Editor ────────────────────────────────────────────────────────

function TaxDetailsEditor({
  value, onChange,
}: { value: HsnTaxDetail[]; onChange: (v: HsnTaxDetail[]) => void }) {
  function addRow() {
    onChange([...value, { rateOfTax: 0, effectiveDate: new Date().toISOString().slice(0, 10), description: '' }])
  }
  function updateRow(i: number, field: keyof HsnTaxDetail, v: string) {
    const next = value.map((r, idx) =>
      idx === i ? { ...r, [field]: field === 'rateOfTax' ? Number(v) : v } : r
    )
    onChange(next)
  }
  function removeRow(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tax History</label>
        <button type="button" onClick={addRow}
          className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition">
          <Plus size={12} /> Add entry
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
          No tax history entries
        </p>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {value.map((row, i) => (
            <div key={i} className="grid grid-cols-[80px_120px_1fr_24px] gap-2 items-start">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Rate (%)</p>
                <input type="number" step="0.01" value={row.rateOfTax}
                  onChange={e => updateRow(i, 'rateOfTax', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Effective date</p>
                <input type="date"
                  value={row.effectiveDate ? row.effectiveDate.slice(0, 10) : ''}
                  onChange={e => updateRow(i, 'effectiveDate', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Description</p>
                <input type="text" value={row.description}
                  onChange={e => updateRow(i, 'description', e.target.value)}
                  placeholder="Rate description"
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition" />
              </div>
              <button type="button" onClick={() => removeRow(i)}
                className="mt-5 text-gray-300 hover:text-red-500 transition">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── History Panel ─────────────────────────────────────────────────────────────

const ACTION_META: Record<HsnAction, { label: string; color: string; Icon: React.ElementType }> = {
  created:  { label: 'Created',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  updated:  { label: 'Updated',  color: 'bg-blue-100    text-blue-700    border-blue-200',    Icon: PenLine      },
  deleted:  { label: 'Deleted',  color: 'bg-red-100     text-red-700     border-red-200',     Icon: Trash        },
  restored: { label: 'Restored', color: 'bg-amber-100   text-amber-700   border-amber-200',   Icon: Undo2        },
}

const FIELD_LABELS: Record<string, string> = {
  type: 'Type', description: 'Description', chapterNumber: 'Chapter', parentCode: 'Parent code',
  currentRate: 'Rate (%)', currentRateEffectiveDate: 'Rate effective date',
  taxDetails: 'Tax history', active: 'Active', deletedAt: 'Deleted at',
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (field === 'taxDetails' && Array.isArray(value)) return `[${value.length} entries]`
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return String(value)
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function HistoryEntry({ entry, isFirst }: { entry: HsnHistoryEntry; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(isFirst)
  const { label, color, Icon } = ACTION_META[entry.action]

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center
        ${entry.action === 'created'  ? 'bg-emerald-500 border-emerald-500' :
          entry.action === 'updated'  ? 'bg-blue-500    border-blue-500'    :
          entry.action === 'deleted'  ? 'bg-red-500     border-red-500'     :
                                        'bg-amber-500   border-amber-500'}`}>
        <Icon size={8} className="text-white" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header row */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/50 transition"
        >
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
            <Icon size={11} /> {label}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{fmtTime(entry.changedAt)}</p>
            <p className="text-xs text-gray-400 truncate">by {entry.changedBy}</p>
          </div>
          {entry.diff.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
              {entry.diff.length} field{entry.diff.length !== 1 ? 's' : ''} changed
            </span>
          )}
          <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Expanded body */}
        {expanded && (
          <div className="border-t border-gray-100">
            {/* Diff */}
            {entry.diff.length > 0 && (
              <div className="px-4 py-3 space-y-2.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Changes</p>
                {entry.diff.map(d => (
                  <div key={d.field} className="grid grid-cols-[120px_1fr_1fr] gap-2 items-start text-xs">
                    <span className="font-medium text-gray-700 pt-0.5">{FIELD_LABELS[d.field] ?? d.field}</span>
                    <div className="bg-red-50 border border-red-100 rounded px-2 py-1.5 font-mono text-red-700 break-all leading-relaxed">
                      <span className="text-[10px] text-red-400 block mb-0.5">Before</span>
                      {formatValue(d.field, d.from)}
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5 font-mono text-emerald-700 break-all leading-relaxed">
                      <span className="text-[10px] text-emerald-400 block mb-0.5">After</span>
                      {formatValue(d.field, d.to)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Snapshot */}
            <div className="px-4 py-3 bg-gray-50/60 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Snapshot at this point</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                {([
                  ['Code',        entry.snapshot.hsnCode],
                  ['Type',        entry.snapshot.type],
                  ['Chapter',     entry.snapshot.chapterNumber],
                  ['Parent',      entry.snapshot.parentCode ?? '—'],
                  ['Rate',        entry.snapshot.currentRate !== null ? `${entry.snapshot.currentRate}%` : '—'],
                  ['Active',      entry.snapshot.active ? 'Yes' : 'No'],
                  ['Tax entries', String((entry.snapshot.taxDetails ?? []).length)],
                  ['Deleted at',  entry.snapshot.deletedAt ? fmtTime(entry.snapshot.deletedAt as string) : '—'],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label} className="flex items-start gap-1.5">
                    <span className="text-gray-400 w-24 flex-shrink-0">{label}</span>
                    <span className="text-gray-700 font-mono break-all">{val}</span>
                  </div>
                ))}
              </div>
              {entry.snapshot.description && (
                <div className="mt-2">
                  <span className="text-gray-400 text-xs">Description</span>
                  <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{entry.snapshot.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryPanel({ code, onClose }: { code: string; onClose: () => void }) {
  const [entries, setEntries] = useState<HsnHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    hsnApi.getHistory(code)
      .then(setEntries)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load history'))
      .finally(() => setLoading(false))
  }, [code])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] bg-gray-50 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200 flex-shrink-0">
          <div>
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <History size={16} className="text-gray-400" />
              History — <span className="font-mono text-slate-800">{code}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Full audit trail of all changes to this code</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={18} /></button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="pl-8">
                  <div className="h-14 bg-white rounded-xl border border-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <History size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No history yet for this code.</p>
              <p className="text-xs text-gray-300 mt-1">Changes will appear here after edits are saved.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
              <div className="space-y-4">
                {entries.map((e, i) => <HistoryEntry key={e._id} entry={e} isFirst={i === 0} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── HSN Form Modal (create + edit) ────────────────────────────────────────────

const EMPTY_FORM: CreateHsnPayload = {
  hsnCode: '', type: 'HSN', description: '', chapterNumber: '',
  parentCode: '', currentRate: null, currentRateEffectiveDate: null,
  taxDetails: [], active: true,
}

function HsnFormModal({
  initial, onClose, onSaved,
}: {
  initial?: HsnCodeRecord
  onClose: () => void
  onSaved: (r: HsnCodeRecord) => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<CreateHsnPayload>(
    initial
      ? {
          hsnCode: initial.hsnCode,
          type: initial.type,
          description: initial.description,
          chapterNumber: initial.chapterNumber,
          parentCode: initial.parentCode ?? '',
          currentRate: initial.currentRate,
          currentRateEffectiveDate: initial.currentRateEffectiveDate
            ? initial.currentRateEffectiveDate.slice(0, 10)
            : null,
          taxDetails: initial.taxDetails ?? [],
          active: initial.active,
        }
      : { ...EMPTY_FORM }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = <K extends keyof CreateHsnPayload>(k: K, v: CreateHsnPayload[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const payload = {
        ...form,
        parentCode: form.parentCode?.trim() || null,
        currentRate: form.currentRate === null || String(form.currentRate) === '' ? null : Number(form.currentRate),
        currentRateEffectiveDate: form.currentRateEffectiveDate?.trim() || null,
      }
      let result: HsnCodeRecord
      if (isEdit) {
        const { hsnCode: _code, ...body } = payload
        result = await hsnApi.update(initial.hsnCode, body)
      } else {
        result = await hsnApi.create(payload)
      }
      onSaved(result)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">{isEdit ? `Edit — ${initial.hsnCode}` : 'New HSN/SAC Code'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Row 1: code + type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                HSN/SAC Code <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.hsnCode} required
                disabled={isEdit}
                onChange={e => set('hsnCode', e.target.value.trim())}
                placeholder="e.g. 0101"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition disabled:bg-gray-50 disabled:text-gray-400 font-mono" />
              {isEdit && <p className="text-[10px] text-gray-400 mt-1">Code cannot be changed after creation.</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Type <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2 mt-1">
                {(['HSN', 'SAC'] as const).map(t => (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition ${
                      form.type === t ? 'border-slate-700 bg-slate-800 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea value={form.description} required rows={3}
              onChange={e => set('description', e.target.value)}
              placeholder="Full description of the goods/services"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition resize-none" />
          </div>

          {/* Row 2: chapter + parent */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Chapter Number <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.chapterNumber} required
                onChange={e => set('chapterNumber', e.target.value.trim())}
                placeholder="e.g. 01"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Parent Code <span className="font-normal text-gray-400 tracking-normal normal-case">(optional)</span>
              </label>
              <input type="text" value={form.parentCode ?? ''}
                onChange={e => set('parentCode', e.target.value.trim() || null)}
                placeholder="e.g. 0101"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition font-mono" />
            </div>
          </div>

          {/* Row 3: current rate + effective date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Current Rate (%) <span className="font-normal text-gray-400 tracking-normal normal-case">(optional)</span>
              </label>
              <input type="number" step="0.01" min="0"
                value={form.currentRate === null ? '' : form.currentRate}
                onChange={e => set('currentRate', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 18"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Rate Effective Date <span className="font-normal text-gray-400 tracking-normal normal-case">(optional)</span>
              </label>
              <input type="date"
                value={form.currentRateEffectiveDate ?? ''}
                onChange={e => set('currentRateEffectiveDate', e.target.value || null)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition" />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-800">Active</p>
              <p className="text-xs text-gray-400">Inactive codes are excluded from default searches.</p>
            </div>
            <button type="button" onClick={() => set('active', !form.active)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-slate-900' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Tax details */}
          <TaxDetailsEditor
            value={form.taxDetails ?? []}
            onChange={v => set('taxDetails', v)}
          />
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-60">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="px-5 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition disabled:opacity-60">
            {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create code')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HsnPage() {
  const [query, setQuery]     = useState('')
  const [typeFilter, setType] = useState<TypeFilter>('')
  const [limit, setLimit]     = useState<200 | 300 | 500>(200)
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const [results, setResults]         = useState<HsnCodeRecord[]>([])
  const [pagination, setPag]          = useState<{ total: number; pages: number; page: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const [localQ, setLocalQ] = useState('')
  const [popup, setPopup]   = useState<PopupState | null>(null)

  const [showCreate, setShowCreate]       = useState(false)
  const [editing, setEditing]             = useState<HsnCodeRecord | null>(null)
  const [deleting, setDeleting]           = useState<HsnCodeRecord | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionError, setActionError]     = useState('')
  const [historyCode, setHistoryCode]     = useState<string | null>(null)

  const openPopup = useCallback((e: React.MouseEvent, r: HsnCodeRecord) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopup({ text: r.description, code: r.hsnCode, cellTop: rect.top, cellLeft: rect.left, cellWidth: rect.width })
  }, [])

  const filtered = useMemo(() => {
    if (!localQ.trim()) return results
    const q = localQ.toLowerCase()
    return results.filter(r => r.hsnCode.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
  }, [results, localQ])

  async function fetchPage(p: number) {
    setLoading(true); setError('')
    try {
      const res = await hsnApi.list({
        q: query.trim() || undefined,
        type: typeFilter || undefined,
        page: p, limit,
        includeDeleted: includeDeleted || undefined,
      })
      setResults(res.data)
      setPag({ total: res.pagination.total, pages: res.pagination.pages, page: res.pagination.page })
      setCurrentPage(p)
      setLocalQ('')
      setHasSearched(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to fetch') }
    finally { setLoading(false) }
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); fetchPage(1) }

  function onSaved(record: HsnCodeRecord) {
    if (editing) {
      setResults(prev => prev.map(r => r._id === record._id ? record : r))
      setEditing(null)
    } else {
      setShowCreate(false)
      if (hasSearched) fetchPage(currentPage)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true); setActionError('')
    try {
      await hsnApi.remove(deleting.hsnCode)
      setResults(prev => prev.map(r => r._id === deleting._id
        ? { ...r, deletedAt: new Date().toISOString(), active: false }
        : r))
      setDeleting(null)
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Delete failed') }
    finally { setDeleteLoading(false) }
  }

  async function handleRestore(record: HsnCodeRecord) {
    setActionError('')
    try {
      const restored = await hsnApi.restore(record.hsnCode)
      setResults(prev => prev.map(r => r._id === restored._id ? restored : r))
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Restore failed') }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">HSN / SAC Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Search, create and edit HSN/SAC code records</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition">
          <Plus size={15} /> New Code
        </button>
      </div>

      {/* Search card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 mb-5 space-y-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Enter an HSN/SAC code (e.g. 0101) or description keyword (e.g. live animals)…"
            className="w-full pl-10 pr-10 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-slate-500 focus:bg-white transition" />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-medium mr-1">Type:</span>
            {(['', 'HSN', 'SAC'] as TypeFilter[]).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  typeFilter === t ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {t === '' ? 'All' : t}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {/* Limit */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-medium mr-1">Rows per fetch:</span>
            {LIMIT_OPTIONS.map(n => (
              <button key={n} type="button" onClick={() => setLimit(n)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  limit === n ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {n}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {/* Include deleted toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={includeDeleted} onChange={e => setIncludeDeleted(e.target.checked)}
              className="accent-slate-800 w-3.5 h-3.5" />
            <span className="text-xs text-gray-500 font-medium">Include deleted</span>
          </label>

          <button type="submit" disabled={loading}
            className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-60 transition">
            <Search size={14} />
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {actionError && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{actionError}</div>}

      {/* Results panel */}
      {hasSearched && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">
                {loading ? 'Loading…' : pagination ? `${pagination.total.toLocaleString()} result${pagination.total !== 1 ? 's' : ''}` : '—'}
              </span>
              {localQ.trim() && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {filtered.length} of {results.length} shown
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {results.length > 0 && (
                <div className="relative">
                  <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="text" value={localQ} onChange={e => setLocalQ(e.target.value)}
                    placeholder="Filter these results…"
                    className="pl-7 pr-8 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-slate-400 transition w-52" />
                  {localQ && (
                    <button onClick={() => setLocalQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      <X size={11} />
                    </button>
                  )}
                </div>
              )}
              <button onClick={() => fetchPage(currentPage)} className="p-1.5 text-gray-400 hover:text-gray-700 transition">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Chapter</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Parent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && results.length === 0 ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3.5" colSpan={8}>
                        <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: `${50 + (i % 5) * 10}%` }} />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center text-gray-400 text-sm">
                      {results.length === 0 ? 'No results found — try a different keyword or code' : 'No results match your filter'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r._id}
                      className={`border-b border-gray-50 last:border-0 transition ${r.deletedAt ? 'bg-red-50/30 opacity-60' : 'hover:bg-gray-50/60'}`}>

                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 text-sm tracking-wide">
                          <Highlight text={r.hsnCode} query={localQ} />
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap"><TypeBadge type={r.type} /></td>

                      <td className="px-4 py-3 text-gray-700 max-w-xs lg:max-w-md">
                        <span onDoubleClick={e => openPopup(e, r)} title="Double-click to read full description"
                          className="line-clamp-2 text-sm leading-relaxed cursor-pointer select-none hover:text-slate-900 transition-colors">
                          <Highlight text={r.description} query={localQ} />
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{r.chapterNumber}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.parentCode ? <span className="font-mono text-xs text-gray-400">{r.parentCode}</span> : <span className="text-gray-300 text-xs">—</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.currentRate !== null
                          ? <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800">{r.currentRate}<span className="text-xs font-normal text-gray-400">%</span></span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.deletedAt
                          ? <span className="text-xs text-red-500 font-medium">Deleted</span>
                          : r.active
                            ? <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Active</span>
                            : <span className="inline-flex items-center gap-1.5 text-xs text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />Inactive</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setHistoryCode(r.hsnCode)} title="View history"
                            className="p-1.5 text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg transition">
                            <History size={13} />
                          </button>
                          {r.deletedAt ? (
                            <button onClick={() => handleRestore(r)} title="Restore"
                              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-400 px-2 py-1 rounded-lg transition">
                              <RotateCcw size={11} /> Restore
                            </button>
                          ) : (
                            <>
                              <button onClick={() => setEditing(r)} title="Edit"
                                className="p-1.5 text-gray-400 hover:text-slate-700 border border-gray-200 hover:border-slate-400 rounded-lg transition">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => { setActionError(''); setDeleting(r) }} title="Delete"
                                className="p-1.5 text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded-lg transition">
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Page {currentPage} of {pagination.pages} · {pagination.total.toLocaleString()} total records
              </span>
              <div className="flex items-center gap-1.5">
                <button disabled={currentPage <= 1 || loading} onClick={() => fetchPage(currentPage - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-gray-600 px-3 font-medium">Page {currentPage}</span>
                <button disabled={currentPage >= pagination.pages || loading} onClick={() => fetchPage(currentPage + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals & panels */}
      {showCreate && <HsnFormModal onClose={() => setShowCreate(false)} onSaved={onSaved} />}
      {editing    && <HsnFormModal initial={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
      {deleting   && (
        <ConfirmDeleteModal
          code={deleting.hsnCode}
          loading={deleteLoading}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
      {historyCode && <HistoryPanel code={historyCode} onClose={() => setHistoryCode(null)} />}
      {popup && <DescriptionPopup popup={popup} onClose={() => setPopup(null)} />}
    </div>
  )
}
