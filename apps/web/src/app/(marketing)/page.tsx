'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { FileText, Calculator, Clock, Search, ArrowRight, Zap, Shield, Download, Lock, CreditCard } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useAuth } from '@/lib/AuthContext'
import { HeroAnimation } from '@/components/HeroAnimation'

const TOOLS = [
  {
    icon: FileText,
    title: 'Invoice Generator',
    description: 'Create GST-compliant tax invoices with CGST, SGST & IGST. Download as professional PDF.',
    href: '/tools/invoice-generator',
    badge: 'Most Popular',
    color: 'text-brand-600',
    bg: 'bg-brand-50',
  },
  {
    icon: Calculator,
    title: 'GST Calculator',
    description: 'Calculate GST across all slabs instantly. Supports intra-state and inter-state transactions.',
    href: '/tools/gst-calculator',
    badge: null,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Clock,
    title: 'GST Late Fee Calculator',
    description: 'Calculate exact penalties & interest on delayed GSTR-3B, GSTR-1, GSTR-9 filings. CBIC rules.',
    href: '/tools/gst-late-fee-calculator',
    badge: null,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: Search,
    title: 'GSTIN Checker',
    description: 'Verify any GST number live from the GSTN portal. See business name, status, and registration details.',
    href: '/tools/gst-number-checker',
    badge: null,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    icon: FileText,
    title: 'GST Filing Checker',
    description: 'Check GSTR-1 and GSTR-3B filing history for any GSTIN year-wise. View return filing frequency from the GSTN portal.',
    href: '/tools/gst-filing-checker',
    badge: 'New',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: CreditCard,
    title: 'Search by PAN',
    description: 'Find all GST registrations linked to a PAN number. View status and state for each GSTIN directly from the GSTN portal.',
    href: '/tools/pan-checker',
    badge: 'New',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    icon: Download,
    title: 'GST Return Downloader',
    description: 'Download GSTR-1, GSTR-3B, GSTR-2A or GSTR-2B in Excel or PDF for any period — single month, full year, or bulk across years.',
    href: '/tools/gst-return-downloader',
    badge: 'New',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
]

const FEATURES = [
  { icon: Zap,      title: 'Instant',       desc: 'No account needed. Open the tool and start working.' },
  { icon: Shield,   title: 'GST-compliant', desc: 'Built for Indian tax rules — CGST, SGST, IGST.' },
  { icon: Download, title: 'PDF export',    desc: 'Download professional PDFs ready to send.' },
]

export default function HomePage() {
  const { user, requireLogin, loading } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('ref') !== 'tools') return
    history.replaceState(null, '', window.location.pathname)
    const timer = setTimeout(() => {
      document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const gated      = !loading && requireLogin && !user
  const toolHref   = (href: string) => gated ? '/login' : href
  const primaryCta = gated ? '/login' : '/tools/invoice-generator'

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(20,184,166,0.07)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(139,92,246,0.05)_0%,_transparent_60%)]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 text-xs font-medium rounded-full border border-brand-100 mb-6 animate-fade-in">
                <Zap size={11} strokeWidth={2.5} />
                Free tools for Indian SMBs
              </div>

              <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-ink-950 leading-tight mb-5 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                Business tools that{' '}
                <span className="text-brand-600 italic">actually work</span>
              </h1>

              <p className="text-ink-500 text-lg md:text-xl leading-relaxed mb-8 max-w-xl animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                GST invoices, tax calculators, and more — free forever.
                {gated ? ' Log in to access all tools.' : ' No sign-up. No watermarks. Just open and use.'}
              </p>

              <div className="flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                <Link href={primaryCta} className="btn-primary gap-2 px-6 py-3 text-base">
                  {gated ? <><Lock size={14} /> Log in to access</> : <>Create Invoice Free <ArrowRight size={15} /></>}
                </Link>
                {!gated && (
                  <Link href="#tools" className="btn-secondary gap-2 px-6 py-3 text-base">
                    See all tools
                  </Link>
                )}
              </div>
            </div>

            <div className="hidden lg:block animate-fade-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section id="tools" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <p className="section-tag mb-3">Free tools</p>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-ink-900">
            Everything you need, free
          </h2>
          <p className="text-ink-500 mt-2 text-sm max-w-md">
            {gated ? 'Log in to start using these tools.' : 'Start with these tools today. No account, no credit card.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(tool => (
            <Link key={tool.href} href={toolHref(tool.href)} className="tool-card group p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 ${tool.bg} rounded-xl flex items-center justify-center`}>
                  <tool.icon size={18} className={tool.color} />
                </div>
                <div className="flex items-center gap-2">
                  {tool.badge && (
                    <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-xs font-medium rounded-full border border-brand-100">
                      {tool.badge}
                    </span>
                  )}
                  {gated && <Lock size={13} className="text-ink-400" />}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-ink-900 mb-1 group-hover:text-brand-700 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-ink-500 text-sm leading-relaxed">{tool.description}</p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-brand-600 text-sm font-medium">
                {gated ? 'Log in to open' : 'Open tool'} <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}

          {/* Coming soon card */}
          <div className="tool-card p-5 opacity-60 cursor-default flex flex-col gap-4">
            <div className="w-10 h-10 bg-ink-100 rounded-xl flex items-center justify-center">
              <span className="text-ink-400 text-lg font-bold">+</span>
            </div>
            <div>
              <h3 className="font-semibold text-ink-700 mb-1">More coming soon</h3>
              <p className="text-ink-400 text-sm leading-relaxed">
                Salary calculator, EMI calculator, TDS calculator and more in the pipeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-white border-y border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon size={15} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900 text-sm mb-0.5">{f.title}</p>
                  <p className="text-ink-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-ink-950 rounded-3xl px-8 py-12 md:px-12 md:py-16 text-center">
          <h2 className="font-display font-bold text-2xl md:text-4xl text-white mb-4">
            Start creating invoices for free
          </h2>
          <p className="text-ink-400 text-base mb-8 max-w-sm mx-auto">
            {gated ? 'Log in to your account to access the invoice generator.' : 'No account required. Download professional PDFs in seconds.'}
          </p>
          <Link href={primaryCta} className="btn-primary gap-2 px-8 py-3 text-base inline-flex">
            {gated ? 'Log in' : 'Create Invoice'} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
