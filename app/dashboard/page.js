import { UserButton } from '@clerk/nextjs';
import { ensureDbUser } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await ensureDbUser();

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Welcome back, {user?.name?.split(' ')[0] || 'Athlete'} 👋
            </h1>
            <p className="text-muted text-sm mt-1">
              Here&apos;s your performance overview
            </p>
          </div>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
              },
            }}
          />
        </div>

        {/* Placeholder content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h3 className="text-sm font-medium text-muted mb-2">
              Active Sports
            </h3>
            <p className="text-3xl font-bold text-primary">
              {user?.sportProfiles?.length || 0}
            </p>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h3 className="text-sm font-medium text-muted mb-2">
              Total Entries
            </h3>
            <p className="text-3xl font-bold text-primary">0</p>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h3 className="text-sm font-medium text-muted mb-2">
              Active Goals
            </h3>
            <p className="text-3xl font-bold text-primary">0</p>
          </div>
        </div>

        <div className="mt-8 bg-surface border border-border rounded-2xl p-8 text-center">
          <p className="text-muted">
            Full dashboard coming in Phase 6. Stats, charts, and goals will
            appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
