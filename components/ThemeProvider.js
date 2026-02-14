'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ dark: false, toggleDark: () => {}, mounted: false });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }) {
  // Always start false to match SSR, then sync from localStorage after mount
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Read saved preference after mount (client-only)
  useEffect(() => {
    const stored = localStorage.getItem('sportify-theme');
    if (stored === 'dark') {
      setDark(true);
    } else if (stored === 'light') {
      setDark(false);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDark(true);
    }
    setMounted(true);
  }, []);

  // Sync the class on the <html> element whenever `dark` changes
  useEffect(() => {
    if (!mounted) return;
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark, mounted]);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem('sportify-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}
