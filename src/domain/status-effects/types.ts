import type { DayOfWeek, GameDate } from '../time/types';

export type StatusEffectTarget = { type: 'gladiator'; id: string };

export type StatusEffectModifier =
  | { type: 'trainingExperienceMultiplier'; value: number }
  | { type: 'arenaCombatEligibility'; value: boolean };

export interface StatusEffectVisual {
  color: string;
  iconName: string;
}

export interface StatusEffectDefinition {
  descriptionKey: string;
  id: string;
  modifiers: StatusEffectModifier[];
  nameKey: string;
  showAlert: boolean;
  visual: StatusEffectVisual;
}

export interface ActiveStatusEffect {
  id: string;
  effectId: string;
  target: StatusEffectTarget;
  startedAt: GameDate;
  expiresAt: GameDate;
}

export interface StatusEffectDurationBreakdown {
  days: number;
  expiresAtDayOfWeek: DayOfWeek;
  expiresAtWeek: number;
  expiresAtYear: number;
}
