import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import {
  FileText, Calculator, Clock, Search, Download, CreditCard,
  FileCheck, Receipt, Package, RefreshCw, ShieldCheck, ClipboardList,
  Truck, ArrowLeftRight, Layers, BookOpen, Landmark,
  TrendingUp, Wallet, Home, PiggyBank, BarChart2, User,
  CalendarClock, BadgePercent, Building2, IndianRupee, FileSearch,
  ScanText, LayoutList, Banknote, ListChecks,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free GST & Income Tax Tools — Conceptra',
  description: 'Free online tools for Indian businesses — GST calculators, income tax tools, invoice generators and more.',
}

type Tool = {
  icon: React.ElementType
  title: string
  desc: string
  href: string
  badge: string
  color: string
  bg: string
  live: boolean
}

const GST_TOOLS: Tool[] = [
  {
    icon: FileText,
    title: 'Invoice Generator',
    desc: 'Create GST-compliant tax invoices with CGST, SGST & IGST. Download as PDF.',
    href: '/tools/invoice-generator',
    badge: 'Live', color: 'text-brand-600', bg: 'bg-brand-50', live: true,
  },
  {
    icon: Calculator,
    title: 'GST Calculator',
    desc: 'Calculate GST across all slabs. Supports intra-state and inter-state.',
    href: '/tools/gst-calculator',
    badge: 'Live', color: 'text-violet-600', bg: 'bg-violet-50', live: true,
  },
  {
    icon: Clock,
    title: 'GST Late Fee Calculator',
    desc: 'Calculate exact penalties & interest on delayed GSTR-3B, GSTR-1, GSTR-9 filings.',
    href: '/tools/gst-late-fee-calculator',
    badge: 'Live', color: 'text-orange-600', bg: 'bg-orange-50', live: true,
  },
  {
    icon: Search,
    title: 'GSTIN Checker',
    desc: 'Verify any GST number live from the GSTN portal. See business name and status.',
    href: '/tools/gst-number-checker',
    badge: 'Live', color: 'text-teal-600', bg: 'bg-teal-50', live: true,
  },
  {
    icon: FileCheck,
    title: 'GST Filing Checker',
    desc: 'Check GSTR-1 and GSTR-3B filing history for any GSTIN year-wise.',
    href: '/tools/gst-filing-checker',
    badge: 'Live', color: 'text-indigo-600', bg: 'bg-indigo-50', live: true,
  },
  {
    icon: Download,
    title: 'GST Return Downloader',
    desc: 'Download GSTR-1, GSTR-3B, GSTR-2A or GSTR-2B in Excel or PDF for any period.',
    href: '/tools/gst-return-downloader',
    badge: 'Live', color: 'text-emerald-600', bg: 'bg-emerald-50', live: true,
  },
  {
    icon: Receipt,
    title: 'E-Invoice Generator',
    desc: 'Generate IRN and QR code compliant e-invoices directly from the IRP portal.',
    href: '#',
    badge: 'Coming Soon', color: 'text-pink-600', bg: 'bg-pink-50', live: false,
  },
  {
    icon: Package,
    title: 'HSN Code Finder',
    desc: 'Search HSN/SAC codes by product or service name and get the applicable GST rate.',
    href: '#',
    badge: 'Coming Soon', color: 'text-amber-600', bg: 'bg-amber-50', live: false,
  },
  {
    icon: Truck,
    title: 'E-Way Bill Generator',
    desc: 'Generate and manage e-way bills for goods movement above ₹50,000.',
    href: '#',
    badge: 'Coming Soon', color: 'text-sky-600', bg: 'bg-sky-50', live: false,
  },
  {
    icon: ArrowLeftRight,
    title: 'RCM Calculator',
    desc: 'Calculate Reverse Charge Mechanism liability on purchases from unregistered suppliers.',
    href: '#',
    badge: 'Coming Soon', color: 'text-red-600', bg: 'bg-red-50', live: false,
  },
  {
    icon: Layers,
    title: 'ITC Calculator',
    desc: 'Calculate Input Tax Credit eligibility and utilization across CGST, SGST, IGST.',
    href: '#',
    badge: 'Coming Soon', color: 'text-cyan-600', bg: 'bg-cyan-50', live: false,
  },
  {
    icon: RefreshCw,
    title: 'GST Reconciliation Tool',
    desc: 'Reconcile GSTR-2A/2B with your purchase register and identify mismatches.',
    href: '#',
    badge: 'Coming Soon', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', live: false,
  },
  {
    icon: BookOpen,
    title: 'Composition Scheme Calculator',
    desc: 'Check eligibility and calculate tax liability under the GST Composition Scheme.',
    href: '#',
    badge: 'Coming Soon', color: 'text-lime-600', bg: 'bg-lime-50', live: false,
  },
  {
    icon: ClipboardList,
    title: 'GSTR-9 Planner',
    desc: 'Plan and prepare your annual GST return with auto-populated data checks.',
    href: '#',
    badge: 'Coming Soon', color: 'text-rose-600', bg: 'bg-rose-50', live: false,
  },
  {
    icon: ShieldCheck,
    title: 'GST Registration Tracker',
    desc: 'Track your GST registration application status in real time from the portal.',
    href: '#',
    badge: 'Coming Soon', color: 'text-green-600', bg: 'bg-green-50', live: false,
  },
]

