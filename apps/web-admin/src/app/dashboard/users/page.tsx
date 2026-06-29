'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  usersApi, membershipsApi,
  UserRecord, MembershipRecord, AccountType, CreateUserPayload,
} from '@/lib/api'
import {
  Search, UserCircle, Briefcase, Building2,
  ChevronLeft, ChevronRight, RefreshCw,
  CheckCircle, XCircle, Plus, X, Link2, Trash2,
  Copy, Check, Eye, EyeOff,
  GitFork,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const LIMIT = 20

const TYPE_META: Record<AccountType, { label: string; Icon: React.ElementType; pill: string }> = {
  individual:   { label: 'Individual',   Icon: UserCircle, pill: 'bg-slate-100 text-slate-600' },
  professional: { label: 'Professional', Icon: Briefcase,  pill: 'bg-blue-100  text-blue-700'  },
  organization: { label: 'Organization', Icon: Building2,  pill: 'bg-emerald-100 text-emerald-700' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function userName(u: UserRecord) {
  if (u.accountType === 'organization') return u.orgName  ?? u.email
  if (u.accountType === 'professional') return u.firmName ?? u.displayName ?? u.email
  return u.displayName ?? u.email
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── TypeBadge ─────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AccountType }) {
  const { label, Icon, pill } = TYPE_META[type] ?? TYPE_META.individual
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${pill}`}>
      <Icon size={11} /> {label}
    </span>
  )
}

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="ml-2 text-gray-400 hover:text-gray-700 transition"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', placeholder, required, optional,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean; optional?: boolean
}) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label} {optional && <span className="normal-case font-normal text-gray-400 tracking-normal">(optional)</span>}
      </label>
      <div className="relative">
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition"
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Create User Modal ─────────────────────────────────────────────────────────

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep]             = useState<0 | 1>(0)
  const [accountType, setType]      = useState<AccountType>('individual')
  const [form, setForm]             = useState({ email: '', displayName: '', firmName: '', membershipNumber: '', orgName: '', pan: '', gstin: '', phone: '' })
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [created, setCreated]       = useState<{ user: UserRecord; tempPassword: string } | null>(null)

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const payload: CreateUserPayload = { email: form.email, accountType }
      if (accountType === 'individual'   && form.displayName)      payload.displayName      = form.displayName
      if (accountType === 'professional' && form.firmName)         payload.firmName         = form.firmName
      if (accountType === 'professional' && form.membershipNumber) payload.membershipNumber = form.membershipNumber
      if (accountType === 'organization')                          payload.orgName          = form.orgName
      if (form.pan)   payload.pan   = form.pan
      if (form.gstin) payload.gstin = form.gstin
      if (form.phone) payload.phone = form.phone
      const res = await usersApi.create(payload)
      setCreated(res)
      onCreated()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  if (created) return (
    <Modal title="User created" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
          Account created and auto-verified.
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Email</p>
          <div className="flex items-center font-mono text-sm text-gray-900">
            {created.user.email} <CopyButton text={created.user.email} />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Temporary password — share with the user</p>
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg font-mono text-sm text-amber-900">
            {created.tempPassword} <CopyButton text={created.tempPassword} />
          </div>
        </div>
        <button onClick={onClose}
          className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition">
          Done
        </button>
      </div>
    </Modal>
  )

  return (
    <Modal title={step === 0 ? 'Choose account type' : 'User details'} onClose={onClose}>
      {step === 0 ? (
        <div className="space-y-2.5">
          {(Object.entries(TYPE_META) as [AccountType, typeof TYPE_META[AccountType]][]).map(([t, m]) => (
            <button key={t} type="button"
              onClick={() => { setType(t); setStep(1) }}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-100 hover:border-slate-400 text-left transition">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.pill}`}>
                <m.Icon size={17} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t === 'individual'   && 'Personal account for a single user'}
                  {t === 'professional' && 'CA / firm managing multiple clients'}
                  {t === 'organization' && 'Company or business entity'}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          <div className="flex items-center gap-2 mb-1">
            <button type="button" onClick={() => setStep(0)} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
              <ChevronLeft size={12} /> Back
            </button>
            <TypeBadge type={accountType} />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

          {accountType === 'individual' && (
            <Field label="Full Name" value={form.displayName} onChange={set('displayName')} placeholder="Rahul Sharma" optional />
          )}
          {accountType === 'professional' && <>
            <Field label="Firm / Practice Name" value={form.firmName} onChange={set('firmName')} placeholder="Sharma & Associates" optional />
            <Field label="Membership Number" value={form.membershipNumber} onChange={set('membershipNumber')} placeholder="ICAI number" optional />
          </>}
          {accountType === 'organization' && <>
            <Field label="Organisation Name" value={form.orgName} onChange={set('orgName')} placeholder="Acme Pvt Ltd" required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="PAN" value={form.pan} onChange={v => set('pan')(v.toUpperCase())} placeholder="AABCA1234Z" optional />
              <Field label="GSTIN" value={form.gstin} onChange={v => set('gstin')(v.toUpperCase())} placeholder="27AABCA…" optional />
            </div>
          </>}

          <Field label="Email" value={form.email} onChange={set('email')} type="email" placeholder="user@example.com" required />
          <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" optional />

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-60 transition">
            {loading ? 'Creating…' : 'Create user'}
          </button>
        </form>
      )}
    </Modal>
  )
}

