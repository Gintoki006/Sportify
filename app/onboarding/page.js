import { redirect } from 'next/navigation';
import { ensureDbUser } from '@/lib/auth';

export default async function OnboardingPage() {
  const user = await ensureDbUser();

  // If user already has sport profiles, skip onboarding
  if (user?.sportProfiles?.length > 0) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-surface border border-border rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-2xl font-bold text-primary mb-2">
          Welcome to Sportify!
        </h1>
        <p className="text-muted mb-6">
          Your account has been created successfully. The onboarding flow (sport
          selection, profile setup, and first goal) will be built in Phase 5.
        </p>
        <a
          href="/dashboard"
          className="inline-block bg-accent text-black font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Go to Dashboard →
        </a>
      </div>
    </div>
  );
}
