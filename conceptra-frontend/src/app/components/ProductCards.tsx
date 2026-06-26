import { ArrowRight, Package, Rocket, BarChart3 } from 'lucide-react';

const PRODUCTS = [
  {
    icon: Package,
    name: 'Annual Compliance Pack',
    desc: 'Complete statutory filing, ROC annual returns, income tax, and audit support bundled for the full year. One price, zero surprises.',
    cta: 'Get Started',
    comingSoon: false,
  },
  {
    icon: Rocket,
    name: 'Startup Launch Pack',
    desc: 'Company incorporation, GST registration, PAN/TAN, and your first 3-month compliance setup — everything to launch your Indian business.',
    cta: 'Launch Now',
    comingSoon: false,
  },
  {
    icon: BarChart3,
    name: 'Virtual CFO Suite',
    desc: 'Ongoing financial advisory, MIS reporting, budgeting, and CFO-level strategic guidance for scaling businesses. Expert pair of hands on your finances.',
    cta: 'Coming Soon',
    comingSoon: true,
  },
];

export default function ProductCards() {
  return (
    <section className="py-20 px-5" style={{ backgroundColor: 'var(--ca-bg)' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ color: 'var(--ca-accent)', backgroundColor: 'var(--ca-accent-light)' }}
          >
            Our Core Products
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 tracking-tight" style={{ color: 'var(--ca-primary)' }}>
            Packaged Solutions for Every Stage
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRODUCTS.map(({ icon: Icon, name, desc, cta, comingSoon }) => (
            <div
              key={name}
              className="relative border rounded-2xl p-7 flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
              style={{ borderColor: 'var(--ca-border)', backgroundColor: 'var(--ca-bg)' }}
            >
              {comingSoon && (
                <div
                  className="absolute top-4 right-4 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--ca-accent-light)', color: 'var(--ca-accent-dark)' }}
                >
                  🔜 Coming Soon
                </div>
              )}

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--ca-primary-light)' }}
              >
                <Icon className="w-6 h-6" style={{ color: 'var(--ca-primary)' }} />
              </div>

              {/* Content */}
              <h3 className="font-extrabold text-lg mb-3" style={{ color: 'var(--ca-primary)' }}>
                {name}
              </h3>
              <p className="text-sm text-[var(--ca-muted)] leading-relaxed flex-grow">{desc}</p>

              {/* CTA */}
              <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--ca-border)' }}>
                {comingSoon ? (
                  <span className="text-sm font-bold text-[var(--ca-muted)] cursor-not-allowed">{cta}</span>
                ) : (
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1.5 text-sm font-bold transition hover:opacity-70"
                    style={{ color: 'var(--ca-accent)' }}
                  >
                    {cta} <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
