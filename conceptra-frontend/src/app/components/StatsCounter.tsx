'use client';
import { useEffect, useRef, useState } from 'react';

const STATS = [
  { target: 500, suffix: '+', label: 'Happy Clients', sub: 'across India' },
  { target: 10,  suffix: '+', label: 'Years Experience', sub: 'since 2014' },
  { target: 12,  suffix: '+', label: 'Service Lines', sub: 'under one roof' },
  { target: 98,  suffix: '%', label: 'Client Retention', sub: 'renewed yearly' },
];

function Counter({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return (
    <span ref={spanRef}>
      {count}{suffix}
    </span>
  );
}

export default function StatsCounter() {
  return (
    <section className="py-20 px-5" style={{ background: 'var(--ca-primary)' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.1)' }}>
          {STATS.map(({ target, suffix, label, sub }, i) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center text-center py-12 px-6 transition-colors hover:bg-white/5"
              style={{ background: 'var(--ca-primary)', animationDelay: `${i * 100}ms` }}
            >
              <p
                className="text-5xl md:text-6xl font-extrabold mb-2 tabular-nums"
                style={{ color: 'var(--ca-accent)' }}
              >
                <Counter target={target} suffix={suffix} />
              </p>
              <p className="font-bold text-white text-sm">{label}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
