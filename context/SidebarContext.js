'use client';

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
} from 'react';

const SidebarContext = createContext({
  collapsed: false,
  setCollapsed: () => {},
  toggleCollapsed: () => {},
});

const STORAGE_KEY = 'sportify-sidebar-collapsed';

// Listeners for useSyncExternalStore
let listeners = [];
function subscribe(cb) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
function emitChange() {
  listeners.forEach((l) => l());
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

function writeCollapsed(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* ignore */
  }
  emitChange();
}

export function SidebarProvider({ children }) {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setCollapsed = useCallback((val) => {
    const next = typeof val === 'function' ? val(getSnapshot()) : val;
    writeCollapsed(next);
  }, []);

  const toggleCollapsed = useCallback(() => {
    writeCollapsed(!getSnapshot());
  }, []);

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
