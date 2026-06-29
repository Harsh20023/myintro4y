'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  usersApi, membershipsApi,
  UserRecord, MembershipRecord,
} from '@/lib/api'
import {
  ArrowLeft, GitFork,
  ShieldCheck, Briefcase, Building2, UserCircle,
  ChevronDown, ChevronRight,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TreeNode {
  id:       string
  user:     UserRecord
  children: TreeNode[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function userName(u: UserRecord) {
  if (u.accountType === 'organization') return u.orgName  ?? u.email
  if (u.accountType === 'professional') return u.firmName ?? u.displayName ?? u.email
  return u.displayName ?? u.email
}

// ── Tree builder ──────────────────────────────────────────────────────────────

function buildTree(allUsers: UserRecord[], memberships: MembershipRecord[]): TreeNode[] {
  const orgToProf  = new Map<string, string>()
  const indToOrg   = new Map<string, string>()
  const indToProf  = new Map<string, string>()
  const profOrgs   = new Map<string, string[]>()
  const orgInds    = new Map<string, string[]>()
  const profInds   = new Map<string, string[]>()

  memberships.forEach(m => {
    const mid = m.memberId._id
    const tid = m.targetId._id
    const mt  = m.memberType
    const tt  = m.targetType

    if (mt === 'organization' && tt === 'professional') {
      orgToProf.set(mid, tid)
      profOrgs.set(tid, [...(profOrgs.get(tid) ?? []), mid])
    }
    if (mt === 'individual' && tt === 'organization') {
      if (!indToOrg.has(mid)) {
        indToOrg.set(mid, tid)
        orgInds.set(tid, [...(orgInds.get(tid) ?? []), mid])
      }
    }
    if (mt === 'individual' && tt === 'professional') {
      if (!indToProf.has(mid)) indToProf.set(mid, tid)
    }
  })

  indToProf.forEach((profId, indId) => {
    if (!indToOrg.has(indId)) {
      profInds.set(profId, [...(profInds.get(profId) ?? []), indId])
    }
  })

  const byId = new Map(allUsers.map(u => [u._id, u]))

  const makeNode = (u: UserRecord): TreeNode => {
    const children: TreeNode[] = []
    if (u.accountType === 'professional') {
      ;(profOrgs.get(u._id) ?? []).forEach(id => { const c = byId.get(id); if (c) children.push(makeNode(c)) })
      ;(profInds.get(u._id) ?? []).forEach(id => { const c = byId.get(id); if (c) children.push(makeNode(c)) })
    }
    if (u.accountType === 'organization') {
      ;(orgInds.get(u._id) ?? []).forEach(id => { const c = byId.get(id); if (c) children.push(makeNode(c)) })
    }
    return { id: u._id, user: u, children }
  }

  const assigned = new Set([
    ...orgToProf.keys(),
    ...indToOrg.keys(),
    ...[...indToProf.keys()].filter(id => !indToOrg.has(id)),
  ])

  return allUsers
    .filter(u => u.role !== 'superadmin' && !assigned.has(u._id))
    .sort((a, b) => {
      const order = { professional: 0, organization: 1, individual: 2 }
      return (order[a.accountType] ?? 3) - (order[b.accountType] ?? 3)
    })
    .map(makeNode)
}

// ── Card styles ───────────────────────────────────────────────────────────────

const ORG_CARD: Record<string, { border: string; bg: string; nameColor: string; iconColor: string; badge?: string }> = {
  superadmin:   { border: 'border-amber-300',   bg: 'bg-amber-50',   nameColor: 'text-amber-900',   iconColor: 'text-amber-500',   badge: 'bg-amber-200 text-amber-800' },
  professional: { border: 'border-blue-300',    bg: 'bg-blue-50',    nameColor: 'text-blue-900',    iconColor: 'text-blue-500' },
  organization: { border: 'border-emerald-300', bg: 'bg-emerald-50', nameColor: 'text-emerald-900', iconColor: 'text-emerald-600' },
  individual:   { border: 'border-slate-200',   bg: 'bg-white',      nameColor: 'text-gray-800',    iconColor: 'text-slate-400' },
}

const ORG_ICON: Record<string, React.ElementType> = {
  superadmin: ShieldCheck, professional: Briefcase, organization: Building2, individual: UserCircle,
}

// ── Node card ─────────────────────────────────────────────────────────────────

function OrgCard({ user }: { user: UserRecord }) {
  const type = user.role === 'superadmin' ? 'superadmin' : user.accountType
  const s    = ORG_CARD[type] ?? ORG_CARD.individual
  const Icon = ORG_ICON[type] ?? UserCircle
  return (
    <div className={`border-2 rounded-2xl px-3.5 py-3 w-48 shadow-sm select-none ${s.border} ${s.bg}`}>
      <div className="flex items-start gap-2">
        <Icon size={15} className={`flex-shrink-0 mt-0.5 ${s.iconColor}`} />
        <div className="min-w-0">
          <p className={`text-xs font-semibold leading-snug truncate ${s.nameColor}`}>{userName(user)}</p>
          <p className="text-[10px] text-gray-400 truncate mt-0.5">{user.email}</p>
          {user.role === 'superadmin' && s.badge && (
            <span className={`mt-1.5 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.badge}`}>
              Super Admin
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Individual leaf list ──────────────────────────────────────────────────────

function IndividualStack({ nodes }: { nodes: TreeNode[] }) {
  const s    = ORG_CARD.individual
  const Icon = ORG_ICON.individual
  return (
    <div className="flex flex-col">
      {nodes.map((node, i) => {
        const isLast = i === nodes.length - 1
        return (
          <div key={node.id} className="flex items-center gap-2.5 relative">
            {!isLast && (
              <div className="absolute left-[6px] top-[18px] bottom-[-10px] w-px bg-gray-200" />
            )}
            <div className="w-3 h-3 rounded-full border-2 border-gray-300 bg-white flex-shrink-0 z-10" />
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm mb-2.5 ${s.border} ${s.bg}`}>
              <Icon size={13} className={s.iconColor} />
              <div>
                <p className={`text-xs font-medium leading-tight ${s.nameColor}`}>{userName(node.user)}</p>
                <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{node.user.email}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Recursive org chart node ──────────────────────────────────────────────────

function OrgTreeNode({ node }: { node: TreeNode }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children.length > 0

  const structural  = node.children.filter(c => c.user.accountType !== 'individual')
  const individuals = node.children.filter(c => c.user.accountType === 'individual')

  type Slot = { id: string; kind: 'node'; node: TreeNode } | { id: string; kind: 'group' }
  const slots: Slot[] = [
    ...structural.map(n => ({ id: n.id, kind: 'node' as const, node: n })),
    ...(individuals.length > 0 ? [{ id: '__ind__', kind: 'group' as const }] : []),
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <OrgCard user={node.user} />
        {hasChildren && (
          <button
            onClick={() => setOpen(o => !o)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-gray-300
                       rounded-full flex items-center justify-center shadow-sm hover:border-gray-500 transition z-10"
          >
            {open
              ? <ChevronDown size={11} className="text-gray-500" />
              : <ChevronRight size={11} className="text-gray-500" />}
          </button>
        )}
      </div>

      {open && hasChildren && (
        <div className="flex flex-col items-center">
          <div className="w-px bg-gray-300" style={{ height: 28 }} />
          <div className="flex items-start">
            {slots.map((slot, i) => {
              const isFirst = i === 0
              const isLast  = i === slots.length - 1
              return (
                <div key={slot.id} className="flex flex-col items-center px-5">
                  <div className="flex w-full">
                    <div className={`flex-1 h-px ${isFirst ? '' : 'bg-gray-300'}`} />
                    <div className={`flex-1 h-px ${isLast  ? '' : 'bg-gray-300'}`} />
                  </div>
                  <div className="w-px bg-gray-300" style={{ height: 24 }} />
                  {slot.kind === 'group'
                    ? <IndividualStack nodes={individuals} />
                    : <OrgTreeNode node={slot.node} />
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserTreePage() {
  const [allUsers, setAllUsers]       = useState<UserRecord[]>([])
  const [memberships, setMemberships] = useState<MembershipRecord[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        const [uRes, mRes] = await Promise.all([
          usersApi.list({ limit: 1000 }),
          membershipsApi.list(),
        ])
        setAllUsers(uRes.users)
        setMemberships(mRes)
      } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const superadmins  = allUsers.filter(u => u.role === 'superadmin')
  const regularUsers = allUsers.filter(u => u.role !== 'superadmin')
  const treeRoots    = buildTree(regularUsers, memberships)
  const roots        = superadmins.map(sa => ({ id: sa._id, user: sa, children: treeRoots }))

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/users"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft size={15} />
            Users
          </Link>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <GitFork size={16} className="text-slate-500" />
            <h1 className="text-base font-semibold text-gray-900">User Tree</h1>
            <span className="text-xs text-gray-400">
              {allUsers.length} users · {memberships.length} assignment{memberships.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-5">
          {(['superadmin', 'professional', 'organization', 'individual'] as const).map(type => {
            const Icon  = ORG_ICON[type]
            const s     = ORG_CARD[type]
            const label = type === 'superadmin' ? 'Super Admin' : type.charAt(0).toUpperCase() + type.slice(1)
            return (
              <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
                <Icon size={13} className={s.iconColor} />
                {label}
              </div>
            )
          })}
        </div>
      </div>

      {/* Canvas */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400 animate-pulse">Building tree…</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="min-w-max min-h-full flex items-start justify-center p-16 gap-16">
            {roots.map(r => <OrgTreeNode key={r.id} node={r} />)}
          </div>
        </div>
      )}
    </div>
  )
}
