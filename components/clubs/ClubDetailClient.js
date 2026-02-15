'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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

const STATUS_STYLES = {
  UPCOMING: 'bg-blue-500/10 text-blue-500',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-500',
  COMPLETED: 'bg-green-500/10 text-green-500',
};

const STATUS_LABELS = {
  UPCOMING: 'Upcoming',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export default function ClubDetailClient({ club, currentUserId }) {
  const router = useRouter();
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleLeave() {
    if (!confirm('Are you sure you want to leave this club?')) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setLeaving(false);
        return;
      }
      router.push('/dashboard/clubs');
      router.refresh();
    } catch {
      setLeaving(false);
    }
  }

  async function handleCopyId() {
    try {
      await navigator.clipboard.writeText(club.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-primary">{club.name}</h1>
              {club.isAdmin && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  Admin
                </span>
              )}
            </div>
            {club.description && (
              <p className="text-muted text-sm mb-3">{club.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              <span>
                👥 {club.members.length} member
                {club.members.length !== 1 ? 's' : ''}
              </span>
              <span>
                🏆 {club.tournaments.length} tournament
                {club.tournaments.length !== 1 ? 's' : ''}
              </span>
              <span>
                📅 Created{' '}
                {new Date(club.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopyId}
              className="px-3 py-2 rounded-xl border border-border text-sm text-muted hover:text-primary hover:border-accent transition-all"
              title="Copy Club ID for invites"
            >
              {copied ? '✓ Copied!' : '📋 Copy ID'}
            </button>
            {!club.isAdmin && (
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="px-3 py-2 rounded-xl border border-red-500/30 text-sm text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
              >
                {leaving ? 'Leaving…' : 'Leave Club'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Members section */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
          Members
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {club.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-bg"
            >
              {member.avatarUrl ? (
                <Image
                  src={member.avatarUrl}
                  alt={member.name}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                  {member.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {member.name}
                </p>
                <p className="text-xs text-muted">
                  {member.userId === club.admin.id ? 'Admin' : 'Member'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tournaments section */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Tournaments
          </h3>
          {club.isAdmin && (
            <button
              onClick={() => setShowCreateTournament(true)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-accent text-black font-semibold text-xs hover:brightness-110 transition-all"
            >
              + New Tournament
            </button>
          )}
        </div>

        {club.tournaments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-muted text-sm">No tournaments yet.</p>
            {club.isAdmin && (
              <button
                onClick={() => setShowCreateTournament(true)}
                className="mt-3 text-xs font-medium text-accent hover:underline"
              >
                Create one →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {club.tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/clubs/${club.id}/tournament/${t.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-bg hover:bg-border/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{SPORT_EMOJIS[t.sportType]}</span>
                  <div>
                    <p className="text-sm font-semibold text-primary group-hover:text-accent transition-colors">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted">
                      {SPORT_LABELS[t.sportType]} ·{' '}
                      {new Date(t.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {t.endDate &&
                        ` – ${new Date(t.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}`}
                      {' · '}
                      {t.matchCount} match{t.matchCount !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[t.status]}`}
                >
                  {STATUS_LABELS[t.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreateTournament && (
        <CreateTournamentModal
          clubId={club.id}
          onClose={() => setShowCreateTournament(false)}
        />
      )}
    </div>
  );
}

/* ───────── Create Tournament Modal ───────── */
function CreateTournamentModal({ clubId, onClose }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sportType, setSportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bracketSize, setBracketSize] = useState(4);
  const [teams, setTeams] = useState(Array(4).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleBracketSizeChange(size) {
    setBracketSize(size);
    setTeams((prev) => {
      const newTeams = Array(size).fill('');
      for (let i = 0; i < Math.min(prev.length, size); i++) {
        newTeams[i] = prev[i];
      }
      return newTeams;
    });
  }

  function handleTeamChange(index, value) {
    setTeams((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !sportType || !startDate) {
      setError('Name, sport, and start date are required.');
      return;
    }

    const filledTeams = teams.map((t) => t.trim()).filter(Boolean);
    if (filledTeams.length < bracketSize) {
      setError(`Please enter names for all ${bracketSize} teams/players.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          name: name.trim(),
          sportType,
          startDate,
          endDate: endDate || null,
          bracketSize,
          teams: filledTeams,
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
      setError('Network error.');
      setSubmitting(false);
    }
  }

  return (
    <AccessibleModal isOpen={true} onClose={onClose} title="New Tournament">
      {success ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="text-5xl animate-bounce mb-4">🏆</div>
          <p className="text-primary font-semibold text-lg">
            Tournament Created!
          </p>
          <p className="text-muted text-sm mt-1">Bracket is ready.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Name */}
          <div>
            <label
              htmlFor="tourney-name"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
            >
              Tournament Name
            </label>
            <input
              id="tourney-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring Cup 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              required
            />
          </div>

          {/* Sport */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Sport
            </label>
            <div
              className="grid grid-cols-3 gap-2"
              role="group"
              aria-label="Select sport"
            >
              {Object.entries(SPORT_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSportType(key)}
                  aria-pressed={sportType === key}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    sportType === key
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted hover:border-accent/50'
                  }`}
                >
                  <span aria-hidden="true">{SPORT_EMOJIS[key]}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tourney-start"
                className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
              >
                Start Date
              </label>
              <input
                id="tourney-start"
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                required
              />
            </div>
            <div>
              <label
                htmlFor="tourney-end"
                className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
              >
                End Date{' '}
                <span className="text-muted/50 normal-case">(opt)</span>
              </label>
              <input
                id="tourney-end"
                type="date"
                min={startDate || today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
          </div>

          {/* Bracket Size */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Bracket Size
            </label>
            <div
              className="flex gap-2"
              role="group"
              aria-label="Select bracket size"
            >
              {[2, 4, 8, 16].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleBracketSizeChange(size)}
                  aria-pressed={bracketSize === size}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    bracketSize === size
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted hover:border-accent/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Team Names */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Teams / Players ({bracketSize})
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {teams.map((team, i) => (
                <input
                  key={i}
                  type="text"
                  value={team}
                  onChange={(e) => handleTeamChange(i, e.target.value)}
                  placeholder={`Team ${i + 1}`}
                  aria-label={`Team ${i + 1} name`}
                  className="px-3 py-2 rounded-lg border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  required
                />
              ))}
            </div>
          </div>

          {error && (
            <p
              className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"
              role="alert"
            >
              {error}
            </p>
          )}

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
              'Create Tournament'
            )}
          </button>
        </form>
      )}
    </AccessibleModal>
  );
}
