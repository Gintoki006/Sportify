const steps = [
  {
    num: '1',
    emoji: '🎯',
    title: 'Pick your sports',
    description:
      'Choose from 6 supported sports and set up your profile in seconds.',
  },
  {
    num: '2',
    emoji: '📊',
    title: 'Track stats & set goals',
    description: 'Log match stats, monitor trends, and set targets to beat.',
  },
  {
    num: '3',
    emoji: '🏆',
    title: 'Compete in tournaments',
    description: 'Create clubs, organize brackets, and score matches live.',
  },
];

export default function FeaturedEvents() {
  return (
    <section className="bg-bg py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted mb-8">
          How it works
        </h2>

        <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step) => (
            <div key={step.num} className="text-center space-y-3">
              <span className="text-3xl">{step.emoji}</span>
              <p className="text-xs font-bold text-accent">Step {step.num}</p>
              <h3 className="text-base font-semibold text-primary">
                {step.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
