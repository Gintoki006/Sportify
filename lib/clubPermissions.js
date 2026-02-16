/**
 * Club Role Permissions
 *
 * Roles (highest → lowest):
 *   ADMIN       — full control: edit/delete club, manage members & roles, create tournaments, enter scores
 *   HOST        — can create & manage tournaments, schedule matches, enter scores (cannot delete club or manage roles)
 *   PARTICIPANT — can join tournaments, view brackets, view scores (cannot create tournaments or enter scores)
 *   SPECTATOR   — view-only: club info, tournament brackets, scores, standings (cannot join tournaments)
 */

// Ordered from highest to lowest privilege
const ROLE_HIERARCHY = ['ADMIN', 'HOST', 'PARTICIPANT', 'SPECTATOR'];

// Permission matrix — each key maps to the minimum role required
const PERMISSION_MAP = {
  // Club management
  editClub: 'ADMIN',
  deleteClub: 'ADMIN',
  manageMembers: 'ADMIN', // add/remove members
  manageRoles: 'ADMIN', // change member roles

  // Tournament management
  createTournament: 'HOST',
  editTournament: 'HOST',
  deleteTournament: 'HOST',
  enterScores: 'HOST',
  scheduleMatches: 'HOST',

  // Tournament participation
  joinTournament: 'PARTICIPANT',

  // View-only (everyone)
  viewClub: 'SPECTATOR',
  viewTournament: 'SPECTATOR',
  viewBracket: 'SPECTATOR',
  viewScores: 'SPECTATOR',
  viewStandings: 'SPECTATOR',
};

/**
 * Get the numeric rank of a role (lower = more privilege)
 */
function getRoleRank(role) {
  const index = ROLE_HIERARCHY.indexOf(role);
  return index === -1 ? Infinity : index;
}

/**
 * Check if a role has at least the privilege level of the minimum required role.
 * e.g. hasMinRole('HOST', 'PARTICIPANT') → true (HOST >= PARTICIPANT)
 *      hasMinRole('SPECTATOR', 'HOST')   → false
 */
export function hasMinRole(userRole, minRole) {
  return getRoleRank(userRole) <= getRoleRank(minRole);
}

/**
 * Check if a user's role has a specific permission.
 * @param {string} userRole — the user's ClubRole (ADMIN | HOST | PARTICIPANT | SPECTATOR)
 * @param {string} permission — a key from PERMISSION_MAP
 * @returns {boolean}
 */
export function hasPermission(userRole, permission) {
  const minRole = PERMISSION_MAP[permission];
  if (!minRole) return false;
  return hasMinRole(userRole, minRole);
}

/**
 * Get all permissions for a given role.
 * Returns an object with each permission key set to true/false.
 */
export function getPermissions(userRole) {
  const perms = {};
  for (const [perm, minRole] of Object.entries(PERMISSION_MAP)) {
    perms[perm] = hasMinRole(userRole, minRole);
  }
  return perms;
}

/**
 * Role display metadata — labels, colors, descriptions
 */
export const ROLE_META = {
  ADMIN: {
    label: 'Admin',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    description: 'Full control over the club',
  },
  HOST: {
    label: 'Host',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    description: 'Can manage tournaments and enter scores',
  },
  PARTICIPANT: {
    label: 'Participant',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    description: 'Can join and play in tournaments',
  },
  SPECTATOR: {
    label: 'Spectator',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    description: 'View-only access to club and tournaments',
  },
};

/**
 * All assignable roles (for dropdowns — excludes ADMIN since it's set via club ownership)
 */
export const ASSIGNABLE_ROLES = ['HOST', 'PARTICIPANT', 'SPECTATOR'];

/**
 * All roles in hierarchy order
 */
export { ROLE_HIERARCHY, PERMISSION_MAP };
