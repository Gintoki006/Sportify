const sports = [
  { emoji: '⚽', name: 'Football', metrics: 'Goals, Assists, Clean Sheets' },
  { emoji: '🏏', name: 'Cricket', metrics: 'Runs, Wickets, Strike Rate' },
  { emoji: '🏀', name: 'Basketball', metrics: 'Points, Efficiency, Shots' },
  { emoji: '🏸', name: 'Badminton', metrics: 'Match Wins, Points Scored' },
  { emoji: '🎾', name: 'Tennis', metrics: 'Match Wins, Points Scored' },
  { emoji: '🏐', name: 'Volleyball', metrics: 'Spikes, Blocks, Serves' },
];

export default function AboutSection() {
  return (
    <section className="bg-surface py-12 sm:py-16 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted mb-8">
          Supported Sports
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {sports.map((sport) => (
            <div
              key={sport.name}
              className="rounded-xl bg-bg border border-border p-4 text-center space-y-1.5 hover:border-accent/40 transition-colors"
            >
              <span className="text-2xl sm:text-3xl">{sport.emoji}</span>
              <h3 className="text-sm font-semibold text-primary">
                {sport.name}
              </h3>
              <p className="text-xs text-muted leading-snug">{sport.metrics}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-4">
          More sports coming soon
        </p>
      </div>
    </section>
  );
}