// ── Assign Modal ──────────────────────────────────────────────────────────────

function AssignModal({
  user, allUsers, onClose, onAssigned,
}: {
  user: UserRecord
  allUsers: UserRecord[]
  onClose: () => void
  onAssigned: () => void
}) {
  const [targetId, setTargetId] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Determine valid targets based on member's accountType
  const validTargets = allUsers.filter(u => {
    if (u._id === user._id) return false
    if (user.accountType === 'individual')   return u.accountType === 'organization' || u.accountType === 'professional'
    if (user.accountType === 'organization') return u.accountType === 'professional'
    return false
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!targetId) return
    setError(''); setLoading(true)
    try {
      await membershipsApi.create(user._id, targetId)
      onAssigned(); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  const allowed =
    user.accountType === 'individual'   ? 'organization or professional' :
    user.accountType === 'organization' ? 'professional' : ''

  return (
    <Modal title={`Assign ${userName(user)}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-xs text-gray-500">
          Assigning a <strong>{user.accountType}</strong> — valid targets: <strong>{allowed}</strong>
        </p>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

        {validTargets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No valid targets available. Create an organization or professional account first.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {validTargets.map(t => (
              <label key={t._id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition
                            ${targetId === t._id ? 'border-slate-700 bg-slate-50' : 'border-gray-100 hover:border-gray-300'}`}>
                <input type="radio" name="target" value={t._id}
                  checked={targetId === t._id} onChange={() => setTargetId(t._id)}
                  className="accent-slate-800" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{userName(t)}</p>
                  <p className="text-xs text-gray-400 truncate">{t.email}</p>
                </div>
                <TypeBadge type={t.accountType} />
              </label>
            ))}
          </div>
        )}

        {validTargets.length > 0 && (
          <button type="submit" disabled={!targetId || loading}
            className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-60 transition">
            {loading ? 'Assigning…' : 'Confirm assignment'}
          </button>
        )}
      </form>
    </Modal>
  )
}

// ── User Detail Panel ─────────────────────────────────────────────────────────

