'use client';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Sparkles, Shield, ChevronDown, ArrowRight } from 'lucide-react';
import { NAV_DROPDOWNS, type NavDropdown } from '../data/navMenu';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openDropdown(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveDropdown(label);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function dropdownWidth(col: number) {
    if (col === 1) return 'w-64';
    if (col === 2) return 'w-[520px]';
    if (col === 3) return 'w-[760px]';
    return 'w-[700px]';
  }

  function dropdownLeft(col: number) {
    if (col === 1) return 'left-0';
    if (col === 2) return '-left-32';
    if (col === 3) return '-left-52';
    return '-left-40';
  }

  function gridCols(col: number) {
    if (col === 1) return 'grid-cols-1';
    if (col === 2) return 'grid-cols-2';
    if (col >= 3) return 'grid-cols-3';
    return 'grid-cols-2';
  }

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      {/* FY badge strip */}
      {/* <div
        className="w-full text-center text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2"
        style={{ backgroundColor: 'var(--ca-accent-light)', color: 'var(--ca-accent-dark)' }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        FY 2026-27 Tax &amp; Compliance Season — Now Active. Get Expert Help Today.
      </div> */}

      {/* Main bar */}
      <div className="max-w-[1200px] mx-auto px-5 h-[68px] flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight flex-shrink-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--ca-primary)' }}
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div style={{ color: 'var(--ca-primary)' }}>
            CONCEPTRA<span className="font-medium opacity-70"> ADVISORY</span>
          </div>
        </a>

        {/* Desktop mega-menu nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_DROPDOWNS.map((menu: NavDropdown) => (
            <div
              key={menu.label}
              className="relative"
              onMouseEnter={() => openDropdown(menu.label)}
              onMouseLeave={scheduleClose}
            >
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{
                  color: 'var(--ca-primary)',
                  backgroundColor: activeDropdown === menu.label ? 'var(--ca-primary-light)' : '',
                }}
                onMouseEnter={(e) => {
                  if (activeDropdown !== menu.label)
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--ca-primary-light)';
                }}
                onMouseLeave={(e) => {
                  if (activeDropdown !== menu.label)
                    (e.currentTarget as HTMLElement).style.backgroundColor = '';
                }}
              >
                {menu.label}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === menu.label ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {activeDropdown === menu.label && (
                <div
                  className={`dropdown-panel absolute top-full mt-2 ${dropdownWidth(menu.columns.length)} ${dropdownLeft(menu.columns.length)} bg-white rounded-2xl shadow-2xl border border-slate-100/80 z-50 overflow-hidden`}
                >
                  {/* Gradient accent bar */}
                  <div
                    className="h-[3px] w-full"
                    style={{ background: 'linear-gradient(90deg, var(--ca-primary), var(--ca-accent))' }}
                  />

                  <div className={`grid ${gridCols(menu.columns.length)} gap-0 p-6`}>
                    {menu.columns.map((col, ci) => (
                      <div
                        key={col.heading}
                        className={ci > 0 ? 'pl-6 border-l border-slate-100' : ''}
                      >
                        {/* Premium column heading */}
                        <div className="flex items-center gap-2 mb-4">
                          <span
                            className="w-[3px] h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: 'var(--ca-primary)' }}
                          />
                          <p
                            className="text-[10px] font-extrabold uppercase tracking-widest"
                            style={{ color: 'var(--ca-primary)' }}
                          >
                            {col.heading}
                          </p>
                        </div>

                        <ul className="space-y-0.5">
                          {col.items.map((item) => (
                            <li key={item}>
                              <a
                                href="https://gst.conceptra.co.in/#tools"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 transition-all duration-150"
                                onMouseEnter={(e) => {
                                  const el = e.currentTarget as HTMLElement;
                                  el.style.backgroundColor = 'var(--ca-primary-light)';
                                  el.style.color = 'var(--ca-primary)';
                                }}
                                onMouseLeave={(e) => {
                                  const el = e.currentTarget as HTMLElement;
                                  el.style.backgroundColor = '';
                                  el.style.color = '';
                                }}
                              >
                                <span className="font-medium">{item}</span>
                                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 flex-shrink-0" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Premium footer */}
                  <div
                    className="px-6 py-3.5 flex items-center justify-between border-t border-slate-100"
                    style={{ backgroundColor: 'var(--ca-primary-light)' }}
                  >
                    <span className="text-xs text-slate-500">All services launching soon</span>
                    <a
                      href="https://gst.conceptra.co.in/#tools"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-70"
                      style={{ color: 'var(--ca-primary)' }}
                    >
                      Contact Us <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-5 pb-6 pt-3 overflow-y-auto max-h-[80vh]">
          {NAV_DROPDOWNS.map((menu: NavDropdown) => (
            <div key={menu.label} className="border-b border-slate-100">
              <button
                className="w-full flex items-center justify-between py-3.5 font-semibold text-sm text-left"
                style={{ color: 'var(--ca-primary)' }}
                onClick={() =>
                  setMobileExpanded(mobileExpanded === menu.label ? null : menu.label)
                }
              >
                {menu.label}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    mobileExpanded === menu.label ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileExpanded === menu.label && (
                <div className="pb-3 space-y-4">
                  {menu.columns.map((col) => (
                    <div key={col.heading}>
                      <p
                        className="text-[10px] font-extrabold uppercase tracking-widest mb-2 pl-1"
                        style={{ color: 'var(--ca-accent)' }}
                      >
                        {col.heading}
                      </p>
                      {col.items.map((item) => (
                        <a
                          key={item}
                          href="https://gst.conceptra.co.in/#tools"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMobileOpen(false)}
                          className="block py-1.5 pl-3 text-sm text-slate-600 border-l-2 mb-1 transition-colors"
                          style={{ borderColor: 'var(--ca-primary-light)' }}
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

        </div>
      )}
    </header>
  );
}
