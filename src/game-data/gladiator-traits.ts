import { GAME_BALANCE } from './balance';
import type { GladiatorTraitDefinition } from '../domain/gladiator-traits/types';

export const GLADIATOR_TRAIT_DEFINITIONS = [
  {
    id: 'disciplined',
    nameKey: 'traits.disciplined.name',
    descriptionKey: 'traits.disciplined.description',
    showAlert: false,
    visual: {
      iconName: 'training',
      color: '#5f8fb7',
    },
    modifiers: [
      {
        type: 'trainingExperienceMultiplier',
        value: GAME_BALANCE.traits.disciplined.trainingExperienceMultiplier,
      },
    ],
  },
  {
    id: 'lazy',
    nameKey: 'traits.lazy.name',
    descriptionKey: 'traits.lazy.description',
    showAlert: false,
    visual: {
      iconName: 'energy',
      color: '#9a8d74',
    },
    modifiers: [
      {
        type: 'trainingExperienceMultiplier',
        value: GAME_BALANCE.traits.lazy.trainingExperienceMultiplier,
      },
    ],
  },
  {
    id: 'brave',
    nameKey: 'traits.brave.name',
    descriptionKey: 'traits.brave.description',
    showAlert: false,
    visual: {
      iconName: 'victory',
      color: '#d6a34a',
    },
    modifiers: [
      {
        type: 'combatMoraleBonus',
        value: GAME_BALANCE.traits.brave.combatMoraleBonus,
      },
    ],
  },
  {
    id: 'cowardly',
    nameKey: 'traits.cowardly.name',
    descriptionKey: 'traits.cowardly.description',
    showAlert: false,
    visual: {
      iconName: 'defeat',
      color: '#8f8a80',
    },
    modifiers: [
      {
        type: 'combatMoraleBonus',
        value: GAME_BALANCE.traits.cowardly.combatMoraleBonus,
      },
    ],
  },
  {
    id: 'ambitious',
    nameKey: 'traits.ambitious.name',
    descriptionKey: 'traits.ambitious.description',
    showAlert: false,
    visual: {
      iconName: 'level',
      color: '#78c46b',
    },
    modifiers: [
      {
        type: 'combatExperienceMultiplier',
        value: GAME_BALANCE.traits.ambitious.combatExperienceMultiplier,
      },
    ],
  },
  {
    id: 'fragile',
    nameKey: 'traits.fragile.name',
    descriptionKey: 'traits.fragile.description',
    showAlert: false,
    visual: {
      iconName: 'injuryRisk',
      color: '#b33a2e',
    },
    modifiers: [
      {
        type: 'injuryRiskMultiplier',
        value: GAME_BALANCE.traits.fragile.injuryRiskMultiplier,
      },
    ],
  },
  {
    id: 'crowdFavorite',
    nameKey: 'traits.crowdFavorite.name',
    descriptionKey: 'traits.crowdFavorite.description',
    showAlert: false,
    visual: {
      iconName: 'reputation',
      color: '#d39942',
    },
    modifiers: [
      {
        type: 'arenaRewardMultiplier',
        value: GAME_BALANCE.traits.crowdFavorite.arenaRewardMultiplier,
      },
    ],
  },
  {
    id: 'rivalrous',
    nameKey: 'traits.rivalrous.name',
    descriptionKey: 'traits.rivalrous.description',
    showAlert: false,
    visual: {
      iconName: 'combatPressure',
      color: '#b55339',
    },
    modifiers: [
      {
        type: 'combatEnergyBonus',
        value: GAME_BALANCE.traits.rivalrous.combatEnergyBonus,
      },
      {
        type: 'combatMoraleBonus',
        value: GAME_BALANCE.traits.rivalrous.combatMoraleBonus,
      },
    ],
  },
  {
    id: 'stoic',
    nameKey: 'traits.stoic.name',
    descriptionKey: 'traits.stoic.description',
    showAlert: false,
    visual: {
      iconName: 'defense',
      color: '#8f8a80',
    },
    modifiers: [
      {
        type: 'injuryRiskMultiplier',
        value: GAME_BALANCE.traits.stoic.injuryRiskMultiplier,
      },
    ],
  },
  {
    id: 'injury',
    nameKey: 'traits.injury.name',
    descriptionKey: 'traits.injury.description',
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
    nameKey: 'traits.victoryAura.name',
    descriptionKey: 'traits.victoryAura.description',
    showAlert: false,
    visual: {
      iconName: 'victory',
      color: '#d6a34a',
    },
    modifiers: [
      {
        type: 'trainingExperienceMultiplier',
        value: GAME_BALANCE.traits.victoryAura.trainingExperienceMultiplier,
      },
    ],
  },
] as const satisfies readonly GladiatorTraitDefinition[];

export type GladiatorTraitDefinitionId = (typeof GLADIATOR_TRAIT_DEFINITIONS)[number]['id'];
