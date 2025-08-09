/**
 * Gamification helpers for fund progress and levels.
 *
 * These utilities derive a "level" from the fund's current balance to
 * provide lightweight game-like feedback without storing additional state.
 * Each level represents a fixed amount of savings.  The progress toward the
 * next level is expressed as a percentage for easy use in progress bars.
 */

// Amount of savings (in cents) required to advance one level.
const LEVEL_STEP_CENTS = 10000; // $100 increments

export interface LevelInfo {
  /** Current level, starting at 1 for balances below LEVEL_STEP_CENTS. */
  level: number;
  /** Percentage [0,100) of progress toward the next level. */
  progressPct: number;
}

/**
 * Calculate the level and progress for a fund based on its balance.
 *
 * @param balanceCents - Current balance for the fund in cents.
 * @returns Level number and percentage progress toward the next level.
 */
export function calculateLevel(balanceCents: number): LevelInfo {
  const level = Math.floor(balanceCents / LEVEL_STEP_CENTS) + 1;
  const progress = (balanceCents % LEVEL_STEP_CENTS) / LEVEL_STEP_CENTS;
  return { level, progressPct: Math.floor(progress * 100) };
}

export interface TargetInfo {
  /** Percent progress toward the target, clamped to [0,100]. */
  progressPct: number;
  /** Whether the current balance meets or exceeds the target. */
  achieved: boolean;
}

/**
 * Provide progress information relative to an optional target balance.
 *
 * @param balanceCents - Current balance for the fund.
 * @param targetCents - Target balance for the fund (null/undefined if none).
 * @returns Progress details or null when no target is defined.
 */
export function calculateTargetProgress(
  balanceCents: number,
  targetCents: number | null | undefined
): TargetInfo | null {
  if (targetCents == null) return null;
  const progress = Math.min(balanceCents / targetCents, 1);
  return { progressPct: Math.floor(progress * 100), achieved: balanceCents >= targetCents };
}
