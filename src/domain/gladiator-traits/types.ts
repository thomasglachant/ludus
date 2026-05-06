import type { GladiatorTraitId } from '../gladiators/types';
import type { DayOfWeek } from '../time/types';

export type GladiatorTraitModifier =
  | { type: 'trainingExperienceMultiplier'; value: number }
  | { type: 'arenaCombatEligibility'; value: boolean }
  | { type: 'activityEligibility'; value: boolean }
  | { type: 'combatMoraleBonus'; value: number }
  | { type: 'combatEnergyBonus'; value: number }
  | { type: 'combatExperienceMultiplier'; value: number }
  | { type: 'injuryRiskMultiplier'; value: number }
  | { type: 'arenaRewardMultiplier'; value: number };

export interface GladiatorTraitVisual {
  color: string;
  iconName: string;
}

export interface GladiatorTraitDefinition {
  descriptionKey: string;
  id: GladiatorTraitId;
  modifiers: GladiatorTraitModifier[];
  nameKey: string;
  showAlert: boolean;
  visual: GladiatorTraitVisual;
}

export interface GladiatorTraitDurationBreakdown {
  days: number;
  expiresAtDayOfWeek: DayOfWeek;
  expiresAtWeek: number;
  expiresAtYear: number;
}
