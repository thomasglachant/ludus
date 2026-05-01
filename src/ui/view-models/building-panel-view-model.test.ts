import { describe, expect, it } from 'vitest';

import { createInitialSave } from '../../domain/saves/create-initial-save';
import { createBuildingPanelViewModel } from './building-panel-view-model';

function createTestSave() {
  return createInitialSave({
    ludusName: 'Test Ludus',
    saveId: 'test-save',
    createdAt: '2026-05-01T08:00:00.000Z',
  });
}

function translateLabel(key: string, params?: Record<string, string | number>): string {
  if (key === 'buildingSkills.skillName') {
    return String(params?.name ?? key);
  }

  return key;
}

describe('createBuildingPanelViewModel', () => {
  it('exposes purchasable and locked building tree states', () => {
    const viewModel = createBuildingPanelViewModel(
      createTestSave(),
      'trainingGround',
      translateLabel,
    );

    const purchasableSkills = viewModel.skills.filter((skill) => skill.canPurchase);
    const lockedSkills = viewModel.skills.filter((skill) => !skill.canPurchase);

    expect(purchasableSkills.length).toBeGreaterThan(0);
    expect(lockedSkills.length).toBeGreaterThan(0);
    expect(purchasableSkills.every((skill) => skill.isPurchased === false)).toBe(true);
    expect(purchasableSkills.every((skill) => skill.validationMessageKey === null)).toBe(true);
    expect(lockedSkills.some((skill) => skill.requiredSkillNames.length > 0)).toBe(true);
    expect(lockedSkills.some((skill) => skill.validationMessageKey !== null)).toBe(true);
  });
});
