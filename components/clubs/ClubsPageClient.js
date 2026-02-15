'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AccessibleModal from '@/components/ui/AccessibleModal';

/* ───────── Clubs Page Client ───────── */
export default function ClubsPageClient({ clubs }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Clubs</h1>
          <p className="text-muted text-sm mt-1">
            Create or join clubs to organize tournaments.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
          >
            <span className="text-lg">+</span> Create Club
          </button>
        </div>
      </div>

      {/* Join by ID */}
      <JoinClubBar />

      {/* Club list */}
      {clubs.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🏟️</div>
          <h3 className="text-primary font-semibold text-lg mb-1">
            No clubs yet
          </h3>
          <p className="text-muted text-sm max-w-sm mx-auto">
            Create a club to start organizing tournaments with friends.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
          >
            Create Your First Club
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && <CreateClubModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

/* ───────── Join Club Bar ───────── */
function JoinClubBar() {
  const router = useRouter();
  const [clubId, setClubId] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleJoin(e) {
    e.preventDefault();
    if (!clubId.trim()) return;
    setError('');
    setSuccess('');
    setJoining(true);

    try {
      const res = await fetch(`/api/clubs/${clubId.trim()}/join`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not join club.');
        setJoining(false);
        return;
      }

      setSuccess('Joined successfully!');
      setClubId('');
      setTimeout(() => {
        router.refresh();
        setSuccess('');
      }, 1500);
    } catch {
      setError('Network error.');
    }
    setJoining(false);
  }

  return (
    <form
      onSubmit={handleJoin}
      className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
    >
      <div className="flex-1">
        <input
          type="text"
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
          placeholder="Paste a Club ID to join…"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={joining || !clubId.trim()}
        className="px-5 py-2.5 rounded-xl border border-accent text-accent font-semibold text-sm hover:bg-accent/10 transition-all disabled:opacity-50"
      >
        {joining ? 'Joining…' : 'Join Club'}
      </button>
      {error && (
        <p className="text-red-500 text-xs" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-500 text-xs" role="status">
          {success}
        </p>
      )}
    </form>
  );
}

/* ───────── Club Card ───────── */
function ClubCard({ club }) {
  return (
    <Link
      href={`/dashboard/clubs/${club.id}`}
      className="block bg-surface border border-border rounded-2xl p-5 hover:shadow-md hover:border-accent/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-primary group-hover:text-accent transition-colors">
            {club.name}
          </h3>
          {club.description && (
            <p className="text-muted text-sm mt-1 line-clamp-2">
              {club.description}
            </p>
          )}
        </div>
        {club.isAdmin && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">
            Admin
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted">
        <span>
          👥 {club.memberCount} member{club.memberCount !== 1 ? 's' : ''}
        </span>
        <span>
          🏆 {club.tournamentCount} tournament
          {club.tournamentCount !== 1 ? 's' : ''}
        </span>
        <span>by {club.adminName}</span>
      </div>
    </Link>
  );
}

/* ───────── Create Club Modal ───────── */
function CreateClubModal({ onClose }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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

    setSubmitting(true);
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
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
        router.refresh();
        onClose();
      }, 1200);
    } catch {
      setError('Network error.');
      setSubmitting(false);
    }
  }

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title="Create Club"
      maxWidth="max-w-md"
    >
      {success ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="text-5xl animate-bounce mb-4">🏟️</div>
          <p className="text-primary font-semibold text-lg">Club Created!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label
              htmlFor="club-name"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
            >
              Club Name
            </label>
            <input
              id="club-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend Warriors"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              required
            />
          </div>

          <div>
            <label
              htmlFor="club-desc"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
            >
              Description{' '}
              <span className="text-muted/50 normal-case">(optional)</span>
            </label>
            <textarea
              id="club-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What's your club about?"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
            />
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
              'Create Club'
            )}
          </button>
        </form>
      )}
    </AccessibleModal>
  );
}
