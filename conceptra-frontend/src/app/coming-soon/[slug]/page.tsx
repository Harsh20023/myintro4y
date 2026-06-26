import Link from 'next/link';
import { getAllServiceSlugs, getServiceName } from '../../lib/slug';

export function generateStaticParams() {
  return getAllServiceSlugs();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = getServiceName(slug);
  return {
    title: `${name} | Conceptra Advisory LLP`,
    description: `${name} — Coming Soon. Conceptra Advisory LLP is working on this service. Contact us for early access.`,
  };
}

export default async function ComingSoonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const serviceName = getServiceName(slug);

  return (
    <section
      className="min-h-[80vh] flex flex-col items-center justify-center px-5 text-center"
      style={{ background: 'var(--ca-bg-soft)' }}
    >
      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
        style={{ background: 'var(--ca-accent-light)', color: 'var(--ca-accent-dark)' }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--ca-accent)', display: 'inline-block' }}
        />
        Coming Soon
      </div>

      {/* Service name */}
      <h1
        className="text-4xl md:text-6xl font-extrabold leading-tight mb-4"
        style={{ color: 'var(--ca-primary)' }}
      >
        {serviceName}
      </h1>

      <p className="text-lg max-w-xl mb-10" style={{ color: 'var(--ca-muted)' }}>
        We are actively building this service. In the meantime, our experts are available to assist you — reach out and we will handle it personally.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="mailto:conceptra.advisory@gmail.com"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90"
          style={{ background: 'var(--ca-primary)' }}
        >
          Email Us
        </a>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base border-2 transition-colors hover:opacity-80"
          style={{ borderColor: 'var(--ca-primary)', color: 'var(--ca-primary)', background: 'white' }}
        >
          ← Back to Home
        </Link>
      </div>

      {/* Countdown placeholder card */}
      <div
        className="mt-16 grid grid-cols-3 gap-6 max-w-sm"
      >
        {['Expert Team', 'Quick Turnaround', '100% Compliant'].map((feat) => (
          <div
            key={feat}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl"
            style={{ background: 'white', border: '1px solid var(--ca-border)' }}
          >
            <span className="text-2xl">✓</span>
            <span className="text-xs font-semibold text-center" style={{ color: 'var(--ca-primary)' }}>
              {feat}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
