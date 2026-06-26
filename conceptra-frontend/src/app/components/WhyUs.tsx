import { CheckCircle, Clock, Users, Award, Headphones, ShieldCheck } from 'lucide-react';
import AnimateIn from './AnimateIn';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'ICAI-Registered CAs',
    desc: 'Every engagement is led by qualified Chartered Accountants — not interns or bots.',
  },
  {
    icon: Clock,
    title: 'Always On Time',
    desc: '100% on-time filing record. We track every due date so you never face a penalty.',
  },
  {
    icon: Users,
    title: 'Dedicated Account Manager',
    desc: 'One point of contact. You always know who to call and get a response in under 2 hours.',
  },
  {
    icon: Award,
    title: '10+ Years of Trust',
    desc: 'Serving Indian businesses since 2014 — from solo founders to mid-size enterprises.',
  },
  {
    icon: Headphones,
    title: 'Year-Round Support',
    desc: 'Not just at filing time. We are your ongoing compliance partner through every season.',
  },
  {
    icon: CheckCircle,
    title: 'Transparent Pricing',
    desc: 'No hidden charges, no surprise invoices. Clear scope, clear cost, always.',
  },
];

const USP_LIST = [
  'Expert CAs & MBAs — Direct Access, No Middlemen',
  '500+ Businesses Empowered Across India',
  'Full Compliance Coverage: Tax, GST, Payroll, Audit',
  '95%+ Client Retention Rate — We Earn Renewals',
];

export default function WhyUs() {
  return (
    <section id="why-us" className="py-24 px-5" style={{ background: 'var(--ca-primary)' }}>
      <div className="max-w-[1200px] mx-auto">

        {/* Top: headline + USPs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center mb-20">
          <AnimateIn from="left">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Why Conceptra
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
              The Conceptra<br />
              <span style={{ color: 'var(--ca-accent)' }}>Advantage</span>
            </h2>
            <p className="text-base mb-8 max-w-md leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              We combine deep domain expertise, ethical practice, and genuine personal attention — delivering advisory that actually moves your business forward.
            </p>
            <ul className="space-y-4">
              {USP_LIST.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--ca-accent)' }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </AnimateIn>

          {/* Right: large quote / trust statement */}
          <AnimateIn from="right" delay={150}>
            <div
              className="rounded-2xl p-8"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div className="text-6xl mb-4 leading-none" style={{ color: 'var(--ca-accent)', opacity: 0.5 }}>
                &ldquo;
              </div>
              <p className="text-lg font-semibold text-white leading-relaxed mb-6">
                Running a business shouldn&apos;t mean drowning in compliance paperwork. That&apos;s exactly what Conceptra is here to solve — completely and professionally.
              </p>
              <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'var(--ca-accent)', color: 'white' }}
                >
                  CA
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Founding Team</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Conceptra Advisory LLP, Gurugram</p>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <AnimateIn key={title} delay={i * 70}>
              <div
                className="flex gap-4 p-6 rounded-2xl transition-colors hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--ca-accent)', color: 'white' }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>

      </div>
    </section>
  );
}
