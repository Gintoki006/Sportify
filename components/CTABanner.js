'use client';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

export default function CTABanner() {
  const { isSignedIn } = useAuth();

  return (
    <section className="bg-primary py-10 sm:py-14 transition-colors">
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-bg">
          Ready to get started?
        </h2>
        {isSignedIn ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center px-7 py-3 rounded-full bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/sign-up"
            className="inline-flex items-center px-7 py-3 rounded-full bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Sign Up Free
          </Link>
        )}
      </div>
    </section>
  );
}