function DetailPanel({
  user, allUsers, onClose, onAction,
}: {
  user: UserRecord
  allUsers: UserRecord[]
  onClose: () => void
  onAction: () => void
}) {
  const [memberships, setMemberships] = useState<MembershipRecord[]>([])
  const [loadingM, setLoadingM]       = useState(true)
  const [showAssign, setShowAssign]   = useState(false)

  const load = useCallback(async () => {
    setLoadingM(true)
    try {
      // fetch both as-member and as-target
      const [asMember, asTarget] = await Promise.all([
        membershipsApi.list({ memberId: user._id }),
        membershipsApi.list({ targetId: user._id }),
      ])
      setMemberships([...asMember, ...asTarget])
    } catch { /* ignore */ }
    finally { setLoadingM(false) }
  }, [user._id])

  useEffect(() => { load() }, [load])

  async function removeAssignment(id: string) {
    await membershipsApi.remove(id)
    load(); onAction()
  }

  const asOutgoing = memberships.filter(m => m.memberId._id === user._id)
  const asIncoming = memberships.filter(m => m.targetId._id === user._id)

  const canAssign = user.accountType === 'individual' || user.accountType === 'organization'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[420px] bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <TypeBadge type={user.accountType} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition flex-shrink-0"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* User info */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-2">
            <p className="font-semibold text-gray-900">{userName(user)}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.accountType === 'organization' && (
              <div className="flex flex-wrap gap-3 pt-1">
                {user.pan   && <span className="text-xs font-mono text-gray-600">PAN: {user.pan}</span>}
                {user.gstin && <span className="text-xs font-mono text-gray-600">GSTIN: {user.gstin}</span>}
              </div>
            )}
            {user.accountType === 'professional' && user.membershipNumber && (
              <p className="text-xs font-mono text-gray-600">Membership: {user.membershipNumber}</p>
            )}
            <div className="flex items-center gap-2 pt-1">
              {user.isVerified
                ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle size={12} /> Verified</span>
                : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><XCircle size={12} /> Unverified</span>
              }
              <span className="text-xs text-gray-400">· Joined {fmt(user.createdAt)}</span>
            </div>
          </div>

          {/* Outgoing assignments (where this user is a member) */}
          {canAssign && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {user.accountType === 'individual' ? 'Assigned to' : 'Managed by'}
                </p>
                <button
                  onClick={() => setShowAssign(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                >
                  <Plus size={12} /> Assign
                </button>
              </div>

              {loadingM ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : asOutgoing.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
                  Not assigned to any {user.accountType === 'individual' ? 'organization or professional' : 'professional'} yet
                </p>
              ) : (
                <div className="space-y-2">
                  {asOutgoing.map(m => (
                    <div key={m._id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                      <Link2 size={13} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{userName(m.targetId)}</p>
                        <p className="text-xs text-gray-400 truncate">{m.targetId.email}</p>
                      </div>
                      <TypeBadge type={m.targetId.accountType} />
                      <button onClick={() => removeAssignment(m._id)}
                        className="text-gray-300 hover:text-red-500 transition flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Incoming (who is assigned TO this user) */}
          {(user.accountType === 'organization' || user.accountType === 'professional') && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
                {user.accountType === 'organization' ? 'Members' : 'Clients'}
              </p>
              {loadingM ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : asIncoming.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
                  No {user.accountType === 'organization' ? 'members' : 'clients'} yet
                </p>
              ) : (
                <div className="space-y-2">
                  {asIncoming.map(m => (
                    <div key={m._id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{userName(m.memberId)}</p>
                        <p className="text-xs text-gray-400 truncate">{m.memberId.email}</p>
                      </div>
                      <TypeBadge type={m.memberId.accountType} />
                      <button onClick={() => removeAssignment(m._id)}
                        className="text-gray-300 hover:text-red-500 transition flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAssign && (
        <AssignModal
          user={user}
          allUsers={allUsers}
          onClose={() => setShowAssign(false)}
          onAssigned={() => { load(); onAction() }}
        />
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers]       = useState<UserRecord[]>([])
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [search, setSearch]             = useState('')
  const [debouncedSearch, setDbSearch]  = useState('')
  const [typeFilter, setTypeFilter]     = useState<AccountType | ''>('')

  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected]     = useState<UserRecord | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDbSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await usersApi.list({ page, limit: LIMIT, accountType: typeFilter || undefined, search: debouncedSearch || undefined })
      setUsers(res.users); setTotal(res.total); setPages(res.pages)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }, [page, typeFilter, debouncedSearch])

  useEffect(() => { load() }, [load])

  // Counts by type (from current page — for summary only)
  const counts = { individual: 0, professional: 0, organization: 0 }
  users.forEach(u => { counts[u.accountType] = (counts[u.accountType] ?? 0) + 1 })

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} registered account{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link href="/dashboard/users/tree"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <GitFork size={14} /> User tree
          </Link>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition">
            <Plus size={15} /> Create user
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(Object.entries(TYPE_META) as [AccountType, typeof TYPE_META[AccountType]][]).map(([type, meta]) => (
          <button key={type}
            onClick={() => { setTypeFilter(t => t === type ? '' : type); setPage(1) }}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition
                        ${typeFilter === type ? 'border-slate-700 bg-slate-50' : 'border-transparent bg-white hover:border-gray-200'}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.pill}`}>
              <meta.Icon size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-none">{counts[type]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{meta.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-slate-500 transition" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['', 'individual', 'professional', 'organization'] as const).map(opt => (
            <button key={opt}
              onClick={() => { setTypeFilter(opt as AccountType | ''); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                          ${typeFilter === opt
                            ? 'bg-slate-800 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-slate-400'}`}
            >
              {opt === '' ? 'All types' : TYPE_META[opt as AccountType].label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

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
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3.5" colSpan={6}>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">No users found</td>
              </tr>
            ) : (
              users.map(u => {
                const name = userName(u)
                const showEmail = name !== u.email
                let detail = ''
                if (u.accountType === 'organization' && u.gstin) detail = `GSTIN: ${u.gstin}`
                else if (u.accountType === 'organization' && u.pan) detail = `PAN: ${u.pan}`
                else if (u.accountType === 'professional' && u.membershipNumber) detail = `Membership: ${u.membershipNumber}`

                return (
                  <tr key={u._id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setSelected(u)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900 truncate max-w-[180px]">{name}</div>
                      {showEmail && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{u.email}</div>}
                      {u.role === 'superadmin' && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">superadmin</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5"><TypeBadge type={u.accountType} /></td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {detail
                        ? <span className="text-xs text-gray-500 font-mono">{detail}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.isVerified ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-gray-300" />}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-gray-400">{fmt(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(u) }}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-slate-700 border border-gray-200 hover:border-slate-400 px-2.5 py-1 rounded-lg transition"
                      >
                        <Link2 size={11} /> Manage
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-600 px-2">Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}

      {selected && (
        <DetailPanel
          user={selected}
          allUsers={users}
          onClose={() => setSelected(null)}
          onAction={load}
        />
      )}
    </div>
  )
}
