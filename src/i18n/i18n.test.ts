import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { BUILDING_IMPROVEMENTS, BUILDING_POLICIES } from '../game-data/building-improvements';
import { BUILDING_DEFINITIONS } from '../game-data/buildings';
import { TRAINING_INTENSITIES, WEEKLY_OBJECTIVES } from '../game-data/planning';
import { translate } from '.';
import en from './locales/en.json';
import fr from './locales/fr.json';

const englishDictionary: Record<string, string> = en;
const frenchDictionary: Record<string, string> = fr;
const sourceRoot = join(process.cwd(), 'src');

function getFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stat = statSync(path);

    return stat.isDirectory() ? getFiles(path) : [path];
  });
}

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

  it('does not include obvious hardcoded visible JSX strings', () => {
    const files = [
      ...getFiles(join(sourceRoot, 'app')),
      ...getFiles(join(sourceRoot, 'ui')),
    ].filter((file) => file.endsWith('.tsx'));
    const visibleTextPattern = />\s*[A-Za-z][^<{]*\s*</;
    const visibleAttributePattern = /\b(?:aria-label|placeholder|title)="[^"]+"/;
    const violations = files.flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      const lines = source.split('\n');

      return lines
        .map((line, index) => ({ line, lineNumber: index + 1 }))
        .filter(({ line }) => visibleTextPattern.test(line) || visibleAttributePattern.test(line))
        .map(({ lineNumber }) => `${file}:${lineNumber}`);
    });

    expect(violations).toEqual([]);
  });
});
