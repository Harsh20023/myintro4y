import { Star } from 'lucide-react';
import { TESTIMONIALS } from '../data/testimonials';
import AnimateIn from './AnimateIn';

export default function Testimonials() {
  return (
    <section className="py-24 px-5" style={{ background: 'var(--ca-bg-soft)' }}>
      <div className="max-w-[1200px] mx-auto">

        <AnimateIn className="text-center mb-14 space-y-3">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ color: 'var(--ca-accent)', background: 'var(--ca-accent-light)' }}
          >
            Client Reviews
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold" style={{ color: 'var(--ca-primary)' }}>
            What Our Clients Say
          </h2>

          {/* Google rating badge */}
          <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-3 shadow-sm border mt-2" style={{ borderColor: 'var(--ca-border)' }}>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5" style={{ fill: 'var(--ca-gold)', color: 'var(--ca-gold)' }} />
              ))}
            </div>
            <div className="text-left">
              <p className="font-extrabold text-lg leading-none" style={{ color: 'var(--ca-primary)' }}>4.9 / 5</p>
              <p className="text-xs" style={{ color: 'var(--ca-muted)' }}>Based on 60+ verified reviews</p>
            </div>
          </div>
        </AnimateIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIALS.map(({ name, company, role, review, initials, color }, i) => (
            <AnimateIn key={name} delay={i * 80}>
              <div
                className="relative bg-white rounded-2xl p-6 border h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ borderColor: 'var(--ca-border)' }}
              >
                {/* Large decorative quote */}
                <div
                  className="absolute top-4 right-5 text-5xl font-serif leading-none select-none pointer-events-none"
                  style={{ color: 'var(--ca-primary-light)' }}
                >
                  &ldquo;
                </div>

                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5" style={{ fill: 'var(--ca-gold)', color: 'var(--ca-gold)' }} />
                  ))}
                </div>

                <p className="text-sm leading-relaxed flex-grow relative z-10" style={{ color: 'var(--ca-muted)' }}>
                  &ldquo;{review}&rdquo;
                </p>

                <div
                  className="flex items-center gap-3 pt-4 mt-4 border-t"
                  style={{ borderColor: 'var(--ca-border)' }}
                >
                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--ca-primary)' }}>{name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--ca-muted)' }}>{role}, {company}</p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
