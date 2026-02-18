'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SPORT_METRICS } from '@/lib/sportMetrics';
import AccessibleModal from '@/components/ui/AccessibleModal';
import DatePicker from '@/components/ui/DatePicker';

const SPORT_LABELS = {
  FOOTBALL: 'Football',
  CRICKET: 'Cricket',
  BASKETBALL: 'Basketball',
  BADMINTON: 'Badminton',
  TENNIS: 'Tennis',
  VOLLEYBALL: 'Volleyball',
};

const SPORT_EMOJIS = {
  FOOTBALL: '⚽',
  CRICKET: '🏏',
  BASKETBALL: '🏀',
  BADMINTON: '🏸',
  TENNIS: '🎾',
  VOLLEYBALL: '🏐',
};

export default function GoalCreationModal({ sportProfiles, onClose }) {
  const router = useRouter();
  const [step, setStep] = useState(sportProfiles.length === 1 ? 1 : 0);
  const [selectedProfile, setSelectedProfile] = useState(
    sportProfiles.length === 1 ? sportProfiles[0] : null,
  );
  const [metric, setMetric] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const metrics = selectedProfile
    ? SPORT_METRICS[selectedProfile.sportType] || []
    : [];

  function handleSelectSport(profile) {
    setSelectedProfile(profile);
    setMetric('');
    setStep(1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!metric) {
      setError('Please select a metric.');
      return;
    }
    if (!target || Number(target) <= 0) {
      setError('Please enter a target greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sportProfileId: selectedProfile.id,
          metric,
          target: Number(target),
          deadline: deadline || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 1200);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  // Today in YYYY-MM-DD for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title={step === 0 ? 'Choose Sport' : 'New Goal'}
    >
      {/* Success state */}
      {success ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="text-5xl animate-bounce mb-4">🎯</div>
          <p className="text-primary font-semibold text-lg">Goal Created!</p>
          <p className="text-muted text-sm mt-1">
            Track your progress on the dashboard.
          </p>
        </div>
      ) : step === 0 ? (
        /* Step 0: Sport selection */
        <div className="p-6">
          <p className="text-muted text-sm mb-4">
            Which sport is this goal for?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {sportProfiles.map((sp) => (
              <button
                key={sp.id}
                onClick={() => handleSelectSport(sp)}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all text-left"
              >
                <span className="text-2xl">{SPORT_EMOJIS[sp.sportType]}</span>
                <span className="text-sm font-medium text-primary">
                  {SPORT_LABELS[sp.sportType]}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Step 1: Goal form */
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Sport badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg w-fit">
            <span className="text-lg">
              {SPORT_EMOJIS[selectedProfile.sportType]}
            </span>
            <span className="text-sm font-medium text-primary">
              {SPORT_LABELS[selectedProfile.sportType]}
            </span>
            {sportProfiles.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setSelectedProfile(null);
                  setMetric('');
                }}
                className="text-xs text-accent hover:underline ml-2"
              >
                Change
              </button>
            )}
          </div>

          {/* Metric selector */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Metric
            </label>
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMetric(m.key)}
                  aria-pressed={metric === m.key}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    metric === m.key
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted hover:border-accent/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div>
            <label
              htmlFor="goal-target"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
            >
              Target
            </label>
            <input
              id="goal-target"
              type="number"
              min="1"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 50"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              required
            />
            {metric && (
              <p className="text-xs text-muted mt-1">
                Total {metrics.find((m) => m.key === metric)?.label || metric}{' '}
                to achieve
              </p>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label
              htmlFor="goal-deadline"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
            >
              Deadline{' '}
              <span className="text-muted/50 normal-case">(optional)</span>
            </label>
            <DatePicker
              id="goal-deadline"
              min={today}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Creating…
              </span>
            ) : (
              'Create Goal'
            )}
          </button>
        </form>
      )}
    </AccessibleModal>
  );
}