type IncomeTaxSection = {
  title: string
  tools: Tool[]
}

const INCOME_TAX_SECTIONS: IncomeTaxSection[] = [
  {
    title: 'Documents & Statements',
    tools: [
      {
        icon: FileSearch,
        title: 'Form 26AS Analyser',
        desc: 'Parse your Form 26AS to check all TDS credits and advance tax paid against your PAN.',
        href: '/tools/form-26as-analyser',
        badge: 'Coming Soon', color: 'text-red-600', bg: 'bg-red-50', live: false,
      },
      {
        icon: ScanText,
        title: 'AIS Analyser',
        desc: 'Analyse your Annual Information Statement — stocks, MF, dividends, interest, property and more.',
        href: '/tools/ais-analyser',
        badge: 'Coming Soon', color: 'text-violet-600', bg: 'bg-violet-50', live: false,
      },
      {
        icon: LayoutList,
        title: 'TIS Viewer',
        desc: 'View your Taxpayer Information Summary — a clean category-wise digest of your AIS data.',
        href: '/tools/tis-viewer',
        badge: 'Coming Soon', color: 'text-sky-600', bg: 'bg-sky-50', live: false,
      },
      {
        icon: FileText,
        title: 'Form 16 / 16A Parser',
        desc: 'Upload your Form 16 or 16A PDF to extract salary, TDS, and deduction details instantly.',
        href: '/tools/form-16-parser',
        badge: 'Coming Soon', color: 'text-indigo-600', bg: 'bg-indigo-50', live: false,
      },
    ],
  },
  {
    title: 'Tax Calculation',
    tools: [
      {
        icon: IndianRupee,
        title: 'Income Tax Calculator',
        desc: 'Compare old vs new tax regime and calculate your exact liability for FY 2024-25 and FY 2025-26.',
        href: '/tools/income-tax-calculator',
        badge: 'Live', color: 'text-brand-600', bg: 'bg-brand-50', live: true,
      },
      {
        icon: BadgePercent,
        title: 'TDS Calculator',
        desc: 'Calculate TDS on salary, professional fees, rent, and contractor payments.',
        href: '/tools/tds-calculator',
        badge: 'Live', color: 'text-orange-600', bg: 'bg-orange-50', live: true,
      },
      {
        icon: CalendarClock,
        title: 'Advance Tax Calculator',
        desc: 'Calculate advance tax instalments due in June, September, December and March.',
        href: '/tools/advance-tax-calculator',
        badge: 'Live', color: 'text-amber-600', bg: 'bg-amber-50', live: true,
      },
      {
        icon: TrendingUp,
        title: 'Capital Gains Calculator',
        desc: 'Calculate STCG and LTCG tax on stocks, mutual funds, and property sales.',
        href: '/tools/capital-gains-calculator',
        badge: 'Live', color: 'text-emerald-600', bg: 'bg-emerald-50', live: true,
      },
    ],
  },
  {
    title: 'Deductions & Savings',
    tools: [
      {
        icon: PiggyBank,
        title: 'Section 80C Planner',
        desc: 'Plan your ₹1.5L 80C investments across PPF, ELSS, LIC, NSC, and more.',
        href: '/tools/section-80c-planner',
        badge: 'Live', color: 'text-teal-600', bg: 'bg-teal-50', live: true,
      },
      {
        icon: Wallet,
        title: 'HRA Exemption Calculator',
        desc: 'Calculate your exact HRA exemption based on salary, rent paid, and city.',
        href: '/tools/hra-calculator',
        badge: 'Live', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', live: true,
      },
      {
        icon: Home,
        title: 'Home Loan Tax Benefit',
        desc: 'Calculate deductions under Section 24(b) and 80C on home loan interest and principal.',
        href: '/tools/home-loan-tax-benefit',
        badge: 'Coming Soon', color: 'text-pink-600', bg: 'bg-pink-50', live: false,
      },
      {
        icon: Landmark,
        title: 'Tax Savings Calculator',
        desc: 'Find how much tax you can save by optimising deductions across all sections.',
        href: '/tools/tax-savings-calculator',
        badge: 'Coming Soon', color: 'text-lime-600', bg: 'bg-lime-50', live: false,
      },
    ],
  },
  {
    title: 'Salary & CTC',
    tools: [
      {
        icon: Building2,
        title: 'CTC Breakup Calculator',
        desc: 'Break down your CTC into in-hand salary, PF, gratuity, and tax liability.',
        href: '/tools/ctc-calculator',
        badge: 'Coming Soon', color: 'text-cyan-600', bg: 'bg-cyan-50', live: false,
      },
      {
        icon: Banknote,
        title: 'In-Hand Salary Calculator',
        desc: 'Enter your gross salary and instantly see your monthly take-home after all deductions.',
        href: '/tools/in-hand-salary-calculator',
        badge: 'Live', color: 'text-green-600', bg: 'bg-green-50', live: true,
      },
    ],
  },
  {
    title: 'ITR Filing',
    tools: [
      {
        icon: CreditCard,
        title: 'Search by PAN',
        desc: 'Find all GST registrations linked to a PAN number. View status and state.',
        href: '/tools/pan-checker',
        badge: 'Live', color: 'text-rose-600', bg: 'bg-rose-50', live: true,
      },
      {
        icon: ListChecks,
        title: 'ITR Form Selector',
        desc: 'Answer a few questions and find the right ITR form to file your return.',
        href: '/tools/itr-form-selector',
        badge: 'Live', color: 'text-violet-600', bg: 'bg-violet-50', live: true,
      },
      {
        icon: BarChart2,
        title: 'ITR Filing Status',
        desc: 'Check the processing status of your filed ITR using PAN and assessment year.',
        href: '/tools/itr-filing-status',
        badge: 'Coming Soon', color: 'text-indigo-600', bg: 'bg-indigo-50', live: false,
      },
      {
        icon: User,
        title: 'Refund Status Tracker',
        desc: 'Track your income tax refund status directly from the IT department portal.',
        href: '/tools/refund-status-tracker',
        badge: 'Coming Soon', color: 'text-amber-600', bg: 'bg-amber-50', live: false,
      },
    ],
  },
]

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={tool.href}
      className={`group relative flex flex-col gap-3 rounded-2xl border bg-white p-5 transition-all duration-200 ${
        tool.live
          ? 'border-ink-100 hover:border-ink-200 hover:shadow-md'
          : 'border-ink-100/60 opacity-60 hover:opacity-80'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center`}>
          <tool.icon size={18} className={tool.color} strokeWidth={1.75} />
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          tool.live
            ? 'bg-brand-50 text-brand-700 border border-brand-100'
            : 'bg-ink-100 text-ink-500'
        }`}>
          {tool.badge}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-900 mb-1">{tool.title}</p>
        <p className="text-xs text-ink-500 leading-relaxed">{tool.desc}</p>
      </div>
      {tool.live && (
        <div className="mt-auto pt-1">
          <span className={`text-xs font-medium ${tool.color} group-hover:underline`}>Open tool →</span>
        </div>
      )}
    </Link>
  )
}

export default function ToolsPage() {
  const allIncomeTaxTools = INCOME_TAX_SECTIONS.flatMap(s => s.tools)

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-14">

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 text-xs font-medium rounded-full border border-brand-100 mb-4">
            Free forever
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-ink-950 leading-tight mb-3">
            All Tools
          </h1>
          <p className="text-ink-500 text-lg max-w-xl">
            Free tools built for Indian businesses. No sign-up needed for most.
          </p>
        </div>

        {/* GST Tools */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display font-bold text-2xl text-ink-900">GST Tools</h2>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
              {GST_TOOLS.filter(t => t.live).length} live · {GST_TOOLS.filter(t => !t.live).length} coming soon
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GST_TOOLS.map(t => <ToolCard key={t.title} tool={t} />)}
          </div>
        </section>

        {/* Income Tax Tools */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="font-display font-bold text-2xl text-ink-900">Income Tax Tools</h2>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
              {allIncomeTaxTools.filter(t => t.live).length} live · {allIncomeTaxTools.filter(t => !t.live).length} coming soon
            </span>
          </div>

          <div className="flex flex-col gap-10">
            {INCOME_TAX_SECTIONS.map(section => (
              <div key={section.title}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-400 mb-4">{section.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {section.tools.map(t => <ToolCard key={t.title} tool={t} />)}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
