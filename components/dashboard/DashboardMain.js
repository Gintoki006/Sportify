'use client';

import { useSidebar } from '@/context/SidebarContext';

/**
 * Main content wrapper — adjusts left margin based on sidebar collapsed state.
 */
export default function DashboardMain({ children }) {
  const { collapsed } = useSidebar();

  return (
    <main
      id="main-content"
      aria-label="Main content"
      className={`pt-16 lg:pt-0 pb-20 lg:pb-0 transition-all duration-300 ${
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </div>
    </main>
  );
}
