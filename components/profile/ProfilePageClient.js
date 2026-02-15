'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SPORT_METRICS } from '@/lib/sportMetrics';
import AccessibleModal from '@/components/ui/AccessibleModal';

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

const SPORT_COLORS = {
  FOOTBALL: '#22c55e',
  CRICKET: '#f59e0b',
  BASKETBALL: '#ef4444',
  BADMINTON: '#06b6d4',
  TENNIS: '#84cc16',
  VOLLEYBALL: '#eab308',
};

const ALL_SPORTS = [
  'FOOTBALL',
  'CRICKET',
  'BASKETBALL',
  'BADMINTON',
  'TENNIS',
  'VOLLEYBALL',
];

/* ───────── Main Component ───────── */
export default function ProfilePageClient({ user, sportData }) {
  const [activeTab, setActiveTab] = useState(
    sportData.length > 0 ? sportData[0].sportType : null,
  );
  const [showEdit, setShowEdit] = useState(false);

  const activeSportData = sportData.find((s) => s.sportType === activeTab);

  return (
    <div className="space-y-6">
      {/* ── Profile Header ── */}
      <ProfileHeader user={user} onEdit={() => setShowEdit(true)} />

      {/* ── Sport Tabs ── */}
      {sportData.length > 0 ? (
        <>
          <SportTabs
            sportData={sportData}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {activeSportData && (
            <div className="space-y-6">
              <StatSummaryCards sportData={activeSportData} />
              <StatHistoryTable
                key={activeSportData.sportType}
                sportData={activeSportData}
              />
              <SportGoals sportData={activeSportData} />
            </div>
          )}
        </>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🏅</div>
          <h3 className="text-primary font-semibold text-lg mb-1">
            No sports added yet
          </h3>
          <p className="text-muted text-sm">
            Add sports from your profile settings to start tracking.
          </p>
          <button
            onClick={() => setShowEdit(true)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEdit && (
        <EditProfileModal
          user={user}
          currentSports={sportData.map((s) => ({
            id: s.profileId,
            sportType: s.sportType,
          }))}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

/* ───────── Profile Header ───────── */
function ProfileHeader({ user, onEdit }) {
  const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={96}
              height={96}
              className="rounded-full ring-4 ring-accent/20 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center ring-4 ring-accent/20">
              <span className="text-3xl font-bold text-accent">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-primary">{user.name}</h1>
          <p className="text-muted text-sm mt-0.5">{user.email}</p>
          {user.bio && (
            <p className="text-primary/80 text-sm mt-2 max-w-lg">{user.bio}</p>
          )}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
            <span className="text-xs text-muted bg-bg px-3 py-1 rounded-full">
              📅 Joined {joinedDate}
            </span>
            <span className="text-xs text-muted bg-bg px-3 py-1 rounded-full">
              🏆 {user.sportCount} sport{user.sportCount !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-muted bg-bg px-3 py-1 rounded-full">
              📊 {user.totalEntries} entries
            </span>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={onEdit}
          className="shrink-0 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted hover:text-primary hover:border-accent transition-all"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}

/* ───────── Sport Tabs ───────── */
function SportTabs({ sportData, activeTab, onTabChange }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      role="tablist"
      aria-label="Sport filters"
    >
      {sportData.map((s) => {
        const isActive = s.sportType === activeTab;
        return (
          <button
            key={s.sportType}
            onClick={() => onTabChange(s.sportType)}
            role="tab"
            aria-selected={isActive}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              isActive
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'bg-surface border border-border text-muted hover:text-primary hover:border-accent/30'
            }`}
          >
            <span>{SPORT_EMOJIS[s.sportType]}</span>
            <span>{SPORT_LABELS[s.sportType]}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-accent/20' : 'bg-bg'
              }`}
            >
              {s.entries.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────── Stat Summary Cards ───────── */
function StatSummaryCards({ sportData }) {
  const metrics = SPORT_METRICS[sportData.sportType] || [];
  const entries = sportData.entries;

  // Compute totals / averages for each metric
  const summaries = metrics.map((m) => {
    let total = 0;
    let count = 0;
    for (const entry of entries) {
      const val = entry.metrics?.[m.key];
      if (typeof val === 'number') {
        total += val;
        count++;
      }
    }
    return {
      key: m.key,
      label: m.label,
      total,
      average: count > 0 ? (total / count).toFixed(1) : '0',
      unit: m.unit,
      type: m.type,
    };
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {summaries.map((s) => (
        <div
          key={s.key}
          className="bg-surface border border-border rounded-xl p-4"
        >
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            {s.label}
          </p>
          <p className="text-xl font-bold text-primary">
            {s.type === 'float' ? s.average : s.total}
            {s.unit ? (
              <span className="text-xs text-muted ml-1">{s.unit}</span>
            ) : null}
          </p>
          {s.type !== 'float' && (
            <p className="text-xs text-muted">avg {s.average} / entry</p>
          )}
        </div>
      ))}
      {/* Total entries card */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-xs text-muted uppercase tracking-wider mb-1">
          Entries
        </p>
        <p className="text-xl font-bold text-primary">{entries.length}</p>
        <p className="text-xs text-muted">total recorded</p>
      </div>
    </div>
  );
}

/* ───────── Stat History Table ───────── */
function StatHistoryTable({ sportData }) {
  const metrics = SPORT_METRICS[sportData.sportType] || [];
  const entries = sportData.entries;
  const [showAll, setShowAll] = useState(false);
  const displayEntries = showAll ? entries : entries.slice(0, 8);

  if (entries.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 text-center">
        <p className="text-muted text-sm">
          No stat entries for {SPORT_LABELS[sportData.sportType]} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
          Stat History
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table
          className="w-full text-sm"
          aria-label={`${SPORT_LABELS[sportData.sportType]} stat history`}
        >
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                Date
              </th>
              {metrics.map((m) => (
                <th
                  key={m.key}
                  className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider"
                >
                  {m.label}
                </th>
              ))}
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                Opponent
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {displayEntries.map((entry, i) => (
              <tr
                key={entry.id}
                className={`border-b border-border/50 hover:bg-bg/50 transition-colors ${
                  i % 2 === 0 ? '' : 'bg-bg/30'
                }`}
              >
                <td className="px-4 py-3 text-primary whitespace-nowrap">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                {metrics.map((m) => (
                  <td
                    key={m.key}
                    className="text-right px-4 py-3 text-primary font-medium tabular-nums"
                  >
                    {entry.metrics?.[m.key] ?? '—'}
                  </td>
                ))}
                <td className="px-4 py-3 text-muted truncate max-w-[120px]">
                  {entry.opponent || '—'}
                </td>
                <td className="px-4 py-3">
                  {entry.source === 'TOURNAMENT' ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                      Tournament
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Manual</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length > 8 && (
        <div className="px-6 py-3 border-t border-border text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-medium text-accent hover:underline"
          >
            {showAll ? 'Show less' : `View all ${entries.length} entries →`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────── Sport Goals ───────── */
function SportGoals({ sportData }) {
  const activeGoals = sportData.goals.filter((g) => !g.completed);
  const completedGoals = sportData.goals.filter((g) => g.completed);
  const sportLabel = SPORT_LABELS[sportData.sportType];
  const color = SPORT_COLORS[sportData.sportType] || '#CDEB5E';

  if (sportData.goals.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 text-center">
        <p className="text-muted text-sm">No goals set for {sportLabel} yet.</p>
        <a
          href="/dashboard/goals"
          className="inline-block mt-2 text-xs font-medium text-accent hover:underline"
        >
          Create a goal →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
          {sportLabel} Goals
        </h3>
        <a
          href="/dashboard/goals"
          className="text-xs font-medium text-accent hover:underline"
        >
          Manage →
        </a>
      </div>

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3 mb-4">
          {activeGoals.map((goal) => {
            const percent =
              goal.target > 0
                ? Math.min(Math.round((goal.current / goal.target) * 100), 100)
                : 0;
            return (
              <div key={goal.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-primary capitalize">
                      {goal.metric.replace(/_/g, ' ')}
                    </span>
                    <span className="text-muted">
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${goal.metric.replace(/_/g, ' ')} ${percent}% progress`}
                      style={{
                        width: `${percent}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
                <span
                  className="text-sm font-bold shrink-0 w-12 text-right"
                  style={{ color }}
                >
                  {percent}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-2">
            Completed ({completedGoals.length})
          </p>
          <div className="space-y-2">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg/50"
              >
                <span className="text-sm text-muted capitalize line-through">
                  {goal.metric.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-green-500 font-medium">
                  ✓ {goal.target} reached
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Edit Profile Modal ───────── */
function EditProfileModal({ user, currentSports, onClose }) {
  const router = useRouter();
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [selectedSports, setSelectedSports] = useState(
    currentSports.map((s) => s.sportType),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function toggleSport(sport) {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (selectedSports.length === 0) {
      setError('Select at least one sport.');
      return;
    }

    setSubmitting(true);
    try {
      const currentTypes = currentSports.map((s) => s.sportType);
      const addSports = selectedSports.filter((s) => !currentTypes.includes(s));
      const removeSportProfileIds = currentSports
        .filter((s) => !selectedSports.includes(s.sportType))
        .map((s) => s.id);

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          addSports: addSports.length > 0 ? addSports : undefined,
          removeSportProfileIds:
            removeSportProfileIds.length > 0
              ? removeSportProfileIds
              : undefined,
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
      }, 1000);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <AccessibleModal isOpen={true} onClose={onClose} title="Edit Profile">
      {success ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-primary font-semibold text-lg">Profile Updated!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Name */}
          <div>
            <label
              htmlFor="edit-name"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
            >
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="edit-bio"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
            >
              Bio <span className="text-muted/50 normal-case">(optional)</span>
            </label>
            <textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="A few words about yourself…"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
            />
            <p className="text-xs text-muted mt-1 text-right">
              {bio.length}/300
            </p>
          </div>

          {/* Sports */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Sports
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_SPORTS.map((sport) => {
                const isSelected = selectedSports.includes(sport);
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted hover:border-accent/50'
                    }`}
                  >
                    <span>{SPORT_EMOJIS[sport]}</span>
                    <span>{SPORT_LABELS[sport]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warning when removing sports */}
          {currentSports.some((s) => !selectedSports.includes(s.sportType)) && (
            <p className="text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg">
              ⚠️ Removing a sport will delete all its entries and goals.
            </p>
          )}

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
                Saving…
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      )}
    </AccessibleModal>
  );
}
