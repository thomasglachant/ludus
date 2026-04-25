import { describe, expect, it } from 'vitest';
import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '../game-data/building-improvements';
import { BUILDING_DEFINITIONS } from '../game-data/buildings';
import { TRAINING_INTENSITIES, WEEKLY_OBJECTIVES } from '../game-data/planning';
import { translate } from '.';
import en from './locales/en.json';
import fr from './locales/fr.json';

const englishDictionary: Record<string, string> = en;
const frenchDictionary: Record<string, string> = fr;

describe('i18n', () => {
  it('keeps English and French locale keys aligned', () => {
    expect(Object.keys(frenchDictionary).sort()).toEqual(Object.keys(englishDictionary).sort());
  });

  it('translates with parameters', () => {
    expect(translate('en', 'topBar.week', { week: 3 })).toBe('Week 3');
    expect(translate('fr', 'topBar.week', { week: 3 })).toBe('Semaine 3');
  });

  it('contains keys referenced by game data', () => {
    const buildingKeys = Object.values(BUILDING_DEFINITIONS).flatMap((definition) => [
      definition.nameKey,
      definition.descriptionKey,
    ]);
    const improvementKeys = BUILDING_IMPROVEMENTS.flatMap((improvement) => [
      improvement.nameKey,
      improvement.descriptionKey,
    ]);
    const policyKeys = BUILDING_POLICIES.flatMap((policy) => [
      policy.nameKey,
      policy.descriptionKey,
    ]);
    const weeklyPlanningKeys = [
      ...WEEKLY_OBJECTIVES.map((objective) => `weeklyPlan.objectives.${objective}`),
      ...TRAINING_INTENSITIES.map((intensity) => `weeklyPlan.intensities.${intensity}`),
    ];

    for (const key of [...buildingKeys, ...improvementKeys, ...policyKeys, ...weeklyPlanningKeys]) {
      expect(englishDictionary[key], key).toBeDefined();
      expect(frenchDictionary[key], key).toBeDefined();
    }
  });
});
