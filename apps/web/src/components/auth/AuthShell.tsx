'use client'

import Link from 'next/link'
import { Zap, FileText, Calculator, Receipt } from 'lucide-react'

const STATS = [
  { value: '10,000+', label: 'Invoices created' },
  { value: '₹0',      label: 'Forever free' },
  { value: '3 sec',   label: 'To download PDF' },
]

const FLOATING_CARDS = [
  {
    icon: FileText,
    title: 'Invoice #INV-2024',
    sub: 'GST • ₹24,780',
    color: 'from-brand-500/20 to-brand-600/10',
    border: 'border-brand-500/30',
    delay: '0s',
    top: '18%', left: '8%',
    anim: 'animate-float',
  },
  {
    icon: Calculator,
    title: 'GST Saved',
    sub: '₹4,212 this month',
    color: 'from-violet-500/20 to-violet-600/10',
    border: 'border-violet-400/30',
    delay: '1.5s',
    top: '54%', left: '62%',
    anim: 'animate-float-slow',
  },
  {
    icon: Receipt,
    title: 'CGST + SGST',
    sub: 'Auto-calculated',
    color: 'from-amber-500/15 to-orange-500/10',
    border: 'border-amber-400/30',
    delay: '0.8s',
    top: '72%', left: '6%',
    anim: 'animate-float-slower',
  },
]

interface Props {
  children: React.ReactNode
  heading: string
  subheading: string
}

export function AuthShell({ children, heading, subheading }: Props) {
  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden bg-ink-950">

        {/* Gradient orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full
                        bg-brand-600/20 blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full
                        bg-violet-600/15 blur-[90px] animate-pulse-glow"
             style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-[40%] left-[55%] w-[280px] h-[280px] rounded-full
                        bg-brand-400/10 blur-[80px] animate-pulse-glow"
             style={{ animationDelay: '2.4s' }} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Top gradient fade */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink-950 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent z-10" />

        {/* Floating cards */}
        {FLOATING_CARDS.map(card => (
          <div
            key={card.title}
            className={`absolute z-20 ${card.anim}`}
            style={{ top: card.top, left: card.left, animationDelay: card.delay }}
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm
                             bg-gradient-to-br ${card.color} ${card.border}`}>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <card.icon size={15} className="text-white/80" />
              </div>
              <div>
                <p className="text-white/90 text-xs font-semibold leading-none mb-0.5">{card.title}</p>
                <p className="text-white/50 text-[11px]">{card.sub}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Content */}
        <div className="relative z-20 flex flex-col justify-between h-full px-12 py-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <span className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/40">
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display font-bold text-xl text-white">Conceptra</span>
          </Link>

          {/* Hero text */}
          <div>
            <p className="text-brand-400 text-xs font-medium tracking-widest uppercase mb-4">Free · No watermarks · Always</p>
            <h2 className="font-display font-bold text-4xl xl:text-5xl text-white leading-[1.15] mb-6">
              Business tools that<br />
              <span className="text-brand-400 italic">actually work.</span>
            </h2>
            <p className="text-ink-400 text-base leading-relaxed max-w-sm">
              GST invoices, tax calculators and more — built for Indian SMBs.
              Professional PDFs in seconds.
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            {STATS.map((s, i) => (
              <div key={s.label} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                <p className="font-display font-bold text-2xl text-white">{s.value}</p>
                <p className="text-ink-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-ink-50 relative overflow-hidden">

        {/* Subtle bg gradient */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full
                        bg-brand-500/5 blur-[80px] pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden px-6 pt-8 pb-2">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <span className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display font-bold text-lg text-ink-900">Conceptra</span>
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px] animate-scale-in" style={{ opacity: 0 }}>

            {/* Heading */}
            <div className="mb-8 animate-slide-up" style={{ opacity: 0, animationDelay: '0.05s' }}>
              <h1 className="font-display font-bold text-3xl text-ink-950 mb-1.5">{heading}</h1>
              <p className="text-ink-400 text-sm">{subheading}</p>
            </div>

            {children}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-ink-300 pb-6 px-4">
          © {new Date().getFullYear()} Conceptra · Free forever for Indian businesses
        </p>
      </div>
    </div>
  )
}
