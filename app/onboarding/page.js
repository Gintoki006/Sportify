import { redirect } from 'next/navigation';
import { ensureDbUser } from '@/lib/auth';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default async function OnboardingPage() {
  const user = await ensureDbUser();

  // If user already has sport profiles, skip onboarding
  if (user?.sportProfiles?.length > 0) {
    redirect('/dashboard');
  }

  // Serialize only what the client component needs
  const clientUser = user
    ? { name: user.name, bio: user.bio || '', avatarUrl: user.avatarUrl }
    : null;

  return <OnboardingWizard dbUser={clientUser} />;
}
