const BRANDS = [
  'Tech Startups', 'Manufacturing SMEs', 'E-Commerce Brands', 'Export Firms',
  'Healthcare Companies', 'Service Businesses', 'Trading Companies', 'Real Estate Firms',
  'Educational Institutions', 'FMCG Distributors', 'IT Consultancies', 'Logistics & Supply',
];

export default function BrandMarquee() {
  const doubled = [...BRANDS, ...BRANDS];

  return (
    <section className="py-10 overflow-hidden" style={{ backgroundColor: 'var(--ca-bg-soft)' }}>
      <div className="max-w-[1200px] mx-auto px-5 text-center mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ca-muted)' }}>
          Trusted by growing businesses across India
        </p>
        <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--ca-primary)' }}>
          Client Industries We Serve
        </h2>
      </div>

      {/* Fade masks + scroll track */}
      <div className="relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, var(--ca-bg-soft), transparent)' }}
        />
        <div
          className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, var(--ca-bg-soft), transparent)' }}
        />

        {/* Track — uses inline style for animation to avoid Tailwind animate-* conflict */}
        <div
          className="marquee-track"
          style={{
            display: 'flex',
            width: 'max-content',
            animation: 'marquee-scroll 30s linear infinite',
          }}
        >
          {doubled.map((brand, i) => (
            <div
              key={i}
              style={{
                margin: '0 10px',
                padding: '10px 20px',
                borderRadius: '9999px',
                border: '1px solid var(--ca-border)',
                color: 'var(--ca-primary)',
                backgroundColor: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
