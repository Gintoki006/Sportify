'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AccessibleModal from '@/components/ui/AccessibleModal';
import {
  ROLE_META,
  ASSIGNABLE_ROLES,
  hasPermission,
} from '@/lib/clubPermissions';
import { isTeamSport } from '@/lib/sportMetrics';

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
  const [requestingUpgrade, setRequestingUpgrade] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [roleRequests, setRoleRequests] = useState([]);
  const canManageRoles = hasPermission(club.currentUserRole, 'manageRoles');
  const [loadingRequests, setLoadingRequests] = useState(canManageRoles);
  const [confirmRoleChange, setConfirmRoleChange] = useState(null);
  const [changingRole, setChangingRole] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [openRoleDropdown, setOpenRoleDropdown] = useState(null);
  const roleDropdownRef = useRef(null);

  // Close role dropdown on outside click
  useEffect(() => {
    if (!openRoleDropdown) return;
    function handleClickOutside(e) {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(e.target)
      ) {
        setOpenRoleDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openRoleDropdown]);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Fetch pending role upgrade requests (admin only)
  const canManageMembers = hasPermission(club.currentUserRole, 'manageMembers');
  const canEditClub = hasPermission(club.currentUserRole, 'editClub');
  const canDeleteClub = hasPermission(club.currentUserRole, 'deleteClub');
  const canCreateTournament = hasPermission(
    club.currentUserRole,
    'createTournament',
  );

  useEffect(() => {
    if (!canManageRoles) return;
    fetch(`/api/clubs/${club.id}/role-requests`)
      .then((res) => res.json())
      .then((data) => {
        if (data.requests) setRoleRequests(data.requests);
      })
      .catch(() => {})
      .finally(() => setLoadingRequests(false));
  }, [club.id, canManageRoles]);

  async function handleRoleUpgradeRequest(requestedRole) {
    setRequestingUpgrade(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}/role-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit request', 'error');
        setRequestingUpgrade(false);
        return;
      }
      showToast('Role upgrade request submitted!');
      setShowUpgradeModal(false);
    } catch {
      showToast('Network error', 'error');
    }
    setRequestingUpgrade(false);
  }

  async function handleRequestAction(requestId, action, userName) {
    setProcessingRequestId(requestId);
    try {
      const res = await fetch(
        `/api/clubs/${club.id}/role-requests/${requestId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to process request', 'error');
        setProcessingRequestId(null);
        return;
      }
      showToast(
        action === 'approve'
          ? `${userName}'s role upgraded!`
          : `${userName}'s request rejected`,
      );
      setRoleRequests((prev) => prev.filter((r) => r.id !== requestId));
      setProcessingRequestId(null);
      if (action === 'approve') router.refresh();
    } catch {
      showToast('Network error', 'error');
      setProcessingRequestId(null);
    }
  }

  async function handleRoleChange() {
    if (!confirmRoleChange) return;
    const { userId, name, newRole } = confirmRoleChange;
    setChangingRole(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to change role', 'error');
        setChangingRole(false);
        return;
      }
      showToast(
        `${name}'s role changed to ${ROLE_META[newRole]?.label || newRole}`,
      );
      setConfirmRoleChange(null);
      setChangingRole(false);
      router.refresh();
    } catch {
      showToast('Network error', 'error');
      setChangingRole(false);
    }
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
      router.push('/dashboard/clubs');
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
              {club.currentUserRole && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_META[club.currentUserRole]?.bg || 'bg-accent/10'} ${ROLE_META[club.currentUserRole]?.color || 'text-accent'}`}
                >
                  {ROLE_META[club.currentUserRole]?.label ||
                    club.currentUserRole}
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

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleCopyId}
              className="px-3 py-2 rounded-xl border border-border text-sm text-muted hover:text-primary hover:border-accent transition-all"
              title="Copy Club ID for invites"
              aria-label={
                copied
                  ? 'Club ID copied to clipboard'
                  : 'Copy Club ID for invites'
              }
            >
              {copied ? '✓ Copied!' : '📋 Copy ID'}
            </button>
            {canEditClub && (
              <button
                onClick={() => setShowEditClub(true)}
                className="px-3 py-2 rounded-xl border border-accent/30 text-sm text-accent hover:bg-accent/10 transition-all"
                title="Edit Club"
              >
                ✏️ Edit
              </button>
            )}
            {canDeleteClub && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="px-3 py-2 rounded-xl border border-red-500/30 text-sm text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                title="Delete Club"
              >
                {deleting ? 'Deleting…' : '🗑️ Delete'}
              </button>
            )}
            {!club.isAdmin && club.isMember && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-3 py-2 rounded-xl border border-blue-500/30 text-sm text-blue-500 hover:bg-blue-500/10 transition-all"
                title="Request Role Upgrade"
              >
                ⬆️ Request Upgrade
              </button>
            )}
            {!club.isAdmin && club.isMember && (
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
          {canManageMembers && (
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
            const memberRole = isAdmin ? 'ADMIN' : member.role || 'SPECTATOR';
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {canManageRoles && !isAdmin ? (
                      <div
                        className="relative"
                        ref={
                          openRoleDropdown === member.userId
                            ? roleDropdownRef
                            : undefined
                        }
                      >
                        <button
                          onClick={() =>
                            setOpenRoleDropdown(
                              openRoleDropdown === member.userId
                                ? null
                                : member.userId,
                            )
                          }
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-all ${ROLE_META[memberRole]?.bg || 'bg-surface'} ${ROLE_META[memberRole]?.color || 'text-muted'} hover:brightness-125`}
                          aria-label={`Change role for ${member.name}`}
                          aria-expanded={openRoleDropdown === member.userId}
                          aria-haspopup="listbox"
                          title="Click to change role"
                        >
                          {ROLE_META[memberRole]?.label}
                          <svg
                            className="w-3 h-3 opacity-60"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {openRoleDropdown === member.userId && (
                          <div
                            className="absolute left-0 top-full mt-1 w-40 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                            role="listbox"
                            aria-label="Select role"
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <button
                                key={r}
                                role="option"
                                aria-selected={r === memberRole}
                                onClick={() => {
                                  setOpenRoleDropdown(null);
                                  if (r !== memberRole) {
                                    setConfirmRoleChange({
                                      userId: member.userId,
                                      name: member.name,
                                      currentRole: memberRole,
                                      newRole: r,
                                    });
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 text-xs font-medium transition-all flex items-center gap-2 ${
                                  r === memberRole
                                    ? `${ROLE_META[r]?.bg || 'bg-accent/10'} ${ROLE_META[r]?.color || 'text-accent'}`
                                    : 'text-primary hover:bg-bg'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${r === memberRole ? ROLE_META[r]?.color?.replace('text-', 'bg-') || 'bg-accent' : 'bg-transparent'}`}
                                />
                                {ROLE_META[r]?.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full ${ROLE_META[memberRole]?.bg || ''} ${ROLE_META[memberRole]?.color || 'text-muted'}`}
                      >
                        {ROLE_META[memberRole]?.label || 'Member'}
                      </span>
                    )}
                    {member.tournamentCount > 0 && (
                      <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                        🏆 In {member.tournamentCount} tournament
                        {member.tournamentCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                {canManageMembers && !isAdmin && (
                  <button
                    onClick={() =>
                      setConfirmRemoveMember({
                        userId: member.userId,
                        name: member.name,
                      })
                    }
                    disabled={isRemoving}
                    className="sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 shrink-0"
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
          {canCreateTournament && (
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
            {canCreateTournament && (
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
              <div
                key={t.id}
                className="flex items-center justify-between p-4 rounded-xl bg-bg hover:bg-border/30 transition-colors group"
              >
                <Link
                  href={`/dashboard/clubs/${club.id}/tournament/${t.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <span className="text-xl">{SPORT_EMOJIS[t.sportType]}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
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
                </Link>
                <div className="flex items-center gap-2 ml-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[t.status]}`}
                  >
                    {STATUS_LABELS[t.status]}
                  </span>
                  {canCreateTournament && (
                    <TournamentDeleteButton
                      tournamentId={t.id}
                      tournamentName={t.name}
                      onDeleted={() => router.refresh()}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreateTournament && (
        <CreateTournamentModal
          clubId={club.id}
          members={club.members}
          adminId={club.admin.id}
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

      {/* Role Change Confirmation Modal */}
      {confirmRoleChange && (
        <AccessibleModal
          isOpen={true}
          onClose={() => setConfirmRoleChange(null)}
          title="Change Member Role"
          maxWidth="max-w-sm"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted">
              Change{' '}
              <strong className="text-primary">{confirmRoleChange.name}</strong>
              &rsquo;s role from{' '}
              <span
                className={
                  ROLE_META[confirmRoleChange.currentRole]?.color || ''
                }
              >
                {ROLE_META[confirmRoleChange.currentRole]?.label}
              </span>{' '}
              to{' '}
              <span
                className={ROLE_META[confirmRoleChange.newRole]?.color || ''}
              >
                {ROLE_META[confirmRoleChange.newRole]?.label}
              </span>
              ?
            </p>
            <p className="text-xs text-muted">
              {ROLE_META[confirmRoleChange.newRole]?.description}
            </p>
            {confirmRoleChange.newRole === 'ADMIN' && (
              <p className="text-xs text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2">
                ⚠️ This will grant full control over the club, including
                managing members and roles.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRoleChange(null)}
                disabled={changingRole}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-primary transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={changingRole}
                className="flex-1 py-2.5 rounded-xl bg-accent text-black text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {changingRole ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Changing…
                  </span>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </AccessibleModal>
      )}

      {/* Role Upgrade Request Modal */}
      {showUpgradeModal && (
        <AccessibleModal
          isOpen={true}
          onClose={() => setShowUpgradeModal(false)}
          title="Request Role Upgrade"
          maxWidth="max-w-sm"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted">
              Your current role is{' '}
              <strong
                className={
                  ROLE_META[club.currentUserRole]?.color || 'text-primary'
                }
              >
                {ROLE_META[club.currentUserRole]?.label || club.currentUserRole}
              </strong>
              . Select a role you&apos;d like to request:
            </p>
            <div className="space-y-2">
              {['PARTICIPANT', 'HOST']
                .filter((r) => {
                  const hierarchy = [
                    'ADMIN',
                    'HOST',
                    'PARTICIPANT',
                    'SPECTATOR',
                  ];
                  return (
                    hierarchy.indexOf(r) <
                    hierarchy.indexOf(club.currentUserRole)
                  );
                })
                .map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleUpgradeRequest(r)}
                    disabled={requestingUpgrade}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border ${ROLE_META[r]?.border || 'border-border'} hover:${ROLE_META[r]?.bg || 'bg-surface'} transition-all disabled:opacity-50`}
                  >
                    <span
                      className={`text-sm font-semibold ${ROLE_META[r]?.color || ''}`}
                    >
                      {ROLE_META[r]?.label}
                    </span>
                    <span className="text-xs text-muted flex-1 text-left">
                      {ROLE_META[r]?.description}
                    </span>
                    {requestingUpgrade && (
                      <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    )}
                  </button>
                ))}
              {['PARTICIPANT', 'HOST'].filter((r) => {
                const hierarchy = ['ADMIN', 'HOST', 'PARTICIPANT', 'SPECTATOR'];
                return (
                  hierarchy.indexOf(r) < hierarchy.indexOf(club.currentUserRole)
                );
              }).length === 0 && (
                <p className="text-sm text-muted text-center py-2">
                  No higher roles available to request.
                </p>
              )}
            </div>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-primary transition-all"
            >
              Cancel
            </button>
          </div>
        </AccessibleModal>
      )}

      {/* Pending Role Requests (Admin only) */}
      {/* Loading skeleton for role requests */}
      {canManageRoles && loadingRequests && (
        <div className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
          <div className="h-4 w-48 bg-border rounded mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-bg"
              >
                <div className="w-9 h-9 rounded-full bg-border" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-border rounded" />
                  <div className="h-2.5 w-32 bg-border rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-7 w-16 bg-border rounded-lg" />
                  <div className="h-7 w-16 bg-border rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canManageRoles && !loadingRequests && roleRequests.length > 0 && (
        <div className="bg-surface border border-amber-500/30 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-4">
            Pending Role Requests ({roleRequests.length})
          </h3>
          <div className="space-y-3">
            {roleRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-bg"
              >
                {request.user.avatarUrl ? (
                  <Image
                    src={request.user.avatarUrl}
                    alt={request.user.name}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {request.user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary truncate">
                    {request.user.name}
                  </p>
                  <p className="text-xs text-muted">
                    Wants to become{' '}
                    <span
                      className={ROLE_META[request.requestedRole]?.color || ''}
                    >
                      {ROLE_META[request.requestedRole]?.label}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() =>
                      handleRequestAction(
                        request.id,
                        'approve',
                        request.user.name,
                      )
                    }
                    disabled={processingRequestId === request.id}
                    className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-semibold hover:bg-green-500/20 transition-all disabled:opacity-50"
                    aria-label={`Approve ${request.user.name}'s request to become ${ROLE_META[request.requestedRole]?.label}`}
                  >
                    {processingRequestId === request.id ? (
                      <span className="w-3 h-3 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin inline-block" />
                    ) : (
                      'Approve'
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleRequestAction(
                        request.id,
                        'reject',
                        request.user.name,
                      )
                    }
                    disabled={processingRequestId === request.id}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50"
                    aria-label={`Reject ${request.user.name}'s request`}
                  >
                    {processingRequestId === request.id ? (
                      <span className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin inline-block" />
                    ) : (
                      'Reject'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-200 animate-in slide-in-from-bottom-4 fade-in duration-300"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                : 'bg-green-500/10 border-green-500/30 text-green-500'
            }`}
            role="alert"
          >
            <span aria-hidden="true">{toast.type === 'error' ? '✕' : '✓'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Create Tournament Modal ───────── */
function CreateTournamentModal({ clubId, members = [], adminId, onClose }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sportType, setSportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bracketSize, setBracketSize] = useState(4);
  const [teams, setTeams] = useState(Array(4).fill(''));
  const [selectedMemberIds, setSelectedMemberIds] = useState(Array(4).fill(''));
  const [useMembers, setUseMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Cricket-specific config
  const [overs, setOvers] = useState(20);
  const [playersPerSide, setPlayersPerSide] = useState(11);
  const isCricket = sportType === 'CRICKET';

  // Football-specific config
  const [halfDuration, setHalfDuration] = useState(45);
  const [squadSize, setSquadSize] = useState(11);
  const isFootball = sportType === 'FOOTBALL';

  // Team vs individual sport detection
  const isTeam = isTeamSport(sportType);

  // Invite-from-outside state
  const [inviteSlot, setInviteSlot] = useState(null); // which slot is searching
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  // Map of slot index → invited user object { id, name, email, avatarUrl }
  const [invitedUsers, setInvitedUsers] = useState({});

  // Categorize members by eligibility
  const membersWithRole = members.map((m) => ({
    ...m,
    effectiveRole: m.userId === adminId ? 'ADMIN' : m.role || 'SPECTATOR',
  }));
  const eligibleMembers = membersWithRole.filter((m) =>
    ['ADMIN', 'HOST', 'PARTICIPANT'].includes(m.effectiveRole),
  );
  const spectatorMembers = membersWithRole.filter(
    (m) => m.effectiveRole === 'SPECTATOR',
  );

  function handleBracketSizeChange(size) {
    setBracketSize(size);
    setTeams((prev) => {
      const newTeams = Array(size).fill('');
      for (let i = 0; i < Math.min(prev.length, size); i++) {
        newTeams[i] = prev[i];
      }
      return newTeams;
    });
    setSelectedMemberIds((prev) => {
      const newIds = Array(size).fill('');
      for (let i = 0; i < Math.min(prev.length, size); i++) {
        newIds[i] = prev[i];
      }
      return newIds;
    });
    // Clean up invited users for slots beyond new size
    setInvitedUsers((prev) => {
      const cleaned = { ...prev };
      Object.keys(cleaned).forEach((k) => {
        if (Number(k) >= size) delete cleaned[k];
      });
      return cleaned;
    });
  }

  function handleTeamChange(index, value) {
    setTeams((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function handleMemberSelect(index, userId) {
    // Clear any invited user for this slot
    setInvitedUsers((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });

    if (!userId) {
      setSelectedMemberIds((prev) => {
        const updated = [...prev];
        updated[index] = '';
        return updated;
      });
      setTeams((prev) => {
        const updated = [...prev];
        updated[index] = '';
        return updated;
      });
      return;
    }
    const member = membersWithRole.find((m) => m.userId === userId);
    if (!member) return;
    setSelectedMemberIds((prev) => {
      const updated = [...prev];
      updated[index] = userId;
      return updated;
    });
    setTeams((prev) => {
      const updated = [...prev];
      updated[index] = member.name;
      return updated;
    });
  }

  // Invite search — search for users not in the club
  const inviteSearchTimerRef = useRef(null);
  function handleInviteSearch(query) {
    setInviteQuery(query);
    if (inviteSearchTimerRef.current)
      clearTimeout(inviteSearchTimerRef.current);
    if (!query || query.trim().length < 2) {
      setInviteResults([]);
      return;
    }
    setInviteLoading(true);
    inviteSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/clubs/${clubId}/members?q=${encodeURIComponent(query.trim())}`,
        );
        const data = await res.json();
        if (res.ok && data.users) {
          // Filter out users already selected in any slot
          const usedIds = new Set([
            ...selectedMemberIds.filter(Boolean),
            ...Object.values(invitedUsers).map((u) => u.id),
          ]);
          setInviteResults(data.users.filter((u) => !usedIds.has(u.id)));
        } else {
          setInviteResults([]);
        }
      } catch {
        setInviteResults([]);
      } finally {
        setInviteLoading(false);
      }
    }, 300);
  }

  function handleInviteSelect(slotIndex, user) {
    // Set the invited user for this slot
    setInvitedUsers((prev) => ({ ...prev, [slotIndex]: user }));
    setSelectedMemberIds((prev) => {
      const updated = [...prev];
      updated[slotIndex] = user.id;
      return updated;
    });
    setTeams((prev) => {
      const updated = [...prev];
      updated[slotIndex] = user.name;
      return updated;
    });
    // Close the invite search
    setInviteSlot(null);
    setInviteQuery('');
    setInviteResults([]);
  }

  function handleRemoveInvite(slotIndex) {
    setInvitedUsers((prev) => {
      const updated = { ...prev };
      delete updated[slotIndex];
      return updated;
    });
    setSelectedMemberIds((prev) => {
      const updated = [...prev];
      updated[slotIndex] = '';
      return updated;
    });
    setTeams((prev) => {
      const updated = [...prev];
      updated[slotIndex] = '';
      return updated;
    });
  }

  // Spectator user IDs that were selected (need upgrade)
  const upgradeUserIds = useMembers
    ? selectedMemberIds.filter(Boolean).filter((id) => {
        const m = membersWithRole.find((mb) => mb.userId === id);
        return m && m.effectiveRole === 'SPECTATOR';
      })
    : [];

  // Invited user IDs (not in club — need to be added as PARTICIPANT)
  const inviteUserIds = Object.values(invitedUsers).map((u) => u.id);

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
      setError(
        isTeam
          ? `Please enter names for all ${bracketSize} teams.`
          : `Please ${useMembers ? 'select' : 'enter names for'} all ${bracketSize} players.`,
      );
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
          // Team sports: no member linking at creation time
          playerUserIds: !isTeam && useMembers ? selectedMemberIds : undefined,
          upgradeUserIds:
            !isTeam && upgradeUserIds.length > 0 ? upgradeUserIds : undefined,
          inviteUserIds:
            !isTeam && inviteUserIds.length > 0 ? inviteUserIds : undefined,
          isTeamSport: isTeam || undefined,
          ...(isCricket ? { overs, playersPerSide } : {}),
          ...(isFootball ? { halfDuration, squadSize } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.details || data.error || 'Something went wrong.');
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

          {/* Cricket Config — overs & players per side */}
          {isCricket && (
            <div className="space-y-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span aria-hidden="true">🏏</span> Cricket Settings
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Overs per innings */}
                <div>
                  <label
                    htmlFor="cricket-overs"
                    className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
                  >
                    Overs per Innings
                  </label>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Select overs"
                  >
                    {[5, 10, 15, 20].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOvers(o)}
                        aria-pressed={overs === o}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          overs === o
                            ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                            : 'border-border text-muted hover:border-amber-500/50'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Players per side */}
                <div>
                  <label
                    htmlFor="cricket-players"
                    className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
                  >
                    Players per Side
                  </label>
                  <select
                    id="cricket-players"
                    value={playersPerSide}
                    onChange={(e) => setPlayersPerSide(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 2).map((n) => (
                      <option key={n} value={n}>
                        {n} players
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Football Config — half duration & squad size */}
          {isFootball && (
            <div className="space-y-3 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                <span aria-hidden="true">⚽</span> Football Settings
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Half duration */}
                <div>
                  <label
                    htmlFor="football-half"
                    className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
                  >
                    Half Duration (min)
                  </label>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Select half duration"
                  >
                    {[30, 35, 40, 45].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHalfDuration(h)}
                        aria-pressed={halfDuration === h}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          halfDuration === h
                            ? 'border-green-500 bg-green-500/20 text-green-400'
                            : 'border-border text-muted hover:border-green-500/50'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Squad size */}
                <div>
                  <label
                    htmlFor="football-squad"
                    className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
                  >
                    Squad Size
                  </label>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Select squad size"
                  >
                    {[5, 7, 11].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSquadSize(s)}
                        aria-pressed={squadSize === s}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          squadSize === s
                            ? 'border-green-500 bg-green-500/20 text-green-400'
                            : 'border-border text-muted hover:border-green-500/50'
                        }`}
                      >
                        {s}-a-side
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teams / Players */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                {isTeam ? `Teams (${bracketSize})` : `Players (${bracketSize})`}
              </label>
              {/* Hide toggle for team sports — always use custom team names */}
              {!isTeam && (
                <button
                  type="button"
                  onClick={() => setUseMembers((v) => !v)}
                  className="text-[10px] font-medium text-accent hover:underline"
                >
                  {useMembers ? 'Use custom names' : 'Select from members'}
                </button>
              )}
            </div>

            {isTeam && (
              <p className="text-[11px] text-muted mb-2">
                Enter team names — individual players can be linked when scoring
                the match.
              </p>
            )}

            {/* Team sports always show text inputs; individual sports use member picker */}
            {!isTeam && useMembers ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {Array.from({ length: bracketSize }).map((_, i) => {
                  const invited = invitedUsers[i];
                  const isSearching = inviteSlot === i;

                  // If this slot has an invited (non-member) user
                  if (invited) {
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-500/50 bg-green-500/5"
                      >
                        <span className="text-xs font-medium text-primary truncate flex-1">
                          {invited.name}
                        </span>
                        <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                          INVITED
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInvite(i)}
                          className="shrink-0 text-muted hover:text-red-400 transition-colors"
                          aria-label={`Remove invited player ${i + 1}`}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className="relative">
                      {isSearching ? (
                        /* Invite search input + results dropdown */
                        <div className="relative">
                          <input
                            type="text"
                            value={inviteQuery}
                            onChange={(e) => handleInviteSearch(e.target.value)}
                            placeholder="Search by name or email…"
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg border border-accent bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all pr-8"
                            aria-label={`Search users to invite for slot ${i + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setInviteSlot(null);
                              setInviteQuery('');
                              setInviteResults([]);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary text-xs"
                            aria-label="Cancel search"
                          >
                            ✕
                          </button>
                          {(inviteResults.length > 0 || inviteLoading) && (
                            <div
                              role="listbox"
                              aria-label="Search results — users to invite"
                              className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-36 overflow-y-auto"
                            >
                              {inviteLoading ? (
                                <div className="px-3 py-2 text-xs text-muted flex items-center gap-2">
                                  <span className="w-3 h-3 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
                                  Searching…
                                </div>
                              ) : (
                                inviteResults.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    role="option"
                                    onClick={() => handleInviteSelect(i, user)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/10 transition-colors"
                                    aria-label={`Invite ${user.name} (${user.email})`}
                                  >
                                    {user.avatarUrl ? (
                                      <img
                                        src={user.avatarUrl}
                                        alt=""
                                        className="w-5 h-5 rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                                        {user.name?.[0] || '?'}
                                      </span>
                                    )}
                                    <span className="flex-1 min-w-0">
                                      <span className="text-xs font-medium text-primary block truncate">
                                        {user.name}
                                      </span>
                                      <span className="text-[10px] text-muted block truncate">
                                        {user.email}
                                      </span>
                                    </span>
                                    <span className="shrink-0 text-[9px] text-green-400 font-medium">
                                      + Invite
                                    </span>
                                  </button>
                                ))
                              )}
                              {!inviteLoading &&
                                inviteQuery.length >= 2 &&
                                inviteResults.length === 0 && (
                                  <div className="px-3 py-2 text-xs text-muted">
                                    No users found
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Normal member select dropdown + invite button */
                        <div className="flex gap-1">
                          <select
                            value={selectedMemberIds[i] || ''}
                            onChange={(e) =>
                              handleMemberSelect(i, e.target.value)
                            }
                            aria-label={`Select player ${i + 1}`}
                            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-bg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                            required
                          >
                            <option value="">Player {i + 1}…</option>
                            {eligibleMembers.length > 0 && (
                              <optgroup label="Eligible Members">
                                {eligibleMembers.map((m) => (
                                  <option
                                    key={m.userId}
                                    value={m.userId}
                                    disabled={
                                      selectedMemberIds.includes(m.userId) &&
                                      selectedMemberIds[i] !== m.userId
                                    }
                                  >
                                    {m.name} (
                                    {ROLE_META[m.effectiveRole]?.label})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {spectatorMembers.length > 0 && (
                              <optgroup label="Spectators (will be upgraded)">
                                {spectatorMembers.map((m) => (
                                  <option
                                    key={m.userId}
                                    value={m.userId}
                                    disabled={
                                      selectedMemberIds.includes(m.userId) &&
                                      selectedMemberIds[i] !== m.userId
                                    }
                                  >
                                    {m.name} (↑ Upgrade)
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setInviteSlot(i);
                              setInviteQuery('');
                              setInviteResults([]);
                            }}
                            title="Invite user not in club"
                            className="shrink-0 px-2 py-2 rounded-lg border border-dashed border-accent/50 text-accent hover:bg-accent/10 transition-all text-xs font-medium"
                            aria-label={`Invite external user for slot ${i + 1}`}
                          >
                            +&thinsp;Invite
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {teams.map((team, i) => (
                  <input
                    key={i}
                    type="text"
                    value={team}
                    onChange={(e) => handleTeamChange(i, e.target.value)}
                    placeholder={isTeam ? `Team ${i + 1}` : `Player ${i + 1}`}
                    aria-label={
                      isTeam ? `Team ${i + 1} name` : `Player ${i + 1} name`
                    }
                    className="px-3 py-2 rounded-lg border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                    required
                  />
                ))}
              </div>
            )}

            {!isTeam && upgradeUserIds.length > 0 && (
              <p className="mt-2 text-[11px] text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                ⬆️ {upgradeUserIds.length} spectator
                {upgradeUserIds.length !== 1 ? 's' : ''} will be auto-upgraded
                to <strong>Participant</strong> when the tournament is created.
              </p>
            )}

            {!isTeam && inviteUserIds.length > 0 && (
              <p className="mt-2 text-[11px] text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg">
                ✉️ {inviteUserIds.length} user
                {inviteUserIds.length !== 1 ? 's' : ''} will be invited and
                added to the club as{' '}
                <strong>
                  Participant{inviteUserIds.length !== 1 ? 's' : ''}
                </strong>{' '}
                when the tournament is created.
              </p>
            )}
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
  const [selectedRole, setSelectedRole] = useState('SPECTATOR');
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
        body: JSON.stringify({ userId: user.id, role: selectedRole }),
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
        {/* Role selection */}
        <div>
          <label
            htmlFor="member-role"
            className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
          >
            Assign Role
          </label>
          <div className="flex gap-2">
            {ASSIGNABLE_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${selectedRole === role ? `${ROLE_META[role]?.bg} ${ROLE_META[role]?.border} ${ROLE_META[role]?.color}` : 'border-border text-muted hover:border-accent/30'}`}
              >
                {ROLE_META[role]?.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-1.5">
            {ROLE_META[selectedRole]?.description}
          </p>
        </div>

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
                <div className="flex items-center gap-2 shrink-0">
                  {user.isMember ? (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                      Already a member
                    </span>
                  ) : (
                    <>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${ROLE_META[selectedRole]?.bg || ''} ${ROLE_META[selectedRole]?.color || ''}`}
                      >
                        {ROLE_META[selectedRole]?.label}
                      </span>
                      <button
                        onClick={() => handleAddUser(user)}
                        disabled={addingUserId === user.id}
                        className="px-3 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Add ${user.name} as ${ROLE_META[selectedRole]?.label}`}
                      >
                        {addingUserId === user.id ? (
                          <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                        ) : (
                          'Add'
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </AccessibleModal>
  );
}

/* ───────── Tournament Delete Button (inline) ───────── */
function TournamentDeleteButton({ tournamentId, tournamentName, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `Delete "${tournamentName}"? This will permanently remove all matches, brackets, and synced stats.`,
      )
    )
      return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleted();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete tournament.');
      }
    } catch {
      alert('Network error.');
    }
    setDeleting(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      aria-label={`Delete ${tournamentName}`}
      title="Delete tournament"
    >
      {deleting ? (
        <span className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin inline-block" />
      ) : (
        <span className="text-sm">🗑️</span>
      )}
    </button>
  );
}
