'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { hsnApi, HsnCodeRecord } from '@/lib/api'

const LIMIT_OPTIONS = [200, 300, 500] as const
type TypeFilter = '' | 'HSN' | 'SAC'

// ── Highlight matching text ───────────────────────────────────────────────────

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

// ── TypeBadge ─────────────────────────────────────────────────────────────────

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

interface PopupState {
  text: string
  code: string
  // bounding rect of the description cell
  cellTop:   number
  cellLeft:  number
  cellWidth: number
}

function DescriptionPopup({ popup, onClose }: { popup: PopupState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  // Align the popup over the description cell, push above if it would clip the bottom
  const [pos, setPos] = useState({ top: popup.cellTop, left: popup.cellLeft, width: popup.cellWidth })

  useEffect(() => {
    if (!ref.current) return
    const popupHeight = ref.current.getBoundingClientRect().height
    const vh = window.innerHeight

    let top = popup.cellTop
    // If the popup would overflow the bottom of the viewport, flip it above the cell
    if (top + popupHeight > vh - 12) top = popup.cellTop - popupHeight + 36

    setPos({ top, left: popup.cellLeft, width: popup.cellWidth })
  }, [popup.cellTop, popup.cellLeft, popup.cellWidth])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Invisible backdrop to catch outside clicks */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Floating card — sits right on top of the description cell */}
      <div
        ref={ref}
        style={{
          position: 'fixed',
          top:   pos.top,
          left:  pos.left,
          width: pos.width,
          zIndex: 50,
          boxShadow: [
            '0 1px 2px rgba(0,0,0,0.07)',
            '0 4px 8px rgba(0,0,0,0.10)',
            '0 16px 32px rgba(0,0,0,0.14)',
            '0 32px 56px rgba(0,0,0,0.10)',
            '0 0 0 1px rgba(0,0,0,0.07)',
          ].join(', '),
          animation: 'hsn-popup-in 150ms cubic-bezier(0.22,1,0.36,1) forwards',
        }}
        className="bg-white rounded-2xl overflow-hidden"
      >
        {/* Coloured top bar with code */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800">
          <span className="font-mono font-bold text-white text-sm tracking-widest">{popup.code}</span>
          <button onClick={onClose}
            className="text-slate-400 hover:text-white transition ml-4 flex-shrink-0">
            <X size={14} />
          </button>
        </div>

        {/* Description body */}
        <div className="px-4 py-4">
          <p className="text-gray-800 text-sm leading-relaxed">{popup.text}</p>
        </div>
      </div>

      {/* Keyframe injected once via a style tag */}
      <style>{`
        @keyframes hsn-popup-in {
          from { opacity: 0; transform: scale(0.93) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HsnPage() {
  // Search form
  const [query, setQuery]     = useState('')
  const [typeFilter, setType] = useState<TypeFilter>('')
  const [limit, setLimit]     = useState<200 | 300 | 500>(200)

  // Results
  const [results, setResults]     = useState<HsnCodeRecord[]>([])
  const [pagination, setPag]      = useState<{ total: number; pages: number; page: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // Client-side secondary filter
  const [localQ, setLocalQ] = useState('')

  // Description popup
  const [popup, setPopup] = useState<PopupState | null>(null)

  const openPopup = useCallback((e: React.MouseEvent, r: HsnCodeRecord) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopup({
      text:      r.description,
      code:      r.hsnCode,
      cellTop:   rect.top,
      cellLeft:  rect.left,
      cellWidth: rect.width,
    })
  }, [])

  const filtered = useMemo(() => {
    if (!localQ.trim()) return results
    const q = localQ.toLowerCase()
    return results.filter(r =>
      r.hsnCode.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    )
  }, [results, localQ])

  async function fetchPage(p: number) {
    setLoading(true)
    setError('')
    try {
      const res = await hsnApi.list({
        q:     query.trim() || undefined,
        type:  typeFilter   || undefined,
        page:  p,
        limit,
      })
      setResults(res.data)
      setPag({ total: res.pagination.total, pages: res.pagination.pages, page: res.pagination.page })
      setCurrentPage(p)
      setLocalQ('')
      setHasSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    fetchPage(1)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">HSN / SAC Codes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Search the master database by code number or description</p>
      </div>

      {/* ── Search card ──────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-5 mb-5 space-y-4">

        {/* Main input */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter an HSN/SAC code (e.g. 0101) or description keyword (e.g. live animals)…"
            className="w-full pl-10 pr-10 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-slate-500 focus:bg-white transition"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-4">

          {/* Type toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-medium mr-1">Type:</span>
            {(['', 'HSN', 'SAC'] as TypeFilter[]).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  typeFilter === t
                    ? 'bg-slate-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {t === '' ? 'All' : t}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {/* Row limit */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-medium mr-1">Rows per fetch:</span>
            {LIMIT_OPTIONS.map(n => (
              <button key={n} type="button" onClick={() => setLimit(n)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  limit === n
                    ? 'bg-slate-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {n}
              </button>
            ))}
          </div>

          {/* Search button */}
          <button type="submit" disabled={loading}
            className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-60 transition">
            <Search size={14} />
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Results panel ─────────────────────────────────────────────────────── */}
      {hasSearched && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* Results toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">
                {loading
                  ? 'Loading…'
                  : pagination
                    ? `${pagination.total.toLocaleString()} result${pagination.total !== 1 ? 's' : ''}`
                    : '—'}
              </span>
              {localQ.trim() && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {filtered.length} of {results.length} shown
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {/* Secondary (client-side) filter */}
              {results.length > 0 && (
                <div className="relative">
                  <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={localQ}
                    onChange={e => setLocalQ(e.target.value)}
                    placeholder="Filter these results…"
                    className="pl-7 pr-8 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-slate-400 transition w-52"
                  />
                  {localQ && (
                    <button onClick={() => setLocalQ('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      <X size={11} />
                    </button>
                  )}
                </div>
              )}
              <button onClick={() => fetchPage(currentPage)}
                className="p-1.5 text-gray-400 hover:text-gray-700 transition">
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
                </tr>
              </thead>
              <tbody>
                {loading && results.length === 0 ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3.5" colSpan={7}>
                        <div className="h-3.5 bg-gray-100 rounded animate-pulse"
                          style={{ width: `${50 + (i % 5) * 10}%` }} />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-gray-400 text-sm">
                      {results.length === 0
                        ? 'No results found — try a different keyword or code'
                        : 'No results match your filter'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r._id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition">

                      {/* Code — monospace, prominent */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 text-sm tracking-wide">
                          <Highlight text={r.hsnCode} query={localQ} />
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <TypeBadge type={r.type} />
                      </td>

                      {/* Description — double-click to expand */}
                      <td className="px-4 py-3 text-gray-700 max-w-xs lg:max-w-md">
                        <span
                          onDoubleClick={e => openPopup(e, r)}
                          title="Double-click to read full description"
                          className="line-clamp-2 text-sm leading-relaxed cursor-pointer select-none
                                     hover:text-slate-900 transition-colors"
                        >
                          <Highlight text={r.description} query={localQ} />
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {r.chapterNumber}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.parentCode
                          ? <span className="font-mono text-xs text-gray-400">{r.parentCode}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.currentRate !== null
                          ? (
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800">
                              {r.currentRate}
                              <span className="text-xs font-normal text-gray-400">%</span>
                            </span>
                          )
                          : <span className="text-gray-300 text-xs">not set</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.deletedAt
                          ? <span className="text-xs text-red-500 font-medium">Deleted</span>
                          : r.active
                            ? <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Active
                              </span>
                            : <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />Inactive
                              </span>}
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
                <button
                  disabled={currentPage <= 1 || loading}
                  onClick={() => fetchPage(currentPage - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-gray-600 px-3 font-medium">Page {currentPage}</span>
                <button
                  disabled={currentPage >= pagination.pages || loading}
                  onClick={() => fetchPage(currentPage + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {popup && <DescriptionPopup popup={popup} onClose={() => setPopup(null)} />}
    </div>
  )
}
