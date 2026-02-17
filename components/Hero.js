'use client';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

const features = [
  { emoji: '📊', label: 'Stats' },
  { emoji: '⚽', label: 'Matches' },
  { emoji: '🏆', label: 'Tournaments' },
  { emoji: '🎯', label: 'Goals' },
];

const floatingEmojis = [
  {
    emoji: '⚽',
    size: 'text-5xl sm:text-6xl',
    pos: 'top-[12%] left-[8%]',
    delay: '0s',
    duration: '6s',
  },
  {
    emoji: '🏏',
    size: 'text-6xl sm:text-7xl',
    pos: 'top-[25%] right-[10%]',
    delay: '1s',
    duration: '7s',
  },
  {
    emoji: '🏀',
    size: 'text-4xl sm:text-5xl',
    pos: 'bottom-[30%] left-[15%]',
    delay: '2s',
    duration: '5s',
  },
  {
    emoji: '🏸',
    size: 'text-7xl sm:text-8xl',
    pos: 'top-[40%] right-[25%]',
    delay: '0.5s',
    duration: '8s',
  },
  {
    emoji: '🎾',
    size: 'text-4xl sm:text-5xl',
    pos: 'top-[10%] right-[35%]',
    delay: '3s',
    duration: '6.5s',
  },
  {
    emoji: '🏐',
    size: 'text-5xl sm:text-6xl',
    pos: 'bottom-[15%] right-[12%]',
    delay: '1.5s',
    duration: '7.5s',
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-bg pt-20 pb-12 sm:pt-24 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left — Text */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-primary">
              Track. Compete.
              <br />
              <span className="text-accent">Improve.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted max-w-lg mx-auto md:mx-0 leading-relaxed">
              Track your stats, organize matches, and compete in tournaments —
              all in one place.
            </p>

            {/* Feature icons */}
            <div className="mt-6 flex items-center justify-center md:justify-start gap-5 sm:gap-8">
              {features.map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-1">
                  <span className="text-2xl sm:text-3xl">{f.emoji}</span>
                  <span className="text-xs font-medium text-muted">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8">
              <SignedOut>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center px-8 py-3.5 rounded-full bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
                >
                  Get Started Free
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-8 py-3.5 rounded-full bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
                >
                  Go to Dashboard
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </SignedIn>
            </div>
          </div>

          {/* Right — Floating sports emojis */}
          <div
            className="relative hidden md:block h-80 lg:h-96"
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-accent/10 via-transparent to-accent/5" />
            {floatingEmojis.map((item, i) => (
              <span
                key={i}
                className={`absolute ${item.pos} ${item.size} animate-sports-float select-none`}
                style={{
                  animationDelay: item.delay,
                  animationDuration: item.duration,
                }}
              >
                {item.emoji}
              </span>
            ))}

            {/* Live Tracking badge — outside top-right corner */}
            <div className="absolute -top-6 -right-4 bg-surface/90 backdrop-blur-sm border border-border rounded-xl px-5 py-3 shadow-lg z-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Live Tracking
              </p>
              <p className="text-base font-bold text-primary">Real-time</p>
            </div>

            {/* Multi-Sport badge — outside bottom-left corner */}
            <div className="absolute -bottom-6 -left-4 bg-surface/90 backdrop-blur-sm border border-border rounded-xl px-5 py-3 shadow-lg z-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Multi-Sport
              </p>
              <p className="text-base font-bold text-primary">6 Sports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute top-20 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
    </section>
  );
}
