export default function AboutSection() {
  return (
    <section id="about" className="bg-surface py-16 sm:py-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Text */}
          <div className="space-y-5 sm:space-y-6 text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted">
              About Us
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary leading-snug">
              SPORT — DRIVING EXCELLENCE IN SPORTS WITH INNOVATION,{' '}
              <span className="text-accent">PASSION,</span> AND UNMATCHED
              DEDICATION.
            </h2>
            <p className="text-sm sm:text-base text-muted leading-relaxed max-w-lg mx-auto md:mx-0">
              At Sportify, we believe sports are more than just a game — they
              inspire, connect, and create lifelong impact. Our mission is to
              deliver world-class tracking, innovative solutions, and unwavering
              support to every athlete. From aspiring beginners to seasoned
              professionals, Sportify stands by you in reaching your highest
              potential and redefining greatness.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 sm:gap-8 justify-center md:justify-start pt-2">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-accent">6</p>
                <p className="text-xs text-muted">Sports</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-accent">
                  1K+
                </p>
                <p className="text-xs text-muted">Athletes</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-accent">
                  50+
                </p>
                <p className="text-xs text-muted">Tournaments</p>
              </div>
            </div>
          </div>

          {/* Image placeholder grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="aspect-square rounded-2xl bg-linear-to-br from-accent/20 to-beige flex items-center justify-center text-4xl sm:text-5xl hover:scale-[1.02] transition-transform">
              ⚽
            </div>
            <div className="aspect-square rounded-2xl bg-linear-to-br from-card-gradient-a to-border flex items-center justify-center text-4xl sm:text-5xl hover:scale-[1.02] transition-transform">
              🏏
            </div>
            <div className="aspect-square rounded-2xl bg-linear-to-br from-card-gradient-b to-beige flex items-center justify-center text-4xl sm:text-5xl col-span-2 hover:scale-[1.02] transition-transform">
              🏐
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
