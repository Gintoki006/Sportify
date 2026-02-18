'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const SidebarContext = createContext({
  collapsed: false,
  setCollapsed: () => {},
  toggleCollapsed: () => {},
});

const STORAGE_KEY = 'sportify-sidebar-collapsed';

function getInitialCollapsed() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const isFirstRender = useRef(true);

  // Persist to localStorage on change (skip initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  function toggleCollapsed() {
    setCollapsed((prev) => !prev);
  }

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, toggleCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
