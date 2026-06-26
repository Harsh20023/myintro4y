'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Theme = 'royal' | 'midnight' ;

const THEME_VARS: Record<Theme, Record<string, string>> = {
  // Royal Blue + Gold (ICAI / CA firm classic)
  royal: {
    '--ca-primary':       '#1040A0',
    '--ca-primary-dark':  '#1e3f8a',
    '--ca-primary-light': '#dbeafe',
    '--ca-accent':        '#D97706',
    '--ca-accent-dark':   '#b45309',
    '--ca-accent-light':  '#fef3c7',
  },
  // Midnight + Steel Cyan (McKinsey / BCG consultancy)
  midnight: {
    '--ca-primary':       '#0c3a5c',
    '--ca-primary-dark':  '#07263d',
    '--ca-primary-light': '#e0f2fe',
    '--ca-accent':        '#00A9CE',
    '--ca-accent-dark':   '#0897b8',
    '--ca-accent-light':  '#cffafe',
  },
  // Deep Indigo + Rose (modern luxury advisory)
  // indigo: {
  //   '--ca-primary':       '#3d3aad',
  //   '--ca-primary-dark':  '#2d2a80',
  //   '--ca-primary-light': '#e0e7ff',
  //   '--ca-accent':        '#E11D48',
  //   '--ca-accent-dark':   '#c1143c',
  //   '--ca-accent-light':  '#ffe4e6',
  // },
};

type ThemeCtx = { theme: Theme; setTheme: (t: Theme) => void };
const ThemeContext = createContext<ThemeCtx>({ theme: 'royal', setTheme: () => {} });

export function useTheme() { return useContext(ThemeContext); }

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(THEME_VARS[theme]).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('royal');

  useEffect(() => {
    const saved = localStorage.getItem('ca-theme') as Theme | null;
    const initial = saved && saved in THEME_VARS ? saved : 'royal';
    applyTheme(initial);
    setTheme(initial);
  }, []);

  const handleSetTheme = (t: Theme) => {
    applyTheme(t);
    setTheme(t);
    localStorage.setItem('ca-theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
