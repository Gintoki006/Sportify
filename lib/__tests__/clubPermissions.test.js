/**
 * Permission boundary tests for Club Role system
 *
 * Run with: node lib/__tests__/clubPermissions.test.js
 */

import {
  hasMinRole,
  hasPermission,
  getPermissions,
  ROLE_HIERARCHY,
  PERMISSION_MAP,
  ROLE_META,
  ASSIGNABLE_ROLES,
} from '../clubPermissions.js';

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ✕ FAIL: ${description}`);
  }
}

console.log('🧪 Club Permissions — Boundary Tests\n');

// ─── Role Hierarchy ───
console.log('── Role Hierarchy ──');

assert(hasMinRole('ADMIN', 'ADMIN'), 'ADMIN >= ADMIN');
assert(hasMinRole('ADMIN', 'HOST'), 'ADMIN >= HOST');
assert(hasMinRole('ADMIN', 'PARTICIPANT'), 'ADMIN >= PARTICIPANT');
assert(hasMinRole('ADMIN', 'SPECTATOR'), 'ADMIN >= SPECTATOR');

assert(hasMinRole('HOST', 'HOST'), 'HOST >= HOST');
assert(hasMinRole('HOST', 'PARTICIPANT'), 'HOST >= PARTICIPANT');
assert(hasMinRole('HOST', 'SPECTATOR'), 'HOST >= SPECTATOR');
assert(!hasMinRole('HOST', 'ADMIN'), 'HOST < ADMIN');

assert(hasMinRole('PARTICIPANT', 'PARTICIPANT'), 'PARTICIPANT >= PARTICIPANT');
assert(hasMinRole('PARTICIPANT', 'SPECTATOR'), 'PARTICIPANT >= SPECTATOR');
assert(!hasMinRole('PARTICIPANT', 'HOST'), 'PARTICIPANT < HOST');
assert(!hasMinRole('PARTICIPANT', 'ADMIN'), 'PARTICIPANT < ADMIN');

assert(hasMinRole('SPECTATOR', 'SPECTATOR'), 'SPECTATOR >= SPECTATOR');
assert(!hasMinRole('SPECTATOR', 'PARTICIPANT'), 'SPECTATOR < PARTICIPANT');
assert(!hasMinRole('SPECTATOR', 'HOST'), 'SPECTATOR < HOST');
assert(!hasMinRole('SPECTATOR', 'ADMIN'), 'SPECTATOR < ADMIN');

// Invalid role returns false
assert(!hasMinRole(null, 'SPECTATOR'), 'null role has no permissions');
assert(
  !hasMinRole(undefined, 'SPECTATOR'),
  'undefined role has no permissions',
);
assert(!hasMinRole('INVALID', 'SPECTATOR'), 'unknown role has no permissions');

// ─── Permission Map ───
console.log('── Permission Map ──');

// Admin-only actions
const adminOnlyPerms = [
  'editClub',
  'deleteClub',
  'manageMembers',
  'manageRoles',
];
for (const perm of adminOnlyPerms) {
  assert(hasPermission('ADMIN', perm), `ADMIN can ${perm}`);
  assert(!hasPermission('HOST', perm), `HOST cannot ${perm}`);
  assert(!hasPermission('PARTICIPANT', perm), `PARTICIPANT cannot ${perm}`);
  assert(!hasPermission('SPECTATOR', perm), `SPECTATOR cannot ${perm}`);
}

// Host-level actions
const hostPerms = [
  'createTournament',
  'editTournament',
  'deleteTournament',
  'enterScores',
  'scheduleMatches',
];
for (const perm of hostPerms) {
  assert(hasPermission('ADMIN', perm), `ADMIN can ${perm}`);
  assert(hasPermission('HOST', perm), `HOST can ${perm}`);
  assert(!hasPermission('PARTICIPANT', perm), `PARTICIPANT cannot ${perm}`);
  assert(!hasPermission('SPECTATOR', perm), `SPECTATOR cannot ${perm}`);
}

// Participant-level actions
assert(hasPermission('ADMIN', 'joinTournament'), 'ADMIN can joinTournament');
assert(hasPermission('HOST', 'joinTournament'), 'HOST can joinTournament');
assert(
  hasPermission('PARTICIPANT', 'joinTournament'),
  'PARTICIPANT can joinTournament',
);
assert(
  !hasPermission('SPECTATOR', 'joinTournament'),
  'SPECTATOR cannot joinTournament',
);

// View-only (everyone can)
const viewPerms = [
  'viewClub',
  'viewTournament',
  'viewBracket',
  'viewScores',
  'viewStandings',
];
for (const perm of viewPerms) {
  for (const role of ROLE_HIERARCHY) {
    assert(hasPermission(role, perm), `${role} can ${perm}`);
  }
}

// Invalid permission returns false
assert(
  !hasPermission('ADMIN', 'nonExistentPermission'),
  'unknown permission returns false',
);

// ─── getPermissions ───
console.log('── getPermissions ──');

const adminPerms = getPermissions('ADMIN');
assert(Object.values(adminPerms).every(Boolean), 'ADMIN has all permissions');

const spectatorPerms = getPermissions('SPECTATOR');
const spectatorTruePerms = Object.entries(spectatorPerms)
  .filter(([, v]) => v)
  .map(([k]) => k);
assert(
  spectatorTruePerms.length === viewPerms.length,
  `SPECTATOR only has ${viewPerms.length} view permissions`,
);
assert(
  viewPerms.every((p) => spectatorPerms[p]),
  'SPECTATOR has all view permissions',
);
assert(
  !spectatorPerms.createTournament,
  'SPECTATOR cannot createTournament via getPermissions',
);
assert(
  !spectatorPerms.editClub,
  'SPECTATOR cannot editClub via getPermissions',
);

// ─── ROLE_META & ASSIGNABLE_ROLES ───
console.log('── ROLE_META & ASSIGNABLE_ROLES ──');

for (const role of ROLE_HIERARCHY) {
  assert(ROLE_META[role], `ROLE_META has entry for ${role}`);
  assert(ROLE_META[role].label, `${role} has label`);
  assert(ROLE_META[role].color, `${role} has color`);
  assert(ROLE_META[role].bg, `${role} has bg`);
  assert(ROLE_META[role].description, `${role} has description`);
}

assert(!ASSIGNABLE_ROLES.includes('ADMIN'), 'ADMIN is not in ASSIGNABLE_ROLES');
assert(ASSIGNABLE_ROLES.includes('HOST'), 'HOST is in ASSIGNABLE_ROLES');
assert(
  ASSIGNABLE_ROLES.includes('PARTICIPANT'),
  'PARTICIPANT is in ASSIGNABLE_ROLES',
);
assert(
  ASSIGNABLE_ROLES.includes('SPECTATOR'),
  'SPECTATOR is in ASSIGNABLE_ROLES',
);

// ─── Summary ───
console.log(`\n${'─'.repeat(40)}`);
console.log(`✅ Passed: ${passed}`);
if (failed > 0) {
  console.log(`❌ Failed: ${failed}`);
  process.exit(1);
} else {
  console.log('All permission boundary tests passed!');
}
