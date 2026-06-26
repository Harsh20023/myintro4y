import { Building2, FileText, Users, Shield, BookOpen, TrendingUp, ArrowRight } from 'lucide-react';
import AnimateIn from './AnimateIn';

const SERVICES = [
  {
    icon: Building2,
    title: 'Company Formation',
    desc: 'Start right — every business structure, legally sound.',
    items: ['Private Limited Company', 'LLP Registration', 'One Person Company', 'Section 8 / NGO'],
    slug: 'company-registration-in-india',
  },
  {
    icon: FileText,
    title: 'Tax & Compliance',
    desc: 'ITR, GST, TDS — filed on time, every time.',
    items: ['Income Tax Returns', 'GST Filing & Registration', 'TDS / TCS Compliance', 'Tax Planning & Advisory'],
    slug: 'income-tax-returns',
  },
  {
    icon: Users,
    title: 'Payroll & HR',
    desc: 'Your team paid on time, fully compliant.',
    items: ['Salary Structuring', 'PF & ESI Filing', 'Payslip Generation', 'Full & Final Settlement'],
    slug: 'payroll-outsourcing-service',
  },
  {
    icon: Shield,
    title: 'Audit & Assurance',
    desc: 'Independent, thorough, and regulatory-ready.',
    items: ['Statutory Audit', 'Internal Audit', 'Tax Audit (44AB)', 'Due Diligence'],
    slug: 'audit-system-risk-assessment',
  },
  {
    icon: BookOpen,
    title: 'Accounting Outsourcing',
    desc: 'Cut costs, gain expert-level financial clarity.',
    items: ['Bookkeeping & Accounting', 'Accounts Payable / Receivable', 'MIS & Management Reports', 'Tally / Zoho / QuickBooks'],
    slug: 'accounting-bookkeeping-outsourcing',
  },
  {
    icon: TrendingUp,
    title: 'Business Advisory',
    desc: 'Strategic thinking for your next growth phase.',
    items: ['Virtual CFO Services', 'Business Restructuring', 'FEMA & RBI Compliance', 'Startup Funding Advisory'],
    slug: 'risk-management-compliance',
  },
];

export default function ServicesGrid() {
  return (
    <section id="services" className="py-24 px-5" style={{ background: 'white' }}>
      <div className="max-w-[1200px] mx-auto">

        <AnimateIn className="text-center mb-16 space-y-3">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ color: 'var(--ca-accent)', background: 'var(--ca-accent-light)' }}
          >
            What We Do
          </span>
          <h2
            className="text-4xl md:text-5xl font-extrabold leading-tight"
            style={{ color: 'var(--ca-primary)' }}
          >
            Full-Spectrum Financial Services
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--ca-muted)' }}>
            One firm. Every compliance need covered — from day one through every growth stage.
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(({ icon: Icon, title, desc, items, slug }, i) => (
            <AnimateIn key={title} delay={i * 80}>
              <div
                className="group relative flex flex-col h-full rounded-2xl p-7 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ borderColor: 'var(--ca-border)', background: 'white' }}
              >
                <div
                  className="absolute top-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'var(--ca-accent)' }}
                />

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'var(--ca-primary-light)', color: 'var(--ca-primary)' }}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-extrabold mb-1" style={{ color: 'var(--ca-primary)' }}>
                  {title}
                </h3>
                <p className="text-sm mb-5" style={{ color: 'var(--ca-muted)' }}>{desc}</p>

                <ul className="space-y-2 flex-grow">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ca-text)' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--ca-accent)' }} />
                      {item}
                    </li>
                  ))}
                </ul>

                <a
                  href={`/coming-soon/${slug}`}
                  className="mt-6 flex items-center gap-1.5 text-sm font-bold transition-colors"
                  style={{ color: 'var(--ca-primary)' }}
                >
                  Explore Services <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
