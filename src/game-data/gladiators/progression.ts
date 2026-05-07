export const GLADIATOR_PROGRESSION_CONFIG = {
  // Highest derived gladiator level supported by the current progression curve.
  maxLevel: 20,
  // Cumulative experience thresholds by level index. Level 1 starts at 0 XP.
  experienceByLevel: [
    0, 100, 230, 390, 580, 800, 1050, 1330, 1640, 1980, 2350, 2750, 3180, 3640, 4130, 4650, 5200,
    5780, 6390, 7030,
  ],
} as const;
