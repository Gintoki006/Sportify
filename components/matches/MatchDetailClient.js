'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AccessibleModal from '@/components/ui/AccessibleModal';
import CricketMatchClient from '@/components/clubs/CricketMatchClient';
import FootballMatchClient from '@/components/clubs/FootballMatchClient';
import MemberAutocomplete from '@/components/ui/MemberAutocomplete';
import { isTeamSport } from '@/lib/sportMetrics';

/* ───────── Sport metadata ───────── */
const SPORT_META = {
  FOOTBALL: {
    emoji: '⚽',
    label: 'Football',
    color: 'bg-green-500/15 text-green-400',
  },
  CRICKET: {
    emoji: '🏏',
    label: 'Cricket',
    color: 'bg-amber-500/15 text-amber-400',
  },
  BASKETBALL: {
    emoji: '🏀',
    label: 'Basketball',
    color: 'bg-orange-500/15 text-orange-400',
  },
  BADMINTON: {
    emoji: '🏸',
    label: 'Badminton',
    color: 'bg-cyan-500/15 text-cyan-400',
  },
  TENNIS: {
    emoji: '🎾',
    label: 'Tennis',
    color: 'bg-lime-500/15 text-lime-400',
  },
  VOLLEYBALL: {
    emoji: '🏐',
    label: 'Volleyball',
    color: 'bg-yellow-500/15 text-yellow-400',
  },
};

const TEAM_SPORT_METRICS = {
  FOOTBALL: [
    { key: 'goals', label: 'Goals' },
    { key: 'assists', label: 'Assists' },
    { key: 'shots_on_target', label: 'SOT' },
    { key: 'shots_taken', label: 'Shots' },
  ],
  BASKETBALL: [
    { key: 'points_scored', label: 'Points' },
    { key: 'shots_taken', label: 'Shots' },
    { key: 'shots_on_target', label: 'SOT' },
  ],
  VOLLEYBALL: [
    { key: 'spikes', label: 'Spikes' },
    { key: 'blocks', label: 'Blocks' },
    { key: 'serves', label: 'Serves' },
    { key: 'digs', label: 'Digs' },
  ],
};

const INVITE_STATUS = {
  PENDING: { label: 'Pending', class: 'bg-amber-500/15 text-amber-400' },
  ACCEPTED: { label: 'Accepted', class: 'bg-green-500/15 text-green-400' },
  DECLINED: { label: 'Declined', class: 'bg-red-500/15 text-red-400' },
};

const MATCH_ROLE = {
  HOST: { label: 'Host', class: 'bg-purple-500/15 text-purple-400' },
  PARTICIPANT: { label: 'Player', class: 'bg-blue-500/15 text-blue-400' },
  SPECTATOR: { label: 'Spectator', class: 'bg-gray-500/15 text-gray-400' },
};

/* ═══════════════════════════════════════════════════════
   Match Detail Client
   ═══════════════════════════════════════════════════════ */
