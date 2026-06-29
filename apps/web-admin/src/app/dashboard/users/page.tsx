'use client'

import { useEffect, useState, useCallback } from 'react'
import { usersApi, UserRecord, AccountType } from '@/lib/api'
import { Search, UserCircle, Briefcase, Building2, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<AccountType, { label: string; icon: React.ElementType; className: string }> = {
  individual:   { label: 'Individual',   icon: UserCircle, className: 'bg-slate-100 text-slate-600' },
  professional: { label: 'Professional', icon: Briefcase,  className: 'bg-blue-100 text-blue-700' },
  organization: { label: 'Organization', icon: Building2,  className: 'bg-emerald-100 text-emerald-700' },
}

function displayName(u: UserRecord): string {
  if (u.accountType === 'organization') return u.orgName ?? u.email
  if (u.accountType === 'professional') return u.firmName ?? u.displayName ?? u.email
  return u.displayName ?? u.email
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

const LIMIT = 20

export default function UsersPage() {
  const [users, setUsers]         = useState<UserRecord[]>([])
  const [total, setTotal]         = useState(0)
  const [pages, setPages]         = useState(1)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  const [search, setSearch]           = useState('')
  const [debouncedSearch, setDbSearch] = useState('')
  const [typeFilter, setTypeFilter]   = useState<AccountType | ''>('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDbSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await usersApi.list({
        page,
        limit: LIMIT,
        accountType: typeFilter || undefined,
        search: debouncedSearch || undefined,
      })
      setUsers(res.users)
      setTotal(res.total)
      setPages(res.pages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, debouncedSearch])

  useEffect(() => { load() }, [load])

  const typeCount: Record<string, number> = {}
  users.forEach(u => { typeCount[u.accountType] = (typeCount[u.accountType] ?? 0) + 1 })

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total.toLocaleString()} registered account{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(Object.entries(TYPE_META) as [AccountType, typeof TYPE_META[AccountType]][]).map(([type, meta]) => {
          const Icon = meta.icon
          const count = users.filter(u => u.accountType === type).length
          return (
            <button
              key={type}
              onClick={() => { setTypeFilter(t => t === type ? '' : type); setPage(1) }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition
                          ${typeFilter === type ? 'border-slate-700 bg-slate-50' : 'border-transparent bg-white hover:border-gray-200'}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.className}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 leading-none">{total > 0 && debouncedSearch === '' && typeFilter === '' ? '—' : count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{meta.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition"
          />
        </div>

        <div className="flex gap-1.5">
          {[
            { value: '' as const,         label: 'All types' },
            { value: 'individual' as AccountType,   label: 'Individual' },
            { value: 'professional' as AccountType, label: 'Professional' },
            { value: 'organization' as AccountType, label: 'Organization' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setTypeFilter(opt.value as AccountType | ''); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                          ${typeFilter === opt.value
                            ? 'bg-slate-800 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-slate-400'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name / Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Details</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Verified</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3.5" colSpan={5}>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              users.map(u => {
                const meta = TYPE_META[u.accountType] ?? TYPE_META.individual
                const Icon = meta.icon
                const name = displayName(u)
                const showEmail = name !== u.email

                let detail = ''
                if (u.accountType === 'professional' && u.membershipNumber) detail = `Membership: ${u.membershipNumber}`
                if (u.accountType === 'organization' && u.gstin) detail = `GSTIN: ${u.gstin}`
                if (u.accountType === 'organization' && u.pan && !detail) detail = `PAN: ${u.pan}`

                return (
                  <tr key={u._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                    {/* Name / Email */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]">{name}</div>
                      {showEmail && (
                        <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{u.email}</div>
                      )}
                      {u.role === 'superadmin' && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                          superadmin
                        </span>
                      )}
                    </td>

                    {/* Type badge */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.className}`}>
                        <Icon size={11} />
                        {meta.label}
                      </span>
                    </td>

                    {/* Extra details */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {detail
                        ? <span className="text-xs text-gray-500 font-mono">{detail}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>

                    {/* Verified */}
                    <td className="px-5 py-3.5">
                      {u.isVerified
                        ? <CheckCircle size={16} className="text-emerald-500" />
                        : <XCircle    size={16} className="text-gray-300" />
                      }
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-gray-400">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-600 px-2">Page {page} of {pages}</span>
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
