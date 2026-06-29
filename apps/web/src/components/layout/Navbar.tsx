'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, Zap, Lock, Unlock, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

const gstTools = [
  { label: 'Invoice Generator',       href: '/tools/invoice-generator' },
  { label: 'GST Calculator',          href: '/tools/gst-calculator' },
  { label: 'GST Late Fee Calculator', href: '/tools/gst-late-fee-calculator' },
  { label: 'GSTIN Checker',           href: '/tools/gst-number-checker' },
  { label: 'GST Filing Checker',      href: '/tools/gst-filing-checker' },
  { label: 'GST Return Downloader',   href: '/tools/gst-return-downloader' },
]

const incomeTaxSections = [
  {
    heading: 'Documents & Statements',
    tools: [
      { label: 'Form 16 / 16A Parser',     href: '/tools/form-16-parser' },
      { label: 'AIS Analyser',             href: '/tools/ais-analyser' },
    ],
  },
  {
    heading: 'Tax Calculation',
    tools: [
      { label: 'Income Tax Calculator',    href: '/tools/income-tax-calculator' },
      { label: 'TDS Calculator',           href: '/tools/tds-calculator' },
      { label: 'Capital Gains Calculator', href: '/tools/capital-gains-calculator' },
    ],
  },
  {
    heading: 'Deductions & Savings',
    tools: [
      { label: 'Section 80C Planner',      href: '/tools/section-80c-planner' },
      { label: 'HRA Exemption Calculator', href: '/tools/hra-calculator' },
    ],
  },
  {
    heading: 'Salary & CTC',
    tools: [
      { label: 'In-Hand Salary Calculator', href: '/tools/in-hand-salary-calculator' },
    ],
  },
  {
    heading: 'ITR Filing',
    tools: [
      { label: 'ITR Form Selector',        href: '/tools/itr-form-selector' },
      { label: 'Search by PAN',            href: '/tools/pan-checker' },
    ],
  },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, requireLogin, setRequireLogin, logout, loading } = useAuth()

  const toggleRequireLogin = async () => {
    try { await setRequireLogin(!requireLogin) } catch { /* swallow */ }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-ink-50/80 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg text-ink-900">
          <span className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" strokeWidth={2.5} />
          </span>
          Conceptra
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="btn-ghost text-sm font-bold text-black flex items-center gap-1"
            >
              Free Tools <ChevronDown size={15} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-lg border border-ink-100 py-2 z-50 flex">
                <div className="min-w-[200px]">
                  <p className="px-4 pt-1 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">GST Tools</p>
                  {gstTools.map(t => (
                    <Link key={t.href} href={t.href}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 hover:text-ink-900 transition-colors whitespace-nowrap">
                      {t.label}
                    </Link>
                  ))}
                </div>
                <div className="w-px bg-ink-100 my-2" />
                <div className="min-w-[220px] py-1">
                  <p className="px-4 pt-1 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">Income Tax Tools</p>
                  {incomeTaxSections.map(section => (
                    <div key={section.heading}>
                      <p className="px-4 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-300">{section.heading}</p>
                      {section.tools.map(t => (
                        <Link key={t.href} href={t.href}
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-1.5 text-sm text-ink-700 hover:bg-ink-50 hover:text-ink-900 transition-colors whitespace-nowrap">
                          {t.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {!loading && user?.role === 'superadmin' && (
            <button
              onClick={toggleRequireLogin}
              title={requireLogin ? 'Tools require login — click to allow public access' : 'Tools are public — click to require login'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
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

        <button
          className="md:hidden p-2 rounded-lg hover:bg-ink-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-ink-100 bg-ink-50 px-4 py-3 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 px-3 pt-1 pb-0.5">GST Tools</p>
          {gstTools.map(t => (
            <Link key={t.href} href={t.href} className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
              {t.label}
            </Link>
          ))}
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 px-3 pt-2 pb-0.5">Income Tax Tools</p>
          {incomeTaxSections.map(section => (
            <div key={section.heading}>
              <p className="px-3 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-300">{section.heading}</p>
              {section.tools.map(t => (
                <Link key={t.href} href={t.href} className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                  {t.label}
                </Link>
              ))}
            </div>
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
              <button onClick={() => { logout(); setMobileOpen(false) }} className="btn-secondary w-full justify-center">
                Log out
              </button>
            ) : (
              <>
                <Link href="/login"  className="btn-secondary w-full justify-center" onClick={() => setMobileOpen(false)}>Log in</Link>
                <Link href="/signup" className="btn-primary  w-full justify-center" onClick={() => setMobileOpen(false)}>Sign up free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
