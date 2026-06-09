'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

export function ToolGate({ children }: { children: React.ReactNode }) {
  const { user, requireLogin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (requireLogin && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-28 px-4 text-center">
        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-5">
          <Lock size={24} className="text-brand-600" />
        </div>
        <h2 className="font-display font-bold text-xl text-ink-900 mb-2">Login required</h2>
        <p className="text-sm text-ink-400 max-w-xs mb-6">
          This tool is currently restricted. Log in to your account to continue.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="btn-primary">Log in</Link>
          <Link href="/signup" className="btn-secondary">Sign up free</Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
