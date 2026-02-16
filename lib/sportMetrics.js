/**
 * Sport-specific metric definitions.
 *
 * Each sport maps to an array of metric objects that define:
 *  - key:          machine-readable identifier stored in StatEntry.metrics JSON
 *  - label:        human-readable label for the UI
 *  - type:         "int" | "float" | "boolean"
 *  - unit:         optional display unit (e.g. "%", "avg")
 *  - defaultValue: value used when creating a blank stat entry
 *
 * These definitions drive:
 *  1. Stat entry forms  (which input fields to show)
 *  2. Validation        (reject unknown keys, enforce types)
 *  3. Goal creation     (which metrics are goal-trackable)
 *  4. Dashboard charts  (labels & formatting)
 */

export const SPORT_METRICS = {
  FOOTBALL: [
    { key: 'goals', label: 'Goals', type: 'int', defaultValue: 0 },
    { key: 'assists', label: 'Assists', type: 'int', defaultValue: 0 },
    {
      key: 'shots_on_target',
      label: 'Shots on Target',
      type: 'int',
      defaultValue: 0,
    },
    { key: 'shots_taken', label: 'Shots Taken', type: 'int', defaultValue: 0 },
  ],

  CRICKET: [
    { key: 'runs', label: 'Runs Scored', type: 'int', defaultValue: 0 },
    { key: 'balls_faced', label: 'Balls Faced', type: 'int', defaultValue: 0 },
    { key: 'fours', label: 'Fours', type: 'int', defaultValue: 0 },
    { key: 'sixes', label: 'Sixes', type: 'int', defaultValue: 0 },
    {
      key: 'strike_rate',
      label: 'Strike Rate',
      type: 'float',
      unit: 'SR',
      defaultValue: 0,
    },
    { key: 'wickets', label: 'Wickets Taken', type: 'int', defaultValue: 0 },
    {
      key: 'overs_bowled',
      label: 'Overs Bowled',
      type: 'float',
      defaultValue: 0,
    },
    {
      key: 'runs_conceded',
      label: 'Runs Conceded',
      type: 'int',
      defaultValue: 0,
    },
    {
      key: 'economy',
      label: 'Economy Rate',
      type: 'float',
      unit: 'econ',
      defaultValue: 0,
    },
    { key: 'catches', label: 'Catches', type: 'int', defaultValue: 0 },
    {
      key: 'match_result',
      label: 'Match Result (1=Win)',
      type: 'int',
      defaultValue: 0,
    },
  ],

  BASKETBALL: [
    {
      key: 'points_scored',
      label: 'Points Scored',
      type: 'int',
      defaultValue: 0,
    },
    { key: 'shots_taken', label: 'Shots Taken', type: 'int', defaultValue: 0 },
    {
      key: 'shots_on_target',
      label: 'Shots on Target',
      type: 'int',
      defaultValue: 0,
    },
    {
      key: 'scoring_efficiency',
      label: 'Scoring Efficiency',
      type: 'float',
      unit: '%',
      defaultValue: 0,
    },
  ],

  BADMINTON: [
    { key: 'match_wins', label: 'Match Wins', type: 'int', defaultValue: 0 },
    {
      key: 'points_scored',
      label: 'Points Scored',
      type: 'int',
      defaultValue: 0,
    },
  ],

  TENNIS: [
    { key: 'match_wins', label: 'Match Wins', type: 'int', defaultValue: 0 },
    {
      key: 'points_scored',
      label: 'Points Scored',
      type: 'int',
      defaultValue: 0,
    },
  ],

  VOLLEYBALL: [
    { key: 'spikes', label: 'Spikes', type: 'int', defaultValue: 0 },
    { key: 'blocks', label: 'Blocks', type: 'int', defaultValue: 0 },
    { key: 'serves', label: 'Serves', type: 'int', defaultValue: 0 },
    { key: 'digs', label: 'Digs', type: 'int', defaultValue: 0 },
  ],
};

/**
 * Get the metric definitions for a given sport type.
 * @param {string} sportType — one of the SportType enum values
 * @returns {Array} metric definitions, or an empty array for unknown sports
 */
export function getMetricsForSport(sportType) {
  return SPORT_METRICS[sportType] ?? [];
}

/**
 * Get the valid metric keys for a sport (useful for validation).
 * @param {string} sportType
 * @returns {string[]}
 */
export function getMetricKeys(sportType) {
  return getMetricsForSport(sportType).map((m) => m.key);
}

/**
 * Build a blank metrics object for a sport (all defaults).
 * @param {string} sportType
 * @returns {Object} e.g. { goals: 0, assists: 0, ... }
 */
export function buildBlankMetrics(sportType) {
  const metrics = {};
  for (const m of getMetricsForSport(sportType)) {
    metrics[m.key] = m.defaultValue;
  }
  return metrics;
}

/**
 * Validate a metrics object against the sport's definition.
 * Returns { valid: true } or { valid: false, errors: string[] }.
 * @param {string} sportType
 * @param {Object} metrics
 */
export function validateMetrics(sportType, metrics) {
  const defs = getMetricsForSport(sportType);
  const errors = [];
  const validKeys = new Set(defs.map((d) => d.key));

  // Check for unknown keys
  for (const key of Object.keys(metrics)) {
    if (!validKeys.has(key)) {
      errors.push(`Unknown metric "${key}" for ${sportType}`);
    }
  }

  // Check types
  for (const def of defs) {
    const val = metrics[def.key];
    if (val === undefined || val === null) continue; // optional — will use default

    if (def.type === 'int' && !Number.isInteger(val)) {
      errors.push(`"${def.key}" must be an integer`);
    }
    if (def.type === 'float' && typeof val !== 'number') {
      errors.push(`"${def.key}" must be a number`);
    }
    if (def.type === 'boolean' && typeof val !== 'boolean') {
      errors.push(`"${def.key}" must be a boolean`);
    }
  }

  return errors.length ? { valid: false, errors } : { valid: true };
}
