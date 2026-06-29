import Link from 'next/link';
import { ArrowRight, Check, ChevronRight, Phone } from 'lucide-react';
import FAQAccordion from '../../components/FAQAccordion';
import { getCategories, getServiceBySlug } from '../../lib/api';
import { toSlug } from '../../lib/slug';
import { NAV_DROPDOWNS } from '../../data/navMenu';
import type { PageSection, PageBlock } from '../../lib/api';

export async function generateStaticParams() {
  // Slugs from navMenu (always available, no API needed)
  const navSlugs = NAV_DROPDOWNS
    .find((m) => m.label === 'Registrations')
    ?.columns.flatMap((col) => col.items.map((item) => ({ slug: toSlug(item) }))) ?? [];

  // Slugs from API (may include additional services)
  const categories = await getCategories();
  const apiSlugs = categories.flatMap((cat) =>
    cat.services.map((svc) => ({ slug: svc.slug }))
  );

  // Merge, deduplicate by slug
  const seen = new Set<string>();
  return [...navSlugs, ...apiSlugs].filter(({ slug }) => {
    if (seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getServiceBySlug(slug);
  if (!data) return {};
  const { service, page } = data;
  return {
    title: `${page?.heroTitle ?? service.name} | Conceptra Advisory LLP`,
    description: page?.heroSubtitle ?? service.shortDescription ?? '',
  };
}

// ── Section renderers ─────────────────────────────────────────────────────────

function Steps({ blocks }: { blocks: PageBlock[] }) {
  return (
    <div className="max-w-2xl">
      {blocks.map((blk, i) => (
        <div key={blk._id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'var(--ca-primary)' }}
            >
              {i + 1}
            </div>
            {i < blocks.length - 1 && (
              <div className="w-0.5 flex-1 min-h-[28px] mt-1" style={{ background: 'var(--ca-border)' }} />
            )}
          </div>
          <div className="pb-8 min-w-0">
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--ca-text)' }}>{blk.title}</p>
            {blk.body && <p className="text-sm leading-relaxed" style={{ color: 'var(--ca-muted)' }}>{blk.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardGrid({ blocks }: { blocks: PageBlock[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {blocks.map((blk) => (
        <div
          key={blk._id}
          className="p-5 rounded-2xl"
          style={{ background: 'white', border: '1px solid var(--ca-border)' }}
        >
          <p className="font-bold text-sm mb-1.5" style={{ color: 'var(--ca-text)' }}>{blk.title}</p>
          {blk.body && <p className="text-sm leading-relaxed" style={{ color: 'var(--ca-muted)' }}>{blk.body}</p>}
        </div>
      ))}
    </div>
  );
}

function Checklist({ blocks }: { blocks: PageBlock[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {blocks.map((blk) => (
        <div
          key={blk._id}
          className="flex gap-3 p-4 rounded-xl"
          style={{ background: 'white', border: '1px solid var(--ca-border)' }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'var(--ca-primary-light)' }}
          >
            <Check className="w-3 h-3" style={{ color: 'var(--ca-primary)' }} strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--ca-text)' }}>{blk.title}</p>
            {blk.body && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--ca-muted)' }}>{blk.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function PricingCards({ blocks }: { blocks: PageBlock[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {blocks.map((blk) => {
        const meta = blk.metadata as { price?: string; badge?: string | null; includes?: string[] } | undefined;
        const highlighted = !!meta?.badge;
        return (
          <div
            key={blk._id}
            className="relative flex flex-col p-6 rounded-2xl"
            style={{
              background: 'white',
              border: `1px solid ${highlighted ? 'var(--ca-primary)' : 'var(--ca-border)'}`,
              boxShadow: highlighted ? '0 0 0 1px var(--ca-primary)' : undefined,
            }}
          >
            {meta?.badge && (
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap"
                style={{ background: 'var(--ca-primary)' }}
              >
                {meta.badge}
              </div>
            )}
            {meta?.price && (
              <p className="font-extrabold text-3xl mb-1" style={{ color: 'var(--ca-primary)' }}>{meta.price}</p>
            )}
            <p className="font-bold text-base mb-2" style={{ color: 'var(--ca-text)' }}>{blk.title}</p>
            {blk.body && <p className="text-sm mb-5" style={{ color: 'var(--ca-muted)' }}>{blk.body}</p>}
            {meta?.includes && (
              <ul className="space-y-2 mt-auto">
                {meta.includes.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ca-text)' }}>
                    <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--ca-primary)' }} strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <button
              className="mt-6 w-full py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: 'var(--ca-primary)' }}
            >
              Get Started
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SectionRenderer({ section, index }: { section: PageSection; index: number }) {
  const blocks = section.blocks.slice().sort((a, b) => a.displayOrder - b.displayOrder);

  let content: React.ReactNode;
  switch (section.type) {
    case 'STEPS':              content = <Steps blocks={blocks} />; break;
    case 'DOCUMENTS_REQUIRED': content = <Checklist blocks={blocks} />; break;
    case 'PRICING':            content = <PricingCards blocks={blocks} />; break;
    case 'FAQ':                content = <FAQAccordion blocks={blocks} />; break;
    default:                   content = <CardGrid blocks={blocks} />;
  }

  return (
    <section
      className="py-14"
      style={{ background: index % 2 === 0 ? 'var(--ca-bg-soft)' : 'white' }}
    >
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="font-extrabold text-2xl md:text-3xl mb-8" style={{ color: 'var(--ca-primary)' }}>
          {section.heading}
        </h2>
        {content}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getServiceBySlug(slug);

  if (!data) {
    return (
      <section className="min-h-[70vh] flex flex-col items-center justify-center px-5 text-center" style={{ background: 'var(--ca-bg-soft)' }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8" style={{ background: 'var(--ca-accent-light)', color: 'var(--ca-accent-dark)' }}>
          Coming Soon
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--ca-primary)' }}>
          {slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </h1>
        <p className="text-lg max-w-xl mb-8" style={{ color: 'var(--ca-muted)' }}>
          We are actively building this service. Our experts are available to assist you personally in the meantime.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="mailto:conceptra.advisory@gmail.com" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90" style={{ background: 'var(--ca-primary)' }}>
            Email Us <ArrowRight className="w-4 h-4" />
          </a>
          <Link href="/services" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base border-2 transition-colors hover:opacity-80" style={{ borderColor: 'var(--ca-primary)', color: 'var(--ca-primary)', background: 'white' }}>
            ← All Services
          </Link>
        </div>
      </section>
    );
  }

  const { service, page } = data;
  const cat = typeof service.categoryId === 'object' ? service.categoryId : null;

  const visibleSections = (page?.sections ?? [])
    .filter((s) => s.isVisible && s.blocks.length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      {/* Hero */}
      <section style={{ background: 'var(--ca-primary)' }}>
        <div className="max-w-[1200px] mx-auto px-5 py-16 md:py-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-white/50 text-xs mb-6 flex-wrap">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/services" className="hover:text-white/80 transition-colors">Services</Link>
            {cat && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/60">{cat.name}</span>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/80">{service.name}</span>
          </div>

          <div className="max-w-2xl">
            {cat && (
              <p className="text-sm font-bold mb-3 opacity-70" style={{ color: 'var(--ca-accent)' }}>
                {cat.name}
              </p>
            )}
            <h1 className="font-extrabold text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-4">
              {page?.heroTitle ?? service.name}
            </h1>
            {(page?.heroSubtitle ?? service.shortDescription) && (
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                {page?.heroSubtitle ?? service.shortDescription}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:conceptra.advisory@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90"
                style={{ background: 'var(--ca-accent)' }}
              >
                {page?.heroCTAText ?? 'Get Started'} <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="tel:+91XXXXXXXXXX"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
              >
                <Phone className="w-4 h-4" /> Talk to an Expert
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      {(page?.overviewText || page?.eligibilityText) && (
        <section className="py-14" style={{ background: 'white' }}>
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {page?.overviewText && (
                <div className="lg:col-span-2">
                  <h2 className="font-extrabold text-2xl md:text-3xl mb-5" style={{ color: 'var(--ca-primary)' }}>
                    What is {service.name}?
                  </h2>
                  <div className="space-y-4 leading-relaxed text-sm" style={{ color: 'var(--ca-muted)' }}>
                    {page.overviewText.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              )}
              {page?.eligibilityText && (
                <div
                  className="p-6 rounded-2xl h-fit"
                  style={{ background: 'var(--ca-primary-light)', border: '1px solid rgba(16,64,160,0.15)' }}
                >
                  <h3 className="font-bold mb-3" style={{ color: 'var(--ca-primary)' }}>Eligibility</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--ca-text)' }}>
                    {page.eligibilityText}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic sections */}
      {visibleSections.map((sec, i) => (
        <SectionRenderer key={sec._id} section={sec} index={i} />
      ))}

      {/* Final CTA */}
      <section style={{ background: 'var(--ca-primary)' }}>
        <div className="max-w-[1200px] mx-auto px-5 py-16 text-center">
          <h2 className="font-extrabold text-2xl md:text-3xl text-white mb-3">
            Ready to get started?
          </h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto text-sm">
            Our expert CAs will guide you through the entire {service.name} process — end to end.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="mailto:conceptra.advisory@gmail.com"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90"
              style={{ background: 'var(--ca-accent)' }}
            >
              {page?.heroCTAText ?? 'Get Started'} <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="tel:+91XXXXXXXXXX"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-colors"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
            >
              <Phone className="w-4 h-4" /> Call Us Now
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
