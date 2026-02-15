'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SportSelectionStep from './SportSelectionStep';
import ProfileStep from './ProfileStep';
import GoalStep from './GoalStep';

const TOTAL_STEPS = 3;

export default function OnboardingWizard({ dbUser }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── State for each step ──
  const [selectedSports, setSelectedSports] = useState([]);
  const [profile, setProfile] = useState({
    name: dbUser?.name || '',
    bio: dbUser?.bio || '',
  });
  const [goal, setGoal] = useState({
    sportType: '',
    metric: '',
    target: '',
    deadline: '',
  });

  // ── Sport toggle ──
  const toggleSport = (key) => {
    setSelectedSports((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  // ── Step validation ──
  const canProceed = () => {
    if (step === 1) return selectedSports.length > 0;
    if (step === 2) return profile.name.trim().length >= 2;
    if (step === 3) return true; // goal is optional
    return false;
  };

  // ── Navigation ──
  const next = () => {
    setError('');
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const back = () => {
    setError('');
    if (step > 1) setStep((s) => s - 1);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const body = {
        sports: selectedSports,
        profile: {
          name: profile.name.trim(),
          bio: profile.bio.trim(),
        },
      };

      // Only include goal if fully filled
      if (goal.sportType && goal.metric && goal.target) {
        body.goal = {
          sportType: goal.sportType,
          metric: goal.metric,
          target: parseInt(goal.target, 10),
          deadline: goal.deadline || null,
        };
      }

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Progress dots ──
  const progressWidth = `${(step / TOTAL_STEPS) * 100}%`;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card container */}
        <div className="bg-surface border border-border rounded-3xl shadow-xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-border">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out rounded-r-full"
              style={{ width: progressWidth }}
            />
          </div>

          {/* Content area */}
          <div className="p-6 sm:p-8">
            {/* Step content */}
            {step === 1 && (
              <SportSelectionStep
                selected={selectedSports}
                onToggle={toggleSport}
              />
            )}
            {step === 2 && (
              <ProfileStep
                profile={profile}
                onChange={setProfile}
                clerkUser={dbUser}
              />
            )}
            {step === 3 && (
              <GoalStep
                selectedSports={selectedSports}
                goal={goal}
                onChange={setGoal}
              />
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-1 text-sm font-medium text-muted hover:text-primary transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>
              ) : (
                <div /> /* spacer */
              )}

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canProceed()}
                  className={`
                    flex items-center gap-1 px-6 py-2.5 rounded-full text-sm font-semibold transition-all
                    ${
                      canProceed()
                        ? 'bg-accent text-black hover:opacity-90 shadow-md shadow-accent/20'
                        : 'bg-border text-muted cursor-not-allowed'
                    }
                  `}
                >
                  Continue
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all
                    ${
                      submitting
                        ? 'bg-border text-muted cursor-wait'
                        : 'bg-accent text-black hover:opacity-90 shadow-md shadow-accent/20'
                    }
                  `}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      Finish Setup
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step indicators below card */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`
                h-2 rounded-full transition-all duration-300
                ${
                  s === step
                    ? 'w-8 bg-accent'
                    : s < step
                      ? 'w-2 bg-accent/50'
                      : 'w-2 bg-border'
                }
              `}
            />
          ))}
        </div>

        {/* Skip link on goal step */}
        {step === 3 && (
          <p className="text-center text-sm text-muted mt-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="underline hover:text-primary transition-colors"
            >
              Skip goal & finish
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
