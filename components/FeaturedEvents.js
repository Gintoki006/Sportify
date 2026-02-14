const events = [
  {
    title: 'Golden Goal Cup',
    description:
      'At Sportify, we believe sports have the power to inspire, connect, and transform lives.',
    emoji: '🏆',
    color: 'from-accent/20 to-beige',
  },
  {
    title: 'Smash Championship',
    description:
      'Compete in badminton and tennis tournaments with real-time bracket tracking.',
    emoji: '🏸',
    color: 'from-card-gradient-a to-border',
  },
  {
    title: 'Hoops League',
    description:
      'Basketball leagues for all levels — track your points, efficiency, and team stats.',
    emoji: '🏀',
    color: 'from-card-gradient-b to-beige',
  },
];

export default function FeaturedEvents() {
  return (
    <section id="events" className="bg-bg py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">
            Featured Events
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-primary leading-tight">
            Powering Your Sport
            <br />
            With Passion
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <div
              key={i}
              className="group rounded-2xl overflow-hidden bg-surface border border-border hover:shadow-lg transition-all"
            >
              <div
                className={`aspect-5/3 bg-linear-to-br ${event.color} flex items-center justify-center`}
              >
                <span className="text-6xl group-hover:scale-110 transition-transform">
                  {event.emoji}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-primary mb-2">
                  {event.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
