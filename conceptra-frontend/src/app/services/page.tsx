import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCategories } from '../lib/api';

export const metadata = {
  title: 'Registration & Compliance Services | Conceptra Advisory LLP',
  description: 'Incorporate your company, get GST registration, licences and stay compliant — all managed by expert CAs at Conceptra Advisory.',
};

export default async function ServicesPage() {
  const categories = await getCategories();

  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-20" style={{ background: 'var(--ca-primary)' }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4 opacity-70"
            style={{ color: 'white' }}
          >
            Expert CA-Assisted Services
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Registration &amp; Compliance<br className="hidden md:block" /> Services
          </h1>
          <p className="text-white/70 text-lg max-w-xl leading-relaxed">
            Incorporate your company, stay compliant, and get the licences you need — all managed by our expert CAs.
          </p>
        </div>
      </section>

      {/* Categories & services */}
      <section className="max-w-[1200px] mx-auto px-5 py-16">
        {categories.length === 0 ? (
          <p style={{ color: 'var(--ca-muted)' }} className="text-sm">
            No services available right now. Check back soon.
          </p>
        ) : (
          <div className="space-y-14">
            {categories.map((cat) => (
              <div key={cat._id}>
                <h2
                  className="font-extrabold text-xl mb-6 pb-3"
                  style={{ color: 'var(--ca-primary)', borderBottom: '2px solid var(--ca-primary-light)' }}
                >
                  {cat.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.services.map((svc) => (
                    <Link
                      key={svc._id}
                      href={`/services/${svc.slug}`}
                      className="service-card group flex flex-col gap-3 p-5"
                    >
                      <h3 className="font-bold text-base" style={{ color: 'var(--ca-text)' }}>
                        {svc.name}
                      </h3>
                      {svc.shortDescription && (
                        <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--ca-muted)' }}>
                          {svc.shortDescription}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-sm font-bold mt-auto" style={{ color: 'var(--ca-primary)' }}>
                        Learn more <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section style={{ background: 'var(--ca-primary)' }}>
        <div className="max-w-[1200px] mx-auto px-5 py-14 text-center">
          <h2 className="font-extrabold text-2xl md:text-3xl text-white mb-3">
            Not sure which service you need?
          </h2>
          <p className="text-white/70 mb-7 max-w-md mx-auto text-sm">
            Talk to one of our CAs — free initial consultation, no commitment.
          </p>
          <a
            href="mailto:conceptra.advisory@gmail.com"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base transition-opacity hover:opacity-90"
            style={{ background: 'var(--ca-accent)', color: 'white' }}
          >
            Book a Free Consultation <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </>
  );
}
