/**
 * Compute "warmth" of a scene based on how recently it was edited.
 * Returns a value from 0 (cold/stale) to 1 (hot/recently edited).
 */
export function computeWarmth(lastEditedAt: number): number {
  const now = Date.now();
  const elapsed = now - lastEditedAt;

  // Time windows
  const ONE_HOUR = 3600_000;
  const ONE_DAY = 86_400_000;
  const ONE_WEEK = 604_800_000;
  const ONE_MONTH = 2_592_000_000;

  if (elapsed < ONE_HOUR) return 1;
  if (elapsed < ONE_DAY) return 0.75;
  if (elapsed < ONE_WEEK) return 0.5;
  if (elapsed < ONE_MONTH) return 0.25;
  return 0;
}

/**
 * Get CSS color variable for warmth level
 */
export function getHeatColor(warmth: number): string {
  if (warmth >= 0.75) return 'var(--heat-hot)';
  if (warmth >= 0.5) return 'var(--heat-warm)';
  if (warmth >= 0.25) return 'var(--heat-cool)';
  return 'var(--heat-cold)';
}
