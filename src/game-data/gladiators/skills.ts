export const GLADIATOR_SKILL_CONFIG = {
  // Skill names that can receive allocated level-up points.
  names: ['strength', 'agility', 'defense', 'life'],
  // Minimum stored skill value.
  minimum: 1,
  // Maximum stored skill value.
  maximum: 10,
  // Total skill points assigned to a newly recruited level 1 gladiator.
  initialTotalPoints: 10,
  // Maximum value allowed for one skill in the initial market distribution.
  initialMaximum: 5,
} as const;
