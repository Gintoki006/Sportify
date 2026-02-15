import { ensureDbUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import FloatingAddButton from '@/components/stats/FloatingAddButton';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

/**
 * Shared layout for all dashboard pages.
 * Renders sidebar + FloatingAddButton globally.
 */
export default async function DashboardLayout({ children }) {
  const user = await ensureDbUser();

  if (!user) redirect('/sign-in');

  // Serialize sport profiles for client components
  const sportProfiles = (user.sportProfiles || []).map((sp) => ({
    id: sp.id,
    sportType: sp.sportType,
  }));

  return (
    <div className="min-h-screen bg-bg">
      <a href="#main-content" className="skip-nav">
        Skip to content
      </a>
      <DashboardSidebar userName={user.name} />

      {/* Main content — offset for sidebar on desktop, offset for top bar on mobile */}
      <main
        id="main-content"
        aria-label="Main content"
        className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      <FloatingAddButton sportProfiles={sportProfiles} />
    </div>
  );
}
