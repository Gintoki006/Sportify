import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-bg pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-primary">
              SPORTS FOR
              <br />
              EVERY PASSION
            </h1>
            <p className="text-lg text-muted max-w-md leading-relaxed">
              Experience premium sports tracking tailored to elevate every
              athlete&apos;s lifestyle and ambition.
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="#"
                className="inline-flex items-center px-7 py-3.5 rounded-full bg-primary text-bg text-sm font-semibold hover:opacity-90 transition-colors"
              >
                Get Started
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
          <div className="relative">
            <div className="aspect-4/3 rounded-3xl bg-linear-to-br from-accent/30 via-beige to-border overflow-hidden flex items-center justify-center transition-colors">
              <span className="text-8xl">🎾</span>
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -left-4 bg-surface rounded-2xl shadow-lg px-5 py-3 border border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Multi-Sport
              </p>
              <p className="text-lg font-bold text-primary">6 Sports</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
