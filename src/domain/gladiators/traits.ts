import {
  GLADIATOR_PERMANENT_TRAITS,
  GLADIATOR_TEMPORARY_TRAITS,
} from '../../game-data/gladiators/traits';
import type { DayOfWeek } from '../time/types';
import type { GladiatorSkillName } from './skills';

export type PermanentGladiatorTraitId = keyof typeof GLADIATOR_PERMANENT_TRAITS;
export type TemporaryGladiatorTraitId = keyof typeof GLADIATOR_TEMPORARY_TRAITS;
export type GladiatorTraitId = PermanentGladiatorTraitId | TemporaryGladiatorTraitId;

// Runtime systems consume these effects directly. Multipliers stack multiplicatively, numeric
// bonuses stack additively, and `false` eligibility values block the matching activity surface.
export type GladiatorTraitModifier =
  | { type: 'trainingExperienceMultiplier'; value: number }
  | { type: 'arenaCombatEligibility'; value: boolean }
  | { type: 'activityEligibility'; value: boolean }
  | { type: 'combatMoraleBonus'; value: number }
  | { type: 'combatEnergyBonus'; value: number }
  | { type: 'combatExperienceMultiplier'; value: number }
  | { type: 'injuryRiskMultiplier'; value: number }
  | { type: 'arenaRewardMultiplier'; value: number }
  | { type: 'skillBonus'; skill: GladiatorSkillName; value: number };

export const GLADIATOR_TRAIT_KINDS = ['permanent', 'temporary'] as const;

export type GladiatorTraitKind = (typeof GLADIATOR_TRAIT_KINDS)[number];

export const GLADIATOR_TRAIT_MARKET_POLARITIES = ['mixed', 'negative', 'positive'] as const;

export type GladiatorTraitMarketPolarity = (typeof GLADIATOR_TRAIT_MARKET_POLARITIES)[number];

export interface GladiatorTraitVisual {
  color: string;
  iconName: string;
}

export interface GladiatorTraitDefinition {
  descriptionKey: string;
  // Prevents contradictory generated permanent traits from appearing together.
  exclusiveGroup?: string;
  id: GladiatorTraitId;
  // Permanent traits are profile traits; temporary traits are event or simulation states.
  kind: GladiatorTraitKind;
  // Market fields are used only for generated candidate selection and valuation.
  marketPolarity: GladiatorTraitMarketPolarity;
  marketPriceModifierPercent: number;
  marketWeight: number;
  modifiers: readonly GladiatorTraitModifier[];
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

type GladiatorTraitDeclaration = Omit<GladiatorTraitDefinition, 'id' | 'kind'>;

function createTraitDefinition(
  id: GladiatorTraitId,
  kind: GladiatorTraitKind,
  declaration: GladiatorTraitDeclaration,
): GladiatorTraitDefinition {
  return {
    ...declaration,
    id,
    kind,
  };
}

function createTraitDefinitions<TTraitId extends GladiatorTraitId>(
  kind: GladiatorTraitKind,
  declarations: Record<string, GladiatorTraitDeclaration>,
) {
  return Object.entries(declarations).map(([id, declaration]) =>
    createTraitDefinition(id as TTraitId, kind, declaration),
  );
}

export const GLADIATOR_TRAIT_DEFINITIONS = [
  ...createTraitDefinitions<PermanentGladiatorTraitId>('permanent', GLADIATOR_PERMANENT_TRAITS),
  ...createTraitDefinitions<TemporaryGladiatorTraitId>('temporary', GLADIATOR_TEMPORARY_TRAITS),
] as const satisfies readonly GladiatorTraitDefinition[];
