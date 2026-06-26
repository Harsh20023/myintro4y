'use client';
import { useState } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { SERVICE_TABS } from '../data/services';

const WA_LINK = 'https://wa.me/918010450004?text=Hi%2C%20I%20want%20a%20free%20consultation%20with%20Conceptra%20Advisory.';

export default function ServicesTabs() {
  const [activeTab, setActiveTab] = useState(SERVICE_TABS[0].id);
  const current = SERVICE_TABS.find((t) => t.id === activeTab)!;

  return (
    <section id="services" className="py-20 px-5" style={{ backgroundColor: 'var(--ca-bg)' }}>
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ color: 'var(--ca-accent)', backgroundColor: 'var(--ca-accent-light)' }}
          >
            Our Services
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 tracking-tight" style={{ color: 'var(--ca-primary)' }}>
            Navigating Finance &amp; Compliance<br />With Precision
          </h2>
          <p className="mt-3 text-[var(--ca-muted)] text-sm max-w-xl mx-auto">
            Click any service category to explore our full scope of solutions.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto gap-2 pb-1 mb-8 scrollbar-hide">
          {SERVICE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition border ${
                activeTab === tab.id
                  ? 'text-white border-transparent'
                  : 'bg-white text-[var(--ca-primary)] border-[var(--ca-border)] hover:border-[var(--ca-primary)]'
              }`}
              style={
                activeTab === tab.id
                  ? { backgroundColor: 'var(--ca-primary)', borderColor: 'var(--ca-primary)' }
                  : {}
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div
          className="rounded-2xl border grid grid-cols-1 md:grid-cols-[40%_60%] overflow-hidden"
          style={{ borderColor: 'var(--ca-border)', backgroundColor: 'var(--ca-bg-soft)' }}
        >
          {/* Sub-items list */}
          <div className="border-b md:border-b-0 md:border-r p-6 space-y-1" style={{ borderColor: 'var(--ca-border)' }}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--ca-muted)] mb-4">
              Included Services
            </p>
            {current.subItems.map((item) => (
              <a
                key={item}
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-xl transition group"
                style={{ color: 'var(--ca-primary)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--ca-primary-light)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <span className="text-sm font-semibold">{item}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition" />
              </a>
            ))}
          </div>

          {/* Description + CTAs */}
          <div className="p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold" style={{ color: 'var(--ca-primary)' }}>
                {current.label}
              </h3>
              <p className="text-[var(--ca-muted)] leading-relaxed text-sm">{current.description}</p>
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              <a
                href="#contact"
                className="flex items-center gap-2 text-white font-bold px-6 py-3 rounded-full text-sm transition hover:opacity-90"
                style={{ backgroundColor: 'var(--ca-accent)' }}
              >
                {current.cta} <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-bold px-6 py-3 rounded-full border-2 text-sm transition hover:opacity-80"
                style={{ borderColor: 'var(--ca-primary)', color: 'var(--ca-primary)' }}
              >
                Get Quotation <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
