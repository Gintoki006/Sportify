'use client';

import { useState, useRef } from 'react';
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
  const [showEditClub, setShowEditClub] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDeleteClub() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to delete club', 'error');
        setDeleting(false);
        return;
      }
      showToast('Club deleted successfully');
      setTimeout(() => {
        router.push('/dashboard/clubs');
        router.refresh();
      }, 1000);
    } catch {
      showToast('Network error', 'error');
      setDeleting(false);
    }
  }

  async function handleRemoveMember(userId, memberName) {
    setRemovingMemberId(userId);
    try {
      const res = await fetch(`/api/clubs/${club.id}/members/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to remove member', 'error');
        setRemovingMemberId(null);
        return;
      }
      showToast(`${memberName} has been removed`);
      setRemovingMemberId(null);
      router.refresh();
    } catch {
      showToast('Network error', 'error');
      setRemovingMemberId(null);
    }
  }

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
            {club.isAdmin && (
              <button
                onClick={() => setShowEditClub(true)}
                className="px-3 py-2 rounded-xl border border-accent/30 text-sm text-accent hover:bg-accent/10 transition-all"
                title="Edit Club"
              >
                ✏️ Edit
              </button>
            )}
            {club.isAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="px-3 py-2 rounded-xl border border-red-500/30 text-sm text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                title="Delete Club"
              >
                {deleting ? 'Deleting…' : '🗑️ Delete'}
              </button>
            )}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Members ({club.members.length})
          </h3>
          {club.isAdmin && (
            <button
              onClick={() => setShowAddMember(true)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-accent text-black font-semibold text-xs hover:brightness-110 transition-all"
              aria-label="Add member"
            >
              + Add Member
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {club.members.map((member) => {
            const isAdmin = member.userId === club.admin.id;
            const isRemoving = removingMemberId === member.userId;
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-bg group"
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
                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {member.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted">
                    {isAdmin ? 'Admin' : 'Member'}
                  </p>
                </div>
                {club.isAdmin && !isAdmin && (
                  <button
                    onClick={() =>
                      setConfirmRemoveMember({
                        userId: member.userId,
                        name: member.name,
                      })
                    }
                    disabled={isRemoving}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 shrink-0"
                    title={`Remove ${member.name}`}
                    aria-label={`Remove ${member.name}`}
                  >
                    {isRemoving ? (
                      <span className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin inline-block" />
                    ) : (
                      '✕'
                    )}
                  </button>
                )}
              </div>
            );
          })}
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

      {/* Edit Club Modal */}
      {showEditClub && (
        <EditClubModal
          club={club}
          onClose={() => setShowEditClub(false)}
          onSuccess={() => {
            showToast('Club details updated!');
            router.refresh();
          }}
        />
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          clubId={club.id}
          onClose={() => setShowAddMember(false)}
          onSuccess={(memberName) => {
            showToast(`${memberName} added to the club!`);
            router.refresh();
          }}
        />
      )}

      {/* Remove Member Confirmation Modal */}
      {confirmRemoveMember && (
        <AccessibleModal
          isOpen={true}
          onClose={() => setConfirmRemoveMember(null)}
          title="Remove Member"
          maxWidth="max-w-sm"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted">
              Remove{' '}
              <strong className="text-primary">
                {confirmRemoveMember.name}
              </strong>{' '}
              from this club? They can rejoin later using the club ID.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemoveMember(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-primary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const { userId, name } = confirmRemoveMember;
                  setConfirmRemoveMember(null);
                  handleRemoveMember(userId, name);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:brightness-110 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </AccessibleModal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <AccessibleModal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Club"
          maxWidth="max-w-sm"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted">
              Are you sure you want to delete{' '}
              <strong className="text-primary">{club.name}</strong>? This will
              permanently remove all tournaments, matches, and memberships.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-primary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteClub();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:brightness-110 transition-all"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </AccessibleModal>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-200 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                : 'bg-green-500/10 border-green-500/30 text-green-500'
            }`}
            role="alert"
          >
            <span>{toast.type === 'error' ? '✕' : '✓'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
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

/* ───────── Edit Club Modal ───────── */
function EditClubModal({ club, onClose, onSuccess }) {
  const [name, setName] = useState(club.name || '');
  const [description, setDescription] = useState(club.description || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Club name is required.');
      return;
    }

    if (name.trim().length > 100) {
      setError('Club name must be 100 characters or fewer.');
      return;
    }

    if (description.length > 500) {
      setError('Description must be 500 characters or fewer.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
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
        onSuccess();
        onClose();
      }, 1200);
    } catch {
      setError('Network error.');
      setSubmitting(false);
    }
  }

  return (
    <AccessibleModal isOpen={true} onClose={onClose} title="Edit Club">
      {success ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="text-5xl animate-bounce mb-4">✅</div>
          <p className="text-primary font-semibold text-lg">Club Updated!</p>
          <p className="text-muted text-sm mt-1">Changes saved successfully.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Club Name */}
          <div>
            <label
              htmlFor="edit-club-name"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
            >
              Club Name
            </label>
            <input
              id="edit-club-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter club name"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              required
            />
            <p className="text-xs text-muted mt-1 text-right">
              {name.length}/100
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="edit-club-desc"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
            >
              Description{' '}
              <span className="text-muted/50 normal-case">(optional)</span>
            </label>
            <textarea
              id="edit-club-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your club..."
              maxLength={500}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
            />
            <p className="text-xs text-muted mt-1 text-right">
              {description.length}/500
            </p>
          </div>

          {error && (
            <p
              className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-primary transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </form>
      )}
    </AccessibleModal>
  );
}

/* ───────── Add Member Modal ───────── */
function AddMemberModal({ clubId, onClose, onSuccess }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);
  const [error, setError] = useState('');
  const searchTimer = useRef(null);

  function handleSearchChange(value) {
    setQuery(value);
    setError('');

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/clubs/${clubId}/members?q=${encodeURIComponent(value.trim())}`,
        );
        const data = await res.json();
        if (res.ok) {
          setResults(data.users || []);
        } else {
          setError(data.error || 'Search failed');
        }
      } catch {
        setError('Network error');
      }
      setSearching(false);
    }, 400);
  }

  async function handleAddUser(user) {
    setAddingUserId(user.id);
    setError('');
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add member');
        setAddingUserId(null);
        return;
      }

      // Remove added user from results
      setResults((prev) => prev.filter((u) => u.id !== user.id));
      setAddingUserId(null);
      onSuccess(user.name);
      onClose();
    } catch {
      setError('Network error');
      setAddingUserId(null);
    }
  }

  return (
    <AccessibleModal isOpen={true} onClose={onClose} title="Add Member">
      <div className="p-6 space-y-4">
        {/* Search input */}
        <div>
          <label
            htmlFor="member-search"
            className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
          >
            Search Users
          </label>
          <input
            id="member-search"
            type="text"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name or email..."
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
          <p className="text-xs text-muted mt-1">
            Type at least 2 characters to search
          </p>
        </div>

        {error && (
          <p
            className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Search results */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {searching && (
            <div className="flex items-center justify-center py-6">
              <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-muted">Searching…</span>
            </div>
          )}

          {!searching && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-6">
              <p className="text-muted text-sm">
                No users found matching &ldquo;{query}&rdquo;
              </p>
            </div>
          )}

          {!searching &&
            results.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-bg hover:bg-border/30 transition-colors"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => handleAddUser(user)}
                  disabled={addingUserId === user.id}
                  className="px-3 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  aria-label={`Add ${user.name}`}
                >
                  {addingUserId === user.id ? (
                    <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                  ) : (
                    'Add'
                  )}
                </button>
              </div>
            ))}
        </div>
      </div>
    </AccessibleModal>
  );
}
