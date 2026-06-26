import { ArrowRight, CheckCircle, Star, LayoutDashboard } from 'lucide-react';

const WA_LINK =
  'https://wa.me/918010450004?text=Hi%2C%20I%20want%20a%20free%20consultation%20with%20Conceptra%20Advisory.';

const COMPLIANCE_ITEMS = [
  { label: 'GST Q1 Returns',    status: 'Filed',     dot: '#22c55e' },
  { label: 'TDS Quarterly',     status: 'Submitted', dot: '#22c55e' },
  { label: 'ROC Annual Return', status: 'Completed', dot: '#22c55e' },
  { label: 'Payroll Oct 2026',  status: 'Processed', dot: '#22c55e' },
  { label: 'Income Tax FY27',   status: 'Assessed',  dot: '#22c55e' },
];

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden min-h-[90vh] flex items-center px-5 pt-8 pb-20"
      style={{
        background:
          'linear-gradient(135deg, #ffffff 0%, var(--ca-primary-light) 60%, #ffffff 100%)',
      }}
    >
      {/* Decorative background blobs */}
      <div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--ca-primary-light), transparent)' }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--ca-accent-light), transparent)' }}
      />

      <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[55%_45%] gap-14 items-center relative z-10">

        {/* Left — text */}
        <div className="space-y-7">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full border"
            style={{
              color: 'var(--ca-primary)',
              borderColor: 'var(--ca-primary)',
              backgroundColor: 'var(--ca-primary-light)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--ca-primary)' }} />
            India&apos;s Trusted CA &amp; Business Advisory Firm
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-[58px] font-extrabold leading-[1.07] tracking-tight"
            style={{ color: 'var(--ca-primary)' }}
          >
            Your Business,{' '}
            <span style={{ color: 'var(--ca-accent)' }}>Fully Compliant.</span>
            <br />
            Always.
          </h1>

          <p className="text-lg leading-relaxed max-w-[500px]" style={{ color: 'var(--ca-muted)' }}>
            Conceptra Advisory LLP handles your taxation, audit, company formation, payroll, and compliance — so you can focus entirely on growing your business.
          </p>

          <ul className="space-y-3">
            {[
              'Expert Chartered Accountants & MBA Professionals',
              'Pan-India Coverage — 500+ Businesses Served',
              'FY 2026-27 Compliance Ready from Day One',
            ].map((pt) => (
              <li key={pt} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--ca-text)' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--ca-accent)' }} />
                {pt}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-4 pt-1">
            {/* <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-full transition hover:opacity-90 shadow-lg shadow-black/10 text-sm"
              style={{ backgroundColor: 'var(--ca-accent)' }}
            >
              Get Free Consultation <ArrowRight className="w-4 h-4" />
            </a> */}
            <a
              href="#services"
              className="flex items-center gap-2 font-bold px-7 py-3.5 rounded-full border-2 transition hover:bg-white text-sm"
              style={{ borderColor: 'var(--ca-primary)', color: 'var(--ca-primary)' }}
            >
              Explore Services
            </a>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4" style={{ fill: 'var(--ca-gold)', color: 'var(--ca-gold)' }} />
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--ca-muted)' }}>
              <span className="font-bold" style={{ color: 'var(--ca-text)' }}>4.9/5</span> · Trusted by 500+ businesses across India
            </p>
          </div>
        </div>

        {/* Right — Compliance Dashboard visual */}
        <div className="relative flex items-center justify-center py-8">

          {/* Top-right floating badge */}
          <div className="absolute -top-2 right-0 ca-float z-20">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg text-xs font-bold"
              style={{ background: 'white', border: '1px solid var(--ca-border)', color: 'var(--ca-primary)' }}
            >
              <Star className="w-3 h-3" style={{ fill: 'var(--ca-gold)', color: 'var(--ca-gold)' }} />
              4.9 Rated on Google
            </div>
          </div>

          {/* Bottom-left floating badge */}
          <div className="absolute -bottom-2 left-0 ca-float-2 z-20">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg text-xs font-bold"
              style={{ background: 'white', border: '1px solid var(--ca-border)', color: 'var(--ca-primary)' }}
            >
              🏆 500+ Happy Clients
            </div>
          </div>

          {/* Main dashboard card */}
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{ border: '1px solid var(--ca-border)', background: 'white' }}
          >
            {/* Card header */}
            <div
              className="px-5 py-4 flex items-center justify-between border-b"
              style={{ background: 'var(--ca-bg-soft)', borderColor: 'var(--ca-border)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--ca-primary)' }}
                >
                  <LayoutDashboard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-extrabold" style={{ color: 'var(--ca-primary)' }}>
                    Compliance Dashboard
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--ca-muted)' }}>FY 2026-27</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                LIVE
              </span>
            </div>

            {/* Items */}
            <div className="px-5 py-4 space-y-1">
              {COMPLIANCE_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                  style={{ borderColor: 'var(--ca-border)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.dot }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--ca-text)' }}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    ✓ {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 flex items-center gap-2" style={{ background: '#f0fdf4' }}>
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-green-700">
                Zero penalties · All filings current
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
