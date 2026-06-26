import AnimateIn from './AnimateIn';

const STEPS = [
  {
    num: '01',
    title: 'Share Your Requirements',
    desc: 'Tell us about your business, the services you need, and your timelines. A quick WhatsApp message or call is all it takes to get started.',
    icon: '💬',
  },
  {
    num: '02',
    title: 'Expert Consultation',
    desc: 'Our Chartered Accountants evaluate your case, identify the optimal structure, and hand you a clear, jargon-free action plan.',
    icon: '🧑‍💼',
  },
  {
    num: '03',
    title: 'Documentation & Filing',
    desc: 'We handle every form, government portal, and registration. You just send us the documents — we handle everything else.',
    icon: '📋',
  },
  {
    num: '04',
    title: 'Delivery & Ongoing Support',
    desc: 'Get your deliverables on time, plus proactive compliance reminders and advisory support as your business scales.',
    icon: '✅',
  },
];

export default function ProcessSteps() {
  return (
    <section id="about" className="py-24 px-5 overflow-hidden" style={{ background: 'var(--ca-bg-soft)' }}>
      <div className="max-w-[1200px] mx-auto">

        <AnimateIn className="text-center mb-20 space-y-3">
          <span
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ color: 'var(--ca-accent)', background: 'var(--ca-accent-light)' }}
          >
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: 'var(--ca-primary)' }}>
            From First Contact to<br />Full Compliance
          </h2>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--ca-muted)' }}>
            Our 4-step process is built so you always know exactly what&apos;s happening and when.
          </p>
        </AnimateIn>

        {/* Alternating timeline */}
        <div className="relative space-y-12 lg:space-y-0">

          {/* Vertical center line — desktop only */}
          <div
            className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-8 bottom-8 w-px"
            style={{ background: 'var(--ca-border)' }}
          />

          {STEPS.map(({ num, title, desc, icon }, i) => {
            const isLeft = i % 2 === 0;
            return (
              <AnimateIn key={num} from={isLeft ? 'left' : 'right'} delay={i * 100}
                className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center relative mb-14 last:mb-0"
              >
                {/* Content — alternate sides on desktop */}
                <div className={isLeft ? 'lg:text-right lg:pr-12' : 'lg:order-2 lg:pl-12'}>
                  <div
                    className={`flex items-start gap-4 ${isLeft ? 'lg:flex-row-reverse lg:justify-start' : ''}`}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                      style={{ background: 'white', border: '1px solid var(--ca-border)' }}
                    >
                      {icon}
                    </div>
                    <div>
                      <div
                        className="text-xs font-extrabold uppercase tracking-widest mb-1"
                        style={{ color: 'var(--ca-accent)' }}
                      >
                        Step {num}
                      </div>
                      <h3
                        className="text-xl font-extrabold mb-2"
                        style={{ color: 'var(--ca-primary)' }}
                      >
                        {title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--ca-muted)' }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Center node — desktop */}
                <div
                  className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center text-white text-sm font-extrabold shadow-lg z-10`}
                  style={{ background: 'var(--ca-primary)', border: '3px solid var(--ca-bg-soft)' }}
                >
                  {num}
                </div>

                {/* Empty column for the other side */}
                <div className={isLeft ? 'lg:order-2' : ''} />
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
