const events = [
  {
    title: 'Golden Goal Cup',
    description:
      'At Sportify, we believe sports have the power to inspire, connect, and transform lives.',
    emoji: '🏆',
    color: 'from-accent/20 to-beige',
    tag: 'Football',
  },
  {
    title: 'Smash Championship',
    description:
      'Compete in badminton and tennis tournaments with real-time bracket tracking.',
    emoji: '🏸',
    color: 'from-card-gradient-a to-border',
    tag: 'Racket Sports',
  },
  {
    title: 'Hoops League',
    description:
      'Basketball leagues for all levels — track your points, efficiency, and team stats.',
    emoji: '🏀',
    color: 'from-card-gradient-b to-beige',
    tag: 'Basketball',
  },
];

export default function FeaturedEvents() {
  return (
    <section id="events" className="bg-bg py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 sm:mb-12 text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">
            Featured Events
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary leading-tight">
            Powering Your Sport
            <br />
            With Passion
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {events.map((event, i) => (
            <div
              key={i}
              className="group rounded-2xl overflow-hidden bg-surface border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`aspect-5/3 bg-linear-to-br ${event.color} flex items-center justify-center relative`}
              >
                <span className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-300">
                  {event.emoji}
                </span>
                <span className="absolute top-3 right-3 text-xs font-semibold bg-bg/80 backdrop-blur-sm text-primary px-3 py-1 rounded-full">
                  {event.tag}
                </span>
              </div>
              <div className="p-5 sm:p-6">
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
