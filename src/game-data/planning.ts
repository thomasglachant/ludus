export const WEEKLY_OBJECTIVES = [
  'balanced',
  'fightPreparation',
  'trainStrength',
  'trainAgility',
  'trainDefense',
  'recovery',
  'moraleBoost',
  'protectChampion',
  'prepareForSale',
] as const;

export const TRAINING_INTENSITIES = ['light', 'normal', 'hard', 'brutal'] as const;

export const PLANNING_THRESHOLDS = {
  criticalHealth: 35,
  lowHealth: 55,
  criticalEnergy: 30,
  lowEnergy: 50,
  criticalSatiety: 25,
  lowSatiety: 50,
  criticalMorale: 30,
  lowMorale: 50,
} as const;

export const READINESS_WEIGHTS = {
  health: 0.35,
  energy: 0.25,
  morale: 0.15,
  satiety: 0.15,
  reputationStability: 0.1,
} as const;
