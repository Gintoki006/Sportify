'use client';

import { useState } from 'react';
import { getMetricsForSport } from '@/lib/sportMetrics';
import DatePicker from '@/components/ui/DatePicker';

const SPORT_LABELS = {
  FOOTBALL: '⚽ Football',
  CRICKET: '🏏 Cricket',
  BASKETBALL: '🏀 Basketball',
  BADMINTON: '🏸 Badminton',
  TENNIS: '🎾 Tennis',
  VOLLEYBALL: '🏐 Volleyball',
};

export default function GoalStep({ selectedSports, goal, onChange }) {
  const [showDeadline, setShowDeadline] = useState(!!goal.deadline);

  const metrics = goal.sportType ? getMetricsForSport(goal.sportType) : [];

  const handleChange = (field, value) => {
    const updated = { ...goal, [field]: value };

    // Reset metric when sport changes
    if (field === 'sportType') {
      updated.metric = '';
      updated.target = '';
    }

    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm font-medium text-accent uppercase tracking-wider mb-2">
          Step 3 of 3
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-primary">
          Set Your First Goal
        </h2>
        <p className="text-muted mt-2 text-sm sm:text-base">
          Goals keep you motivated. You can skip this and add goals later.
        </p>
      </div>

      {/* Goal form */}
      <div className="space-y-4">
        {/* Sport picker */}
        <div>
          <label
            htmlFor="goal-sport"
            className="block text-sm font-medium text-primary mb-1.5"
          >
            Sport
          </label>
          <select
            id="goal-sport"
            value={goal.sportType}
            onChange={(e) => handleChange('sportType', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none cursor-pointer"
          >
            <option value="">Choose a sport...</option>
            {selectedSports.map((s) => (
              <option key={s} value={s}>
                {SPORT_LABELS[s] || s}
              </option>
            ))}
          </select>
        </div>

        {/* Metric picker — shown once sport is selected */}
        {goal.sportType && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label
              htmlFor="goal-metric"
              className="block text-sm font-medium text-primary mb-1.5"
            >
              Metric to Track
            </label>
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => handleChange('metric', m.key)}
                  className={`
                    px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all
                    ${
                      goal.metric === m.key
                        ? 'border-accent bg-accent/10 text-primary shadow-sm'
                        : 'border-border bg-surface text-muted hover:border-accent/40'
                    }
                  `}
                >
                  {m.label}
                  {m.unit && (
                    <span className="text-muted text-xs ml-1">({m.unit})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Target value */}
        {goal.metric && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label
              htmlFor="goal-target"
              className="block text-sm font-medium text-primary mb-1.5"
            >
              Target Value
            </label>
            <input
              id="goal-target"
              type="number"
              min="1"
              value={goal.target}
              onChange={(e) => handleChange('target', e.target.value)}
              placeholder="e.g. 50"
              className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-primary placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
            {goal.metric && goal.target && (
              <p className="text-xs text-muted mt-1.5">
                Goal: reach{' '}
                <span className="font-semibold text-accent">{goal.target}</span>{' '}
                {metrics
                  .find((m) => m.key === goal.metric)
                  ?.label?.toLowerCase() || goal.metric}
              </p>
            )}
          </div>
        )}

        {/* Optional deadline */}
        {goal.metric && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            {!showDeadline ? (
              <button
                type="button"
                onClick={() => setShowDeadline(true)}
                className="text-sm text-accent hover:underline font-medium"
              >
                + Add a deadline
              </button>
            ) : (
              <div>
                <label
                  htmlFor="goal-deadline"
                  className="block text-sm font-medium text-primary mb-1.5"
                >
                  Deadline{' '}
                  <span className="text-muted font-normal text-xs">
                    (optional)
                  </span>
                </label>
                <DatePicker
                  id="goal-deadline"
                  value={goal.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Goal preview card */}
      {goal.sportType && goal.metric && goal.target && (
        <div className="mt-4 p-4 rounded-2xl bg-accent/10 border border-accent/30">
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-1">
            Your first goal
          </p>
          <p className="text-primary font-medium">
            {SPORT_LABELS[goal.sportType]}:{' '}
            {metrics.find((m) => m.key === goal.metric)?.label} → {goal.target}
            {goal.deadline && (
              <span className="text-muted text-sm ml-1">
                by {new Date(goal.deadline).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
