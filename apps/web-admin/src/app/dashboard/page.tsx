'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usersApi } from '@/lib/api'
import { Users, UserCircle, Briefcase, Building2, ArrowRight } from 'lucide-react'

interface Stats {
  total: number
  individual: number
  professional: number
  organization: number
}

const CARDS = [
  {
    key: 'total' as const,
    label: 'Total Users',
    href: '/dashboard/users',
    icon: Users,
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconColor: 'text-slate-600',
    numColor: 'text-slate-900',
  },
  {
    key: 'individual' as const,
    label: 'Individuals',
    href: '/dashboard/users?accountType=individual',
    icon: UserCircle,
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconColor: 'text-slate-500',
    numColor: 'text-slate-900',
  },
  {
    key: 'professional' as const,
    label: 'Professionals',
    href: '/dashboard/users?accountType=professional',
    icon: Briefcase,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-500',
    numColor: 'text-blue-900',
  },
  {
    key: 'organization' as const,
    label: 'Organizations',
    href: '/dashboard/users?accountType=organization',
    icon: Building2,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    numColor: 'text-emerald-900',
  },
]

export default function DashboardPage() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersApi.stats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Overview</h1>
      <p className="text-sm text-gray-500 mb-8">Manage Conceptra settings and data from the sidebar.</p>

      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Users</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CARDS.map(card => {
          const Icon = card.icon
          const count = stats?.[card.key] ?? 0

          return (
            <Link
              key={card.key}
              href={card.href}
              className={`group flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all
                          hover:shadow-md ${card.bg} ${card.border}`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 ${card.iconColor}`}>
                  <Icon size={18} />
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition" />
              </div>

              {loading ? (
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className={`text-3xl font-bold leading-none ${card.numColor}`}>{count}</p>
              )}

              <p className="text-xs font-medium text-gray-500">{card.label}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
