import { ensureDbUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { SidebarProvider } from '@/context/SidebarContext';
import DashboardMain from '@/components/dashboard/DashboardMain';

/**
 * Shared layout for all dashboard pages.
 * Renders sidebar + main content with collapsible sidebar support.
 */
export default async function DashboardLayout({ children }) {
  const user = await ensureDbUser();

  if (!user) redirect('/sign-in');

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-bg">
        <a href="#main-content" className="skip-nav">
          Skip to content
        </a>
        <DashboardSidebar userName={user.name} />
        <DashboardMain>{children}</DashboardMain>
      </div>
    </SidebarProvider>
  );
}
