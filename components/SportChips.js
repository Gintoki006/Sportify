'use client';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

const features = [
  { emoji: '📊', label: 'Track Stats' },
  { emoji: '⚽', label: 'Live Score' },
  { emoji: '🏆', label: 'Tournaments' },
  { emoji: '🎯', label: 'Set Goals' },
  { emoji: '👥', label: 'Clubs' },
  { emoji: '🤝', label: 'Matches' },
];

export default function SportChips() {
  const { isSignedIn } = useAuth();
  const href = isSignedIn ? '/dashboard' : '/sign-up';

  return (
    <section className="bg-bg py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted mb-4">
          What you can do
        </h2>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {features.map((f) => (
            <Link
              key={f.label}
              href={href}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-surface text-sm font-medium text-primary hover:border-accent/50 hover:shadow-sm transition-all"
            >
              <span>{f.emoji}</span>
              {f.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
