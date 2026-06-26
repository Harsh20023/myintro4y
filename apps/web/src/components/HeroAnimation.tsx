'use client'

import { useRef, useEffect } from 'react'
import { FileText, CheckCircle, Download, Shield, Zap, BarChart2 } from 'lucide-react'

export function HeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const card      = cardRef.current
    if (!container || !card) return

    let raf = 0
    let targetX = -8, targetY = 4
    let currentX = -8, currentY = 4

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.08)
      currentY = lerp(currentY, targetY, 0.08)
      card.style.transform =
        `perspective(900px) rotateY(${currentX}deg) rotateX(${currentY}deg) translateZ(0px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const cx = rect.left + rect.width  / 2
      const cy = rect.top  + rect.height / 2
      targetX =  ((e.clientX - cx) / (rect.width  / 2)) * 14
      targetY = -((e.clientY - cy) / (rect.height / 2)) * 9
    }

    const onLeave = () => { targetX = -8; targetY = 4 }

    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full"
      style={{ minHeight: 420, cursor: 'default' }}
    >
      {/* ambient glow blobs */}
      <div
        className="absolute animate-pulse-glow"
        style={{
          width: 280, height: 280,
          background: 'radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%)',
          top: '10%', right: '5%', borderRadius: '50%', filter: 'blur(8px)',
        }}
      />
      <div
        className="absolute animate-pulse-glow"
        style={{
          width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
          bottom: '5%', left: '8%', borderRadius: '50%', filter: 'blur(8px)',
          animationDelay: '1.8s',
        }}
      />

      {/* orbiting dots */}
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i % 2 === 0 ? 6 : 4,
            height: i % 2 === 0 ? 6 : 4,
            background: i % 3 === 0 ? '#0d9488' : i % 3 === 1 ? '#8b5cf6' : '#f59e0b',
            opacity: 0.55,
            animation: `orbit${i % 2 === 0 ? '' : '-rev'} ${12 + i * 1.5}s linear infinite`,
            animationDelay: `${-i * 2.4}s`,
            left: '50%', top: '50%',
            transformOrigin: '0 0',
          }}
        />
      ))}

      {/* main 3-D card */}
      <div
        ref={cardRef}
        className="relative"
        style={{
          transform: 'perspective(900px) rotateY(-8deg) rotateX(4deg)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          zIndex: 10,
        }}
      >
        {/* drop shadow depth layer */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg,#0d9488 0%,#8b5cf6 100%)',
            opacity: 0.22,
            filter: 'blur(28px)',
            transform: 'translateY(24px) scaleX(0.9)',
          }}
        />

        {/* card surface */}
        <div
          className="relative bg-white rounded-2xl overflow-hidden animate-float"
          style={{
            width: 288,
            boxShadow: '0 24px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
            border: '1px solid rgba(255,255,255,0.9)',
          }}
        >
          {/* header */}
          <div style={{ background: 'linear-gradient(135deg,#0d9488 0%,#0f766e 100%)', padding: '16px 20px' }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 5 }}>
                  <FileText size={13} color="white" />
                </div>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Tax Invoice</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>#INV-2025</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 500, margin: 0 }}>Acme Technologies Pvt. Ltd.</p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '2px 0 0' }}>GSTIN: 27ABCDE1234F1Z5</p>
          </div>

          {/* line items */}
          <div style={{ padding: '14px 20px 0', fontSize: 12 }}>
            {[
              { name: 'Consulting Services', amount: '₹50,000' },
              { name: 'Software License',    amount: '₹25,000' },
            ].map(item => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0ede7' }}>
                <span style={{ color: '#7a7568' }}>{item.name}</span>
                <span style={{ color: '#252320', fontWeight: 500 }}>{item.amount}</span>
              </div>
            ))}

            {/* tax breakdown */}
            <div style={{ padding: '10px 0 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[['CGST @ 9%','₹6,750'],['SGST @ 9%','₹6,750']].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize: 11, color: '#aaa695' }}>
                  <span>{k}</span><span>{v}</span>
                </div>
              ))}
            </div>

            {/* total */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: '10px 0', borderTop: '1px solid #efeee9' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#252320' }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0d9488' }}>₹88,500</span>
            </div>
          </div>

          {/* download button */}
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f0fdf9', borderRadius: 12, padding: '10px 14px',
              border: '1px solid #ccfbef',
            }}>
              <Download size={13} color="#0d9488" />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#0f766e' }}>Download PDF</span>
              <CheckCircle size={12} color="#14b8a6" style={{ marginLeft: 'auto' }} />
            </div>
          </div>

          {/* shimmer sweep */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)',
              animation: 'sweep 3.2s ease-in-out infinite',
              animationDelay: '1s',
            }}
          />
        </div>

        {/* floating badge — GST Compliant */}
        <div
          className="absolute animate-float-slow"
          style={{
            top: -16, right: -52,
            background: 'white',
            borderRadius: 12,
            padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            border: '1px solid #efeee9',
            fontSize: 12, fontWeight: 500, color: '#252320',
            animationDelay: '0s',
            whiteSpace: 'nowrap',
          }}
        >
          <Shield size={13} color="#0d9488" />
          GST Compliant
        </div>

        {/* floating badge — Instant PDF */}
        <div
          className="absolute animate-float"
          style={{
            bottom: 20, left: -56,
            background: 'white',
            borderRadius: 12,
            padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            border: '1px solid #efeee9',
            fontSize: 12, fontWeight: 500, color: '#252320',
            animationDelay: '1.8s',
            whiteSpace: 'nowrap',
          }}
        >
          <Zap size={13} color="#8b5cf6" />
          Instant PDF
        </div>

        {/* floating badge — 10k+ users */}
        <div
          className="absolute animate-float-slower"
          style={{
            bottom: -18, right: -36,
            background: 'linear-gradient(135deg,#0d9488,#0f766e)',
            borderRadius: 12,
            padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 8px 24px rgba(13,148,136,0.35)',
            fontSize: 12, fontWeight: 600, color: 'white',
            animationDelay: '0.9s',
            whiteSpace: 'nowrap',
          }}
        >
          <BarChart2 size={13} color="rgba(255,255,255,0.85)" />
          10k+ invoices
        </div>
      </div>

      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(155px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(155px) rotate(-360deg); }
        }
        @keyframes orbit-rev {
          from { transform: rotate(0deg) translateX(125px) rotate(0deg); }
          to   { transform: rotate(-360deg) translateX(125px) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
