import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-bg pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-36 md:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left — Text */}
          <div className="space-y-6 sm:space-y-8 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-primary">
              SPORTS FOR
              <br />
              EVERY <span className="text-accent">PASSION</span>
            </h1>
            <p className="text-base sm:text-lg text-muted max-w-md mx-auto md:mx-0 leading-relaxed">
              Experience premium sports tracking tailored to elevate every
              athlete&apos;s lifestyle and ambition.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 justify-center md:justify-start">
              <Link
                href="/sign-up"
                className="inline-flex items-center px-7 py-3.5 rounded-full bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
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
              <div className="flex items-center gap-2">
                {/* Avatar stack */}
                <div className="flex -space-x-2">
                  {['🏀', '⚽', '🎾'].map((emoji, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-beige text-lg border-2 border-bg"
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
                <span className="text-sm font-semibold text-primary ml-1">
                  1000+
                  <span className="block text-xs font-normal text-muted">
                    Members Joined
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right — Hero image placeholder */}
          <div className="relative mt-4 md:mt-0">
            <div className="aspect-4/3 rounded-3xl bg-linear-to-br from-accent/30 via-beige to-border overflow-hidden flex items-center justify-center transition-colors">
              <span className="text-7xl sm:text-8xl">🎾</span>
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 left-4 sm:-left-4 bg-surface rounded-2xl shadow-lg px-5 py-3 border border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Multi-Sport
              </p>
              <p className="text-lg font-bold text-primary">6 Sports</p>
            </div>
            {/* Second floating card */}
            <div className="absolute -top-2 -right-2 sm:-right-4 bg-surface rounded-2xl shadow-lg px-4 py-2.5 border border-border hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Live Tracking
              </p>
              <p className="text-lg font-bold text-accent">Real-time</p>
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
