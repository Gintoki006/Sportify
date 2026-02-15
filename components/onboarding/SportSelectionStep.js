'use client';

const SPORTS = [
  {
    key: 'FOOTBALL',
    label: 'Football',
    emoji: '⚽',
    gradient: 'from-green-400 to-emerald-600',
    darkGradient: 'dark:from-green-600 dark:to-emerald-800',
    description: 'Goals, assists, shots',
  },
  {
    key: 'CRICKET',
    label: 'Cricket',
    emoji: '🏏',
    gradient: 'from-amber-400 to-orange-500',
    darkGradient: 'dark:from-amber-600 dark:to-orange-700',
    description: 'Runs, wickets, batting avg',
  },
  {
    key: 'BASKETBALL',
    label: 'Basketball',
    emoji: '🏀',
    gradient: 'from-orange-400 to-red-500',
    darkGradient: 'dark:from-orange-600 dark:to-red-700',
    description: 'Points, shots, efficiency',
  },
  {
    key: 'BADMINTON',
    label: 'Badminton',
    emoji: '🏸',
    gradient: 'from-cyan-400 to-blue-500',
    darkGradient: 'dark:from-cyan-600 dark:to-blue-700',
    description: 'Match wins, points scored',
  },
  {
    key: 'TENNIS',
    label: 'Tennis',
    emoji: '🎾',
    gradient: 'from-lime-400 to-green-500',
    darkGradient: 'dark:from-lime-600 dark:to-green-700',
    description: 'Match wins, points scored',
  },
  {
    key: 'VOLLEYBALL',
    label: 'Volleyball',
    emoji: '🏐',
    gradient: 'from-yellow-400 to-amber-500',
    darkGradient: 'dark:from-yellow-600 dark:to-amber-700',
    description: 'Spikes, blocks, serves, digs',
  },
];

export default function SportSelectionStep({ selected, onToggle }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm font-medium text-accent uppercase tracking-wider mb-2">
          Step 1 of 3
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-primary">
          Choose Your Sports
        </h2>
        <p className="text-muted mt-2 text-sm sm:text-base">
          Pick the sports you play. You can always add more later.
        </p>
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {SPORTS.map((sport) => {
          const isSelected = selected.includes(sport.key);
          return (
            <button
              key={sport.key}
              type="button"
              onClick={() => onToggle(sport.key)}
              className={`
                relative group flex flex-col items-center justify-center
                p-4 sm:p-6 rounded-2xl border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20 scale-[1.02]'
                    : 'border-border bg-surface hover:border-accent/50 hover:shadow-md'
                }
              `}
            >
              {/* Selected check */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              {/* Emoji with gradient backdrop */}
              <div
                className={`
                  w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-3
                  bg-linear-to-br ${sport.gradient} ${sport.darkGradient}
                  shadow-md group-hover:shadow-lg transition-shadow
                `}
              >
                <span className="text-2xl sm:text-3xl">{sport.emoji}</span>
              </div>

              {/* Label */}
              <span className="text-sm sm:text-base font-semibold text-primary">
                {sport.label}
              </span>

              {/* Description */}
              <span className="text-[11px] sm:text-xs text-muted mt-0.5 text-center leading-tight">
                {sport.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selection count */}
      <p className="text-center text-sm text-muted">
        {selected.length === 0
          ? 'No sports selected'
          : `${selected.length} sport${selected.length > 1 ? 's' : ''} selected`}
      </p>
    </div>
  );
}
