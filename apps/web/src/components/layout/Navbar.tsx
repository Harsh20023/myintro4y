'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Zap, Lock, Unlock } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

const tools = [
  { label: 'Invoice Generator',      href: '/tools/invoice-generator' },
  { label: 'GST Calculator',          href: '/tools/gst-calculator' },
  { label: 'GST Late Fee Calculator', href: '/tools/gst-late-fee-calculator' },
  { label: 'GSTIN Checker',           href: '/tools/gst-number-checker' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, requireLogin, setRequireLogin, logout, loading } = useAuth()

  const toggleRequireLogin = async () => {
    try {
      await setRequireLogin(!requireLogin)
    } catch {
      // swallow — user likely not logged in as superadmin
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-ink-50/80 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg text-ink-900">
          <span className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" strokeWidth={2.5} />
          </span>
          LedgerHQ
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {tools.map(t => (
            <Link key={t.href} href={t.href} className="btn-ghost text-sm">
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {/* Tools access toggle — superadmin only */}
          {!loading && user?.role === 'superadmin' && (
            <button
              onClick={toggleRequireLogin}
              title={requireLogin ? 'Tools require login — click to allow public access' : 'Tools are public — click to require login'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
                         border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            >
              {requireLogin
                ? <><Lock size={12} className="text-amber-500" /> Login required</>
                : <><Unlock size={12} className="text-green-500" /> Public access</>}
            </button>
          )}

          {user ? (
            <>
              <span className="text-xs text-slate-500">{user.email}</span>
              <button onClick={logout} className="btn-ghost text-sm">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login"  className="btn-ghost text-sm">Log in</Link>
              <Link href="/signup" className="btn-primary text-sm">Sign up free</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-ink-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-ink-100 bg-ink-50 px-4 py-3 flex flex-col gap-1">
          {tools.map(t => (
            <Link key={t.href} href={t.href} className="btn-ghost justify-start" onClick={() => setOpen(false)}>
              {t.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-ink-100 mt-1 flex flex-col gap-2">
            {!loading && user?.role === 'superadmin' && (
              <button
                onClick={toggleRequireLogin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium border-slate-200 bg-white text-slate-600"
              >
                {requireLogin
                  ? <><Lock size={12} className="text-amber-500" /> Login required</>
                  : <><Unlock size={12} className="text-green-500" /> Public access</>}
              </button>
            )}
            {user ? (
              <button onClick={() => { logout(); setOpen(false) }} className="btn-secondary w-full justify-center">
                Log out
              </button>
            ) : (
              <>
                <Link href="/login"  className="btn-secondary w-full justify-center" onClick={() => setOpen(false)}>Log in</Link>
                <Link href="/signup" className="btn-primary  w-full justify-center" onClick={() => setOpen(false)}>Sign up free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
