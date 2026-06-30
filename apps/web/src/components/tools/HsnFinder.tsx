'use client'

import { useState, useMemo, useRef } from 'react'
import { Search, Filter, X, Hash, Tag } from 'lucide-react'
import { Card } from '@/components/ui'
import { hsnApi, HsnCodeRecord } from '@/lib/api'

type TypeFilter = '' | 'HSN' | 'SAC'

// ── Inline text highlighter ────────────────────────────────────────────────────

function Hl({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>
  const lower = text.toLowerCase()
  const qi    = q.toLowerCase()
  const idx   = lower.indexOf(qi)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 not-italic rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}

// ── Result card ────────────────────────────────────────────────────────────────

function ResultCard({ r, highlight }: { r: HsnCodeRecord; highlight: string }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3.5 bg-white border border-ink-100 rounded-2xl
                    hover:border-brand-200 hover:shadow-sm transition-all duration-150 group">

      {/* Code chip */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
        <span className="font-mono font-bold text-sm tracking-wider text-ink-800 bg-ink-50
                         group-hover:bg-brand-50 border border-ink-100 group-hover:border-brand-100
                         px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap">
          <Hl text={r.hsnCode} q={highlight} />
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
          r.type === 'HSN'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-purple-100 text-purple-700'
        }`}>
          {r.type}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-800 leading-relaxed font-medium">
          <Hl text={r.description} q={highlight} />
        </p>

        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          <span className="text-xs text-ink-400">
            Ch.&nbsp;<span className="font-mono font-semibold text-ink-600">{r.chapterNumber}</span>
          </span>

          {r.parentCode && (
            <>
              <span className="text-ink-200 select-none">·</span>
              <span className="text-xs text-ink-400">
                Parent&nbsp;<span className="font-mono font-semibold text-ink-600">{r.parentCode}</span>
              </span>
            </>
          )}

          {r.currentRate !== null && (
            <>
              <span className="text-ink-200 select-none">·</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                               bg-brand-50 text-brand-700 border border-brand-100">
                {r.currentRate}% GST
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-2">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-4 py-3.5 bg-white border border-ink-100 rounded-2xl animate-pulse">
          <div className="flex-shrink-0 space-y-1.5">
            <div className="w-16 h-7 bg-ink-100 rounded-xl" />
            <div className="w-10 h-4 bg-ink-100 rounded-full mx-auto" />
          </div>
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 bg-ink-100 rounded-lg" style={{ width: `${55 + (i % 4) * 12}%` }} />
            <div className="h-2.5 bg-ink-50 rounded-lg w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HsnFinder() {
  const [query, setQuery]         = useState('')
  const [typeFilter, setType]     = useState<TypeFilter>('')

  const [results, setResults]     = useState<HsnCodeRecord[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [searched, setSearched]   = useState(false)

  // Client-side secondary filter over fetched results
  const [localQ, setLocalQ]       = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!localQ.trim()) return results
    const q = localQ.toLowerCase()
    return results.filter(r =>
      r.hsnCode.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    )
  }, [results, localQ])

  // The term to highlight — prefer local filter, else original query
  const highlight = localQ || query

  async function runSearch() {
    setLoading(true); setError(''); setSearched(true)
    try {
      const res = await hsnApi.list({
        q:     query.trim() || undefined,
        type:  typeFilter   || undefined,
        limit: 200,
        page:  1,
      })
      setResults(res.data)
      setTotal(res.pagination.total)
      setLocalQ('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed — please try again')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    runSearch()
  }

  const EXAMPLES: [string, TypeFilter][] = [
    ['0101', 'HSN'],
    ['9954', 'SAC'],
    ['live animals', 'HSN'],
    ['construction', 'SAC'],
    ['textile', 'HSN'],
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Search card ──────────────────────────────────────────────────── */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Big input */}
          <div className="relative">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Code (e.g. "0101") or description (e.g. "live animals")…'
              className="w-full input-base pl-11 pr-10 py-3.5 text-[15px]"
              autoComplete="off"
              autoFocus
            />
            {query && (
              <button type="button"
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Type toggle + Search button */}
          <div className="flex items-center justify-between gap-3 flex-wrap">

            <div className="flex items-center gap-1">
              {([
                ['', 'All',          ''],
                ['HSN', 'Goods (HSN)', ''],
                ['SAC', 'Services (SAC)', ''],
              ] as [TypeFilter, string, string][]).map(([t, label]) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    typeFilter === t
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-200'
                      : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
              <Search size={14} />
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>

          {/* Example chips */}
          {!searched && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-xs text-ink-400">Try:</span>
              {EXAMPLES.map(([ex, t]) => (
                <button key={ex} type="button"
                  onClick={() => { setQuery(ex); setType(t) }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-ink-50 border border-ink-100 text-ink-500
                             hover:text-brand-700 hover:border-brand-200 hover:bg-brand-50 transition-colors font-mono">
                  {ex}
                </button>
              ))}
            </div>
          )}
        </form>
      </Card>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {searched && (
        <div className="space-y-3">

          {/* Result toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {loading ? (
                <span className="text-sm text-ink-400">Searching…</span>
              ) : (
                <span className="text-sm font-semibold text-ink-700">
                  {total > 0
                    ? <>
                        {total.toLocaleString()} result{total !== 1 ? 's' : ''}
                        {total > 200 && <span className="text-ink-400 font-normal"> — showing first 200</span>}
                      </>
                    : 'No codes found'}
                </span>
              )}
              {localQ && results.length > 0 && (
                <span className="text-xs bg-ink-100 text-ink-500 px-2 py-0.5 rounded-full">
                  {filtered.length} shown
                </span>
              )}
            </div>

            {/* Secondary (client-side) filter */}
            {results.length > 0 && (
              <div className="relative">
                <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input
                  type="text"
                  value={localQ}
                  onChange={e => setLocalQ(e.target.value)}
                  placeholder="Filter these results…"
                  className="pl-7 pr-7 py-1.5 text-xs bg-white border border-ink-200 rounded-xl
                             outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent
                             transition-all w-48"
                />
                {localQ && (
                  <button onClick={() => setLocalQ('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                    <X size={11} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cards */}
          {loading ? (
            <Skeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mb-4">
                <Hash size={22} className="text-ink-300" />
              </div>
              <p className="text-sm font-semibold text-ink-500">
                {results.length === 0 ? 'No codes found' : 'Nothing matches your filter'}
              </p>
              <p className="text-xs text-ink-400 mt-1">
                {results.length === 0
                  ? 'Try a broader keyword or just the first few digits of the code'
                  : 'Clear the filter to see all loaded results'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(r => (
                <ResultCard key={r._id} r={r} highlight={highlight} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