export default function MatchDetailClient({
  match,
  currentUserId,
  currentUserRole = 'SPECTATOR',
  members = [],
}) {
  const router = useRouter();
  const isCreator = match.createdByUserId === currentUserId;
  const isHost = currentUserRole === 'HOST';
  const isSpectator = currentUserRole === 'SPECTATOR';
  const isCricket = match.sportType === 'CRICKET';
  const isFootball = match.sportType === 'FOOTBALL';
  const meta = SPORT_META[match.sportType] || {
    emoji: '🏆',
    label: match.sportType,
    color: 'bg-muted/15 text-muted',
  };

  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── If cricket, render the CricketMatchClient with standalone actions ──
  if (isCricket) {
    return (
      <div className="space-y-6">
        {/* Toast */}
        {toast && (
          <div
            role="alert"
            aria-live="assertive"
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top ${
              toast.type === 'error'
                ? 'bg-red-500/90 text-white'
                : 'bg-green-500/90 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Back link */}
        <Link
          href="/dashboard/matches"
          className="text-sm text-accent hover:underline inline-flex items-center gap-1"
        >
          ← Back to Matches
        </Link>

        {/* Action buttons for standalone cricket matches */}
        {match.isStandalone && isCreator && (
          <div className="flex items-center gap-2">
            {!match.completed && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary border border-border hover:border-accent/40 transition-all"
                aria-label="Edit match details"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 border border-border hover:border-red-400/40 transition-all"
              aria-label="Delete match"
            >
              Delete
            </button>
            {!match.completed && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-accent hover:text-accent border border-border hover:border-accent/40 transition-all"
                aria-label="Invite players to match"
              >
                + Invite
              </button>
            )}
          </div>
        )}

        <CricketMatchClient match={match} members={members} />

        {/* Invites section below cricket scorecard */}
        {match.invites?.length > 0 && (
          <InvitesSection
            invites={match.invites}
            currentUserId={currentUserId}
            matchId={match.id}
            isCreator={isCreator}
            onUpdate={() => router.refresh()}
          />
        )}

        {/* ── Modals for cricket standalone matches ── */}

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <AccessibleModal
            isOpen={true}
            onClose={() => setShowDeleteConfirm(false)}
            title="Delete Match"
            maxWidth="max-w-sm"
          >
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted" id="delete-match-description">
                Are you sure you want to delete this match? This will remove all
                scores, innings data, stats, and invites permanently.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const res = await fetch(`/api/matches/${match.id}`, {
                        method: 'DELETE',
                      });
                      if (res.ok) {
                        router.push('/dashboard/matches');
                      } else {
                        const data = await res.json();
                        showToast(data.error || 'Failed to delete', 'error');
                        setDeleting(false);
                      }
                    } catch {
                      showToast('Network error', 'error');
                      setDeleting(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete Match'}
                </button>
              </div>
            </div>
          </AccessibleModal>
        )}

        {/* Edit modal */}
        {showEditModal && (
          <EditMatchModal
            match={match}
            onClose={() => setShowEditModal(false)}
            onSaved={() => {
              setShowEditModal(false);
              showToast('Match updated!');
              router.refresh();
            }}
          />
        )}

        {/* Invite modal */}
        {showInviteModal && (
          <InvitePlayersModal
            matchId={match.id}
            onClose={() => setShowInviteModal(false)}
            onInvited={() => {
              setShowInviteModal(false);
              showToast('Invite sent!');
              router.refresh();
            }}
          />
        )}
      </div>
    );
  }

  // ── If football, render the FootballMatchClient with standalone actions ──
  if (isFootball) {
    return (
      <div className="space-y-6">
        {/* Toast */}
        {toast && (
          <div
            role="alert"
            aria-live="assertive"
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top ${
              toast.type === 'error'
                ? 'bg-red-500/90 text-white'
                : 'bg-green-500/90 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Back link */}
        <Link
          href="/dashboard/matches"
          className="text-sm text-accent hover:underline inline-flex items-center gap-1"
        >
          ← Back to Matches
        </Link>

        {/* Action buttons for standalone football matches */}
        {match.isStandalone && isCreator && (
          <div className="flex items-center gap-2">
            {!match.completed && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary border border-border hover:border-accent/40 transition-all"
                aria-label="Edit match details"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 border border-border hover:border-red-400/40 transition-all"
              aria-label="Delete match"
            >
              Delete
            </button>
            {!match.completed && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-accent hover:text-accent border border-border hover:border-accent/40 transition-all"
                aria-label="Invite players to match"
              >
                + Invite
              </button>
            )}
          </div>
        )}

        <FootballMatchClient match={match} members={members} />

        {/* Invites section below football scorecard */}
        {match.invites?.length > 0 && (
          <InvitesSection
            invites={match.invites}
            currentUserId={currentUserId}
            matchId={match.id}
            isCreator={isCreator}
            onUpdate={() => router.refresh()}
          />
        )}

        {/* ── Modals for football standalone matches ── */}

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <AccessibleModal
            isOpen={true}
            onClose={() => setShowDeleteConfirm(false)}
            title="Delete Match"
            maxWidth="max-w-sm"
          >
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted">
                Are you sure you want to delete this match? This will remove all
                events, player data, stats, and invites permanently.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const res = await fetch(`/api/matches/${match.id}`, {
                        method: 'DELETE',
                      });
                      if (res.ok) {
                        router.push('/dashboard/matches');
                      } else {
                        const data = await res.json();
                        showToast(data.error || 'Failed to delete', 'error');
                        setDeleting(false);
                      }
                    } catch {
                      showToast('Network error', 'error');
                      setDeleting(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete Match'}
                </button>
              </div>
            </div>
          </AccessibleModal>
        )}

        {/* Edit modal */}
        {showEditModal && (
          <EditMatchModal
            match={match}
            onClose={() => setShowEditModal(false)}
            onSaved={() => {
              setShowEditModal(false);
              showToast('Match updated!');
              router.refresh();
            }}
          />
        )}

        {/* Invite modal */}
        {showInviteModal && (
          <InvitePlayersModal
            matchId={match.id}
            onClose={() => setShowInviteModal(false)}
            onInvited={() => {
              setShowInviteModal(false);
              showToast('Invite sent!');
              router.refresh();
            }}
          />
        )}
      </div>
    );
  }

  // ── Non-cricket/football match detail ──
  // Determine status
  let statusLabel, statusClass;
  if (match.completed) {
    statusLabel = 'Completed';
    statusClass = 'bg-green-500/15 text-green-400';
  } else {
    statusLabel = 'Upcoming';
    statusClass = 'bg-blue-500/15 text-blue-400';
  }

  // Winner
  const winner =
    match.completed && match.scoreA !== null && match.scoreB !== null
      ? match.scoreA > match.scoreB
        ? match.teamA
        : match.scoreB > match.scoreA
          ? match.teamB
          : null
      : null;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top ${
            toast.type === 'error'
              ? 'bg-red-500/90 text-white'
              : 'bg-green-500/90 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Back link */}
      <Link
        href="/dashboard/matches"
        className="text-sm text-accent hover:underline inline-flex items-center gap-1"
      >
        ← Back to Matches
      </Link>

      {/* Match Header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        {/* Top bar: sport badge, status, actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${meta.color}`}
            >
              {meta.emoji} {meta.label}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>

          {isCreator && (
            <div className="flex items-center gap-2">
              {!match.completed && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary border border-border hover:border-accent/40 transition-all"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 border border-border hover:border-red-400/40 transition-all"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Score display */}
        <div className="flex items-center justify-between gap-4 py-4">
          {/* Team A */}
          <div className="flex-1 text-center">
            <p
              className={`text-lg font-bold ${winner === match.teamA ? 'text-accent' : 'text-primary'}`}
            >
              {match.teamA}
            </p>
            {match.playerA && (
              <p className="text-xs text-muted mt-0.5">{match.playerA.name}</p>
            )}
            {match.completed && match.scoreA !== null && (
              <p className="text-4xl font-black text-primary mt-2">
                {match.scoreA}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex flex-col items-center gap-1">
            {match.completed ? (
              <span className="text-xs text-muted font-medium">FINAL</span>
            ) : (
              <span className="text-lg text-muted font-bold">VS</span>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1 text-center">
            <p
              className={`text-lg font-bold ${winner === match.teamB ? 'text-accent' : 'text-primary'}`}
            >
              {match.teamB}
            </p>
            {match.playerB && (
              <p className="text-xs text-muted mt-0.5">{match.playerB.name}</p>
            )}
            {match.completed && match.scoreB !== null && (
              <p className="text-4xl font-black text-primary mt-2">
                {match.scoreB}
              </p>
            )}
          </div>
        </div>

        {/* Winner banner */}
        {winner && (
          <div className="text-center py-2 px-4 rounded-xl bg-accent/10 border border-accent/20">
            <p className="text-sm font-semibold text-accent">
              🏆 {winner} wins!
            </p>
          </div>
        )}

        {/* Match info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <span className="text-xs text-muted">
            {match.date
              ? new Date(match.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'No date set'}
          </span>
          <div className="flex items-center gap-2">
            {match.createdBy && (
              <span className="text-xs text-muted">
                Hosted by {match.createdBy.name}
              </span>
            )}
            {match.statsSynced && (
              <span className="text-[10px] font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                Stats synced ✓
              </span>
            )}
          </div>
        </div>

        {/* Enter Score button */}
        {isCreator && !match.completed && (
          <div className="mt-4">
            <button
              onClick={() => setShowScoreModal(true)}
              className="w-full py-3 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
            >
              Enter Score
            </button>
          </div>
        )}
      </div>

      {/* Invites section */}
      {match.invites?.length > 0 && (
        <InvitesSection
          invites={match.invites}
          currentUserId={currentUserId}
          matchId={match.id}
          isCreator={isCreator}
          onUpdate={() => router.refresh()}
        />
      )}

      {/* Invite players button */}
      {isCreator && !match.completed && (
        <button
          onClick={() => setShowInviteModal(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-accent/30 text-accent text-sm font-medium hover:bg-accent/5 transition-all"
        >
          + Invite Players
        </button>
      )}

      {/* ── Modals ── */}

      {/* Score entry modal */}
      {showScoreModal && (
        <StandaloneScoreModal
          match={match}
          members={members}
          onClose={() => setShowScoreModal(false)}
          onSubmitted={() => {
            setShowScoreModal(false);
            showToast('Score submitted!');
            router.refresh();
          }}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <AccessibleModal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Match"
          maxWidth="max-w-sm"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted" id="delete-match-warning">
              Are you sure you want to delete this match? This will remove all
              scores, stats, and invites permanently.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const res = await fetch(`/api/matches/${match.id}`, {
                      method: 'DELETE',
                    });
                    if (res.ok) {
                      router.push('/dashboard/matches');
                    } else {
                      const data = await res.json();
                      showToast(data.error || 'Failed to delete', 'error');
                      setDeleting(false);
                    }
                  } catch {
                    showToast('Network error', 'error');
                    setDeleting(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete Match'}
              </button>
            </div>
          </div>
        </AccessibleModal>
      )}

      {/* Edit modal */}
      {showEditModal && (
        <EditMatchModal
          match={match}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            showToast('Match updated!');
            router.refresh();
          }}
        />
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <InvitePlayersModal
          matchId={match.id}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            setShowInviteModal(false);
            showToast('Invite sent!');
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* ───────── Invites Section ───────── */
function InvitesSection({
  invites,
  currentUserId,
  matchId,
  isCreator,
  onUpdate,
}) {
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function handleAction(inviteId, action) {
    setActionLoading(inviteId);
    setActionError(null);
    try {
      let res;
      if (action === 'cancel') {
        res = await fetch(`/api/matches/${matchId}/invites/${inviteId}`, {
          method: 'DELETE',
        });
      } else {
        res = await fetch(`/api/matches/${matchId}/invites/${inviteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Failed to ${action} invite.`);
      } else {
        onUpdate();
      }
    } catch {
      setActionError('Network error. Please try again.');
    }
    setActionLoading(null);
  }

  const teamAInvites = invites.filter((i) => i.team === 'A');
  const teamBInvites = invites.filter((i) => i.team === 'B');
  const noTeam = invites.filter((i) => !i.team);

  function renderInviteRow(inv) {
    const status = INVITE_STATUS[inv.status] || INVITE_STATUS.PENDING;
    const role = MATCH_ROLE[inv.role] || MATCH_ROLE.PARTICIPANT;
    const isMe = inv.userId === currentUserId;
    const loading = actionLoading === inv.id;

    return (
      <div key={inv.id} className="flex items-center gap-3 py-2">
        {inv.user?.avatarUrl ? (
          <Image
            src={inv.user.avatarUrl}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
            {inv.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <span className="text-sm font-medium text-primary flex-1">
          {inv.user?.name || 'Unknown'}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${role.class}`}
        >
          {role.label}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.class}`}
        >
          {status.label}
        </span>

        {/* Actions */}
        {isMe && inv.status === 'PENDING' && (
          <div className="flex gap-1.5">
            <button
              disabled={loading}
              onClick={() => handleAction(inv.id, 'accept')}
              className="px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              disabled={loading}
              onClick={() => handleAction(inv.id, 'decline')}
              className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/25 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        )}
        {isCreator && inv.status === 'PENDING' && !isMe && (
          <button
            disabled={loading}
            onClick={() => handleAction(inv.id, 'cancel')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted hover:text-red-400 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-primary mb-3">
        Invited Players
      </h3>

      {actionError && (
        <p
          role="alert"
          className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg mb-3"
        >
          {actionError}
        </p>
      )}

      {teamAInvites.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted mb-1">Team A</p>
          <div className="divide-y divide-border/50">
            {teamAInvites.map(renderInviteRow)}
          </div>
        </div>
      )}
      {teamBInvites.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted mb-1">Team B</p>
          <div className="divide-y divide-border/50">
            {teamBInvites.map(renderInviteRow)}
          </div>
        </div>
      )}
      {noTeam.length > 0 && (
        <div>
          <div className="divide-y divide-border/50">
            {noTeam.map(renderInviteRow)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Standalone Score Modal ───────── */
function StandaloneScoreModal({ match, members, onClose, onSubmitted }) {
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const sportType = match.sportType;
  const isTeam = isTeamSport(sportType) && sportType !== 'CRICKET';
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const metricDefs = TEAM_SPORT_METRICS[sportType] || [];

  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);

  const membersList = useMemo(
    () =>
      (members || []).map((m) => ({
        id: m.userId,
        name: m.name,
        avatarUrl: m.avatarUrl,
      })),
    [members],
  );

  function addPlayer(team) {
    const blank = {
      name: '',
      userId: '',
      metrics: Object.fromEntries(metricDefs.map((d) => [d.key, 0])),
    };
    if (team === 'A') setTeamAPlayers((p) => [...p, blank]);
    else setTeamBPlayers((p) => [...p, blank]);
  }

  function removePlayer(team, idx) {
    if (team === 'A') setTeamAPlayers((p) => p.filter((_, i) => i !== idx));
    else setTeamBPlayers((p) => p.filter((_, i) => i !== idx));
  }

  function updatePlayer(team, idx, field, value) {
    const setter = team === 'A' ? setTeamAPlayers : setTeamBPlayers;
    setter((prev) => {
      const copy = [...prev];
      if (field === 'name' || field === 'userId') {
        copy[idx] = { ...copy[idx], [field]: value };
      } else {
        copy[idx] = {
          ...copy[idx],
          metrics: { ...copy[idx].metrics, [field]: value },
        };
      }
      return copy;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const a = parseInt(scoreA);
    const b = parseInt(scoreB);

    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      setError('Enter valid scores (0 or higher).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { scoreA: a, scoreB: b };

      if (showPlayerStats) {
        const allPlayers = [
          ...teamAPlayers
            .filter((p) => p.name.trim())
            .map((p) => ({ ...p, team: 'A' })),
          ...teamBPlayers
            .filter((p) => p.name.trim())
            .map((p) => ({ ...p, team: 'B' })),
        ];
        if (allPlayers.length > 0) {
          payload.playerStats = allPlayers.map((p) => ({
            name: p.name.trim(),
            userId: p.userId || null,
            team: p.team,
            metrics: Object.fromEntries(
              Object.entries(p.metrics).map(([k, v]) => [k, parseInt(v) || 0]),
            ),
          }));
        }
      }

      const res = await fetch(`/api/matches/${match.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit score.');
        setSubmitting(false);
        return;
      }
      onSubmitted();
    } catch {
      setError('Network error.');
      setSubmitting(false);
    }
  }

  function renderPlayerRows(team, players) {
    return (
      <div className="space-y-2">
        {players.map((p, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-start gap-2 bg-bg/50 border border-border/50 rounded-lg p-2 overflow-x-auto"
          >
            <div className="flex-1 min-w-32">
              <MemberAutocomplete
                members={membersList}
                value={p.name}
                playerId={p.userId}
                onChange={(name, uid) => {
                  updatePlayer(team, idx, 'name', name);
                  updatePlayer(team, idx, 'userId', uid);
                }}
                placeholder="Player name"
                inputClassName="w-full px-2 py-1 rounded border border-border bg-bg text-primary text-xs focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>
            {metricDefs.map((def) => (
              <div key={def.key} className="w-16">
                <label className="block text-[9px] text-muted mb-0.5 truncate">
                  {def.label}
                </label>
                <input
                  type="number"
                  min="0"
                  value={p.metrics[def.key]}
                  onChange={(e) =>
                    updatePlayer(team, idx, def.key, e.target.value)
                  }
                  className="w-full px-1 py-1 rounded border border-border bg-bg text-primary text-xs text-center focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => removePlayer(team, idx)}
              className="mt-4 px-1.5 text-red-400 hover:text-red-300 text-xs"
              aria-label={`Remove player ${p.name || idx + 1}`}
              title="Remove player"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addPlayer(team)}
          className="w-full py-1.5 rounded-lg border border-dashed border-accent/40 text-accent text-xs hover:bg-accent/5 transition-colors"
        >
          + Add Player
        </button>
      </div>
    );
  }

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title="Enter Score"
      maxWidth={isTeam && showPlayerStats ? 'max-w-xl' : 'max-w-sm'}
    >
      <form
        onSubmit={handleSubmit}
        className="p-6 space-y-5 overflow-y-auto max-h-[80vh]"
      >
        {/* Score inputs */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-center">
            <label
              htmlFor="score-a"
              className="text-xs text-muted uppercase tracking-wider mb-2 block"
            >
              {match.teamA}
            </label>
            <input
              id="score-a"
              type="number"
              min="0"
              value={scoreA}
              onChange={(e) => setScoreA(e.target.value)}
              className="w-full text-center text-2xl font-bold px-4 py-3 rounded-xl border border-border bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              autoFocus
              required
            />
          </div>
          <span className="text-lg font-bold text-muted mt-6">-</span>
          <div className="text-center">
            <label
              htmlFor="score-b"
              className="text-xs text-muted uppercase tracking-wider mb-2 block"
            >
              {match.teamB}
            </label>
            <input
              id="score-b"
              type="number"
              min="0"
              value={scoreB}
              onChange={(e) => setScoreB(e.target.value)}
              className="w-full text-center text-2xl font-bold px-4 py-3 rounded-xl border border-border bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              required
            />
          </div>
        </div>

        {/* Per-player stats toggle (team sports only) */}
        {isTeam && (
          <button
            type="button"
            onClick={() => setShowPlayerStats(!showPlayerStats)}
            className="text-xs text-accent hover:underline"
          >
            {showPlayerStats
              ? '▼ Hide per-player stats'
              : '▶ Add per-player stats (optional)'}
          </button>
        )}

        {/* Per-player stat rows */}
        {isTeam && showPlayerStats && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                {match.teamA}
              </h4>
              {renderPlayerRows('A', teamAPlayers)}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                {match.teamB}
              </h4>
              {renderPlayerRows('B', teamBPlayers)}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Score'}
          </button>
        </div>
      </form>
    </AccessibleModal>
  );
}

/* ───────── Edit Match Modal ───────── */
function EditMatchModal({ match, onClose, onSaved }) {
  const [teamA, setTeamA] = useState(match.teamA);
  const [teamB, setTeamB] = useState(match.teamB);
  const [matchDate, setMatchDate] = useState(
    match.date ? match.date.split('T')[0] : '',
  );
  const [overs, setOvers] = useState(match.overs || 20);
  const [playersPerSide, setPlayersPerSide] = useState(
    match.playersPerSide || 11,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isCricket = match.sportType === 'CRICKET';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!teamA.trim() || !teamB.trim()) {
      setError('Team names are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        teamA: teamA.trim(),
        teamB: teamB.trim(),
        date: matchDate || undefined,
      };
      if (isCricket) {
        payload.overs = overs;
        payload.playersPerSide = playersPerSide;
      }

      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update.');
        setSubmitting(false);
        return;
      }
      onSaved();
    } catch {
      setError('Network error.');
      setSubmitting(false);
    }
  }

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title="Edit Match"
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Team A
          </label>
          <input
            type="text"
            value={teamA}
            onChange={(e) => setTeamA(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Team B
          </label>
          <input
            type="text"
            value={teamB}
            onChange={(e) => setTeamB(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Date
          </label>
          <input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          />
        </div>

        {isCricket && (
          <>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Overs
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={overs}
                onChange={(e) => setOvers(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Players per side
              </label>
              <input
                type="number"
                min={2}
                max={11}
                value={playersPerSide}
                onChange={(e) => setPlayersPerSide(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AccessibleModal>
  );
}

/* ───────── Invite Players Modal ───────── */
function InvitePlayersModal({ matchId, onClose, onInvited }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [team, setTeam] = useState('A');
  const [role, setRole] = useState('PARTICIPANT');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(null);
  const timerRef = useRef(null);

  function handleSearch(query) {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.users || []);
        }
      } catch {
        /* ignore */
      }
      setSearching(false);
    }, 300);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function sendInvite(userId) {
    setError('');
    setSending(userId);
    try {
      const res = await fetch(`/api/matches/${matchId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, team, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send invite.');
        setSending(null);
        return;
      }
      onInvited();
    } catch {
      setError('Network error.');
      setSending(null);
    }
  }

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title="Invite Player"
      maxWidth="max-w-sm"
    >
      <div className="p-6 space-y-4">
        {/* Team selector */}
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">
            Invite to team
          </label>
          <div className="flex gap-2">
            {['A', 'B'].map((t) => (
              <button
                key={t}
                onClick={() => setTeam(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  team === t
                    ? 'bg-accent text-black'
                    : 'bg-surface border border-border text-muted hover:text-primary'
                }`}
              >
                Team {t}
              </button>
            ))}
          </div>
        </div>

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">
            Role
          </label>
          <div className="flex gap-2">
            {[
              {
                value: 'PARTICIPANT',
                label: 'Player',
                desc: 'Can play in the match',
              },
              { value: 'SPECTATOR', label: 'Spectator', desc: 'View only' },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  role === r.value
                    ? 'bg-accent text-black'
                    : 'bg-surface border border-border text-muted hover:text-primary'
                }`}
                title={r.desc}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search by name or email"
            className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-primary placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
            autoFocus
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {results.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg transition-colors"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {user.name}
                  </p>
                  {user.email && (
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  )}
                </div>
                <button
                  disabled={sending === user.id}
                  onClick={() => sendInvite(user.id)}
                  className="px-3 py-1.5 rounded-lg bg-accent/15 text-accent text-xs font-medium hover:bg-accent/25 disabled:opacity-50 transition-all"
                >
                  {sending === user.id ? '…' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        )}

        {search.length >= 2 && !searching && results.length === 0 && (
          <p className="text-xs text-muted text-center py-3">No users found.</p>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>
    </AccessibleModal>
  );
}
