export default function AboutSection() {
  return (
    <section id="about" className="bg-surface py-20 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted">
              About Us
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-primary leading-snug">
              SPORT — DRIVING EXCELLENCE IN SPORTS WITH INNOVATION,{' '}
              <span className="text-accent">PASSION,</span> AND UNMATCHED
              DEDICATION.
            </h2>
            <p className="text-base text-muted leading-relaxed">
              At Sportify, we believe sports are more than just a game — they
              inspire, connect, and create lifelong impact. Our mission is to
              deliver world-class tracking, innovative solutions, and unwavering
              support to every athlete. From aspiring beginners to seasoned
              professionals, Sportify stands by you in reaching your highest
              potential and redefining greatness.
            </p>
          </div>

          {/* Image placeholder grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-2xl bg-linear-to-br from-accent/20 to-beige flex items-center justify-center text-5xl">
              ⚽
            </div>
            <div className="aspect-square rounded-2xl bg-linear-to-br from-card-gradient-a to-border flex items-center justify-center text-5xl">
              🏏
            </div>
            <div className="aspect-square rounded-2xl bg-linear-to-br from-card-gradient-b to-beige flex items-center justify-center text-5xl col-span-2">
              🏐
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
