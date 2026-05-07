export const TREASURY_CONFIG = {
  // Denarii available when a new ludus save is created.
  initialTreasury: 500,
  // Ludus reputation assigned to a brand-new save.
  initialReputation: 0,
  // Treasury threshold below which the player receives a persistent warning.
  lowTreasuryWarningThreshold: 100,
  // Minimum grace period before a negative treasury can become a defeat.
  debtGraceDays: 7,
  // Lower clamp for treasury changes from events and actions.
  minimumTreasury: 0,
  // Lower clamp for ludus and gladiator reputation changes.
  minimumReputation: 0,
} as const;

export const INITIAL_TREASURY = TREASURY_CONFIG.initialTreasury;
