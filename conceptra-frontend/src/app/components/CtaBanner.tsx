import { ArrowRight, Phone } from 'lucide-react';
import AnimateIn from './AnimateIn';

const WA_LINK =
  'https://wa.me/918010450004?text=Hi%2C%20I%20want%20to%20talk%20to%20a%20specialist%20at%20Conceptra%20Advisory.';

export default function CtaBanner() {
  return (
    <section
      id="contact"
      className="relative py-28 px-5 overflow-hidden"
      style={{ background: 'var(--ca-primary)' }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06), transparent)' }}
      />
      <div
        className="absolute -bottom-32 -left-20 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04), transparent)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03), transparent)' }}
      />

      <div className="max-w-[780px] mx-auto text-center relative z-10">
        <AnimateIn>
          <div
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Free consultation — No commitments
          </div>

          <h2 className="text-5xl md:text-6xl font-extrabold text-white leading-[1.05] mb-6">
            Ready to Take
            <br />
            <span style={{ color: 'var(--ca-accent)' }}>Compliance Off</span> Your Plate?
          </h2>

          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Book a free 30-minute consultation with a senior CA at Conceptra. Clear answers, no jargon, no pressure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-extrabold text-sm px-9 py-4 rounded-full transition hover:opacity-90 shadow-xl"
              style={{ background: 'var(--ca-accent)', color: 'white' }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp a Specialist
              <ArrowRight className="w-4 h-4" />
            </a> */}

            <a
              href="tel:+918010450004"
              className="flex items-center gap-2 font-bold text-sm px-9 py-4 rounded-full border-2 transition hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
            >
              <Phone className="w-4 h-4 flex-shrink-0" />
              Call +91-8010450004
            </a>
          </div>

          {/* Trust strip */}
          <div className="flex items-center justify-center gap-6 mt-12 flex-wrap">
            {['No Hidden Charges', 'ICAI Registered', 'Response in 2 Hours', '10+ Years Experience'].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                <span className="w-1 h-1 rounded-full bg-green-400 inline-block" />
                {t}
              </span>
            ))}
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
