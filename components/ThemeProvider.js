'use client';
import { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from 'react';

const ThemeContext = createContext({ dark: false, toggleDark: () => {}, mounted: true });

export function useTheme() {
  return useContext(ThemeContext);
}

// ── External-store helpers (stable refs, defined outside the component) ──

const THEME_CHANGE = 'sportify-theme-change';

function subscribe(callback) {
  // Custom event for same-tab toggles
  window.addEventListener(THEME_CHANGE, callback);
  // Native storage event for cross-tab sync
  window.addEventListener('storage', callback);
  // OS-level preference change
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', callback);
  return () => {
    window.removeEventListener(THEME_CHANGE, callback);
    window.removeEventListener('storage', callback);
    mql.removeEventListener('change', callback);
  };
}

function getSnapshot() {
  const stored = localStorage.getItem('sportify-theme');
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSnapshot() {
  return false; // always light on the server → no hydration mismatch
}

// ── Provider ──

export default function ThemeProvider({ children }) {
  // Reactive read — no useState / setState needed
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Sync the .dark class on <html> whenever the value changes
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  const toggleDark = useCallback(() => {
    const current = getSnapshot();
    localStorage.setItem('sportify-theme', current ? 'light' : 'dark');
    // Notify useSyncExternalStore in this tab
    window.dispatchEvent(new Event(THEME_CHANGE));
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, mounted: true }}>
      {children}
    </ThemeContext.Provider>
  );
}
