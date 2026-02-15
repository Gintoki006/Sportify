'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMetricsForSport, buildBlankMetrics } from '@/lib/sportMetrics';

const SPORT_META = {
  FOOTBALL: { emoji: '⚽', label: 'Football', color: 'from-green-400 to-emerald-600' },
  CRICKET: { emoji: '🏏', label: 'Cricket', color: 'from-amber-400 to-orange-500' },
  BASKETBALL: { emoji: '🏀', label: 'Basketball', color: 'from-orange-400 to-red-500' },
  BADMINTON: { emoji: '🏸', label: 'Badminton', color: 'from-cyan-400 to-blue-500' },
  TENNIS: { emoji: '🎾', label: 'Tennis', color: 'from-lime-400 to-green-500' },
  VOLLEYBALL: { emoji: '🏐', label: 'Volleyball', color: 'from-yellow-400 to-amber-500' },
};

export default function StatEntryModal({ sportProfiles, onClose }) {
  const router = useRouter();
  const backdropRef = useRef(null);

  // ── Modal state ──
  const [step, setStep] = useState(sportProfiles.length === 1 ? 2 : 1); // skip sport select if only 1
  const [selectedProfile, setSelectedProfile] = useState(
    sportProfiles.length === 1 ? sportProfiles[0] : null
  );
  const [metrics, setMetrics] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [opponent, setOpponent] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize blank metrics when sport is selected
  useEffect(() => {
    if (selectedProfile) {
      setMetrics(buildBlankMetrics(selectedProfile.sportType));
    }
  }, [selectedProfile]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ── Sport selection ──
  const selectSport = (profile) => {
    setSelectedProfile(profile);
    setErrors({});
    setStep(2);
  };

  // ── Metric change ──
  const handleMetricChange = (key, value) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
    // Clear field error on edit
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // ── Validation ──
  const validate = () => {
    const metricDefs = getMetricsForSport(selectedProfile.sportType);
    const newErrors = {};

    for (const def of metricDefs) {
      const val = metrics[def.key];
      if (val === '' || val === undefined || val === null) {
        newErrors[def.key] = `${def.label} is required`;
        continue;
      }
      const num = Number(val);
      if (isNaN(num)) {
        newErrors[def.key] = `${def.label} must be a number`;
        continue;
      }
      if (def.type === 'int' && !Number.isInteger(num)) {
        newErrors[def.key] = `${def.label} must be a whole number`;
        continue;
      }
      if (num < 0) {
        newErrors[def.key] = `${def.label} cannot be negative`;
      }
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Convert metric values to proper numbers
      const parsedMetrics = {};
      const metricDefs = getMetricsForSport(selectedProfile.sportType);
      for (const def of metricDefs) {
        const val = Number(metrics[def.key]);
        parsedMetrics[def.key] = def.type === 'int' ? Math.round(val) : val;
      }

      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sportProfileId: selectedProfile.id,
          date,
          opponent: opponent.trim() || null,
          notes: notes.trim() || null,
          metrics: parsedMetrics,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess(true);

      // Auto-close after success animation
      setTimeout(() => {
        router.refresh(); // refresh server component data
        onClose();
      }, 1500);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render helpers ──
  const metricDefs = selectedProfile
    ? getMetricsForSport(selectedProfile.sportType)
    : [];
  const sportMeta = selectedProfile
    ? SPORT_META[selectedProfile.sportType]
    : null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full sm:max-w-md bg-surface border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {sportMeta && (
              <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${sportMeta.color} flex items-center justify-center`}>
                <span className="text-base">{sportMeta.emoji}</span>
              </div>
            )}
            <h2 className="text-lg font-bold text-primary">
              {success
                ? 'Saved!'
                : step === 1
                  ? 'Choose Sport'
                  : `Log ${sportMeta?.label} Stats`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-bg transition-colors text-muted hover:text-primary"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* ── Success state ── */}
          {success && (
            <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-bold text-primary">Entry Saved!</p>
              <p className="text-sm text-muted mt-1">Your stats have been recorded.</p>
            </div>
          )}

          {/* ── Step 1: Sport selector ── */}
          {!success && step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {sportProfiles.map((sp) => {
                const meta = SPORT_META[sp.sportType];
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => selectSport(sp)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border bg-bg hover:border-accent/50 hover:shadow-md transition-all"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${meta.color} flex items-center justify-center shadow-md`}>
                      <span className="text-2xl">{meta.emoji}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step 2: Metric form ── */}
          {!success && step === 2 && (
            <div className="space-y-5">
              {/* Sport change link (if multiple sports) */}
              {sportProfiles.length > 1 && (
                <button
                  type="button"
                  onClick={() => { setStep(1); setSelectedProfile(null); setErrors({}); }}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  ← Change sport
                </button>
              )}

              {/* Dynamic metric fields */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Performance Metrics
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {metricDefs.map((def) => (
                    <div key={def.key}>
                      <label
                        htmlFor={`metric-${def.key}`}
                        className="block text-sm font-medium text-primary mb-1"
                      >
                        {def.label}
                        {def.unit && (
                          <span className="text-muted text-xs ml-1">({def.unit})</span>
                        )}
                      </label>
                      <input
                        id={`metric-${def.key}`}
                        type="number"
                        step={def.type === 'float' ? '0.01' : '1'}
                        min="0"
                        value={metrics[def.key] ?? ''}
                        onChange={(e) => handleMetricChange(def.key, e.target.value)}
                        placeholder="0"
                        className={`
                          w-full px-3 py-2.5 rounded-xl bg-bg border text-primary text-sm
                          placeholder:text-muted/40 focus:outline-none focus:ring-2 transition-all
                          ${errors[def.key]
                            ? 'border-red-500 focus:ring-red-500/30'
                            : 'border-border focus:ring-accent/50 focus:border-accent'
                          }
                        `}
                      />
                      {errors[def.key] && (
                        <p className="text-xs text-red-500 mt-0.5">{errors[def.key]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Date / Opponent / Notes */}
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Details
                </p>

                {/* Date */}
                <div>
                  <label
                    htmlFor="stat-date"
                    className="block text-sm font-medium text-primary mb-1"
                  >
                    Date
                  </label>
                  <input
                    id="stat-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`
                      w-full px-3 py-2.5 rounded-xl bg-bg border text-primary text-sm
                      focus:outline-none focus:ring-2 transition-all
                      ${errors.date
                        ? 'border-red-500 focus:ring-red-500/30'
                        : 'border-border focus:ring-accent/50 focus:border-accent'
                      }
                    `}
                  />
                  {errors.date && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.date}</p>
                  )}
                </div>

                {/* Opponent */}
                <div>
                  <label
                    htmlFor="stat-opponent"
                    className="block text-sm font-medium text-primary mb-1"
                  >
                    Opponent{' '}
                    <span className="text-muted font-normal text-xs">(optional)</span>
                  </label>
                  <input
                    id="stat-opponent"
                    type="text"
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                    placeholder="e.g. Team Alpha"
                    className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-primary text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="stat-notes"
                    className="block text-sm font-medium text-primary mb-1"
                  >
                    Notes{' '}
                    <span className="text-muted font-normal text-xs">(optional)</span>
                  </label>
                  <textarea
                    id="stat-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did the game go?"
                    className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-primary text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm text-center">
                  {errors.submit}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — submit button (step 2 only) */}
        {!success && step === 2 && (
          <div className="px-6 py-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`
                w-full flex items-center justify-center gap-2
                px-6 py-3 rounded-full text-sm font-semibold transition-all
                ${submitting
                  ? 'bg-border text-muted cursor-wait'
                  : 'bg-accent text-black hover:opacity-90 shadow-md shadow-accent/20'
                }
              `}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Save Entry
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
