import { GAME_BALANCE } from './balance';
import type { StatusEffectDefinition } from '../domain/status-effects/types';

export const STATUS_EFFECT_DEFINITIONS = [
  {
    id: 'injury',
    nameKey: 'statusEffects.injury.name',
    descriptionKey: 'statusEffects.injury.description',
    showAlert: true,
    visual: {
      iconName: 'health',
      color: '#b33a2e',
    },
    modifiers: [
      { type: 'trainingExperienceMultiplier', value: 0 },
      { type: 'arenaCombatEligibility', value: false },
    ],
  },
  {
    id: 'victoryAura',
    nameKey: 'statusEffects.victoryAura.name',
    descriptionKey: 'statusEffects.victoryAura.description',
    showAlert: false,
    visual: {
      iconName: 'victory',
      color: '#d6a34a',
    },
    modifiers: [
      {
        type: 'trainingExperienceMultiplier',
        value: GAME_BALANCE.statusEffects.victoryAura.trainingExperienceMultiplier,
      },
    ],
  },
] as const satisfies readonly StatusEffectDefinition[];

export type StatusEffectId = (typeof STATUS_EFFECT_DEFINITIONS)[number]['id'];
