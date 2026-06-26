'use client';
import { useState } from 'react';
import { Palette } from 'lucide-react';
import { useTheme, type Theme } from './ThemeWrapper';

const THEMES: { id: Theme; label: string; desc: string; primary: string; accent: string }[] = [
  { id: 'royal',    label: 'Royal Blue & Gold',     desc: 'CA firm classic',  primary: '#1040A0', accent: '#D97706' },
  { id: 'midnight', label: 'Midnight & Steel Cyan', desc: 'McKinsey / BCG',   primary: '#0c3a5c', accent: '#00A9CE' },
  // { id: 'indigo',   label: 'Indigo & Rose',         desc: 'Modern luxury',    primary: '#3d3aad', accent: '#E11D48' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-start">
      <button
        onClick={() => setOpen(!open)}
        className="bg-white border border-gray-200 shadow-lg rounded-r-xl px-2 py-3 flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
        title="Switch theme"
      >
        <Palette className="w-4 h-4" />
      </button>

      {open && (
        <div className="ml-1 bg-white border border-gray-200 shadow-xl rounded-xl p-3 flex flex-col gap-1.5 w-56 max-h-[80vh] overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 pb-1 sticky top-0 bg-white">
            Color Theme
          </p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg text-left transition ${
                theme === t.id ? 'ring-1 ring-gray-300' : 'hover:bg-gray-50'
              }`}
              style={theme === t.id ? { background: t.primary + '10' } : {}}
            >
              <span
                className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm flex items-end overflow-hidden"
                style={{ background: t.primary }}
              >
                <span className="w-full h-3" style={{ background: t.accent, opacity: 0.85 }} />
              </span>
              <span>
                <span className="block text-xs font-semibold text-gray-800">{t.label}</span>
                <span className="block text-[10px] text-gray-400">{t.desc}</span>
              </span>
              {theme === t.id && (
                <span className="ml-auto text-[10px] font-bold" style={{ color: t.primary }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
