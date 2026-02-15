'use client';

const SPORT_COLORS = {
  FOOTBALL: '#22c55e',
  CRICKET: '#f59e0b',
  BASKETBALL: '#ef4444',
  BADMINTON: '#06b6d4',
  TENNIS: '#84cc16',
  VOLLEYBALL: '#eab308',
};

const SPORT_LABELS = {
  FOOTBALL: 'Football',
  CRICKET: 'Cricket',
  BASKETBALL: 'Basketball',
  BADMINTON: 'Badminton',
  TENNIS: 'Tennis',
  VOLLEYBALL: 'Volleyball',
};

/**
 * Circular progress ring component for individual goals.
 */
function ProgressRing({ progress, color, size = 80, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const dashOffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export default function GoalProgressRings({ goals }) {
  if (!goals || goals.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
          Goal Progress
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-muted text-sm">No active goals yet.</p>
          <p className="text-muted text-xs mt-1">
            Set a goal to track your progress!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
        Goal Progress
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = goal.target > 0
            ? Math.round((goal.current / goal.target) * 100)
            : 0;
          const color = SPORT_COLORS[goal.sportType] || '#CDEB5E';
          const sportLabel = SPORT_LABELS[goal.sportType] || goal.sportType;

          return (
            <div
              key={goal.id}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-bg transition-colors"
            >
              <div className="relative">
                <ProgressRing progress={progress} color={color} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {progress}%
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-primary capitalize">
                  {goal.metric.replace(/_/g, ' ')}
                </p>
                <p className="text-[10px] text-muted">
                  {goal.current}/{goal.target} · {sportLabel}
                </p>
                {goal.deadline && (
                  <p className="text-[10px] text-muted">
                    Due {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
